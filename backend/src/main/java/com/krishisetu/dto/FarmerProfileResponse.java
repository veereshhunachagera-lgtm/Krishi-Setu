package com.krishisetu.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record FarmerProfileResponse(
    UUID id,
    UUID userId,
    boolean hasSoilReport,
    String farmerName,
    String email,
    String state,
    String district,
    String village,
    BigDecimal landSize,
    String landUnit,
    String soilType,
    String irrigationSource,
    String currentOrPreviousCrop,
    String growingSeason,
    SoilReportDto soilReport,
    Instant updatedAt
) {}
