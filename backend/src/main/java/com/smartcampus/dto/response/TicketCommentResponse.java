package com.smartcampus.dto.response;

import com.smartcampus.model.TicketComment;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter
public class TicketCommentResponse {

    private Long id;
    private Long ticketId;
    private Long authorId;
    private String authorName;
    private String authorEmail;
    private String content;
    private LocalDateTime createdAt;

    public static TicketCommentResponse from(TicketComment c) {
        TicketCommentResponse r = new TicketCommentResponse();
        r.id         = c.getId();
        r.ticketId   = c.getTicket().getId();
        r.authorId   = c.getAuthor().getId();
        r.authorName = c.getAuthor().getName();
        r.authorEmail= c.getAuthor().getEmail();
        r.content    = c.getContent();
        r.createdAt  = c.getCreatedAt();
        return r;
    }
}
