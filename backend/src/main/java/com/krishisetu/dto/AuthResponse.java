package com.krishisetu.dto;

public record AuthResponse(
    String token,
    UserSummaryDto user
) {}
