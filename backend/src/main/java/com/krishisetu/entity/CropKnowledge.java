package com.krishisetu.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "crop_knowledge")
public class CropKnowledge {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 60)
    private String cropCode;

    @Column(nullable = false, length = 120)
    private String nameEn;

    @Column(nullable = false, length = 120)
    private String nameKn;

    @Column(length = 120)
    private String scientificName;

    @Column(nullable = false, length = 40)
    private String cropCategory;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "crop_suitable_soils", joinColumns = @JoinColumn(name = "crop_id"))
    @Column(name = "soil_type", length = 40)
    private List<String> suitableSoils = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "crop_seasons", joinColumns = @JoinColumn(name = "crop_id"))
    @Column(name = "season", length = 30)
    private List<String> seasons = new ArrayList<>();

    @Column(nullable = false, length = 20)
    private String waterRequirement;

    @Column(length = 300)
    private String waterNotesEn;

    @Column(length = 300)
    private String waterNotesKn;

    @Column(precision = 4, scale = 2)
    private BigDecimal minPh;

    @Column(precision = 4, scale = 2)
    private BigDecimal maxPh;

    @Column(length = 20)
    private String nitrogenDemand;

    @Column(length = 20)
    private String phosphorusDemand;

    @Column(length = 20)
    private String potassiumDemand;

    @Column(nullable = false)
    private boolean nitrogenFixing = false;

    @Column(nullable = false)
    private Integer durationMinDays;

    @Column(nullable = false)
    private Integer durationMaxDays;

    private Integer tempMinC;
    private Integer tempMaxC;
    private Integer rainfallMinMm;
    private Integer rainfallMaxMm;

    @Column(length = 400)
    private String climateNoteEn;

    @Column(length = 400)
    private String climateNoteKn;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "crop_supported_states", joinColumns = @JoinColumn(name = "crop_id"))
    @Column(name = "state_name", length = 80)
    private List<String> supportedStates = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "crop_supported_districts", joinColumns = @JoinColumn(name = "crop_id"))
    @Column(name = "district_name", length = 80)
    private List<String> supportedDistricts = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String advantagesEnJson;

    @Column(columnDefinition = "TEXT")
    private String advantagesKnJson;

    @Column(columnDefinition = "TEXT")
    private String risksEnJson;

    @Column(columnDefinition = "TEXT")
    private String risksKnJson;

    @Column(length = 400)
    private String rotationalBenefitsEn;

    @Column(length = 400)
    private String rotationalBenefitsKn;

    @Column(columnDefinition = "TEXT")
    private String growingGuidanceEnJson;

    @Column(columnDefinition = "TEXT")
    private String growingGuidanceKnJson;

    @Column(columnDefinition = "TEXT")
    private String commonPestsJson;

    @Column(nullable = false, length = 40)
    private String dataReliability = "CURATED_REFERENCE";

    @Column(length = 300)
    private String sourceReference;

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

    public String getAdvantagesEnJson() { return advantagesEnJson; }
    public void setAdvantagesEnJson(String advantagesEnJson) { this.advantagesEnJson = advantagesEnJson; }

    public String getAdvantagesKnJson() { return advantagesKnJson; }
    public void setAdvantagesKnJson(String advantagesKnJson) { this.advantagesKnJson = advantagesKnJson; }

    public String getRisksEnJson() { return risksEnJson; }
    public void setRisksEnJson(String risksEnJson) { this.risksEnJson = risksEnJson; }

    public String getRisksKnJson() { return risksKnJson; }
    public void setRisksKnJson(String risksKnJson) { this.risksKnJson = risksKnJson; }

    public String getRotationalBenefitsEn() { return rotationalBenefitsEn; }
    public void setRotationalBenefitsEn(String rotationalBenefitsEn) { this.rotationalBenefitsEn = rotationalBenefitsEn; }

    public String getRotationalBenefitsKn() { return rotationalBenefitsKn; }
    public void setRotationalBenefitsKn(String rotationalBenefitsKn) { this.rotationalBenefitsKn = rotationalBenefitsKn; }

    public String getGrowingGuidanceEnJson() { return growingGuidanceEnJson; }
    public void setGrowingGuidanceEnJson(String growingGuidanceEnJson) { this.growingGuidanceEnJson = growingGuidanceEnJson; }

    public String getGrowingGuidanceKnJson() { return growingGuidanceKnJson; }
    public void setGrowingGuidanceKnJson(String growingGuidanceKnJson) { this.growingGuidanceKnJson = growingGuidanceKnJson; }

    public String getCommonPestsJson() { return commonPestsJson; }
    public void setCommonPestsJson(String commonPestsJson) { this.commonPestsJson = commonPestsJson; }

    public String getDataReliability() { return dataReliability; }
    public void setDataReliability(String dataReliability) { this.dataReliability = dataReliability; }

    public String getSourceReference() { return sourceReference; }
    public void setSourceReference(String sourceReference) { this.sourceReference = sourceReference; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
