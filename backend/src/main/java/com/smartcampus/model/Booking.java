package com.smartcampus.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "bookings",
    indexes = {
        @Index(name = "idx_booking_user",     columnList = "user_id"),
        @Index(name = "idx_booking_resource", columnList = "resource_id"),
        @Index(name = "idx_booking_status",   columnList = "status"),
        @Index(name = "idx_booking_times",    columnList = "start_time, end_time"),
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resource_id", nullable = false)
    private Resource resource;

    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column(nullable = false)
    private LocalDateTime endTime;

    @Column(length = 500)
    private String purpose;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.PENDING;

    /** Admin note when approving or rejecting */
    @Column(length = 500)
    private String adminNote;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = BookingStatus.PENDING;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
