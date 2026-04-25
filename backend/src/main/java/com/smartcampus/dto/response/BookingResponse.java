package com.smartcampus.dto.response;

import com.smartcampus.model.Booking;
import com.smartcampus.model.BookingStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class BookingResponse {

    private Long   id;
    private Long   resourceId;
    private String resourceName;
    private String resourceType;
    private String resourceLocation;

    private Long   userId;
    private String userName;
    private String userEmail;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String        purpose;
    private BookingStatus status;
    private String        adminNote;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static BookingResponse from(Booking b) {
        return BookingResponse.builder()
            .id(b.getId())
            .resourceId(b.getResource().getId())
            .resourceName(b.getResource().getName())
            .resourceType(b.getResource().getType().name())
            .resourceLocation(b.getResource().getLocation())
            .userId(b.getUser().getId())
            .userName(b.getUser().getName())
            .userEmail(b.getUser().getEmail())
            .startTime(b.getStartTime())
            .endTime(b.getEndTime())
            .purpose(b.getPurpose())
            .status(b.getStatus())
            .adminNote(b.getAdminNote())
            .createdAt(b.getCreatedAt())
            .updatedAt(b.getUpdatedAt())
            .build();
    }
}
