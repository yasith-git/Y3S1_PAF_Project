package com.smartcampus.dto.request;

import com.smartcampus.model.ResourceStatus;
import com.smartcampus.model.ResourceType;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResourceRequest {

    @NotBlank(message = "Resource name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @NotNull(message = "Resource type is required")
    private ResourceType type;

    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;          // nullable for equipment

    @NotBlank(message = "Location is required")
    @Size(max = 150, message = "Location must not exceed 150 characters")
    private String location;

    @Size(max = 100, message = "Building must not exceed 100 characters")
    private String building;

    private String availabilityWindows;  // JSON string

    private ResourceStatus status;       // defaults to ACTIVE in entity

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    @Size(max = 500, message = "Features must not exceed 500 characters")
    private String features;             // comma-separated: "Projector,AC,Whiteboard"

    @Size(max = 500, message = "Image URL must not exceed 500 characters")
    private String imageUrl;
}
