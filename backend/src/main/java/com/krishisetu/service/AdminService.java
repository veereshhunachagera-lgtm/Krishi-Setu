package com.krishisetu.service;

import com.krishisetu.dto.AdminPhase6Dtos.*;
import com.krishisetu.dto.AdminSummaryResponse;
import com.krishisetu.dto.FarmerProfileResponse;
import com.krishisetu.entity.*;
import com.krishisetu.exception.BadRequestException;
import com.krishisetu.exception.ResourceNotFoundException;
import com.krishisetu.integration.DataGovMandiClient;
import com.krishisetu.integration.GeminiClient;
import com.krishisetu.integration.OpenMeteoClient;
import com.krishisetu.integration.PlantDiseaseModelClient;
import com.krishisetu.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final FarmerProfileService farmerProfileService;
    private final CropKnowledgeRepository cropRepository;
    private final SavedCropAdvisoryPlanRepository planRepository;
    private final PestDiseaseAlertRepository alertRepository;
    private final PlantProtectionGuideRepository guideRepository;
    private final PlantDiseaseScanRepository scanRepository;
    private final MandiPriceRecordRepository mandiRepository;
    private final AgriServiceProviderRepository providerRepository;
    private final EquipmentListingRepository equipmentRepository;
    private final EquipmentBookingRequestRepository bookingRepository;
    private final AiChatMessageRepository aiMessageRepository;
    private final DataGovMandiClient dataGovMandiClient;
    private final OpenMeteoClient openMeteoClient;
    private final PlantDiseaseModelClient plantDiseaseModelClient;
    private final GeminiClient geminiClient;

    public AdminService(
        UserRepository userRepository,
        FarmerProfileRepository farmerProfileRepository,
        FarmerProfileService farmerProfileService,
        CropKnowledgeRepository cropRepository,
        SavedCropAdvisoryPlanRepository planRepository,
        PestDiseaseAlertRepository alertRepository,
        PlantProtectionGuideRepository guideRepository,
        PlantDiseaseScanRepository scanRepository,
        MandiPriceRecordRepository mandiRepository,
        AgriServiceProviderRepository providerRepository,
        EquipmentListingRepository equipmentRepository,
        EquipmentBookingRequestRepository bookingRepository,
        AiChatMessageRepository aiMessageRepository,
        DataGovMandiClient dataGovMandiClient,
        OpenMeteoClient openMeteoClient,
        PlantDiseaseModelClient plantDiseaseModelClient,
        GeminiClient geminiClient
    ) {
        this.userRepository = userRepository;
        this.farmerProfileRepository = farmerProfileRepository;
        this.farmerProfileService = farmerProfileService;
        this.cropRepository = cropRepository;
        this.planRepository = planRepository;
        this.alertRepository = alertRepository;
        this.guideRepository = guideRepository;
        this.scanRepository = scanRepository;
        this.mandiRepository = mandiRepository;
        this.providerRepository = providerRepository;
        this.equipmentRepository = equipmentRepository;
        this.bookingRepository = bookingRepository;
        this.aiMessageRepository = aiMessageRepository;
        this.dataGovMandiClient = dataGovMandiClient;
        this.openMeteoClient = openMeteoClient;
        this.plantDiseaseModelClient = plantDiseaseModelClient;
        this.geminiClient = geminiClient;
    }

    @Transactional(readOnly = true)
    public AdminSummaryResponse getOverview() {
        long totalFarmers = userRepository.countByRole(Role.FARMER);
        long onboardedFarmers = userRepository.countByRoleAndOnboardingCompletedTrue(Role.FARMER);
        long withSoilReportCount = farmerProfileRepository.countByHasSoilReportTrue();
        long withoutSoilReportCount = farmerProfileRepository.countByHasSoilReportFalse();

        Map<String, Long> languageBreakdown = new HashMap<>();
        for (User user : userRepository.findAll()) {
            if (user.getRole() == Role.FARMER) {
                languageBreakdown.merge(user.getPreferredLanguage(), 1L, Long::sum);
            }
        }

        List<FarmerProfileResponse> farmers = farmerProfileRepository.findAll()
            .stream()
            .map(farmerProfileService::toResponse)
            .toList();

        return new AdminSummaryResponse(
            totalFarmers,
            onboardedFarmers,
            withSoilReportCount,
            withoutSoilReportCount,
            languageBreakdown,
            farmers
        );
    }

    @Transactional(readOnly = true)
    public List<AdminFarmerAccountDto> listFarmerAccounts() {
        List<User> allUsers = userRepository.findAll();
        Map<UUID, FarmerProfile> profileByUserId = new HashMap<>();
        for (FarmerProfile profile : farmerProfileRepository.findAll()) {
            if (profile.getUser() != null) {
                profileByUserId.put(profile.getUser().getId(), profile);
            }
        }

        return allUsers.stream()
            .filter(u -> u.getRole() == Role.FARMER)
            .sorted(Comparator.comparing(User::getCreatedAt).reversed())
            .map(u -> toAccountDto(u, profileByUserId.get(u.getId())))
            .toList();
    }

    @Transactional
    public AdminFarmerAccountDto updateFarmerAccountStatus(UUID userId, boolean active) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Farmer account not found."));
        if (user.getRole() != Role.FARMER) {
            throw new BadRequestException("Only farmer accounts can be modified here.");
        }
        user.setActive(active);
        User saved = userRepository.save(user);
        FarmerProfile profile = farmerProfileRepository.findByUserId(saved.getId()).orElse(null);
        return toAccountDto(saved, profile);
    }

    @Transactional(readOnly = true)
    public AdminAnalyticsResponse getAnalytics() {
        List<User> farmers = userRepository.findAll().stream()
            .filter(u -> u.getRole() == Role.FARMER)
            .toList();
        List<FarmerProfile> profiles = farmerProfileRepository.findAll();
        List<CropKnowledge> crops = cropRepository.findAll();
        List<PestDiseaseAlert> alerts = alertRepository.findAll();
        List<PlantProtectionGuide> guides = guideRepository.findAll();
        List<PlantDiseaseScan> scans = scanRepository.findAll();
        List<MandiPriceRecord> mandiRecords = mandiRepository.findAllByOrderByArrivalDateDesc();
        List<AgriServiceProvider> providers = providerRepository.findAll();
        List<EquipmentListing> equipment = equipmentRepository.findAll();
        List<EquipmentBookingRequest> bookings = bookingRepository.findAll();
        List<AiChatMessage> aiMessages = aiMessageRepository.findAll();

        long activeCount = farmers.stream().filter(User::isActive).count();
        long onboardedCount = farmers.stream().filter(User::isOnboardingCompleted).count();
        long withSoilReport = profiles.stream().filter(FarmerProfile::isHasSoilReport).count();
        long fieldOnly = profiles.size() - withSoilReport;

        Map<String, Long> langMap = new LinkedHashMap<>();
        langMap.put("en", 0L);
        langMap.put("kn", 0L);
        for (User f : farmers) {
            langMap.merge(f.getPreferredLanguage(), 1L, Long::sum);
        }

        Map<String, Long> soilTypeCounts = new LinkedHashMap<>();
        Map<String, Long> irrigationCounts = new LinkedHashMap<>();
        Map<String, DistrictAccumulator> districtCounts = new LinkedHashMap<>();

        for (FarmerProfile p : profiles) {
            if (p.getSoilType() != null && !p.getSoilType().isBlank()) {
                soilTypeCounts.merge(p.getSoilType().toUpperCase(), 1L, Long::sum);
            }
            if (p.getIrrigationSource() != null && !p.getIrrigationSource().isBlank()) {
                irrigationCounts.merge(p.getIrrigationSource().toUpperCase(), 1L, Long::sum);
            }
            if (p.getDistrict() != null && !p.getDistrict().isBlank()) {
                String d = p.getDistrict().trim();
                String s = p.getState() != null ? p.getState().trim() : "";
                String key = d.toLowerCase() + "|" + s.toLowerCase();
                districtCounts.computeIfAbsent(key, k -> new DistrictAccumulator(d, s)).increment();
            }
        }

        long curatedCrops = crops.stream().filter(c -> "CURATED_REFERENCE".equalsIgnoreCase(c.getDataReliability())).count();
        Map<String, Long> waterCounts = new LinkedHashMap<>();
        Map<String, Long> categoryCounts = new LinkedHashMap<>();
        for (CropKnowledge c : crops) {
            waterCounts.merge(c.getWaterRequirement(), 1L, Long::sum);
            categoryCounts.merge(c.getCropCategory(), 1L, Long::sum);
        }

        Map<String, Long> alertVerification = new LinkedHashMap<>();
        alertVerification.put("CONFIRMED_OUTBREAK", 0L);
        alertVerification.put("REPORTED_CASE", 0L);
        alertVerification.put("SEASONAL_RULE_ADVISORY", 0L);
        long activeAlerts = 0;
        for (PestDiseaseAlert a : alerts) {
            if (a.isActive()) activeAlerts++;
            alertVerification.merge(a.getVerificationStatus(), 1L, Long::sum);
        }

        long distinctCommodities = mandiRecords.stream()
            .map(m -> m.getCommodity().trim().toLowerCase())
            .distinct()
            .count();
        String latestArrivalDate = mandiRecords.isEmpty() ? null : mandiRecords.get(0).getArrivalDate();

        long verifiedProviders = providers.stream()
            .filter(p -> "VERIFIED_DIRECTORY".equalsIgnoreCase(p.getVerificationStatus()))
            .count();
        Map<String, Long> bookingsByStatus = new LinkedHashMap<>();
        bookingsByStatus.put("REQUESTED", 0L);
        bookingsByStatus.put("REVIEWING", 0L);
        bookingsByStatus.put("FORWARDED_TO_PROVIDER", 0L);
        bookingsByStatus.put("COMPLETED", 0L);
        bookingsByStatus.put("CANCELLED", 0L);
        for (EquipmentBookingRequest b : bookings) {
            bookingsByStatus.merge(b.getStatus(), 1L, Long::sum);
        }

        long uniqueAiUsers = aiMessages.stream().map(AiChatMessage::getUserId).distinct().count();

        List<VerifiedGeoProviderPoint> verifiedGeoProviders = new ArrayList<>();
        long totalGeoWithCoords = 0;
        long unverifiedExcluded = 0;
        for (AgriServiceProvider p : providers) {
            if (!p.isActive()) continue;
            boolean hasCoords = p.getLatitude() != null && p.getLongitude() != null;
            if (hasCoords) {
                totalGeoWithCoords++;
                if ("VERIFIED_DIRECTORY".equalsIgnoreCase(p.getVerificationStatus()) && p.isCoordinatesVerified()) {
                    verifiedGeoProviders.add(new VerifiedGeoProviderPoint(
                        p.getId(),
                        p.getNameEn(),
                        p.getNameKn(),
                        p.getServiceType(),
                        p.getState(),
                        p.getDistrict(),
                        p.getLatitude(),
                        p.getLongitude(),
                        p.getSourceReference()
                    ));
                } else {
                    unverifiedExcluded++;
                }
            } else {
                unverifiedExcluded++;
            }
        }

        List<DistrictFarmerCount> farmersByDistrict = districtCounts.values().stream()
            .sorted((a, b) -> Long.compare(b.count, a.count))
            .map(acc -> new DistrictFarmerCount(acc.district, acc.state, acc.count))
            .toList();

        return new AdminAnalyticsResponse(
            Instant.now().toString(),
            new FarmerMetrics(
                farmers.size(),
                activeCount,
                farmers.size() - activeCount,
                onboardedCount,
                farmers.size() - onboardedCount,
                withSoilReport,
                fieldOnly,
                langMap,
                toBuckets(soilTypeCounts),
                toBuckets(irrigationCounts)
            ),
            new KnowledgeMetrics(
                crops.size(),
                curatedCrops,
                crops.size() - curatedCrops,
                toBuckets(waterCounts),
                toBuckets(categoryCounts),
                planRepository.count()
            ),
            new PlantHealthMetrics(
                alerts.size(),
                activeAlerts,
                alertVerification,
                guides.size(),
                scans.size()
            ),
            new MarketMetrics(
                mandiRecords.size(),
                distinctCommodities,
                latestArrivalDate
            ),
            new ServicesMetrics(
                providers.size(),
                verifiedProviders,
                providers.size() - verifiedProviders,
                equipment.size(),
                bookings.size(),
                bookingsByStatus
            ),
            new AiAssistantMetrics(
                aiMessages.size(),
                uniqueAiUsers
            ),
            new RegionalMetrics(
                farmersByDistrict,
                verifiedGeoProviders,
                totalGeoWithCoords,
                unverifiedExcluded
            )
        );
    }

    @Transactional(readOnly = true)
    public IntegrationsOverviewResponse getIntegrationsStatus() {
        List<MandiPriceRecord> mandiRecords = mandiRepository.findAllByOrderByArrivalDateDesc();
        String latestMandiTimestamp = mandiRecords.isEmpty() ? null : mandiRecords.get(0).getFetchedAt().toString();
        List<PlantDiseaseScan> scans = scanRepository.findAll();
        String latestScanTimestamp = scans.stream()
            .map(PlantDiseaseScan::getCreatedAt)
            .max(Comparator.naturalOrder())
            .map(Instant::toString)
            .orElse(null);
        List<AiChatMessage> aiMessages = aiMessageRepository.findAll();
        String latestAiTimestamp = aiMessages.stream()
            .map(AiChatMessage::getCreatedAt)
            .max(Comparator.naturalOrder())
            .map(Instant::toString)
            .orElse(null);

        return new IntegrationsOverviewResponse(
            Instant.now().toString(),
            List.of(
                new IntegrationStatusItem(
                    "data_gov_in",
                    "data.gov.in Agmarknet Mandi API",
                    dataGovMandiClient.isConfigured(),
                    dataGovMandiClient.getMandiResourceId(),
                    mandiRecords.size(),
                    latestMandiTimestamp,
                    dataGovMandiClient.isConfigured()
                        ? "API key configured server-side. Ready to sync live Agmarknet daily arrivals."
                        : "DATA_GOV_IN_API_KEY is not configured in backend environment variables.",
                    dataGovMandiClient.isConfigured()
                        ? "ಸರ್ವರ್‌ನಲ್ಲಿ API ಕೀ ಹೊಂದಿಸಲಾಗಿದೆ. ನೇರ Agmarknet ದರ ಸಿಂಕ್ ಮಾಡಲು ಸಿದ್ಧವಾಗಿದೆ."
                        : "ಬ್ಯಾಕ್‌ಎಂಡ್ ಪರಿಸರದಲ್ಲಿ DATA_GOV_IN_API_KEY ಹೊಂದಿಸಲಾಗಿಲ್ಲ."
                ),
                new IntegrationStatusItem(
                    "open_meteo",
                    "Open-Meteo Forecast & Geocoding",
                    true,
                    "https://api.open-meteo.com/v1/forecast",
                    0,
                    null,
                    "Public Open-Meteo forecast & geocoding endpoints configured (no API key required for non-commercial use).",
                    "Open-Meteo ಸಾರ್ವಜನಿಕ ಹವಾಮಾನ ಮತ್ತು ಸ್ಥಳ ಹುಡುಕಾಟ ಎಂಡ್‌ಪಾಯಿಂಟ್‌ಗಳು ಸಿದ್ಧವಾಗಿವೆ."
                ),
                new IntegrationStatusItem(
                    "plant_disease_model",
                    "Crop Leaf Disease Inference Service",
                    plantDiseaseModelClient.isConfigured(),
                    plantDiseaseModelClient.isConfigured() ? "Configured external FastAPI inference URL" : "Unconfigured",
                    scans.size(),
                    latestScanTimestamp,
                    plantDiseaseModelClient.isConfigured()
                        ? "Inference service URL configured; leaf images are forwarded from backend."
                        : "PLANT_DISEASE_INFERENCE_URL is not configured. Scanner shows an honest unavailable state.",
                    plantDiseaseModelClient.isConfigured()
                        ? "ರೋಗ ವರ್ಗೀಕರಣ ಸೇವೆಯ URL ಹೊಂದಿಸಲಾಗಿದೆ."
                        : "PLANT_DISEASE_INFERENCE_URL ಹೊಂದಿಸಲಾಗಿಲ್ಲ. ಸ್ಕ್ಯಾನರ್ ಲಭ್ಯವಿಲ್ಲದ ಸ್ಥಿತಿಯನ್ನು ತೋರಿಸುತ್ತದೆ."
                ),
                new IntegrationStatusItem(
                    "gemini_ai",
                    "Google Gemini AI Farmer Assistant",
                    geminiClient.isConfigured(),
                    geminiClient.getModel(),
                    aiMessages.size(),
                    latestAiTimestamp,
                    geminiClient.isConfigured()
                        ? "GEMINI_API_KEY is set server-side for bilingual English & Kannada agronomic answers."
                        : "GEMINI_API_KEY is not configured in backend environment variables.",
                    geminiClient.isConfigured()
                        ? "ಸರ್ವರ್‌ನಲ್ಲಿ GEMINI_API_KEY ಹೊಂದಿಸಲಾಗಿದೆ (ಇಂಗ್ಲಿಷ್ ಮತ್ತು ಕನ್ನಡ ಸಹಾಯಕ)."
                        : "ಬ್ಯಾಕ್‌ಎಂಡ್ ಪರಿಸರದಲ್ಲಿ GEMINI_API_KEY ಹೊಂದಿಸಲಾಗಿಲ್ಲ."
                )
            )
        );
    }

    public IntegrationsProbeResponse probeIntegrations() {
        List<IntegrationProbeItem> results = new ArrayList<>();

        long startMeteo = System.currentTimeMillis();
        try {
            var locs = openMeteoClient.searchLocations("Bengaluru");
            long elapsed = System.currentTimeMillis() - startMeteo;
            results.add(new IntegrationProbeItem(
                "open_meteo",
                "REACHABLE",
                elapsed,
                "Open-Meteo geocoding responded with " + locs.size() + " matches.",
                "Open-Meteo ಸ್ಥಳ ಸೇವೆ " + locs.size() + " ಫಲಿತಾಂಶಗಳೊಂದಿಗೆ ಪ್ರತಿಕ್ರಿಯಿಸಿದೆ."
            ));
        } catch (Exception ex) {
            results.add(new IntegrationProbeItem(
                "open_meteo",
                "UNREACHABLE",
                System.currentTimeMillis() - startMeteo,
                "Open-Meteo request failed: " + ex.getMessage(),
                "Open-Meteo ಸಂಪರ್ಕ ವಿಫಲವಾಗಿದೆ: " + ex.getMessage()
            ));
        }

        if (!dataGovMandiClient.isConfigured()) {
            results.add(new IntegrationProbeItem(
                "data_gov_in",
                "UNCONFIGURED",
                null,
                "DATA_GOV_IN_API_KEY missing in server environment.",
                "ಸರ್ವರ್‌ನಲ್ಲಿ DATA_GOV_IN_API_KEY ಹೊಂದಿಸಲಾಗಿಲ್ಲ."
            ));
        } else {
            long startGov = System.currentTimeMillis();
            try {
                var res = dataGovMandiClient.fetchDailyPrices(null, "Karnataka", null, null, 1, 0);
                results.add(new IntegrationProbeItem(
                    "data_gov_in",
                    "REACHABLE",
                    System.currentTimeMillis() - startGov,
                    "data.gov.in API reachable (" + res.totalAvailable() + " available records reported).",
                    "data.gov.in API ಸಂಪರ್ಕದಲ್ಲಿದೆ (" + res.totalAvailable() + " ದಾಖಲೆಗಳು ಲಭ್ಯ)."
                ));
            } catch (Exception ex) {
                results.add(new IntegrationProbeItem(
                    "data_gov_in",
                    "UNREACHABLE",
                    System.currentTimeMillis() - startGov,
                    "data.gov.in probe failed: " + ex.getMessage(),
                    "data.gov.in ಸಂಪರ್ಕ ವಿಫಲವಾಗಿದೆ."
                ));
            }
        }

        if (!plantDiseaseModelClient.isConfigured()) {
            results.add(new IntegrationProbeItem(
                "plant_disease_model",
                "UNCONFIGURED",
                null,
                "PLANT_DISEASE_INFERENCE_URL not configured.",
                "PLANT_DISEASE_INFERENCE_URL ಹೊಂದಿಸಲಾಗಿಲ್ಲ."
            ));
        } else {
            long startScan = System.currentTimeMillis();
            var health = plantDiseaseModelClient.checkHealth();
            results.add(new IntegrationProbeItem(
                "plant_disease_model",
                health.connected() ? "REACHABLE" : "UNREACHABLE",
                System.currentTimeMillis() - startScan,
                health.connected() ? "Inference health endpoint active (" + health.modelId() + ")." : health.errorMessage(),
                health.connected() ? "ರೋಗ ಮಾದರಿ ಸೇವೆ ಸಕ್ರಿಯವಾಗಿದೆ." : "ರೋಗ ಮಾದರಿ ಸೇವೆ ತಲುಪಲಾಗುತ್ತಿಲ್ಲ."
            ));
        }

        results.add(new IntegrationProbeItem(
            "gemini_ai",
            geminiClient.isConfigured() ? "CONFIGURED" : "UNCONFIGURED",
            null,
            geminiClient.isConfigured()
                ? "Server-side key present for model " + geminiClient.getModel() + " (live quota verified on chat request)."
                : "GEMINI_API_KEY missing in server environment.",
            geminiClient.isConfigured()
                ? "ಸರ್ವರ್ ಕೀ ಲಭ್ಯವಿದೆ (" + geminiClient.getModel() + ")."
                : "ಸರ್ವರ್‌ನಲ್ಲಿ GEMINI_API_KEY ಹೊಂದಿಸಲಾಗಿಲ್ಲ."
        ));

        return new IntegrationsProbeResponse(Instant.now().toString(), results);
    }

    private AdminFarmerAccountDto toAccountDto(User user, FarmerProfile profile) {
        return new AdminFarmerAccountDto(
            user.getId(),
            user.getFullName(),
            maskEmail(user.getEmail()),
            user.getPreferredLanguage(),
            user.isOnboardingCompleted(),
            user.isActive(),
            profile != null ? profile.isHasSoilReport() : null,
            profile != null ? profile.getState() : null,
            profile != null ? profile.getDistrict() : null,
            profile != null ? profile.getLandSize() : null,
            profile != null ? profile.getLandUnit() : null,
            profile != null ? profile.getGrowingSeason() : null,
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }

    private static String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        String[] parts = email.split("@", 2);
        String local = parts[0];
        String prefix = local.length() <= 2 ? local.substring(0, 1) : local.substring(0, 2);
        return prefix + "***@" + parts[1];
    }

    private static List<CountBucket> toBuckets(Map<String, Long> map) {
        return map.entrySet().stream()
            .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
            .map(e -> new CountBucket(e.getKey(), e.getValue()))
            .toList();
    }

    private static final class DistrictAccumulator {
        final String district;
        final String state;
        long count = 0;

        DistrictAccumulator(String district, String state) {
            this.district = district;
            this.state = state;
        }

        void increment() {
            this.count++;
        }
    }
}
