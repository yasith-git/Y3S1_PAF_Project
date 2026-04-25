package com.smartcampus.service;

import com.smartcampus.dto.response.NotificationResponse;
import com.smartcampus.model.NotificationType;
import com.smartcampus.model.User;

import java.util.List;

public interface NotificationService {

    // Called by other services (BookingService, TicketService) to create notifications
    void send(User recipient, String message, NotificationType type, String referenceId);

    // REST-facing methods
    List<NotificationResponse> getMyNotifications(String email);
    long getUnreadCount(String email);
    NotificationResponse markAsRead(Long notificationId, String email);
    void markAllAsRead(String email);
    void deleteNotification(Long notificationId, String email);
}
