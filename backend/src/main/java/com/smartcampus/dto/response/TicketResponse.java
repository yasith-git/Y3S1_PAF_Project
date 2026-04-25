package com.smartcampus.dto.response;

import com.smartcampus.model.Ticket;
import com.smartcampus.model.TicketAttachment;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
public class TicketResponse {

    private Long id;
    private Long reporterId;
    private String reporterName;
    private String reporterEmail;
    private Long assigneeId;
    private String assigneeName;
    private String title;
    private String description;
    private String category;
    private String status;
    private String priority;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<AttachmentInfo> attachments;

    @Getter @Setter
    public static class AttachmentInfo {
        private Long id;
        private String fileName;
        private String fileUrl;
        private Long fileSize;
        private String contentType;

        public static AttachmentInfo from(TicketAttachment a) {
            AttachmentInfo i = new AttachmentInfo();
            i.id          = a.getId();
            i.fileName    = a.getFileName();
            i.fileUrl     = a.getFileUrl();
            i.fileSize    = a.getFileSize();
            i.contentType = a.getContentType();
            return i;
        }
    }

    public static TicketResponse from(Ticket t, List<TicketAttachment> attachments) {
        TicketResponse r = new TicketResponse();
        r.id            = t.getId();
        r.reporterId    = t.getReporter().getId();
        r.reporterName  = t.getReporter().getName();
        r.reporterEmail = t.getReporter().getEmail();
        if (t.getAssignee() != null) {
            r.assigneeId   = t.getAssignee().getId();
            r.assigneeName = t.getAssignee().getName();
        }
        r.title       = t.getTitle();
        r.description = t.getDescription();
        r.category    = t.getCategory();
        r.status      = t.getStatus().name();
        r.priority    = t.getPriority().name();
        r.createdAt   = t.getCreatedAt();
        r.updatedAt   = t.getUpdatedAt();
        r.attachments = attachments.stream()
                .map(AttachmentInfo::from)
                .toList();
        return r;
    }
}
