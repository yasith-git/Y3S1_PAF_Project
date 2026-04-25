package com.smartcampus.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class TicketRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 255, message = "Title must be 5–255 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(min = 10, message = "Description must be at least 10 characters")
    private String description;

    @Size(max = 100)
    private String category;

    private String priority; // defaults to MEDIUM if null
}
