package com.krishisetu.dto;

import java.util.List;

public record MandiPricesResponse(
    String status,
    boolean configured,
    String sourceName,
    String sourceUrl,
    String resourceId,
    String updatedAt,
    int totalAvailable,
    List<MandiPriceDto> records,
    AvailableFilters availableFilters,
    String messageEn,
    String messageKn,
    String configurationGuideEn,
    String configurationGuideKn
) {
    public record MandiPriceDto(
        String id,
        String commodity,
        String variety,
        String grade,
        String state,
        String district,
        String market,
        Double minPrice,
        Double maxPrice,
        Double modalPrice,
        String unit,
        String arrivalDate,
        String reportedDateRaw,
        String sourceName,
        String resourceId,
        String fetchedAt
    ) {}

    public record AvailableFilters(
        List<String> commodities,
        List<String> states,
        List<String> districts,
        List<String> markets
    ) {}
}
