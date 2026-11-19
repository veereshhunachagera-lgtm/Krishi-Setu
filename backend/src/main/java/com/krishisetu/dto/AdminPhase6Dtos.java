package com.krishisetu.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class AdminPhase6Dtos {

    private AdminPhase6Dtos() {}

    public record AdminFarmerAccountDto(
        UUID id,
        String fullName,
        String maskedEmail,
        String preferredLanguage,
        boolean onboardingCompleted,
        boolean active,
        Boolean hasSoilReport,
        String state,
        String district,
        BigDecimal landSize,
        String landUnit,
        String growingSeason,
        Instant createdAt,
        Instant updatedAt
    ) {}

    public record FarmerAccountStatusRequest(
        @NotNull Boolean active
    ) {}

    public record CountBucket(String key, long count) {}

    public record DistrictFarmerCount(String district, String state, long count) {}

    public record VerifiedGeoProviderPoint(
        UUID id,
        String nameEn,
        String nameKn,
        String serviceType,
        String state,
        String district,
        double latitude,
        double longitude,
        String sourceReference
    ) {}

    public record FarmerMetrics(
        long total,
        long active,
        long disabled,
        long onboarded,
        long pendingOnboarding,
        long withSoilReport,
        long fieldOnly,
        Map<String, Long> languageBreakdown,
        List<CountBucket> soilTypes,
        List<CountBucket> irrigationSources
    ) {}

    public record KnowledgeMetrics(
        long totalCrops,
        long curatedCrops,
        long sampleCrops,
        List<CountBucket> cropWaterBreakdown,
        List<CountBucket> cropCategoryBreakdown,
        long savedCropPlans
    ) {}

    public record PlantHealthMetrics(
        long totalAlerts,
        long activeAlerts,
        Map<String, Long> alertsByVerification,
        long totalGuides,
        long totalDiseaseScans
    ) {}

    public record MarketMetrics(
        long totalMandiRecords,
        long distinctCommodities,
        String latestArrivalDate
    ) {}

    public record ServicesMetrics(
        long totalProviders,
        long verifiedDirectoryProviders,
        long demonstrationSampleProviders,
        long totalEquipmentListings,
        long totalBookings,
        Map<String, Long> bookingsByStatus
    ) {}

    public record AiAssistantMetrics(
        long totalMessages,
        long uniqueFarmerUsers
    ) {}

    public record RegionalMetrics(
        List<DistrictFarmerCount> farmersByDistrict,
        List<VerifiedGeoProviderPoint> verifiedGeoProviders,
        long totalGeoProvidersWithCoords,
        long unverifiedGeoExcludedCount
    ) {}

    public record AdminAnalyticsResponse(
        String generatedAt,
        FarmerMetrics farmers,
        KnowledgeMetrics knowledge,
        PlantHealthMetrics plantHealth,
        MarketMetrics market,
        ServicesMetrics services,
        AiAssistantMetrics aiAssistant,
        RegionalMetrics regional
    ) {}

    public record IntegrationStatusItem(
        String id,
        String name,
        boolean configured,
        String endpointOrModel,
        long storedRecordsCount,
        String lastRecordTimestamp,
        String notesEn,
        String notesKn
    ) {}

    public record IntegrationsOverviewResponse(
        String checkedAt,
        List<IntegrationStatusItem> integrations
    ) {}

    public record IntegrationProbeItem(
        String id,
        String status,
        Long latencyMs,
        String detailEn,
        String detailKn
    ) {}

    public record IntegrationsProbeResponse(
        String probedAt,
        List<IntegrationProbeItem> results
    ) {}
}
