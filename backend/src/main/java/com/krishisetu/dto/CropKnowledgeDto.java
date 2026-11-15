package com.krishisetu.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class CropKnowledgeDto {

    private UUID id;
    private String cropCode;
    private String nameEn;
    private String nameKn;
    private String scientificName;
    private String cropCategory;
    private List<String> suitableSoils;
    private List<String> seasons;
    private String waterRequirement;
    private String waterNotesEn;
    private String waterNotesKn;
    private BigDecimal minPh;
    private BigDecimal maxPh;
    private String nitrogenDemand;
    private String phosphorusDemand;
    private String potassiumDemand;
    private boolean nitrogenFixing;
    private Integer durationMinDays;
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
    private GrowingGuidanceDto growingGuidanceEn;
    private GrowingGuidanceDto growingGuidanceKn;
    private List<CommonPestDto> commonPests;
    private String dataReliability;
    private String sourceReference;

    public static class GrowingGuidanceDto {
        private String landPreparation;
        private String sowingAndSpacing;
        private String irrigationSchedule;
        private String nutrientPractice;

        public String getLandPreparation() { return landPreparation; }
        public void setLandPreparation(String landPreparation) { this.landPreparation = landPreparation; }
        public String getSowingAndSpacing() { return sowingAndSpacing; }
        public void setSowingAndSpacing(String sowingAndSpacing) { this.sowingAndSpacing = sowingAndSpacing; }
        public String getIrrigationSchedule() { return irrigationSchedule; }
        public void setIrrigationSchedule(String irrigationSchedule) { this.irrigationSchedule = irrigationSchedule; }
        public String getNutrientPractice() { return nutrientPractice; }
        public void setNutrientPractice(String nutrientPractice) { this.nutrientPractice = nutrientPractice; }
    }

    public static class CommonPestDto {
        private String pestNameEn;
        private String pestNameKn;
        private String symptomsEn;
        private String symptomsKn;
        private String managementEn;
        private String managementKn;

        public String getPestNameEn() { return pestNameEn; }
        public void setPestNameEn(String pestNameEn) { this.pestNameEn = pestNameEn; }
        public String getPestNameKn() { return pestNameKn; }
        public void setPestNameKn(String pestNameKn) { this.pestNameKn = pestNameKn; }
        public String getSymptomsEn() { return symptomsEn; }
        public void setSymptomsEn(String symptomsEn) { this.symptomsEn = symptomsEn; }
        public String getSymptomsKn() { return symptomsKn; }
        public void setSymptomsKn(String symptomsKn) { this.symptomsKn = symptomsKn; }
        public String getManagementEn() { return managementEn; }
        public void setManagementEn(String managementEn) { this.managementEn = managementEn; }
        public String getManagementKn() { return managementKn; }
        public void setManagementKn(String managementKn) { this.managementKn = managementKn; }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
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
    public GrowingGuidanceDto getGrowingGuidanceEn() { return growingGuidanceEn; }
    public void setGrowingGuidanceEn(GrowingGuidanceDto growingGuidanceEn) { this.growingGuidanceEn = growingGuidanceEn; }
    public GrowingGuidanceDto getGrowingGuidanceKn() { return growingGuidanceKn; }
    public void setGrowingGuidanceKn(GrowingGuidanceDto growingGuidanceKn) { this.growingGuidanceKn = growingGuidanceKn; }
    public List<CommonPestDto> getCommonPests() { return commonPests; }
    public void setCommonPests(List<CommonPestDto> commonPests) { this.commonPests = commonPests; }
    public String getDataReliability() { return dataReliability; }
    public void setDataReliability(String dataReliability) { this.dataReliability = dataReliability; }
    public String getSourceReference() { return sourceReference; }
    public void setSourceReference(String sourceReference) { this.sourceReference = sourceReference; }
}
