package com.krishisetu.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record PlantProtectionGuideUpsertRequest(
    @NotBlank @Size(max = 80) String guideCode,
    @NotBlank @Size(max = 60) String cropCode,
    @Size(max = 120) String cropNameEn,
    @Size(max = 120) String cropNameKn,
    @NotBlank @Size(max = 160) String issueNameEn,
    @NotBlank @Size(max = 160) String issueNameKn,
    @NotBlank @Size(max = 40) String issueType,
    @Size(max = 160) String scientificName,
    String favorableConditionsEn,
    String favorableConditionsKn,
    List<String> symptomsEn,
    List<String> symptomsKn,
    List<String> preventivePracticesEn,
    List<String> preventivePracticesKn,
    List<String> responsibleManagementEn,
    List<String> responsibleManagementKn,
    String safetyNotesEn,
    String safetyNotesKn,
    @Size(max = 40) String dataReliability,
    @Size(max = 300) String sourceReference
) {}
