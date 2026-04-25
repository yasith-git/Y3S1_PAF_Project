package com.smartcampus.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class TicketStatusRequest {
    private String status;
    private Long assigneeId;
}
