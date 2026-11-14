package com.krishisetu.dto;

import java.time.Instant;
import java.util.UUID;

public record NotificationDto(
    UUID id,
    String titleKey,
    String messageKey,
    String category,
    boolean read,
    Instant createdAt
) {}
