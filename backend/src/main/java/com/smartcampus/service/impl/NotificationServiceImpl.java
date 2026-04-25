package com.smartcampus.service.impl;

import com.smartcampus.dto.response.NotificationResponse;
import com.smartcampus.exception.AccessDeniedException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Notification;
import com.smartcampus.model.NotificationType;
import com.smartcampus.model.User;
import com.smartcampus.repository.NotificationRepository;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void send(User recipient, String message, NotificationType type, String referenceId) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .read(false)
                .build();
        notificationRepository.save(notification);
    }

    @Override
    public List<NotificationResponse> getMyNotifications(String email) {
        User user = getUserByEmail(email);
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user)
                .stream()
                .map(NotificationResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public long getUnreadCount(String email) {
        User user = getUserByEmail(email);
        return notificationRepository.countByRecipientAndReadFalse(user);
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(Long notificationId, String email) {
        User user = getUserByEmail(email);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));

        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new AccessDeniedException("You can only mark your own notifications as read");
        }

        notification.setRead(true);
        return NotificationResponse.from(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public void markAllAsRead(String email) {
        User user = getUserByEmail(email);
        notificationRepository.markAllAsReadForUser(user);
    }

    @Override
    @Transactional
    public void deleteNotification(Long notificationId, String email) {
        User user = getUserByEmail(email);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));

        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new AccessDeniedException("You can only delete your own notifications");
        }

        notificationRepository.delete(notification);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
