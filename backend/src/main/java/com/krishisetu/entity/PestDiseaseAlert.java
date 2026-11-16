package com.krishisetu.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "pest_disease_alerts")
public class PestDiseaseAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 80)
    private String alertCode;

    @Column(nullable = false, length = 200)
    private String titleEn;

    @Column(nullable = false, length = 200)
    private String titleKn;

    @Column(nullable = false, length = 60)
    private String cropCode;

    @Column(nullable = false, length = 120)
    private String cropNameEn;

    @Column(nullable = false, length = 120)
    private String cropNameKn;

    @Column(nullable = false, length = 80)
    private String state;

    @Column(length = 80)
    private String district;

    /**
     * CONFIRMED_OUTBREAK | REPORTED_CASE | SEASONAL_RULE_ADVISORY
     */
    @Column(nullable = false, length = 40)
    private String verificationStatus;

    /**
     * LOW | MODERATE | HIGH
     */
    @Column(nullable = false, length = 20)
    private String severity;

    @Column(nullable = false, length = 20)
    private String observedDate;

    @Column(length = 20)
    private String validUntil;

    @Column(nullable = false, length = 200)
    private String sourceName;

    @Column(length = 300)
    private String sourceUrl;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summaryEn;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summaryKn;

    @Column(columnDefinition = "TEXT")
    private String precautionsEnJson;

    @Column(columnDefinition = "TEXT")
    private String precautionsKnJson;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

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

    public String getPrecautionsEnJson() { return precautionsEnJson; }
    public void setPrecautionsEnJson(String precautionsEnJson) { this.precautionsEnJson = precautionsEnJson; }

    public String getPrecautionsKnJson() { return precautionsKnJson; }
    public void setPrecautionsKnJson(String precautionsKnJson) { this.precautionsKnJson = precautionsKnJson; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
