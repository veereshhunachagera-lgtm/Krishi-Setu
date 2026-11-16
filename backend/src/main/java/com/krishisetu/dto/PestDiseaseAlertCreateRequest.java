package com.krishisetu.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class PestDiseaseAlertCreateRequest {
    @NotBlank(message = "Alert code is required.")
    private String alertCode;

    @NotBlank(message = "English title is required.")
    private String titleEn;

    @NotBlank(message = "Kannada title is required.")
    private String titleKn;

    @NotBlank(message = "Crop code is required.")
    private String cropCode;

    @NotBlank(message = "English crop name is required.")
    private String cropNameEn;

    @NotBlank(message = "Kannada crop name is required.")
    private String cropNameKn;

    @NotBlank(message = "State is required.")
    private String state;

    private String district;

    @NotBlank(message = "Verification status is required.")
    private String verificationStatus;

    @NotBlank(message = "Severity is required.")
    private String severity;

    @NotBlank(message = "Observed date is required.")
    private String observedDate;

    private String validUntil;

    @NotBlank(message = "Source name is required.")
    private String sourceName;

    private String sourceUrl;

    @NotBlank(message = "English summary is required.")
    private String summaryEn;

    @NotBlank(message = "Kannada summary is required.")
    private String summaryKn;

    private List<String> precautionsEn;
    private List<String> precautionsKn;
    private boolean active = true;

    public String getAlertCode() { return alertCode; }
    public void setAlertCode(String alertCode) { this.alertCode = alertCode; }

    public String getTitleEn() { return titleEn; }
    public void setTitleEn(String titleEn) { this.titleEn = titleEn; }

    public String getTitleKn() { return titleKn; }
    public void setTitleKn(String titleKn) { this.titleKn = titleKn; }

    public String getCropCode() { return cropCode; }
    public void setCropCode(String cropCode) { this.cropCode = cropCode; }

    public String getCropNameEn() { return cropNameEn; }
    public void setCropNameEn(String cropNameEn) { this.cropNameEn = cropNameEn; }

    public String getCropNameKn() { return cropNameKn; }
    public void setCropNameKn(String cropNameKn) { this.cropNameKn = cropNameKn; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getObservedDate() { return observedDate; }
    public void setObservedDate(String observedDate) { this.observedDate = observedDate; }

    public String getValidUntil() { return validUntil; }
    public void setValidUntil(String validUntil) { this.validUntil = validUntil; }

    public String getSourceName() { return sourceName; }
    public void setSourceName(String sourceName) { this.sourceName = sourceName; }

    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }

    public String getSummaryEn() { return summaryEn; }
    public void setSummaryEn(String summaryEn) { this.summaryEn = summaryEn; }

    public String getSummaryKn() { return summaryKn; }
    public void setSummaryKn(String summaryKn) { this.summaryKn = summaryKn; }

    public List<String> getPrecautionsEn() { return precautionsEn; }
    public void setPrecautionsEn(List<String> precautionsEn) { this.precautionsEn = precautionsEn; }

    public List<String> getPrecautionsKn() { return precautionsKn; }
    public void setPrecautionsKn(List<String> precautionsKn) { this.precautionsKn = precautionsKn; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
