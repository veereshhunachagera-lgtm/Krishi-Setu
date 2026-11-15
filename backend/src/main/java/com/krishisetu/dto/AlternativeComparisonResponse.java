package com.krishisetu.dto;

import java.util.List;

public class AlternativeComparisonResponse {

    private List<CropRecommendationResponse.RecommendedCropItem> comparedCrops;
    private List<String> comparisonNotesEn;
    private List<String> comparisonNotesKn;
    private List<String> limitationsEn;
    private List<String> limitationsKn;

    public List<CropRecommendationResponse.RecommendedCropItem> getComparedCrops() { return comparedCrops; }
    public void setComparedCrops(List<CropRecommendationResponse.RecommendedCropItem> comparedCrops) { this.comparedCrops = comparedCrops; }
    public List<String> getComparisonNotesEn() { return comparisonNotesEn; }
    public void setComparisonNotesEn(List<String> comparisonNotesEn) { this.comparisonNotesEn = comparisonNotesEn; }
    public List<String> getComparisonNotesKn() { return comparisonNotesKn; }
    public void setComparisonNotesKn(List<String> comparisonNotesKn) { this.comparisonNotesKn = comparisonNotesKn; }
    public List<String> getLimitationsEn() { return limitationsEn; }
    public void setLimitationsEn(List<String> limitationsEn) { this.limitationsEn = limitationsEn; }
    public List<String> getLimitationsKn() { return limitationsKn; }
    public void setLimitationsKn(List<String> limitationsKn) { this.limitationsKn = limitationsKn; }
}
