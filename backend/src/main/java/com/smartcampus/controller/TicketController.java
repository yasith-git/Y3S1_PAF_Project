package com.smartcampus.controller;

import com.smartcampus.dto.request.TicketCommentRequest;
import com.smartcampus.dto.request.TicketRequest;
import com.smartcampus.dto.request.TicketStatusRequest;
import com.smartcampus.dto.response.PagedResponse;
import com.smartcampus.dto.response.TicketCommentResponse;
import com.smartcampus.dto.response.TicketResponse;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService  ticketService;
    private final UserRepository userRepository;

    private User resolveUser(UserDetails ud) {
        return userRepository.findByEmail(ud.getUsername())
                .orElseThrow(() -> new com.smartcampus.exception.ResourceNotFoundException(
                        "User", "email", ud.getUsername()));
    }

    // ── Create ticket (authenticated, optional image uploads) ────────────────
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TicketResponse> createTicket(
            @AuthenticationPrincipal UserDetails ud,
            @RequestPart("data") @Valid TicketRequest req,
            @RequestPart(name = "images", required = false) List<MultipartFile> images) {

        User user = resolveUser(ud);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.createTicket(user, req, images));
    }

    // ── My tickets ───────────────────────────────────────────────────────────
    @GetMapping("/my")
    public ResponseEntity<List<TicketResponse>> getMyTickets(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ticketService.getMyTickets(resolveUser(ud)));
    }

    // ── Get single ticket ────────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicket(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ticketService.getTicketById(id, resolveUser(ud)));
    }

    // ── Add comment ──────────────────────────────────────────────────────────
    @PostMapping("/{id}/comments")
    public ResponseEntity<TicketCommentResponse> addComment(
            @PathVariable Long id,
            @RequestBody @Valid TicketCommentRequest req,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.addComment(id, req, resolveUser(ud)));
    }

    // ── Get comments ─────────────────────────────────────────────────────────
    @GetMapping("/{id}/comments")
    public ResponseEntity<List<TicketCommentResponse>> getComments(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ticketService.getComments(id, resolveUser(ud)));
    }

    // ── Admin: list all tickets ──────────────────────────────────────────────
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PagedResponse<TicketResponse>> getAllTickets(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(
                ticketService.getAllTickets(status, priority, keyword, pageable));
    }

    // ── Admin: update status / assignee ─────────────────────────────────────
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TicketResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody TicketStatusRequest req,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ticketService.updateTicketStatus(id, req, resolveUser(ud)));
    }

    // ── Admin: delete ticket ─────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTicket(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud) {
        ticketService.deleteTicket(id, resolveUser(ud));
        return ResponseEntity.noContent().build();
    }

    // ── Admin: stats ─────────────────────────────────────────────────────────
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(ticketService.getStats());
    }
}
