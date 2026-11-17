package com.krishisetu.dto;

import java.util.List;

public record PriceTrendsResponse(
    String commodity,
    String market,
    String district,
    String state,
    String unit,
    boolean sufficientData,
    int pointCount,
    DateRange dateRange,
    List<TrendPoint> points,
    TrendSummary summary,
    String sourceNoteEn,
    String sourceNoteKn,
    String insufficientReasonEn,
    String insufficientReasonKn,
    String disclaimerEn,
    String disclaimerKn,
    List<String> availableCommodities,
    List<MarketOption> availableMarkets
) {
    public record DateRange(String startDate, String endDate) {}

    public record TrendPoint(
        String date,
        Double minPrice,
        Double modalPrice,
        Double maxPrice,
        int recordCount,
        List<String> varieties
    ) {}

    public record TrendSummary(
        Double latestModalPrice,
        Double earliestModalPrice,
        Double observedMinPrice,
        Double observedMaxPrice,
        Double changeAbsolute,
        Double changePercent
    ) {}

    public record MarketOption(String market, String district, String state) {}
}
