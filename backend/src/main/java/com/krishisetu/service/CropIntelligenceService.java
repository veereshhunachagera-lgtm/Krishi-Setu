package com.krishisetu.service;

import com.krishisetu.dto.*;
import com.krishisetu.entity.CropKnowledge;
import com.krishisetu.entity.FarmerProfile;
import com.krishisetu.entity.SavedCropAdvisoryPlan;
import com.krishisetu.entity.SoilReport;
import com.krishisetu.entity.User;
import com.krishisetu.exception.BadRequestException;
import com.krishisetu.exception.ResourceNotFoundException;
import com.krishisetu.repository.CropKnowledgeRepository;
import com.krishisetu.repository.FarmerProfileRepository;
import com.krishisetu.repository.SavedCropAdvisoryPlanRepository;
import com.krishisetu.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class CropIntelligenceService {

    private final CropKnowledgeRepository cropRepository;
    private final FarmerProfileRepository profileRepository;
    private final SavedCropAdvisoryPlanRepository planRepository;
    private final UserRepository userRepository;
    private final CropDatasetImportService importService;

    public CropIntelligenceService(
        CropKnowledgeRepository cropRepository,
        FarmerProfileRepository profileRepository,
        SavedCropAdvisoryPlanRepository planRepository,
        UserRepository userRepository,
        CropDatasetImportService importService
    ) {
        this.cropRepository = cropRepository;
        this.profileRepository = profileRepository;
        this.planRepository = planRepository;
        this.userRepository = userRepository;
        this.importService = importService;
    }

    public List<CropKnowledgeDto> searchKnowledgeBank(
        String query,
        String season,
        String soilType,
        String waterRequirement,
        String category
    ) {
        String q = query != null ? query.trim().toLowerCase() : "";
        return cropRepository.findAllByOrderByNameEnAsc().stream()
            .filter(c -> matchesSearch(c, q))
            .filter(c -> season == null || season.isBlank() || season.equalsIgnoreCase("ALL")
                || c.getSeasons().stream().anyMatch(s -> s.equalsIgnoreCase(season)))
            .filter(c -> soilType == null || soilType.isBlank() || soilType.equalsIgnoreCase("ALL")
                || c.getSuitableSoils().stream().anyMatch(s -> s.equalsIgnoreCase(soilType)))
            .filter(c -> waterRequirement == null || waterRequirement.isBlank() || waterRequirement.equalsIgnoreCase("ALL")
                || c.getWaterRequirement().equalsIgnoreCase(waterRequirement))
            .filter(c -> category == null || category.isBlank() || category.equalsIgnoreCase("ALL")
                || c.getCropCategory().equalsIgnoreCase(category))
            .map(importService::toDto)
            .toList();
    }

    public CropKnowledgeDto getCropByCode(String cropCode) {
        CropKnowledge crop = cropRepository.findByCropCodeIgnoreCase(cropCode)
            .orElseThrow(() -> new ResourceNotFoundException("Crop not found in knowledge bank."));
        return importService.toDto(crop);
    }

    public CropRecommendationResponse generateRecommendations(
        UUID userId,
        String overrideSeason,
        String overrideIrrigation,
        String overrideSoilType
    ) {
        FarmerProfile profile = profileRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Complete farmer onboarding before requesting recommendations."));

        String effectiveSeason = resolveValue(overrideSeason, profile.getGrowingSeason());
        String effectiveIrrigation = resolveValue(overrideIrrigation, profile.getIrrigationSource());
        String effectiveSoilType = resolveValue(overrideSoilType, profile.getSoilType());

        CropRecommendationResponse response = new CropRecommendationResponse();
        response.setProfileContext(buildProfileContext(profile, effectiveSeason, effectiveIrrigation, effectiveSoilType));

        List<String> missingEn = new ArrayList<>();
        List<String> missingKn = new ArrayList<>();
        collectMissingInfo(profile, effectiveSeason, effectiveIrrigation, effectiveSoilType, missingEn, missingKn);
        response.setMissingInformationEn(missingEn);
        response.setMissingInformationKn(missingKn);

        List<String> limitsEn = List.of(
            "Recommendations are rule-based matches from our curated dataset (with regional sample indicators where local district trials are unavailable).",
            "Live local weather rainfall, real-time pest outbreaks, expected yields, market prices, and profits are intentionally excluded to avoid fabricated figures."
        );
        List<String> limitsKn = List.of(
            "ಈ ಶಿಫಾರಸುಗಳು ನಮ್ಮ ಸಂಗ್ರಹಿತ ದತ್ತಾಂಶದ ನಿಯಮಗಳ ಮೇಲೆ ಆಧಾರಿತವಾಗಿವೆ (ಪ್ರಾದೇಶಿಕ ಪ್ರಯೋಗ ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲದ ಕಡೆ ಮಾದರಿ ಸೂಚನೆ ಇರುತ್ತದೆ).",
            "ನೇರ ಹವಾಮಾನ ಮಳೆ, ಇಳುವರಿ, ಮಾರುಕಟ್ಟೆ ದರ ಅಥವಾ ಲಾಭದ ಅಂಕಿಅಂಶಗಳನ್ನು ಊಹಿಸಿ ತೋರಿಸಲಾಗುವುದಿಲ್ಲ."
        );
        response.setLimitationsEn(limitsEn);
        response.setLimitationsKn(limitsKn);

        List<CropKnowledge> allCrops = cropRepository.findAllByOrderByNameEnAsc();
        List<ScoredCrop> scored = allCrops.stream()
            .map(crop -> evaluateCropForFarmer(crop, profile, effectiveSeason, effectiveIrrigation, effectiveSoilType))
            .sorted((a, b) -> Integer.compare(b.internalScore, a.internalScore))
            .toList();

        response.setRecommendations(scored.stream().map(s -> s.item).toList());
        return response;
    }

    public AlternativeComparisonResponse compareAlternatives(
        UUID userId,
        List<String> cropCodes,
        String overrideSeason,
        String overrideIrrigation
    ) {
        if (cropCodes == null || cropCodes.size() < 2 || cropCodes.size() > 4) {
            throw new BadRequestException("Select between 2 and 4 crops to compare side-by-side.");
        }

        FarmerProfile profile = profileRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Farmer profile not found."));

        String effectiveSeason = resolveValue(overrideSeason, profile.getGrowingSeason());
        String effectiveIrrigation = resolveValue(overrideIrrigation, profile.getIrrigationSource());
        String effectiveSoilType = profile.getSoilType();

        List<CropRecommendationResponse.RecommendedCropItem> compared = new ArrayList<>();
        for (String code : cropCodes) {
            CropKnowledge crop = cropRepository.findByCropCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Crop not found: " + code));
            compared.add(evaluateCropForFarmer(crop, profile, effectiveSeason, effectiveIrrigation, effectiveSoilType).item);
        }

        AlternativeComparisonResponse res = new AlternativeComparisonResponse();
        res.setComparedCrops(compared);

        List<String> notesEn = new ArrayList<>();
        List<String> notesKn = new ArrayList<>();

        Optional<CropRecommendationResponse.RecommendedCropItem> lowWater = compared.stream()
            .filter(c -> "LOW".equalsIgnoreCase(c.getCrop().getWaterRequirement()))
            .findFirst();
        if (lowWater.isPresent()) {
            notesEn.add(lowWater.get().getCrop().getNameEn() + " requires low water and reduces dry-spell risk compared to water-intensive options.");
            notesKn.add(lowWater.get().getCrop().getNameKn() + " ಕಡಿಮೆ ನೀರಿನಲ್ಲಿ ಬೆಳೆಯುತ್ತದೆ ಮತ್ತು ಒಣ ಹವೆಯ ಅಪಾಯ ಕಡಿಮೆ ಮಾಡುತ್ತದೆ.");
        }

        Optional<CropRecommendationResponse.RecommendedCropItem> fixer = compared.stream()
            .filter(c -> c.getCrop().isNitrogenFixing())
            .findFirst();
        if (fixer.isPresent()) {
            notesEn.add(fixer.get().getCrop().getNameEn() + " fixes atmospheric nitrogen and strengthens soil health for the next season.");
            notesKn.add(fixer.get().getCrop().getNameKn() + " ಮಣ್ಣಿನಲ್ಲಿ ಸಾರಜನಕ ಸ್ಥಿರೀಕರಿಸಿ ಮುಂದಿನ ಋತುವಿನ ಫಲವತ್ತತೆ ಹೆಚ್ಚಿಸುತ್ತದೆ.");
        }

        compared.stream()
            .min(Comparator.comparingInt(c -> c.getCrop().getDurationMinDays()))
            .ifPresent(shortest -> {
                notesEn.add(shortest.getCrop().getNameEn() + " has the shortest field duration ("
                    + shortest.getCrop().getDurationMinDays() + "–" + shortest.getCrop().getDurationMaxDays() + " days).");
                notesKn.add(shortest.getCrop().getNameKn() + " ಅತ್ಯಂತ ಕಡಿಮೆ ಅವಧಿಯ ಬೆಳೆಯಾಗಿದೆ ("
                    + shortest.getCrop().getDurationMinDays() + "–" + shortest.getCrop().getDurationMaxDays() + " ದಿನಗಳು).");
            });

        res.setComparisonNotesEn(notesEn);
        res.setComparisonNotesKn(notesKn);
        res.setLimitationsEn(List.of(
            "Comparison covers factual water needs, duration, soil fit, advantages, and agronomic risks. Expected yields, market rates, and profit margins are intentionally not fabricated."
        ));
        res.setLimitationsKn(List.of(
            "ಈ ಹೋಲಿಕೆಯು ನೀರಿನ ಅವಶ್ಯಕತೆ, ಅವಧಿ, ಮಣ್ಣಿನ ಹೊಂದಾಣಿಕೆ, ಅನುಕೂಲಗಳು ಮತ್ತು ಅಪಾಯಗಳನ್ನು ಮಾತ್ರ ತೋರಿಸುತ್ತದೆ. ಊಹಾತ್ಮಕ ಇಳುವರಿ ಅಥವಾ ಲಾಭವನ್ನು ತೋರಿಸಲಾಗಿಲ್ಲ."
        ));
        return res;
    }

    public SoilAnalysisResponse analyzeSoilHealth(UUID userId) {
        FarmerProfile profile = profileRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Farmer profile not found."));

        SoilAnalysisResponse response = new SoilAnalysisResponse();
        response.setHasSoilReport(profile.isHasSoilReport());
        response.setSoilType(profile.getSoilType());

        List<SoilAnalysisResponse.NutrientStatusItem> items = new ArrayList<>();
        List<String> missingEn = new ArrayList<>();
        List<String> missingKn = new ArrayList<>();

        SoilReport report = profile.getSoilReport();
        if (!profile.isHasSoilReport() || report == null) {
            missingEn.add("No Soil Health Card or lab test report is saved. Showing baseline practices for your recorded soil class instead of lab thresholds.");
            missingKn.add("ಮಣ್ಣು ಆರೋಗ್ಯ ಕಾರ್ಡ್ ಅಥವಾ ಪ್ರಯೋಗಾಲಯದ ವರದಿ ಉಳಿಸಲಾಗಿಲ್ಲ. ಪ್ರಯೋಗಾಲಯದ ಮೌಲ್ಯಗಳ ಬದಲು ಮೂಲಭೂತ ಮಣ್ಣಿನ ಕ್ರಮಗಳನ್ನು ತೋರಿಸಲಾಗಿದೆ.");
        } else {
            items.add(evaluateNutrient("nitrogen", report.getNitrogenKgPerHa(), report.isNitrogenUnknown(), "kg/ha", 280.0, 560.0));
            items.add(evaluateNutrient("phosphorus", report.getPhosphorusKgPerHa(), report.isPhosphorusUnknown(), "kg/ha", 10.0, 25.0));
            items.add(evaluateNutrient("potassium", report.getPotassiumKgPerHa(), report.isPotassiumUnknown(), "kg/ha", 108.0, 280.0));
            items.add(evaluatePh(report.getPhLevel(), report.isPhUnknown()));

            if (report.isNitrogenUnknown() || report.getNitrogenKgPerHa() == null) {
                missingEn.add("Nitrogen (N) reading is marked unknown or missing.");
                missingKn.add("ಸಾರಜನಕ (N) ಮೌಲ್ಯವನ್ನು ತಿಳಿದಿಲ್ಲ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ ಅಥವಾ ನಮೂದಿಸಿಲ್ಲ.");
            }
            if (report.isPhosphorusUnknown() || report.getPhosphorusKgPerHa() == null) {
                missingEn.add("Phosphorus (P) reading is marked unknown or missing.");
                missingKn.add("ರಂಜಕ (P) ಮೌಲ್ಯವನ್ನು ತಿಳಿದಿಲ್ಲ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ ಅಥವಾ ನಮೂದಿಸಿಲ್ಲ.");
            }
            if (report.isPotassiumUnknown() || report.getPotassiumKgPerHa() == null) {
                missingEn.add("Potassium (K) reading is marked unknown or missing.");
                missingKn.add("ಪೊಟ್ಯಾಸಿಯಮ್ (K) ಮೌಲ್ಯವನ್ನು ತಿಳಿದಿಲ್ಲ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ ಅಥವಾ ನಮೂದಿಸಿಲ್ಲ.");
            }
            if (report.isPhUnknown() || report.getPhLevel() == null) {
                missingEn.add("Soil pH value is marked unknown or missing.");
                missingKn.add("ಮಣ್ಣಿನ pH ಮೌಲ್ಯವನ್ನು ತಿಳಿದಿಲ್ಲ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ ಅಥವಾ ನಮೂದಿಸಿಲ್ಲ.");
            }
        }

        missingEn.add("Micronutrients (Zinc, Boron, Sulphur) and Organic Carbon are not captured in Phase 2 onboarding and should be checked on your lab card.");
        missingKn.add("ಸೂಕ್ಷ್ಮ ಪೋಷಕಾಂಶಗಳು (ಸತು, ಬೋರಾನ್, ಗಂಧಕ) ಮತ್ತು ಸಾವಯವ ಇಂಗಾಲದ ಮಾಹಿತಿಯನ್ನು ನಿಮ್ಮ ಪ್ರಯೋಗಾಲಯ ವರದಿಯಲ್ಲಿ ಪರಿಶೀಲಿಸಿ.");

        response.setParameters(items);
        response.setMissingInformationEn(missingEn);
        response.setMissingInformationKn(missingKn);
        response.setBaselinePracticesEn(List.of(
            "Incorporate well-decomposed farmyard manure or compost before sowing to improve moisture retention and soil biology.",
            "Split nitrogen applications across active growth stages rather than applying all at sowing.",
            "Test soil every 2–3 years at your district Krishi Vigyan Kendra or Raitha Samparka Kendra."
        ));
        response.setBaselinePracticesKn(List.of(
            "ತೇವಾಂಶ ಮತ್ತು ಮಣ್ಣಿನ ಜೀವಸತ್ವ ಹೆಚ್ಚಿಸಲು ಬಿತ್ತನೆಗೆ ಮುನ್ನ ಚೆನ್ನಾಗಿ ಕೊಳೆತ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ ಸೇರಿಸಿ.",
            "ಸಾರಜನಕವನ್ನು ಒಂದೇ ಬಾರಿಗೆ ಹಾಕದೆ ಬೆಳೆಯ ಬೆಳವಣಿಗೆಯ ಹಂತಗಳಲ್ಲಿ ಹಂಚಿ ನೀಡಿ.",
            "ಪ್ರತಿ 2–3 ವರ್ಷಗಳಿಗೊಮ್ಮೆ ಜಿಲ್ಲಾ ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ ಅಥವಾ ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರದಲ್ಲಿ ಮಣ್ಣು ಪರೀಕ್ಷೆ ಮಾಡಿಸಿ."
        ));
        return response;
    }

    public List<SavedCropPlanResponse> getSavedPlans(UUID userId) {
        return planRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
            .map(this::toPlanResponse)
            .toList();
    }

    @Transactional
    public SavedCropPlanResponse savePlan(UUID userId, SavedCropPlanRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        CropKnowledge primary = cropRepository.findByCropCodeIgnoreCase(request.getPrimaryCropCode().trim())
            .orElseThrow(() -> new BadRequestException("Selected primary crop does not exist in dataset."));

        List<String> validAlts = new ArrayList<>();
        if (request.getAlternativeCropCodes() != null) {
            for (String code : request.getAlternativeCropCodes()) {
                if (code != null && !code.isBlank() && !code.equalsIgnoreCase(primary.getCropCode())) {
                    cropRepository.findByCropCodeIgnoreCase(code.trim())
                        .ifPresent(c -> {
                            if (!validAlts.contains(c.getCropCode())) {
                                validAlts.add(c.getCropCode());
                            }
                        });
                }
            }
        }

        SavedCropAdvisoryPlan plan = new SavedCropAdvisoryPlan();
        plan.setUser(user);
        plan.setPrimaryCropCode(primary.getCropCode());
        plan.setAlternativeCropCodes(validAlts);
        plan.setPlannedSeason(request.getPlannedSeason());
        plan.setFarmerNotes(request.getFarmerNotes() != null ? request.getFarmerNotes().trim() : null);

        SavedCropAdvisoryPlan saved = planRepository.save(plan);
        return toPlanResponse(saved);
    }

    @Transactional
    public void deletePlan(UUID userId, UUID planId) {
        SavedCropAdvisoryPlan plan = planRepository.findByIdAndUserId(planId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Saved advisory plan not found."));
        planRepository.delete(plan);
    }

    private SavedCropPlanResponse toPlanResponse(SavedCropAdvisoryPlan plan) {
        SavedCropPlanResponse res = new SavedCropPlanResponse();
        res.setId(plan.getId());
        res.setPrimaryCropCode(plan.getPrimaryCropCode());
        cropRepository.findByCropCodeIgnoreCase(plan.getPrimaryCropCode()).ifPresent(c -> {
            res.setPrimaryCropNameEn(c.getNameEn());
            res.setPrimaryCropNameKn(c.getNameKn());
        });
        res.setAlternativeCropCodes(plan.getAlternativeCropCodes());
        res.setPlannedSeason(plan.getPlannedSeason());
        res.setFarmerNotes(plan.getFarmerNotes());
        res.setCreatedAt(plan.getCreatedAt());
        return res;
    }

    private boolean matchesSearch(CropKnowledge c, String q) {
        if (q.isEmpty()) return true;
        return c.getNameEn().toLowerCase().contains(q)
            || c.getNameKn().toLowerCase().contains(q)
            || (c.getScientificName() != null && c.getScientificName().toLowerCase().contains(q))
            || c.getCropCategory().toLowerCase().contains(q)
            || c.getSupportedDistricts().stream().anyMatch(d -> d.toLowerCase().contains(q));
    }

    private String resolveValue(String overrideVal, String savedVal) {
        return (overrideVal != null && !overrideVal.isBlank()) ? overrideVal.trim() : savedVal;
    }

    private CropRecommendationResponse.FarmerContextSummary buildProfileContext(
        FarmerProfile profile,
        String season,
        String irrigation,
        String soilType
    ) {
        CropRecommendationResponse.FarmerContextSummary ctx = new CropRecommendationResponse.FarmerContextSummary();
        ctx.setHasSoilReport(profile.isHasSoilReport());
        ctx.setState(profile.getState());
        ctx.setDistrict(profile.getDistrict());
        ctx.setSoilType(soilType);
        ctx.setIrrigationSource(irrigation);
        ctx.setGrowingSeason(season);
        ctx.setCurrentOrPreviousCrop(profile.getCurrentOrPreviousCrop());
        if (profile.getLandSize() != null) {
            double val = profile.getLandSize().doubleValue();
            if ("HECTARES".equalsIgnoreCase(profile.getLandUnit())) val = val * 2.471;
            else if ("GUNTAS".equalsIgnoreCase(profile.getLandUnit())) val = val / 40.0;
            ctx.setLandSizeAcres(Math.round(val * 100.0) / 100.0);
        }
        return ctx;
    }

    private void collectMissingInfo(
        FarmerProfile profile,
        String season,
        String irrigation,
        String soilType,
        List<String> missingEn,
        List<String> missingKn
    ) {
        if (!profile.isHasSoilReport() || profile.getSoilReport() == null) {
            missingEn.add("Soil Health Card lab readings (N, P, K, pH) are not saved — recommendations rely on field soil type and irrigation.");
            missingKn.add("ಮಣ್ಣು ಆರೋಗ್ಯ ಕಾರ್ಡ್ ಪ್ರಯೋಗಾಲಯ ಮೌಲ್ಯಗಳು (N, P, K, pH) ಇಲ್ಲ — ಶಿಫಾರಸುಗಳು ಮಣ್ಣಿನ ವಿಧ ಮತ್ತು ನೀರಾವರಿ ಆಧಾರಿತವಾಗಿವೆ.");
        } else {
            SoilReport r = profile.getSoilReport();
            if (r.isPhUnknown() || r.getPhLevel() == null) {
                missingEn.add("Soil pH is unknown — pH compatibility checks could not be verified for each crop.");
                missingKn.add("ಮಣ್ಣಿನ pH ತಿಳಿದಿಲ್ಲ — ಬೆಳೆಗಳಿಗೆ pH ಹೊಂದಾಣಿಕೆ ಪರಿಶೀಲಿಸಲಾಗಲಿಲ್ಲ.");
            }
            if (r.isNitrogenUnknown() || r.getNitrogenKgPerHa() == null) {
                missingEn.add("Nitrogen (N) value is unknown — nutrient demand ranking uses crop category baselines.");
                missingKn.add("ಸಾರಜನಕ (N) ಮೌಲ್ಯ ತಿಳಿದಿಲ್ಲ — ಪೋಷಕಾಂಶ ಮಾರ್ಗದರ್ಶನ ಸಾಮಾನ್ಯ ಆಧಾರದಲ್ಲಿದೆ.");
            }
        }
        if (soilType == null || soilType.isBlank() || "UNKNOWN".equalsIgnoreCase(soilType)) {
            missingEn.add("Soil type is not specified — showing broader cross-soil matches.");
            missingKn.add("ಮಣ್ಣಿನ ವಿಧ ನಮೂದಿಸಿಲ್ಲ — ವಿವಿಧ ಮಣ್ಣುಗಳಿಗೆ ಹೊಂದುವ ಬೆಳೆಗಳನ್ನು ತೋರಿಸಲಾಗಿದೆ.");
        }
        if (season == null || season.isBlank() || "UNKNOWN".equalsIgnoreCase(season)) {
            missingEn.add("Growing season is not selected — crops across Kharif, Rabi, and Zaid are included.");
            missingKn.add("ಬೆಳೆ ಋತು ಆಯ್ಕೆ ಮಾಡಿಲ್ಲ — ಎಲ್ಲಾ ಋತುಗಳ ಬೆಳೆಗಳನ್ನು ಸೇರಿಸಲಾಗಿದೆ.");
        }
        if (irrigation == null || irrigation.isBlank() || "UNKNOWN".equalsIgnoreCase(irrigation)) {
            missingEn.add("Irrigation source is unknown — verify crop water requirements against your field water availability.");
            missingKn.add("ನೀರಾವರಿ ಮೂಲ ತಿಳಿದಿಲ್ಲ — ನಿಮ್ಮ ಜಮೀನಿನ ನೀರಿನ ಲಭ್ಯತೆಯನ್ನು ಪರಿಶೀಲಿಸಿ.");
        }
        if (profile.getDistrict() == null || profile.getDistrict().isBlank()) {
            missingEn.add("District is not recorded — regional district match could not be checked.");
            missingKn.add("ಜಿಲ್ಲೆ ನಮೂದಿಸಿಲ್ಲ — ಜಿಲ್ಲಾ ಮಟ್ಟದ ಹೊಂದಾಣಿಕೆ ಪರಿಶೀಲಿಸಲಾಗಲಿಲ್ಲ.");
        }
    }

    private ScoredCrop evaluateCropForFarmer(
        CropKnowledge crop,
        FarmerProfile profile,
        String season,
        String irrigation,
        String soilType
    ) {
        int score = 0;
        List<String> reasonsEn = new ArrayList<>();
        List<String> reasonsKn = new ArrayList<>();
        List<String> cautionsEn = new ArrayList<>();
        List<String> cautionsKn = new ArrayList<>();

        // 1. Season rule
        if (season != null && !season.isBlank() && !"UNKNOWN".equalsIgnoreCase(season)) {
            if (crop.getSeasons().stream().anyMatch(s -> s.equalsIgnoreCase(season))) {
                score += 25;
                reasonsEn.add("Fits your selected growing season (" + season + ").");
                reasonsKn.add("ನಿಮ್ಮ ಆಯ್ಕೆಯ ಬೆಳೆ ಋತುವಿಗೆ (" + season + ") ಸೂಕ್ತವಾಗಿದೆ.");
            } else {
                score -= 20;
                cautionsEn.add("Usually grown in " + String.join("/", crop.getSeasons()) + " rather than " + season + ".");
                cautionsKn.add("ಸಾಮಾನ್ಯವಾಗಿ " + String.join("/", crop.getSeasons()) + " ಋತುವಿನಲ್ಲಿ ಬೆಳೆಯಲಾಗುತ್ತದೆ.");
            }
        } else {
            score += 5;
        }

        // 2. Soil type rule
        if (soilType != null && !soilType.isBlank() && !"UNKNOWN".equalsIgnoreCase(soilType)) {
            if (crop.getSuitableSoils().stream().anyMatch(s -> s.equalsIgnoreCase(soilType))) {
                score += 25;
                reasonsEn.add("Adapted to " + soilType.replace("_", " ") + " soil.");
                reasonsKn.add("ನಿಮ್ಮ ಜಮೀನಿನ ಮಣ್ಣಿನ ವಿಧಕ್ಕೆ (" + soilType + ") ಹೊಂದಿಕೊಳ್ಳುತ್ತದೆ.");
            } else {
                score -= 15;
                cautionsEn.add("Prefers " + String.join(", ", crop.getSuitableSoils()) + " soils; check drainage/texture on your field.");
                cautionsKn.add("ಈ ಬೆಳೆಗೆ " + String.join(", ", crop.getSuitableSoils()) + " ಮಣ್ಣು ಹೆಚ್ಚು ಸೂಕ್ತ; ಬಸಿಗಾಲುವೆ ಪರಿಶೀಲಿಸಿ.");
            }
        } else {
            score += 5;
        }

        // 3. Irrigation vs Water Requirement rule
        String waterReq = crop.getWaterRequirement();
        if (irrigation != null && !irrigation.isBlank() && !"UNKNOWN".equalsIgnoreCase(irrigation)) {
            boolean assuredWater = List.of("CANAL", "BOREWELL", "DRIP_SPRINKLER").contains(irrigation.toUpperCase());
            if ("RAINFED".equalsIgnoreCase(irrigation)) {
                if ("LOW".equalsIgnoreCase(waterReq)) {
                    score += 25;
                    reasonsEn.add("Low water requirement fits rainfed conditions well.");
                    reasonsKn.add("ಕಡಿಮೆ ನೀರಿನ ಅವಶ್ಯಕತೆ ಮಳೆಯಾಶ್ರಿತ ಜಮೀನಿಗೆ ಉತ್ತಮವಾಗಿ ಹೊಂದುತ್ತದೆ.");
                } else if ("MEDIUM".equalsIgnoreCase(waterReq)) {
                    score += 10;
                    cautionsEn.add("Moderate water demand — vulnerable if monsoon breaks exceed 2–3 weeks.");
                    cautionsKn.add("ಮಧ್ಯಮ ನೀರಿನ ಅವಶ್ಯಕತೆ — ಮಳೆ ಕೈಕೊಟ್ಟರೆ ರಕ್ಷಣಾತ್ಮಕ ನೀರು ಬೇಕಾಗಬಹುದು.");
                } else {
                    score -= 30;
                    cautionsEn.add("High water requirement is risky on purely rainfed land.");
                    cautionsKn.add("ಮಳೆಯಾಶ್ರಿತ ಜಮೀನಿಗೆ ಹೆಚ್ಚು ನೀರು ಬಯಸುವ ಈ ಬೆಳೆ ಅಪಾಯಕಾರಿ.");
                }
            } else if (assuredWater) {
                if ("HIGH".equalsIgnoreCase(waterReq)) {
                    score += 20;
                    reasonsEn.add("Your " + irrigation.replace("_", " ") + " irrigation can support crop water needs.");
                    reasonsKn.add("ನಿಮ್ಮ ನೀರಾವರಿ ಸೌಲಭ್ಯ ಈ ಬೆಳೆಯ ನೀರಿನ ಬೇಡಿಕೆಯನ್ನು ಪೂರೈಸಬಲ್ಲದು.");
                } else {
                    score += 18;
                    reasonsEn.add("Low-to-moderate water use helps conserve irrigation water.");
                    reasonsKn.add("ಕಡಿಮೆ/ಮಧ್ಯಮ ನೀರಿನ ಬಳಕೆಯಿಂದ ನೀರಾವರಿ ಉಳಿತಾಯವಾಗುತ್ತದೆ.");
                }
            } else {
                if ("LOW".equalsIgnoreCase(waterReq) || "MEDIUM".equalsIgnoreCase(waterReq)) {
                    score += 15;
                    reasonsEn.add("Compatible with tank/open-well irrigation availability.");
                    reasonsKn.add("ಕೆರೆ ಅಥವಾ ತೆರೆದ ಬಾವಿ ನೀರಾವರಿಗೆ ಹೊಂದಿಕೊಳ್ಳುತ್ತದೆ.");
                } else {
                    score -= 10;
                    cautionsEn.add("Verify water availability across full season before planting a high-water crop.");
                    cautionsKn.add("ಹೆಚ್ಚು ನೀರು ಬೇಕಾದ ಬೆಳೆಗೆ ಪೂರ್ಣ ಋತುವಿನ ನೀರಿನ ಲಭ್ಯತೆ ಖಚಿತಪಡಿಸಿ.");
                }
            }
        }

        // 4. Soil Report pH & Nitrogen rule
        if (profile.isHasSoilReport() && profile.getSoilReport() != null) {
            SoilReport report = profile.getSoilReport();
            if (!report.isPhUnknown() && report.getPhLevel() != null && crop.getMinPh() != null && crop.getMaxPh() != null) {
                BigDecimal ph = report.getPhLevel();
                if (ph.compareTo(crop.getMinPh()) >= 0 && ph.compareTo(crop.getMaxPh()) <= 0) {
                    score += 15;
                    reasonsEn.add("Recorded soil pH (" + ph + ") is within crop tolerance (" + crop.getMinPh() + "–" + crop.getMaxPh() + ").");
                    reasonsKn.add("ದಾಖಲಾದ ಮಣ್ಣಿನ pH (" + ph + ") ಬೆಳೆಯ ಸೂಕ್ತ ಮಿತಿಯೊಳಗೆ (" + crop.getMinPh() + "–" + crop.getMaxPh() + ") ಇದೆ.");
                } else {
                    score -= 15;
                    cautionsEn.add("Recorded soil pH (" + ph + ") lies outside optimal " + crop.getMinPh() + "–" + crop.getMaxPh() + " range.");
                    cautionsKn.add("ಮಣ್ಣಿನ pH (" + ph + ") ಸೂಕ್ತ ಮಿತಿಗಿಂತ (" + crop.getMinPh() + "–" + crop.getMaxPh() + ") ಹೊರಗಿದೆ.");
                }
            }
            if (!report.isNitrogenUnknown() && report.getNitrogenKgPerHa() != null
                && report.getNitrogenKgPerHa().doubleValue() < 280.0 && crop.isNitrogenFixing()) {
                score += 12;
                reasonsEn.add("Low soil nitrogen recorded — this nitrogen-fixing crop helps rebuild soil fertility.");
                reasonsKn.add("ಮಣ್ಣಿನಲ್ಲಿ ಸಾರಜನಕ ಕಡಿಮೆ ಇರುವುದರಿಂದ ಈ ಸಾರಜನಕ ಸ್ಥಿರೀಕರಿಸುವ ಬೆಳೆ ಫಲವತ್ತತೆ ಹೆಚ್ಚಿಸುತ್ತದೆ.");
            }
        }

        // 5. Location match
        if (profile.getDistrict() != null && !profile.getDistrict().isBlank()) {
            boolean districtMatch = crop.getSupportedDistricts().stream()
                .anyMatch(d -> d.equalsIgnoreCase(profile.getDistrict().trim()));
            if (districtMatch) {
                score += 12;
                reasonsEn.add("Supported in " + profile.getDistrict() + " district crop reference.");
                reasonsKn.add(profile.getDistrict() + " ಜಿಲ್ಲೆಯ ಕೃಷಿ ಮಾರ್ಗದರ್ಶಿ ಪಟ್ಟಿಯಲ್ಲಿ ಸೇರಿದೆ.");
            }
        } else if (profile.getState() != null && crop.getSupportedStates().stream().anyMatch(s -> s.equalsIgnoreCase(profile.getState()))) {
            score += 5;
        }

        // 6. Crop rotation bonus / monoculture caution
        boolean rotationRecommended = false;
        String prevCrop = profile.getCurrentOrPreviousCrop() != null ? profile.getCurrentOrPreviousCrop().trim().toLowerCase() : "";
        if (!prevCrop.isEmpty()) {
            boolean isSameCrop = prevCrop.contains(crop.getCropCode().replace("-", " "))
                || prevCrop.contains(crop.getNameEn().toLowerCase().split(" ")[0]);
            if (isSameCrop) {
                score -= 15;
                cautionsEn.add("Same as your recorded crop (" + profile.getCurrentOrPreviousCrop() + ") — consider rotating with a pulse or oilseed to break pest cycles.");
                cautionsKn.add("ನಿಮ್ಮ ಹಿಂದಿನ ಬೆಳೆಯೇ ಆಗಿರುವುದರಿಂದ ಕೀಟ ಸರಪಳಿ ಮುರಿಯಲು ದ್ವಿದಳ ಅಥವಾ ಎಣ್ಣೆಕಾಳು ಬೆಳೆ ಪರಿವರ್ತನೆ ಪರಿಗಣಿಸಿ.");
            } else if (crop.isNitrogenFixing()) {
                score += 10;
                rotationRecommended = true;
                reasonsEn.add("Strong crop-rotation choice following " + profile.getCurrentOrPreviousCrop() + ".");
                reasonsKn.add(profile.getCurrentOrPreviousCrop() + " ಬೆಳೆಯ ನಂತರ ಬೆಳೆ ಪರಿವರ್ತನೆಗೆ ಉತ್ತಮ ಆಯ್ಕೆ.");
            }
        }

        String band;
        if (score >= 55) {
            band = "STRONG_FIT";
        } else if (score >= 25) {
            band = "MODERATE_FIT";
        } else {
            band = "CONDITIONAL_FIT";
        }

        if (reasonsEn.isEmpty()) {
            reasonsEn.add("Included as a reference crop option from the KrishiSetu dataset.");
            reasonsKn.add("ಕೃಷಿಸೇತು ದತ್ತಾಂಶದಿಂದ ಉಲ್ಲೇಖಿತ ಬೆಳೆ ಆಯ್ಕೆಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ.");
        }

        CropRecommendationResponse.RecommendedCropItem item = new CropRecommendationResponse.RecommendedCropItem();
        item.setCrop(importService.toDto(crop));
        item.setSuitabilityBand(band);
        item.setMatchReasonsEn(reasonsEn);
        item.setMatchReasonsKn(reasonsKn);
        item.setCautionsEn(cautionsEn);
        item.setCautionsKn(cautionsKn);
        item.setRotationRecommended(rotationRecommended);

        return new ScoredCrop(score, item);
    }

    private SoilAnalysisResponse.NutrientStatusItem evaluateNutrient(
        String key,
        BigDecimal value,
        boolean unknown,
        String unit,
        double lowMax,
        double highMin
    ) {
        SoilAnalysisResponse.NutrientStatusItem item = new SoilAnalysisResponse.NutrientStatusItem();
        item.setParameterKey(key);
        item.setUnknown(unknown || value == null);
        item.setMeasuredValue(value != null ? value.doubleValue() : null);
        item.setUnit(unit);
        item.setLowThreshold(lowMax);
        item.setHighThreshold(highMin);

        if (unknown || value == null) {
            item.setStatusBand("UNKNOWN");
            item.setSummaryEn("Not recorded on profile. Test at a soil lab before applying targeted chemical doses.");
            item.setSummaryKn("ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ದಾಖಲಾಗಿಲ್ಲ. ನಿಖರ ಗೊಬ್ಬರ ಪ್ರಮಾಣಕ್ಕೆ ಮುನ್ನ ಮಣ್ಣು ಪರೀಕ್ಷೆ ಮಾಡಿಸಿ.");
        } else {
            double v = value.doubleValue();
            if (v < lowMax) {
                item.setStatusBand("LOW");
                item.setSummaryEn("Below standard medium fertility threshold (" + lowMax + " " + unit + "). Combine organic compost with nitrogen-fixing rotation or split application.");
                item.setSummaryKn("ಸಾಮಾನ್ಯ ಮಧ್ಯಮ ಮಟ್ಟಕ್ಕಿಂತ (" + lowMax + ") ಕಡಿಮೆ ಇದೆ. ಸಾವಯವ ಗೊಬ್ಬರ, ದ್ವಿದಳ ಬೆಳೆ ಪರಿವರ್ತನೆ ಮತ್ತು ಹಂತವಾರು ಪೋಷಣೆ ಬಳಸಿ.");
            } else if (v <= highMin) {
                item.setStatusBand("MEDIUM");
                item.setSummaryEn("Within balanced medium range (" + lowMax + "–" + highMin + " " + unit + "). Maintain with crop-stage split nutrition and organic matter.");
                item.setSummaryKn("ಸಮತೋಲಿತ ಮಧ್ಯಮ ಮಟ್ಟದಲ್ಲಿದೆ (" + lowMax + "–" + highMin + "). ನಿಯಮಿತ ಸಾವಯವ ಗೊಬ್ಬರದಿಂದ ಕಾಯ್ದುಕೊಳ್ಳಿ.");
            } else {
                item.setStatusBand("HIGH");
                item.setSummaryEn("Above high threshold (" + highMin + " " + unit + "). Avoid over-application to reduce cost and runoff.");
                item.setSummaryKn("ಹೆಚ್ಚಿನ ಮಟ್ಟದಲ್ಲಿದೆ (" + highMin + " ಕ್ಕಿಂತ ಹೆಚ್ಚು). ಹೆಚ್ಚುವರಿ ರಾಸಾಯನಿಕ ಗೊಬ್ಬರ ತಪ್ಪಿಸಿ ವೆಚ್ಚ ಉಳಿಸಿ.");
            }
        }
        return item;
    }

    private SoilAnalysisResponse.NutrientStatusItem evaluatePh(BigDecimal phValue, boolean unknown) {
        SoilAnalysisResponse.NutrientStatusItem item = new SoilAnalysisResponse.NutrientStatusItem();
        item.setParameterKey("ph");
        item.setUnknown(unknown || phValue == null);
        item.setMeasuredValue(phValue != null ? phValue.doubleValue() : null);
        item.setUnit("pH");
        item.setLowThreshold(6.0);
        item.setHighThreshold(7.5);

        if (unknown || phValue == null) {
            item.setStatusBand("UNKNOWN");
            item.setSummaryEn("Soil pH not recorded.");
            item.setSummaryKn("ಮಣ್ಣಿನ pH ದಾಖಲಾಗಿಲ್ಲ.");
        } else {
            double v = phValue.doubleValue();
            if (v < 6.0) {
                item.setStatusBand("ACIDIC");
                item.setSummaryEn("Acidic soil (pH < 6.0). Consult local KVK on agricultural lime requirement if pH is below 5.5.");
                item.setSummaryKn("ಆಮ್ಲೀಯ ಮಣ್ಣು (pH < 6.0). pH 5.5 ಕ್ಕಿಂತ ಕಡಿಮೆ ಇದ್ದರೆ ಸುಣ್ಣದ ಪ್ರಮಾಣಕ್ಕೆ KVK ಸಲಹೆ ಪಡೆಯಿರಿ.");
            } else if (v <= 7.5) {
                item.setStatusBand("NEUTRAL");
                item.setSummaryEn("Optimal neutral range (6.0–7.5) suited to most pulses, cereals, and oilseeds.");
                item.setSummaryKn("ಸಮತೋಲಿತ ತಟಸ್ಥ ಮಟ್ಟ (6.0–7.5) — ಬಹುತೇಕ ಬೆಳೆಗಳಿಗೆ ಸೂಕ್ತವಾಗಿದೆ.");
            } else {
                item.setStatusBand("ALKALINE");
                item.setSummaryEn("Alkaline soil (pH > 7.5). Incorporate organic manure and consult KVK regarding gypsum if sodicity exists.");
                item.setSummaryKn("ಕ್ಷಾರೀಯ ಮಣ್ಣು (pH > 7.5). ಸಾವಯವ ಗೊಬ್ಬರ ಹೆಚ್ಚಿಸಿ ಮತ್ತು ಅಗತ್ಯವಿದ್ದರೆ ಜಿಪ್ಸಮ್ ಬಳಕೆಗೆ KVK ಸಲಹೆ ಪಡೆಯಿರಿ.");
            }
        }
        return item;
    }

    private record ScoredCrop(int internalScore, CropRecommendationResponse.RecommendedCropItem item) {}
}
