package com.krishisetu.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.krishisetu.dto.PestDiseaseAlertDto;
import com.krishisetu.dto.PlantDiseaseScanResponse;
import com.krishisetu.dto.PlantDiseaseScanResponse.CandidatePrediction;
import com.krishisetu.dto.PlantDiseaseScannerStatusResponse;
import com.krishisetu.dto.PlantProtectionGuideDto;
import com.krishisetu.entity.PestDiseaseAlert;
import com.krishisetu.entity.PlantDiseaseScan;
import com.krishisetu.entity.PlantProtectionGuide;
import com.krishisetu.entity.User;
import com.krishisetu.exception.BadRequestException;
import com.krishisetu.exception.ResourceNotFoundException;
import com.krishisetu.integration.PlantDiseaseModelClient;
import com.krishisetu.repository.PestDiseaseAlertRepository;
import com.krishisetu.repository.PlantDiseaseScanRepository;
import com.krishisetu.repository.PlantProtectionGuideRepository;
import com.krishisetu.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class PlantHealthService {

    private static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of("image/jpeg", "image/jpg", "image/png", "image/webp");

    private final PestDiseaseAlertRepository alertRepository;
    private final PlantProtectionGuideRepository guideRepository;
    private final PlantDiseaseScanRepository scanRepository;
    private final UserRepository userRepository;
    private final PlantHealthDatasetImportService importService;
    private final PlantDiseaseModelClient modelClient;
    private final ObjectMapper objectMapper;

    public PlantHealthService(
        PestDiseaseAlertRepository alertRepository,
        PlantProtectionGuideRepository guideRepository,
        PlantDiseaseScanRepository scanRepository,
        UserRepository userRepository,
        PlantHealthDatasetImportService importService,
        PlantDiseaseModelClient modelClient,
        ObjectMapper objectMapper
    ) {
        this.alertRepository = alertRepository;
        this.guideRepository = guideRepository;
        this.scanRepository = scanRepository;
        this.userRepository = userRepository;
        this.importService = importService;
        this.modelClient = modelClient;
        this.objectMapper = objectMapper;
    }

    public PlantDiseaseScannerStatusResponse getScannerStatus() {
        PlantDiseaseModelClient.InferenceHealthResult health = modelClient.checkHealth();
        PlantDiseaseScannerStatusResponse dto = new PlantDiseaseScannerStatusResponse();
        dto.setModelConnected(health.connected());
        dto.setMode(health.connected() ? "MODEL_ACTIVE" : "MODEL_UNAVAILABLE");
        dto.setConfiguredModelId(health.modelId());
        dto.setConfidenceThreshold(health.confidenceThreshold());
        dto.setSupportedCrops(health.supportedCrops());
        if (health.connected()) {
            dto.setStatusMessageEn("Disease classification service is connected and ready for supported leaf images.");
            dto.setStatusMessageKn("ಬೆಂಬಲಿತ ಬೆಳೆಗಳ ಎಲೆ ಚಿತ್ರಗಳಿಗಾಗಿ ರೋಗ ವರ್ಗೀಕರಣ ಸೇವೆ ಸಿದ್ಧವಾಗಿದೆ.");
        } else {
            dto.setStatusMessageEn(
                "Automated leaf disease scanning is currently unavailable because no external model service is connected. KrishiSetu does not simulate or fabricate diagnoses."
            );
            dto.setStatusMessageKn(
                "ಬಾಹ್ಯ ರೋಗ ಪತ್ತೆ ಮಾದರಿ ಸೇವೆ ಸಂಪರ್ಕದಲ್ಲಿಲ್ಲದ ಕಾರಣ ಸ್ವಯಂಚಾಲಿತ ಸ್ಕ್ಯಾನಿಂಗ್ ಲಭ್ಯವಿಲ್ಲ. ಕೃಷಿಸೇತು ಸುಳ್ಳು ರೋಗ ನಿರ್ಣಯವನ್ನು ತೋರಿಸುವುದಿಲ್ಲ."
            );
        }
        return dto;
    }

    @Transactional
    public PlantDiseaseScanResponse analyzeLeafImage(
        UUID userId,
        MultipartFile imageFile,
        String cropCode,
        String farmerNotes
    ) {
        if (imageFile == null || imageFile.isEmpty()) {
            throw new BadRequestException("A leaf image file (JPEG, PNG, or WebP) is required.");
        }
        if (imageFile.getSize() > MAX_IMAGE_BYTES) {
            throw new BadRequestException("Uploaded image exceeds the 5 MB size limit.");
        }
        String mimeType = imageFile.getContentType() != null ? imageFile.getContentType().toLowerCase() : "";
        if (!ALLOWED_MIME_TYPES.contains(mimeType)) {
            throw new BadRequestException("Unsupported image format. Please upload a JPEG, PNG, or WebP image.");
        }

        byte[] bytes;
        try {
            bytes = imageFile.getBytes();
        } catch (IOException ex) {
            throw new BadRequestException("Failed to read uploaded image bytes.");
        }

        if (!hasValidImageSignature(bytes)) {
            throw new BadRequestException("Uploaded file does not match a valid JPEG, PNG, or WebP image header.");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User account not found."));

        String normalizedCrop = cropCode != null && !cropCode.isBlank() ? cropCode.trim().toLowerCase() : null;
        PlantDiseaseModelClient.InferencePredictionResult prediction = modelClient.predict(
            bytes,
            imageFile.getOriginalFilename(),
            mimeType,
            normalizedCrop
        );

        PlantDiseaseScan scan = new PlantDiseaseScan();
        scan.setUser(user);
        scan.setCropCode(normalizedCrop);
        scan.setOriginalFileName(imageFile.getOriginalFilename() != null ? imageFile.getOriginalFilename() : "leaf-upload.jpg");
        scan.setMimeType(mimeType);
        scan.setFileSizeBytes(imageFile.getSize());
        scan.setScanStatus(prediction.status());
        scan.setModelId(prediction.modelId());
        scan.setPredictedLabel(prediction.predictedLabel());
        scan.setConfidence(prediction.confidence() != null ? BigDecimal.valueOf(prediction.confidence()) : null);
        scan.setReasonEn(prediction.reason());
        scan.setReasonKn(translateScanReasonKn(prediction.status(), prediction.reason()));
        scan.setTopCandidatesJson(writeCandidatesJson(prediction.topCandidates()));
        scan.setFarmerNotes(farmerNotes != null && !farmerNotes.isBlank() ? farmerNotes.trim() : null);

        PlantDiseaseScan saved = scanRepository.save(scan);
        return toScanResponse(saved, prediction.topCandidates());
    }

    @Transactional(readOnly = true)
    public List<PlantDiseaseScanResponse> getScanHistory(UUID userId) {
        return scanRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
            .map(scan -> toScanResponse(scan, readCandidatesJson(scan.getTopCandidatesJson())))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<PestDiseaseAlertDto> listActiveAlerts(
        String state,
        String district,
        String cropCode,
        String verificationStatus
    ) {
        List<PestDiseaseAlert> active = alertRepository.findByActiveTrueOrderByObservedDateDesc();
        return active.stream()
            .filter(a -> state == null || state.isBlank() || a.getState().equalsIgnoreCase(state.trim()))
            .filter(a -> district == null || district.isBlank()
                || (a.getDistrict() != null && a.getDistrict().equalsIgnoreCase(district.trim())))
            .filter(a -> cropCode == null || cropCode.isBlank() || a.getCropCode().equalsIgnoreCase(cropCode.trim()))
            .filter(a -> verificationStatus == null || verificationStatus.isBlank()
                || a.getVerificationStatus().equalsIgnoreCase(verificationStatus.trim()))
            .map(importService::toAlertDto)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<PlantProtectionGuideDto> searchGuides(String query, String cropCode, String issueType) {
        String q = query != null ? query.trim().toLowerCase() : "";
        return guideRepository.findAllByOrderByCropNameEnAsc().stream()
            .filter(g -> cropCode == null || cropCode.isBlank() || g.getCropCode().equalsIgnoreCase(cropCode.trim()))
            .filter(g -> issueType == null || issueType.isBlank() || g.getIssueType().equalsIgnoreCase(issueType.trim()))
            .filter(g -> {
                if (q.isEmpty()) return true;
                return g.getCropNameEn().toLowerCase().contains(q)
                    || g.getCropNameKn().toLowerCase().contains(q)
                    || g.getIssueNameEn().toLowerCase().contains(q)
                    || g.getIssueNameKn().toLowerCase().contains(q)
                    || (g.getScientificName() != null && g.getScientificName().toLowerCase().contains(q));
            })
            .map(importService::toGuideDto)
            .toList();
    }

    private PlantDiseaseScanResponse toScanResponse(PlantDiseaseScan scan, List<CandidatePrediction> candidates) {
        PlantDiseaseScanResponse res = new PlantDiseaseScanResponse();
        res.setId(scan.getId());
        res.setScanStatus(scan.getScanStatus());
        res.setCropCode(scan.getCropCode());
        res.setOriginalFileName(scan.getOriginalFileName());
        res.setMimeType(scan.getMimeType());
        res.setFileSizeBytes(scan.getFileSizeBytes());
        res.setModelId(scan.getModelId());
        res.setPredictedLabel(scan.getPredictedLabel());
        res.setConfidence(scan.getConfidence() != null ? scan.getConfidence().doubleValue() : null);
        res.setReasonEn(scan.getReasonEn());
        res.setReasonKn(scan.getReasonKn());
        res.setTopCandidates(candidates);
        res.setCreatedAt(scan.getCreatedAt().toString());

        if ("PREDICTION_READY".equals(scan.getScanStatus()) && scan.getCropCode() != null) {
            List<PlantProtectionGuide> cropGuides = guideRepository.findAllByOrderByCropNameEnAsc().stream()
                .filter(g -> g.getCropCode().equalsIgnoreCase(scan.getCropCode()))
                .toList();
            if (!cropGuides.isEmpty()) {
                PlantProtectionGuideDto guideDto = importService.toGuideDto(cropGuides.get(0));
                res.setPreventiveGuidanceEn(guideDto.getPreventivePracticesEn());
                res.setPreventiveGuidanceKn(guideDto.getPreventivePracticesKn());
            }
        }
        res.setSafetyReminderEn(
            "Verify visual screening results with a local Raitha Samparka Kendra (RSK) or KVK specialist before applying chemical treatments."
        );
        res.setSafetyReminderKn(
            "ಯಾವುದೇ ರಾಸಾಯನಿಕ ಚಿಕಿತ್ಸೆ ಬಳಸುವ ಮೊದಲು ಸ್ಥಳೀಯ ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ (RSK) ಅಥವಾ ಕೆವಿಕೆ ತಜ್ಞರಿಂದ ದೃಢೀಕರಿಸಿ."
        );
        return res;
    }

    private String translateScanReasonKn(String status, String englishReason) {
        if ("MODEL_UNAVAILABLE".equals(status)) {
            return "ಬಾಹ್ಯ ರೋಗ ವರ್ಗೀಕರಣ ಮಾದರಿ ಸೇವೆ ಸಂಪರ್ಕದಲ್ಲಿಲ್ಲದ ಕಾರಣ ವಿಶ್ಲೇಷಣೆ ನಡೆಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.";
        }
        if ("UNSUPPORTED_CROP".equals(status)) {
            return "ಆಯ್ಕೆಮಾಡಿದ ಬೆಳೆ ಪ್ರಸ್ತುತ ಸಂಪರ್ಕಿತ ಮಾದರಿಯ ತರಬೇತಿ ವ್ಯಾಪ್ತಿಯಲ್ಲಿಲ್ಲ.";
        }
        if ("UNCERTAIN_POOR_QUALITY".equals(status)) {
            return "ಚಿತ್ರವು ಮಸುಕಾಗಿದೆ, ಕಡಿಮೆ ಬೆಳಕಿನಲ್ಲಿದೆ ಅಥವಾ ಕಡಿಮೆ ರೆಸಲ್ಯೂಶನ್ ಹೊಂದಿದೆ. ಸ್ಪಷ್ಟವಾದ ಎಲೆಯ ಹತ್ತಿರದ ಚಿತ್ರವನ್ನು ತೆಗೆಯಿರಿ.";
        }
        if ("UNCERTAIN_LOW_CONFIDENCE".equals(status)) {
            return "ಮಾದರಿಯ ವಿಶ್ವಾಸಾರ್ಹತೆ ನಿಗದಿತ ಮಿತಿಗಿಂತ ಕಡಿಮೆಯಿದೆ. ದೃಢೀಕರಣಕ್ಕಾಗಿ ಕೃಷಿ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ.";
        }
        return englishReason;
    }

    private boolean hasValidImageSignature(byte[] b) {
        if (b.length < 12) return false;
        // JPEG: FF D8 FF
        if ((b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) return true;
        // PNG: 89 50 4E 47
        if ((b[0] & 0xFF) == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47) return true;
        // WebP: RIFF....WEBP
        if (b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
            && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return true;
        return false;
    }

    private String writeCandidatesJson(List<CandidatePrediction> list) {
        try {
            return objectMapper.writeValueAsString(list != null ? list : Collections.emptyList());
        } catch (JsonProcessingException ex) {
            return "[]";
        }
    }

    private List<CandidatePrediction> readCandidatesJson(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<CandidatePrediction>>() {});
        } catch (IOException ex) {
            return Collections.emptyList();
        }
    }
}
