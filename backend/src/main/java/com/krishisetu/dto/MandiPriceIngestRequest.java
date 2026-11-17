package com.krishisetu.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record MandiPriceIngestRequest(
    @NotBlank(message = "Commodity name is required.")
    String commodity,
    String variety,
    String grade,
    @NotBlank(message = "State is required.")
    String state,
    @NotBlank(message = "District is required.")
    String district,
    @NotBlank(message = "Market / APMC mandi name is required.")
    String market,
    Double minPrice,
    Double maxPrice,
    @NotNull(message = "Modal price is required.")
    @Positive(message = "Modal price must be greater than 0.")
    Double modalPrice,
    @NotBlank(message = "Arrival date is required.")
    String arrivalDate,
    String sourceName
) {}
