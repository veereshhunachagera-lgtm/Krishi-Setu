package com.krishisetu.service;

import com.krishisetu.dto.NotificationDto;
import com.krishisetu.entity.Notification;
import com.krishisetu.entity.User;
import com.krishisetu.exception.ResourceNotFoundException;
import com.krishisetu.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public void createNotification(User user, String titleKey, String messageKey, String category) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitleKey(titleKey);
        notification.setMessageKey(messageKey);
        notification.setCategory(category);
        notification.setRead(false);
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> listForUser(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(this::toDto)
            .toList();
    }

    @Transactional
    public NotificationDto markRead(UUID userId, UUID notificationId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Notification not found."));
        notification.setRead(true);
        return toDto(notificationRepository.save(notification));
    }

    @Transactional
    public void markAllRead(UUID userId) {
        List<Notification> items = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        for (Notification item : items) {
            item.setRead(true);
        }
        notificationRepository.saveAll(items);
    }

    private NotificationDto toDto(Notification n) {
        return new NotificationDto(
            n.getId(),
            n.getTitleKey(),
            n.getMessageKey(),
            n.getCategory(),
            n.isRead(),
            n.getCreatedAt()
        );
    }
}
