package com.smartcampus.dto.request;

import com.smartcampus.model.ResourceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResourceStatusRequest {

    @NotNull(message = "Status is required")
    private ResourceStatus status;
}
