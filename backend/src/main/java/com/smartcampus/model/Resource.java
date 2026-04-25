package com.smartcampus.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "resources", indexes = {
    @Index(name = "idx_resource_type",     columnList = "type"),
    @Index(name = "idx_resource_status",   columnList = "status"),
    @Index(name = "idx_resource_location", columnList = "location")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceType type;

    /**
     * Capacity is nullable for equipment items (cameras, projectors)
     * that don't have a seating capacity.
     */
    private Integer capacity;

    @Column(nullable = false)
    private String location;

    /**
     * Building / floor / room number for precise identification
     */
    private String building;

    /**
     * Stored as JSON string, e.g.
     * {"monday":"08:00-20:00","tuesday":"08:00-20:00",...,"sunday":null}
     */
    @Column(name = "availability_windows", columnDefinition = "TEXT")
    private String availabilityWindows;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ResourceStatus status = ResourceStatus.ACTIVE;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Additional features: projector, AC, whiteboard, etc. stored as comma list */
    private String features;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
