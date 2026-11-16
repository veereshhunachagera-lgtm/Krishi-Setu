package com.krishisetu.dto;

import java.util.List;
import java.util.UUID;

public class PlantDiseaseScanResponse {
    public static class CandidatePrediction {
        private String label;
        private double confidence;

        public CandidatePrediction() {}
        public CandidatePrediction(String label, double confidence) {
            this.label = label;
            this.confidence = confidence;
        }

        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }

        public double getConfidence() { return confidence; }
        public void setConfidence(double confidence) { this.confidence = confidence; }
    }

    private UUID id;
    private String scanStatus;
    private String cropCode;
    private String originalFileName;
    private String mimeType;
    private Long fileSizeBytes;
    private String modelId;
    private String predictedLabel;
    private Double confidence;
    private String reasonEn;
    private String reasonKn;
    private List<CandidatePrediction> topCandidates;
    private List<String> preventiveGuidanceEn;
    private List<String> preventiveGuidanceKn;
    private String safetyReminderEn;
    private String safetyReminderKn;
    private String createdAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getScanStatus() { return scanStatus; }
    public void setScanStatus(String scanStatus) { this.scanStatus = scanStatus; }

    public String getCropCode() { return cropCode; }
    public void setCropCode(String cropCode) { this.cropCode = cropCode; }

    public String getOriginalFileName() { return originalFileName; }
    public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }

    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }

    public Long getFileSizeBytes() { return fileSizeBytes; }
    public void setFileSizeBytes(Long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }

    public String getModelId() { return modelId; }
    public void setModelId(String modelId) { this.modelId = modelId; }

    public String getPredictedLabel() { return predictedLabel; }
    public void setPredictedLabel(String predictedLabel) { this.predictedLabel = predictedLabel; }

    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }

    public String getReasonEn() { return reasonEn; }
    public void setReasonEn(String reasonEn) { this.reasonEn = reasonEn; }

    public String getReasonKn() { return reasonKn; }
    public void setReasonKn(String reasonKn) { this.reasonKn = reasonKn; }

    public List<CandidatePrediction> getTopCandidates() { return topCandidates; }
    public void setTopCandidates(List<CandidatePrediction> topCandidates) { this.topCandidates = topCandidates; }

    public List<String> getPreventiveGuidanceEn() { return preventiveGuidanceEn; }
    public void setPreventiveGuidanceEn(List<String> preventiveGuidanceEn) { this.preventiveGuidanceEn = preventiveGuidanceEn; }

    public List<String> getPreventiveGuidanceKn() { return preventiveGuidanceKn; }
    public void setPreventiveGuidanceKn(List<String> preventiveGuidanceKn) { this.preventiveGuidanceKn = preventiveGuidanceKn; }

    public String getSafetyReminderEn() { return safetyReminderEn; }
    public void setSafetyReminderEn(String safetyReminderEn) { this.safetyReminderEn = safetyReminderEn; }

    public String getSafetyReminderKn() { return safetyReminderKn; }
    public void setSafetyReminderKn(String safetyReminderKn) { this.safetyReminderKn = safetyReminderKn; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
