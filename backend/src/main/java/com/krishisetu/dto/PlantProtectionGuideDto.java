package com.krishisetu.dto;

import java.util.List;
import java.util.UUID;

public class PlantProtectionGuideDto {
    private UUID id;
    private String guideCode;
    private String cropCode;
    private String cropNameEn;
    private String cropNameKn;
    private String issueNameEn;
    private String issueNameKn;
    private String issueType;
    private String scientificName;
    private String favorableConditionsEn;
    private String favorableConditionsKn;
    private List<String> symptomsEn;
    private List<String> symptomsKn;
    private List<String> preventivePracticesEn;
    private List<String> preventivePracticesKn;
    private List<String> responsibleManagementEn;
    private List<String> responsibleManagementKn;
    private String safetyNotesEn;
    private String safetyNotesKn;
    private String dataReliability;
    private String sourceReference;

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

    public List<String> getSymptomsEn() { return symptomsEn; }
    public void setSymptomsEn(List<String> symptomsEn) { this.symptomsEn = symptomsEn; }

    public List<String> getSymptomsKn() { return symptomsKn; }
    public void setSymptomsKn(List<String> symptomsKn) { this.symptomsKn = symptomsKn; }

    public List<String> getPreventivePracticesEn() { return preventivePracticesEn; }
    public void setPreventivePracticesEn(List<String> preventivePracticesEn) { this.preventivePracticesEn = preventivePracticesEn; }

    public List<String> getPreventivePracticesKn() { return preventivePracticesKn; }
    public void setPreventivePracticesKn(List<String> preventivePracticesKn) { this.preventivePracticesKn = preventivePracticesKn; }

    public List<String> getResponsibleManagementEn() { return responsibleManagementEn; }
    public void setResponsibleManagementEn(List<String> responsibleManagementEn) { this.responsibleManagementEn = responsibleManagementEn; }

    public List<String> getResponsibleManagementKn() { return responsibleManagementKn; }
    public void setResponsibleManagementKn(List<String> responsibleManagementKn) { this.responsibleManagementKn = responsibleManagementKn; }

    public String getSafetyNotesEn() { return safetyNotesEn; }
    public void setSafetyNotesEn(String safetyNotesEn) { this.safetyNotesEn = safetyNotesEn; }

    public String getSafetyNotesKn() { return safetyNotesKn; }
    public void setSafetyNotesKn(String safetyNotesKn) { this.safetyNotesKn = safetyNotesKn; }

    public String getDataReliability() { return dataReliability; }
    public void setDataReliability(String dataReliability) { this.dataReliability = dataReliability; }

    public String getSourceReference() { return sourceReference; }
    public void setSourceReference(String sourceReference) { this.sourceReference = sourceReference; }
}
