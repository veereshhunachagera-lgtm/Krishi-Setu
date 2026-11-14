package com.krishisetu.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record FarmerProfileRequest(
    @NotNull(message = "Soil report choice is required")
    Boolean hasSoilReport,

    String farmerName,
    String state,
    String district,
    String village,

    @DecimalMin(value = "0.01", message = "Land size must be greater than 0")
    @DecimalMax(value = "50000.0", message = "Land size seems too large")
    BigDecimal landSize,

    String landUnit,
    String soilType,
    String irrigationSource,
    String currentOrPreviousCrop,
    String growingSeason,

    @Valid
    SoilReportDto soilReport
) {}
