package com.krishisetu.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class SavedCropPlanResponse {

    private UUID id;
    private String primaryCropCode;
    private String primaryCropNameEn;
    private String primaryCropNameKn;
    private List<String> alternativeCropCodes;
    private String plannedSeason;
    private String farmerNotes;
    private Instant createdAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getPrimaryCropCode() { return primaryCropCode; }
    public void setPrimaryCropCode(String primaryCropCode) { this.primaryCropCode = primaryCropCode; }
    public String getPrimaryCropNameEn() { return primaryCropNameEn; }
    public void setPrimaryCropNameEn(String primaryCropNameEn) { this.primaryCropNameEn = primaryCropNameEn; }
    public String getPrimaryCropNameKn() { return primaryCropNameKn; }
    public void setPrimaryCropNameKn(String primaryCropNameKn) { this.primaryCropNameKn = primaryCropNameKn; }
    public List<String> getAlternativeCropCodes() { return alternativeCropCodes; }
    public void setAlternativeCropCodes(List<String> alternativeCropCodes) { this.alternativeCropCodes = alternativeCropCodes; }
    public String getPlannedSeason() { return plannedSeason; }
    public void setPlannedSeason(String plannedSeason) { this.plannedSeason = plannedSeason; }
    public String getFarmerNotes() { return farmerNotes; }
    public void setFarmerNotes(String farmerNotes) { this.farmerNotes = farmerNotes; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
