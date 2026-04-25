package com.smartcampus.dto.request;

import com.smartcampus.model.Role;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateRoleRequest {

    @NotNull(message = "Role is required")
    private Role role;
}
