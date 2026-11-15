package com.krishisetu.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

public class CropUpsertRequest {

    @NotBlank(message = "Crop code is required.")
    @Size(max = 60)
    private String cropCode;

    @NotBlank(message = "English crop name is required.")
    @Size(max = 120)
    private String nameEn;

    @NotBlank(message = "Kannada crop name is required.")
    @Size(max = 120)
    private String nameKn;

    @Size(max = 120)
    private String scientificName;

    @NotBlank(message = "Crop category is required.")
    @Size(max = 40)
    private String cropCategory;

    @NotEmpty(message = "At least one suitable soil type is required.")
    private List<String> suitableSoils;

    @NotEmpty(message = "At least one season is required.")
    private List<String> seasons;

    @NotBlank(message = "Water requirement is required.")
    private String waterRequirement;

    @Size(max = 300)
    private String waterNotesEn;

    @Size(max = 300)
    private String waterNotesKn;

    @DecimalMin("3.5")
    @DecimalMax("10.0")
    private BigDecimal minPh;

    @DecimalMin("3.5")
    @DecimalMax("10.0")
    private BigDecimal maxPh;

    private String nitrogenDemand;
    private String phosphorusDemand;
    private String potassiumDemand;
    private boolean nitrogenFixing;

    @NotNull
    @Min(30)
    @Max(600)
    private Integer durationMinDays;

    @NotNull
    @Min(30)
    @Max(600)
    private Integer durationMaxDays;

    private Integer tempMinC;
    private Integer tempMaxC;
    private Integer rainfallMinMm;
    private Integer rainfallMaxMm;
    private String climateNoteEn;
    private String climateNoteKn;

    private List<String> supportedStates;
    private List<String> supportedDistricts;
    private List<String> advantagesEn;
    private List<String> advantagesKn;
    private List<String> risksEn;
    private List<String> risksKn;
    private String rotationalBenefitsEn;
    private String rotationalBenefitsKn;
    private CropKnowledgeDto.GrowingGuidanceDto growingGuidanceEn;
    private CropKnowledgeDto.GrowingGuidanceDto growingGuidanceKn;
    private List<CropKnowledgeDto.CommonPestDto> commonPests;

    @NotBlank
    private String dataReliability;
    private String sourceReference;

    public String getCropCode() { return cropCode; }
    public void setCropCode(String cropCode) { this.cropCode = cropCode; }
    public String getNameEn() { return nameEn; }
    public void setNameEn(String nameEn) { this.nameEn = nameEn; }
    public String getNameKn() { return nameKn; }
    public void setNameKn(String nameKn) { this.nameKn = nameKn; }
    public String getScientificName() { return scientificName; }
    public void setScientificName(String scientificName) { this.scientificName = scientificName; }
    public String getCropCategory() { return cropCategory; }
    public void setCropCategory(String cropCategory) { this.cropCategory = cropCategory; }
    public List<String> getSuitableSoils() { return suitableSoils; }
    public void setSuitableSoils(List<String> suitableSoils) { this.suitableSoils = suitableSoils; }
    public List<String> getSeasons() { return seasons; }
    public void setSeasons(List<String> seasons) { this.seasons = seasons; }
    public String getWaterRequirement() { return waterRequirement; }
    public void setWaterRequirement(String waterRequirement) { this.waterRequirement = waterRequirement; }
    public String getWaterNotesEn() { return waterNotesEn; }
    public void setWaterNotesEn(String waterNotesEn) { this.waterNotesEn = waterNotesEn; }
    public String getWaterNotesKn() { return waterNotesKn; }
    public void setWaterNotesKn(String waterNotesKn) { this.waterNotesKn = waterNotesKn; }
    public BigDecimal getMinPh() { return minPh; }
    public void setMinPh(BigDecimal minPh) { this.minPh = minPh; }
    public BigDecimal getMaxPh() { return maxPh; }
    public void setMaxPh(BigDecimal maxPh) { this.maxPh = maxPh; }
    public String getNitrogenDemand() { return nitrogenDemand; }
    public void setNitrogenDemand(String nitrogenDemand) { this.nitrogenDemand = nitrogenDemand; }
    public String getPhosphorusDemand() { return phosphorusDemand; }
    public void setPhosphorusDemand(String phosphorusDemand) { this.phosphorusDemand = phosphorusDemand; }
    public String getPotassiumDemand() { return potassiumDemand; }
    public void setPotassiumDemand(String potassiumDemand) { this.potassiumDemand = potassiumDemand; }
    public boolean isNitrogenFixing() { return nitrogenFixing; }
    public void setNitrogenFixing(boolean nitrogenFixing) { this.nitrogenFixing = nitrogenFixing; }
    public Integer getDurationMinDays() { return durationMinDays; }
    public void setDurationMinDays(Integer durationMinDays) { this.durationMinDays = durationMinDays; }
    public Integer getDurationMaxDays() { return durationMaxDays; }
    public void setDurationMaxDays(Integer durationMaxDays) { this.durationMaxDays = durationMaxDays; }
    public Integer getTempMinC() { return tempMinC; }
    public void setTempMinC(Integer tempMinC) { this.tempMinC = tempMinC; }
    public Integer getTempMaxC() { return tempMaxC; }
    public void setTempMaxC(Integer tempMaxC) { this.tempMaxC = tempMaxC; }
    public Integer getRainfallMinMm() { return rainfallMinMm; }
    public void setRainfallMinMm(Integer rainfallMinMm) { this.rainfallMinMm = rainfallMinMm; }
    public Integer getRainfallMaxMm() { return rainfallMaxMm; }
    public void setRainfallMaxMm(Integer rainfallMaxMm) { this.rainfallMaxMm = rainfallMaxMm; }
    public String getClimateNoteEn() { return climateNoteEn; }
    public void setClimateNoteEn(String climateNoteEn) { this.climateNoteEn = climateNoteEn; }
    public String getClimateNoteKn() { return climateNoteKn; }
    public void setClimateNoteKn(String climateNoteKn) { this.climateNoteKn = climateNoteKn; }
    public List<String> getSupportedStates() { return supportedStates; }
    public void setSupportedStates(List<String> supportedStates) { this.supportedStates = supportedStates; }
    public List<String> getSupportedDistricts() { return supportedDistricts; }
    public void setSupportedDistricts(List<String> supportedDistricts) { this.supportedDistricts = supportedDistricts; }
    public List<String> getAdvantagesEn() { return advantagesEn; }
    public void setAdvantagesEn(List<String> advantagesEn) { this.advantagesEn = advantagesEn; }
    public List<String> getAdvantagesKn() { return advantagesKn; }
    public void setAdvantagesKn(List<String> advantagesKn) { this.advantagesKn = advantagesKn; }
    public List<String> getRisksEn() { return risksEn; }
    public void setRisksEn(List<String> risksEn) { this.risksEn = risksEn; }
    public List<String> getRisksKn() { return risksKn; }
    public void setRisksKn(List<String> risksKn) { this.risksKn = risksKn; }
    public String getRotationalBenefitsEn() { return rotationalBenefitsEn; }
    public void setRotationalBenefitsEn(String rotationalBenefitsEn) { this.rotationalBenefitsEn = rotationalBenefitsEn; }
    public String getRotationalBenefitsKn() { return rotationalBenefitsKn; }
    public void setRotationalBenefitsKn(String rotationalBenefitsKn) { this.rotationalBenefitsKn = rotationalBenefitsKn; }
    public CropKnowledgeDto.GrowingGuidanceDto getGrowingGuidanceEn() { return growingGuidanceEn; }
    public void setGrowingGuidanceEn(CropKnowledgeDto.GrowingGuidanceDto growingGuidanceEn) { this.growingGuidanceEn = growingGuidanceEn; }
    public CropKnowledgeDto.GrowingGuidanceDto getGrowingGuidanceKn() { return growingGuidanceKn; }
    public void setGrowingGuidanceKn(CropKnowledgeDto.GrowingGuidanceDto growingGuidanceKn) { this.growingGuidanceKn = growingGuidanceKn; }
    public List<CropKnowledgeDto.CommonPestDto> getCommonPests() { return commonPests; }
    public void setCommonPests(List<CropKnowledgeDto.CommonPestDto> commonPests) { this.commonPests = commonPests; }
    public String getDataReliability() { return dataReliability; }
    public void setDataReliability(String dataReliability) { this.dataReliability = dataReliability; }
    public String getSourceReference() { return sourceReference; }
    public void setSourceReference(String sourceReference) { this.sourceReference = sourceReference; }
}
