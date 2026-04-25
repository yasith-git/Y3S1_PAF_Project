package com.smartcampus.service.impl;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.smartcampus.dto.request.GoogleAuthRequest;
import com.smartcampus.dto.request.UpdateRoleRequest;
import com.smartcampus.dto.response.AuthResponse;
import com.smartcampus.dto.response.UserResponse;
import com.smartcampus.exception.InvalidTokenException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Role;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.service.AuthService;
import com.smartcampus.util.JwtUtil;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final RestTemplate restTemplate;

    // Inner DTO for Google tokeninfo response
    @Getter
    @Setter
    private static class GoogleTokenInfo {
        private String sub;
        private String email;
        private String name;
        private String picture;
        @JsonProperty("email_verified")
        private String emailVerified;
    }

    @Override
    @Transactional
    public AuthResponse loginWithGoogle(GoogleAuthRequest request) {
        GoogleTokenInfo tokenInfo = verifyGoogleToken(request.getIdToken());

        User user = userRepository.findByGoogleId(tokenInfo.getSub())
                .orElseGet(() -> createNewUser(tokenInfo));

        // Update name/picture in case they changed
        user.setName(tokenInfo.getName());
        user.setPictureUrl(tokenInfo.getPicture());
        userRepository.save(user);

        String jwt = jwtUtil.generateToken(user);
        return AuthResponse.of(jwt, UserResponse.from(user));
    }

    @Override
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return UserResponse.from(user);
    }

    @Override
    @Transactional
    public UserResponse updateUserRole(Long userId, UpdateRoleRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        user.setRole(request.getRole());
        return UserResponse.from(userRepository.save(user));
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private GoogleTokenInfo verifyGoogleToken(String idToken) {
        String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;
        try {
            GoogleTokenInfo info = restTemplate.getForObject(url, GoogleTokenInfo.class);
            if (info == null || info.getEmail() == null) {
                throw new InvalidTokenException("Invalid Google token: no email returned");
            }
            if (!"true".equals(info.getEmailVerified())) {
                throw new InvalidTokenException("Google account email is not verified");
            }
            return info;
        } catch (RestClientException e) {
            throw new InvalidTokenException("Google token verification failed: " + e.getMessage());
        }
    }

    private User createNewUser(GoogleTokenInfo tokenInfo) {
        return userRepository.save(
                User.builder()
                        .googleId(tokenInfo.getSub())
                        .email(tokenInfo.getEmail())
                        .name(tokenInfo.getName())
                        .pictureUrl(tokenInfo.getPicture())
                        .role(Role.USER)
                        .build()
        );
    }
}
