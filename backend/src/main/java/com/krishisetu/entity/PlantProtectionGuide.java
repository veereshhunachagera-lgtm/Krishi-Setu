package com.krishisetu.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "plant_protection_guides")
public class PlantProtectionGuide {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 80)
    private String guideCode;

    @Column(nullable = false, length = 60)
    private String cropCode;

    @Column(nullable = false, length = 120)
    private String cropNameEn;

    @Column(nullable = false, length = 120)
    private String cropNameKn;

    @Column(nullable = false, length = 160)
    private String issueNameEn;

    @Column(nullable = false, length = 160)
    private String issueNameKn;

    @Column(nullable = false, length = 40)
    private String issueType;

    @Column(length = 160)
    private String scientificName;

    @Column(columnDefinition = "TEXT")
    private String favorableConditionsEn;

    @Column(columnDefinition = "TEXT")
    private String favorableConditionsKn;

    @Column(columnDefinition = "TEXT")
    private String symptomsEnJson;

    @Column(columnDefinition = "TEXT")
    private String symptomsKnJson;

    @Column(columnDefinition = "TEXT")
    private String preventivePracticesEnJson;

    @Column(columnDefinition = "TEXT")
    private String preventivePracticesKnJson;

    @Column(columnDefinition = "TEXT")
    private String responsibleManagementEnJson;

    @Column(columnDefinition = "TEXT")
    private String responsibleManagementKnJson;

    @Column(columnDefinition = "TEXT")
    private String safetyNotesEn;

    @Column(columnDefinition = "TEXT")
    private String safetyNotesKn;

    @Column(nullable = false, length = 40)
    private String dataReliability = "CURATED_REFERENCE";

    @Column(length = 300)
    private String sourceReference;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getGuideCode() { return guideCode; }
    public void setGuideCode(String guideCode) { this.guideCode = guideCode; }

    public String getCropCode() { return cropCode; }
    public void setCropCode(String cropCode) { this.cropCode = cropCode; }

    public String getCropNameEn() { return cropNameEn; }
    public void setCropNameEn(String cropNameEn) { this.cropNameEn = cropNameEn; }

    public String getCropNameKn() { return cropNameKn; }
    public void setCropNameKn(String cropNameKn) { this.cropNameKn = cropNameKn; }

    public String getIssueNameEn() { return issueNameEn; }
    public void setIssueNameEn(String issueNameEn) { this.issueNameEn = issueNameEn; }

    public String getIssueNameKn() { return issueNameKn; }
    public void setIssueNameKn(String issueNameKn) { this.issueNameKn = issueNameKn; }

    public String getIssueType() { return issueType; }
    public void setIssueType(String issueType) { this.issueType = issueType; }

    public String getScientificName() { return scientificName; }
    public void setScientificName(String scientificName) { this.scientificName = scientificName; }

    public String getFavorableConditionsEn() { return favorableConditionsEn; }
    public void setFavorableConditionsEn(String favorableConditionsEn) { this.favorableConditionsEn = favorableConditionsEn; }

    public String getFavorableConditionsKn() { return favorableConditionsKn; }
    public void setFavorableConditionsKn(String favorableConditionsKn) { this.favorableConditionsKn = favorableConditionsKn; }

    public String getSymptomsEnJson() { return symptomsEnJson; }
    public void setSymptomsEnJson(String symptomsEnJson) { this.symptomsEnJson = symptomsEnJson; }

    public String getSymptomsKnJson() { return symptomsKnJson; }
    public void setSymptomsKnJson(String symptomsKnJson) { this.symptomsKnJson = symptomsKnJson; }

    public String getPreventivePracticesEnJson() { return preventivePracticesEnJson; }
    public void setPreventivePracticesEnJson(String preventivePracticesEnJson) { this.preventivePracticesEnJson = preventivePracticesEnJson; }

    public String getPreventivePracticesKnJson() { return preventivePracticesKnJson; }
    public void setPreventivePracticesKnJson(String preventivePracticesKnJson) { this.preventivePracticesKnJson = preventivePracticesKnJson; }

    public String getResponsibleManagementEnJson() { return responsibleManagementEnJson; }
    public void setResponsibleManagementEnJson(String responsibleManagementEnJson) { this.responsibleManagementEnJson = responsibleManagementEnJson; }

    public String getResponsibleManagementKnJson() { return responsibleManagementKnJson; }
    public void setResponsibleManagementKnJson(String responsibleManagementKnJson) { this.responsibleManagementKnJson = responsibleManagementKnJson; }

    public String getSafetyNotesEn() { return safetyNotesEn; }
    public void setSafetyNotesEn(String safetyNotesEn) { this.safetyNotesEn = safetyNotesEn; }

    public String getSafetyNotesKn() { return safetyNotesKn; }
    public void setSafetyNotesKn(String safetyNotesKn) { this.safetyNotesKn = safetyNotesKn; }

    public String getDataReliability() { return dataReliability; }
    public void setDataReliability(String dataReliability) { this.dataReliability = dataReliability; }

    public String getSourceReference() { return sourceReference; }
    public void setSourceReference(String sourceReference) { this.sourceReference = sourceReference; }

    public Instant getCreatedAt() { return createdAt; }
}
