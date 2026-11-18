package com.krishisetu.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.krishisetu.dto.AiAssistantDtos.*;
import com.krishisetu.entity.AiChatMessage;
import com.krishisetu.entity.CropKnowledge;
import com.krishisetu.entity.FarmerProfile;
import com.krishisetu.entity.PlantProtectionGuide;
import com.krishisetu.entity.SoilReport;
import com.krishisetu.integration.GeminiClient;
import com.krishisetu.repository.AiChatMessageRepository;
import com.krishisetu.repository.CropKnowledgeRepository;
import com.krishisetu.repository.FarmerProfileRepository;
import com.krishisetu.repository.PlantProtectionGuideRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AiAssistantService {

    private final GeminiClient geminiClient;
    private final AiChatMessageRepository messageRepository;
    private final FarmerProfileRepository profileRepository;
    private final CropKnowledgeRepository cropRepository;
    private final PlantProtectionGuideRepository guideRepository;
    private final ObjectMapper objectMapper;

    public AiAssistantService(
        GeminiClient geminiClient,
        AiChatMessageRepository messageRepository,
        FarmerProfileRepository profileRepository,
        CropKnowledgeRepository cropRepository,
        PlantProtectionGuideRepository guideRepository,
        ObjectMapper objectMapper
    ) {
        this.geminiClient = geminiClient;
        this.messageRepository = messageRepository;
        this.profileRepository = profileRepository;
        this.cropRepository = cropRepository;
        this.guideRepository = guideRepository;
        this.objectMapper = objectMapper;
    }

    public AiAssistantStatusResponse getStatus() {
        return new AiAssistantStatusResponse(
            geminiClient.isConfigured(),
            "Google Gemini API",
            geminiClient.getModel(),
            List.of("en", "kn"),
            "Gemini API provides a no-cost tier with strict requests-per-minute and daily token quotas under Google AI Studio terms.",
            "Gemini API ಉಚಿತ ಶ್ರೇಣಿಯು ನಿಗದಿತ ನಿಮಿಷದ ಹಾಗೂ ದೈನಂದಿನ ಮಿತಿಗಳನ್ನು ಹೊಂದಿದೆ.",
            List.of(
                "Obtain a free or billing-enabled Gemini API key from Google AI Studio.",
                "Set GEMINI_API_KEY in the Spring Boot backend environment (never in frontend code).",
                "Optionally set GEMINI_MODEL (default: gemini-4-hydrogen) and restart the service."
            ),
            List.of(
                "Google AI Studio ದಿಂದ Gemini API ಕೀ ಪಡೆಯಿರಿ.",
                "Spring Boot ಬ್ಯಾಕ್‌ಎಂಡ್ ಪರಿಸರದಲ್ಲಿ GEMINI_API_KEY ಅನ್ನು ಹೊಂದಿಸಿ.",
                "ಅಗತ್ಯವಿದ್ದರೆ GEMINI_MODEL ಹೊಂದಿಸಿ ಬ್ಯಾಕ್‌ಎಂಡ್ ಮರುಪ್ರಾರಂಭಿಸಿ."
            ),
            "Grounded on your saved farm profile and KrishiSetu PostgreSQL crop dataset. Never invents live prices, weather forecasts, service contacts, or disease diagnoses.",
            "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಮತ್ತು ಕೃಷಿಸೇತು ಬೆಳೆ ಡೇಟಾಬೇಸ್ ಆಧಾರದ ಮೇಲೆ ಉತ್ತರಿಸುತ್ತದೆ. ನಕಲಿ ಬೆಲೆ ಅಥವಾ ರೋಗ ನಿರ್ಣಯಗಳನ್ನು ರಚಿಸುವುದಿಲ್ಲ."
        );
    }

    public List<AiChatMessageDto> getHistory(UUID userId) {
        return messageRepository.findByUserIdOrderByCreatedAtAsc(userId).stream()
            .map(this::toDto)
            .toList();
    }

    @Transactional
    public void clearHistory(UUID userId) {
        messageRepository.deleteByUserId(userId);
    }

    @Transactional
    public AiChatExchangeResponse chat(UUID userId, AiChatRequest req) {
        String lang = "kn".equalsIgnoreCase(req.language()) ? "kn" : "en";
        String query = req.message().trim();

        FarmerProfile profile = profileRepository.findByUserId(userId).orElse(null);
        List<CropKnowledge> allCrops = cropRepository.findAllByOrderByNameEnAsc();
        List<PlantProtectionGuide> allGuides = guideRepository.findAllByOrderByCropNameEnAsc();
        List<AiChatMessage> recent = messageRepository.findByUserIdOrderByCreatedAtAsc(userId);

        List<CropKnowledge> matchedCrops = selectRelevantCrops(query, profile, allCrops);
        Set<String> matchedCodes = matchedCrops.stream()
            .map(c -> c.getCropCode().toLowerCase(Locale.ROOT))
            .collect(Collectors.toSet());

        String lowerQuery = query.toLowerCase(Locale.ROOT);
        List<PlantProtectionGuide> matchedGuides = allGuides.stream()
            .filter(g -> matchedCodes.contains(g.getCropCode().toLowerCase(Locale.ROOT))
                || lowerQuery.contains(g.getIssueNameEn().toLowerCase(Locale.ROOT))
                || lowerQuery.contains(g.getCropNameEn().toLowerCase(Locale.ROOT)))
            .limit(4)
            .toList();

        String systemInstruction = buildSystemInstruction(lang);
        String prompt = buildPrompt(query, lang, profile, matchedCrops, matchedGuides, recent);

        // Propagates UpstreamServiceException on missing key, quota exhaustion, or network error
        String answerText = geminiClient.generateGroundedReply(systemInstruction, prompt);

        List<GroundedCropRef> refs = matchedCrops.stream()
            .map(c -> new GroundedCropRef(c.getCropCode(), c.getNameEn(), c.getNameKn(), c.getSourceReference()))
            .toList();

        AiChatMessage userMsg = new AiChatMessage();
        userMsg.setUserId(userId);
        userMsg.setRole("USER");
        userMsg.setLanguage(lang);
        userMsg.setContent(query);
        userMsg.setGroundedCropsJson("[]");
        userMsg = messageRepository.save(userMsg);

        AiChatMessage assistantMsg = new AiChatMessage();
        assistantMsg.setUserId(userId);
        assistantMsg.setRole("ASSISTANT");
        assistantMsg.setLanguage(lang);
        assistantMsg.setContent(answerText);
        assistantMsg.setModel(geminiClient.getModel());
        assistantMsg.setGroundedCropsJson(toJson(refs));
        assistantMsg = messageRepository.save(assistantMsg);

        return new AiChatExchangeResponse(toDto(userMsg), toDto(assistantMsg));
    }

    private List<CropKnowledge> selectRelevantCrops(String query, FarmerProfile profile, List<CropKnowledge> crops) {
        String lower = query.toLowerCase(Locale.ROOT);
        String savedCrop = profile != null && profile.getCurrentOrPreviousCrop() != null
            ? profile.getCurrentOrPreviousCrop().toLowerCase(Locale.ROOT)
            : "";

        record Scored(CropKnowledge crop, int score) {}
        List<CropKnowledge> matched = crops.stream()
            .map(c -> {
                int s = 0;
                if (lower.contains(c.getCropCode().toLowerCase(Locale.ROOT))
                    || lower.contains(c.getNameEn().toLowerCase(Locale.ROOT))
                    || lower.contains(c.getNameKn().toLowerCase(Locale.ROOT))) {
                    s += 10;
                }
                if (!savedCrop.isBlank() && (savedCrop.contains(c.getCropCode().toLowerCase(Locale.ROOT))
                    || savedCrop.contains(c.getNameEn().toLowerCase(Locale.ROOT)))) {
                    s += 5;
                }
                if (profile != null && profile.getSoilType() != null && c.getSuitableSoils().contains(profile.getSoilType())) {
                    s += 2;
                }
                return new Scored(c, s);
            })
            .filter(sc -> sc.score() > 0)
            .sorted(Comparator.comparingInt(Scored::score).reversed())
            .limit(4)
            .map(Scored::crop)
            .toList();

        if (!matched.isEmpty()) return matched;
        return crops.stream().limit(3).toList();
    }

    private String buildSystemInstruction(String lang) {
        String langLine = "kn".equals(lang)
            ? "Respond clearly in natural, respectful Kannada (ಕನ್ನಡ script)."
            : "Respond clearly in plain, practical Indian English suitable for farmers.";
        return String.join("\n",
            "You are KrishiSetu AI Farmer Assistant, an evidence-grounded agricultural helper for Indian farmers.",
            langLine,
            "Use the provided SAVED FARMER PROFILE and KRISHISETU CROP KNOWLEDGE DATASET RECORDS whenever relevant.",
            "STRICT HONESTY GUARDRAILS:",
            "1. NEVER invent or guess live mandi market prices, future prices, profit guarantees, or yields.",
            "2. NEVER invent live weather forecasts — refer the farmer to the Weather Forecast section in KrishiSetu.",
            "3. NEVER invent phone numbers, email addresses, or unverified private service contacts.",
            "4. NEVER claim a confirmed plant disease diagnosis from text or prescribe chemical dosages; recommend verifying with KrishiSetu Disease Scanner or local KVK/RSK officers."
        );
    }

    private String buildPrompt(
        String query,
        String lang,
        FarmerProfile profile,
        List<CropKnowledge> crops,
        List<PlantProtectionGuide> guides,
        List<AiChatMessage> recent
    ) {
        StringBuilder sb = new StringBuilder();
        if (profile != null) {
            sb.append("SAVED FARMER PROFILE:\n");
            sb.append("- Location: ").append(profile.getDistrict()).append(", ").append(profile.getState()).append("\n");
            sb.append("- Land: ").append(profile.getLandSize()).append(" ").append(profile.getLandUnit()).append("\n");
            sb.append("- Irrigation: ").append(profile.getIrrigationSource()).append("\n");
            sb.append("- Current Crop: ").append(profile.getCurrentOrPreviousCrop()).append("\n");
            if (profile.isHasSoilReport() && profile.getSoilReport() != null) {
                SoilReport sr = profile.getSoilReport();
                sb.append("- Soil Test: N=").append(sr.isNitrogenUnknown() ? "Unknown" : sr.getNitrogenKgPerHa())
                  .append(", P=").append(sr.isPhosphorusUnknown() ? "Unknown" : sr.getPhosphorusKgPerHa())
                  .append(", K=").append(sr.isPotassiumUnknown() ? "Unknown" : sr.getPotassiumKgPerHa())
                  .append(", pH=").append(sr.isPhUnknown() ? "Unknown" : sr.getPhLevel()).append("\n");
            }
            sb.append("\n");
        }
        if (!crops.isEmpty()) {
            sb.append("KRISHISETU CROP KNOWLEDGE DATASET RECORDS:\n");
            for (CropKnowledge c : crops) {
                sb.append("• ").append(c.getNameEn()).append(" (").append(c.getNameKn()).append("): Soils=")
                  .append(c.getSuitableSoils()).append(", Water=").append(c.getWaterRequirement())
                  .append(", Duration=").append(c.getDurationMinDays()).append("-").append(c.getDurationMaxDays())
                  .append(" days, pH=").append(c.getMinPh()).append("-").append(c.getMaxPh())
                  .append(", Source=").append(c.getSourceReference()).append("\n");
            }
            sb.append("\n");
        }
        if (!guides.isEmpty()) {
            sb.append("KRISHISETU PROTECTION GUIDES:\n");
            for (PlantProtectionGuide g : guides) {
                sb.append("• ").append(g.getCropNameEn()).append(" - ").append(g.getIssueNameEn())
                  .append(" (Source: ").append(g.getSourceReference()).append(")\n");
            }
            sb.append("\n");
        }
        if (!recent.isEmpty()) {
            sb.append("RECENT HISTORY:\n");
            int start = Math.max(0, recent.size() - 6);
            for (int i = start; i < recent.size(); i++) {
                AiChatMessage m = recent.get(i);
                sb.append(m.getRole()).append(": ").append(m.getContent()).append("\n");
            }
            sb.append("\n");
        }
        sb.append("FARMER QUESTION (").append(lang.toUpperCase(Locale.ROOT)).append("):\n").append(query);
        return sb.toString();
    }

    private AiChatMessageDto toDto(AiChatMessage m) {
        return new AiChatMessageDto(
            m.getId(),
            m.getUserId(),
            m.getRole(),
            m.getLanguage(),
            m.getContent(),
            m.getModel(),
            parseRefs(m.getGroundedCropsJson()),
            m.getCreatedAt()
        );
    }

    private List<GroundedCropRef> parseRefs(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception ex) {
            return List.of();
        }
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            return "[]";
        }
    }
}
