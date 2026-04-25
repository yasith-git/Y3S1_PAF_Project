package com.smartcampus.service;

import com.smartcampus.dto.request.TicketCommentRequest;
import com.smartcampus.dto.request.TicketRequest;
import com.smartcampus.dto.request.TicketStatusRequest;
import com.smartcampus.dto.response.PagedResponse;
import com.smartcampus.dto.response.TicketCommentResponse;
import com.smartcampus.dto.response.TicketResponse;
import com.smartcampus.model.User;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

public interface TicketService {

    TicketResponse createTicket(User reporter, TicketRequest req,
                                List<MultipartFile> images);

    List<TicketResponse> getMyTickets(User reporter);

    PagedResponse<TicketResponse> getAllTickets(String status, String priority,
                                               String keyword, Pageable pageable);

    TicketResponse getTicketById(Long id, User currentUser);

    TicketResponse updateTicketStatus(Long id, TicketStatusRequest req, User admin);

    TicketCommentResponse addComment(Long ticketId, TicketCommentRequest req, User author);

    List<TicketCommentResponse> getComments(Long ticketId, User currentUser);

    void deleteTicket(Long id, User admin);

    Map<String, Long> getStats();
}
