package com.smartcampus.controller;

import com.smartcampus.dto.response.NotificationResponse;
import com.smartcampus.model.User;
import com.smartcampus.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * GET /api/notifications
     * Returns all notifications for the currently logged-in user.
     */
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(
                notificationService.getMyNotifications(currentUser.getEmail()));
    }

    /**
     * GET /api/notifications/unread-count
     * Returns the number of unread notifications for the badge counter.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal User currentUser) {
        long count = notificationService.getUnreadCount(currentUser.getEmail());
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    /**
     * PUT /api/notifications/{id}/read
     * Marks a single notification as read.
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(
                notificationService.markAsRead(id, currentUser.getEmail()));
    }

    /**
     * PUT /api/notifications/read-all
     * Marks all notifications as read for the current user.
     */
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(
            @AuthenticationPrincipal User currentUser) {
        notificationService.markAllAsRead(currentUser.getEmail());
        return ResponseEntity.noContent().build();
    }

    /**
     * DELETE /api/notifications/{id}
     * Deletes a single notification owned by the current user.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        notificationService.deleteNotification(id, currentUser.getEmail());
        return ResponseEntity.noContent().build();
    }
}
