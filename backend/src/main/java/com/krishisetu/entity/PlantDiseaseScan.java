package com.krishisetu.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "plant_disease_scans")
public class PlantDiseaseScan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 60)
    private String cropCode;

    @Column(nullable = false, length = 180)
    private String originalFileName;

    @Column(nullable = false, length = 80)
    private String mimeType;

    @Column(nullable = false)
    private Long fileSizeBytes;

    /**
     * PREDICTION_READY | UNCERTAIN_LOW_CONFIDENCE | UNCERTAIN_POOR_QUALITY | UNSUPPORTED_CROP | MODEL_UNAVAILABLE
     */
    @Column(nullable = false, length = 40)
    private String scanStatus;

    @Column(length = 160)
    private String modelId;

    @Column(length = 180)
    private String predictedLabel;

    @Column(precision = 5, scale = 4)
    private BigDecimal confidence;

    @Column(columnDefinition = "TEXT")
    private String reasonEn;

    @Column(columnDefinition = "TEXT")
    private String reasonKn;

    @Column(columnDefinition = "TEXT")
    private String topCandidatesJson;

    @Column(length = 500)
    private String farmerNotes;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getCropCode() { return cropCode; }
    public void setCropCode(String cropCode) { this.cropCode = cropCode; }

    public String getOriginalFileName() { return originalFileName; }
    public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }

    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }

    public Long getFileSizeBytes() { return fileSizeBytes; }
    public void setFileSizeBytes(Long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }

    public String getScanStatus() { return scanStatus; }
    public void setScanStatus(String scanStatus) { this.scanStatus = scanStatus; }

    public String getModelId() { return modelId; }
    public void setModelId(String modelId) { this.modelId = modelId; }

    public String getPredictedLabel() { return predictedLabel; }
    public void setPredictedLabel(String predictedLabel) { this.predictedLabel = predictedLabel; }

    public BigDecimal getConfidence() { return confidence; }
    public void setConfidence(BigDecimal confidence) { this.confidence = confidence; }

    public String getReasonEn() { return reasonEn; }
    public void setReasonEn(String reasonEn) { this.reasonEn = reasonEn; }

    public String getReasonKn() { return reasonKn; }
    public void setReasonKn(String reasonKn) { this.reasonKn = reasonKn; }

    public String getTopCandidatesJson() { return topCandidatesJson; }
    public void setTopCandidatesJson(String topCandidatesJson) { this.topCandidatesJson = topCandidatesJson; }

    public String getFarmerNotes() { return farmerNotes; }
    public void setFarmerNotes(String farmerNotes) { this.farmerNotes = farmerNotes; }

    public Instant getCreatedAt() { return createdAt; }
}
