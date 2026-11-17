package com.krishisetu.dto;

import java.util.List;

public record WeatherForecastResponse(
    String status,
    LocationInfo location,
    String sourceName,
    String attributionText,
    String attributionUrl,
    ForecastPeriod forecastPeriod,
    String updatedAt,
    CurrentConditions current,
    List<DailyForecast> daily,
    List<FarmingAdvisory> advisories
) {
    public record GeoLocationResult(
        long id,
        String name,
        String state,
        String district,
        String country,
        String countryCode,
        double latitude,
        double longitude,
        Double elevation
    ) {}

    public record LocationInfo(
        String name,
        String state,
        String district,
        double latitude,
        double longitude,
        String timezone,
        Double elevationM
    ) {}

    public record ForecastPeriod(
        String startDate,
        String endDate,
        int days
    ) {}

    public record CurrentConditions(
        String time,
        Double temperatureC,
        Double relativeHumidityPct,
        Double precipitationMm,
        Double rainMm,
        Double windSpeedKmh,
        Integer weatherCode,
        String conditionEn,
        String conditionKn
    ) {}

    public record DailyForecast(
        String date,
        Integer weatherCode,
        String conditionEn,
        String conditionKn,
        Double tempMaxC,
        Double tempMinC,
        Double precipitationSumMm,
        Integer precipitationProbabilityMaxPct,
        Double windSpeedMaxKmh,
        String sunrise,
        String sunset
    ) {}

    public record FarmingAdvisory(
        String code,
        String severity,
        String titleEn,
        String titleKn,
        String detailEn,
        String detailKn,
        String triggerMetric
    ) {}
}
