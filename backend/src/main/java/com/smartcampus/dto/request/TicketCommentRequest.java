package com.smartcampus.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class TicketCommentRequest {

    @NotBlank(message = "Comment content is required")
    private String content;
}
