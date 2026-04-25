package com.smartcampus.service;

import com.smartcampus.dto.request.GoogleAuthRequest;
import com.smartcampus.dto.request.UpdateRoleRequest;
import com.smartcampus.dto.response.AuthResponse;
import com.smartcampus.dto.response.UserResponse;

import java.util.List;

public interface AuthService {
    AuthResponse loginWithGoogle(GoogleAuthRequest request);
    UserResponse getCurrentUser(String email);
    UserResponse updateUserRole(Long userId, UpdateRoleRequest request);
    List<UserResponse> getAllUsers();
}
