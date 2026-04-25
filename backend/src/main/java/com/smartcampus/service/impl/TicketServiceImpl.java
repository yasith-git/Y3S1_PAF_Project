package com.smartcampus.service.impl;

import com.smartcampus.dto.request.TicketCommentRequest;
import com.smartcampus.dto.request.TicketRequest;
import com.smartcampus.dto.request.TicketStatusRequest;
import com.smartcampus.dto.response.PagedResponse;
import com.smartcampus.dto.response.TicketCommentResponse;
import com.smartcampus.dto.response.TicketResponse;
import com.smartcampus.exception.AccessDeniedException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.*;
import com.smartcampus.repository.*;
import com.smartcampus.service.FileStorageService;
import com.smartcampus.service.NotificationService;
import com.smartcampus.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TicketServiceImpl implements TicketService {

    private static final int MAX_ATTACHMENTS = 3;

    private final TicketRepository           ticketRepo;
    private final TicketCommentRepository    commentRepo;
    private final TicketAttachmentRepository attachmentRepo;
    private final UserRepository             userRepo;
    private final FileStorageService         fileStorage;
    private final NotificationService        notificationService;

    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public TicketResponse createTicket(User reporter, TicketRequest req,
                                       List<MultipartFile> images) {
        Ticket ticket = new Ticket();
        ticket.setReporter(reporter);
        ticket.setTitle(req.getTitle());
        ticket.setDescription(req.getDescription());
        ticket.setCategory(req.getCategory());
        ticket.setStatus(TicketStatus.OPEN);

        if (req.getPriority() != null && !req.getPriority().isBlank()) {
            try {
                ticket.setPriority(TicketPriority.valueOf(req.getPriority().toUpperCase()));
            } catch (IllegalArgumentException ignored) {
                ticket.setPriority(TicketPriority.MEDIUM);
            }
        }

        Ticket saved = ticketRepo.save(ticket);

        // Store attachments (up to MAX_ATTACHMENTS)
        List<TicketAttachment> attachments = new ArrayList<>();
        if (images != null) {
            List<MultipartFile> validImages = images.stream()
                    .filter(f -> f != null && !f.isEmpty())
                    .limit(MAX_ATTACHMENTS)
                    .toList();
            for (MultipartFile img : validImages) {
                try {
                    String url = fileStorage.store(img);
                    TicketAttachment att = new TicketAttachment();
                    att.setTicket(saved);
                    att.setFileName(img.getOriginalFilename());
                    att.setStoredName(url.substring(url.lastIndexOf('/') + 1));
                    att.setFileUrl(url);
                    att.setFileSize(img.getSize());
                    att.setContentType(img.getContentType());
                    attachments.add(attachmentRepo.save(att));
                } catch (IOException | IllegalArgumentException e) {
                    log.warn("Failed to store attachment: {}", e.getMessage());
                }
            }
        }

        // Notify admins
        userRepo.findByRole(Role.ADMIN).forEach(admin ->
                notificationService.send(
                        admin,
                        "New ticket #" + saved.getId() + ": " + saved.getTitle(),
                        NotificationType.TICKET_UPDATE,
                        String.valueOf(saved.getId())));

        return TicketResponse.from(saved, attachments);
    }

    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public List<TicketResponse> getMyTickets(User reporter) {
        return ticketRepo.findByReporterOrderByCreatedAtDesc(reporter)
                .stream()
                .map(t -> TicketResponse.from(t, attachmentRepo.findByTicket(t)))
                .toList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public PagedResponse<TicketResponse> getAllTickets(String status, String priority,
                                                      String keyword, Pageable pageable) {
        TicketStatus    s = parseEnum(TicketStatus.class,    status);
        TicketPriority  p = parseEnum(TicketPriority.class,  priority);
        String          k = (keyword == null || keyword.isBlank()) ? null : keyword.trim();

        Page<Ticket> page = ticketRepo.search(s, p, k, pageable);
        Page<TicketResponse> mapped = page.map(
                t -> TicketResponse.from(t, attachmentRepo.findByTicket(t)));
        return PagedResponse.of(mapped);
    }

    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public TicketResponse getTicketById(Long id, User currentUser) {
        Ticket t = findTicket(id);
        boolean isAdmin    = currentUser.getRole() == Role.ADMIN;
        boolean isReporter = t.getReporter().getId().equals(currentUser.getId());
        boolean isAssignee = t.getAssignee() != null &&
                             t.getAssignee().getId().equals(currentUser.getId());
        if (!isAdmin && !isReporter && !isAssignee) {
            throw new AccessDeniedException("You do not have access to this ticket");
        }
        return TicketResponse.from(t, attachmentRepo.findByTicket(t));
    }

    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public TicketResponse updateTicketStatus(Long id, TicketStatusRequest req, User admin) {
        Ticket t = findTicket(id);

        if (req.getStatus() != null && !req.getStatus().isBlank()) {
            t.setStatus(TicketStatus.valueOf(req.getStatus().toUpperCase()));
        }

        if (req.getAssigneeId() != null) {
            User assignee = userRepo.findById(req.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", req.getAssigneeId()));
            t.setAssignee(assignee);
        }

        Ticket saved = ticketRepo.save(t);

        // Notify reporter
        notificationService.send(
                t.getReporter(),
                "Your ticket #" + t.getId() + " status updated to: " + t.getStatus(),
                NotificationType.TICKET_UPDATE,
                String.valueOf(t.getId()));

        return TicketResponse.from(saved, attachmentRepo.findByTicket(saved));
    }

    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public TicketCommentResponse addComment(Long ticketId, TicketCommentRequest req, User author) {
        Ticket t = findTicket(ticketId);

        TicketComment c = new TicketComment();
        c.setTicket(t);
        c.setAuthor(author);
        c.setContent(req.getContent());

        TicketComment saved = commentRepo.save(c);

        // Notify reporter (unless they commented themselves)
        if (!t.getReporter().getId().equals(author.getId())) {
            notificationService.send(
                    t.getReporter(),
                    "New comment on your ticket #" + t.getId(),
                    NotificationType.TICKET_UPDATE,
                    String.valueOf(t.getId()));
        }

        return TicketCommentResponse.from(saved);
    }

    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public List<TicketCommentResponse> getComments(Long ticketId, User currentUser) {
        Ticket t = findTicket(ticketId);
        return commentRepo.findByTicketOrderByCreatedAtAsc(t)
                .stream()
                .map(TicketCommentResponse::from)
                .toList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public void deleteTicket(Long id, User admin) {
        Ticket t = findTicket(id);
        // Delete stored files
        attachmentRepo.findByTicket(t).forEach(a -> fileStorage.delete(a.getStoredName()));
        ticketRepo.delete(t);
    }

    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getStats() {
        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("total",      ticketRepo.count());
        stats.put("open",       ticketRepo.countByStatus(TicketStatus.OPEN));
        stats.put("inProgress", ticketRepo.countByStatus(TicketStatus.IN_PROGRESS));
        stats.put("resolved",   ticketRepo.countByStatus(TicketStatus.RESOLVED));
        stats.put("closed",     ticketRepo.countByStatus(TicketStatus.CLOSED));
        return stats;
    }

    // ─────────────────────────────────────────────────────────────────────────
    private Ticket findTicket(Long id) {
        return ticketRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", id));
    }

    private <E extends Enum<E>> E parseEnum(Class<E> cls, String value) {
        if (value == null || value.isBlank()) return null;
        try { return Enum.valueOf(cls, value.toUpperCase()); }
        catch (IllegalArgumentException e) { return null; }
    }
}
