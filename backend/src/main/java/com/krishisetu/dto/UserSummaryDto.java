package com.krishisetu.dto;

import com.krishisetu.entity.Role;
import java.util.UUID;

public record UserSummaryDto(
    UUID id,
    String fullName,
    String email,
    Role role,
    String preferredLanguage,
    boolean onboardingCompleted
) {}
