package com.smartcampus.dto.request;

import com.smartcampus.model.BookingStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BookingStatusRequest {

    @NotNull(message = "Status is required")
    private BookingStatus status;

    private String adminNote;
}
