package com.krishisetu.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public class SavedCropPlanRequest {

    @NotBlank(message = "Primary crop selection is required.")
    @Size(max = 60)
    private String primaryCropCode;

    private List<String> alternativeCropCodes;

    @Size(max = 30)
    private String plannedSeason;

    @Size(max = 500)
    private String farmerNotes;

    public String getPrimaryCropCode() { return primaryCropCode; }
    public void setPrimaryCropCode(String primaryCropCode) { this.primaryCropCode = primaryCropCode; }
    public List<String> getAlternativeCropCodes() { return alternativeCropCodes; }
    public void setAlternativeCropCodes(List<String> alternativeCropCodes) { this.alternativeCropCodes = alternativeCropCodes; }
    public String getPlannedSeason() { return plannedSeason; }
    public void setPlannedSeason(String plannedSeason) { this.plannedSeason = plannedSeason; }
    public String getFarmerNotes() { return farmerNotes; }
    public void setFarmerNotes(String farmerNotes) { this.farmerNotes = farmerNotes; }
}
