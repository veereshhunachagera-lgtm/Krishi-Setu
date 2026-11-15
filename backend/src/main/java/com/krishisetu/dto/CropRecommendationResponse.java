package com.krishisetu.dto;

import java.util.List;

public class CropRecommendationResponse {

    private FarmerContextSummary profileContext;
    private List<String> missingInformationEn;
    private List<String> missingInformationKn;
    private List<String> limitationsEn;
    private List<String> limitationsKn;
    private List<RecommendedCropItem> recommendations;

    public static class FarmerContextSummary {
        private boolean hasSoilReport;
        private String state;
        private String district;
        private String soilType;
        private String irrigationSource;
        private String growingSeason;
        private String currentOrPreviousCrop;
        private Double landSizeAcres;

        public boolean isHasSoilReport() { return hasSoilReport; }
        public void setHasSoilReport(boolean hasSoilReport) { this.hasSoilReport = hasSoilReport; }
        public String getState() { return state; }
        public void setState(String state) { this.state = state; }
        public String getDistrict() { return district; }
        public void setDistrict(String district) { this.district = district; }
        public String getSoilType() { return soilType; }
        public void setSoilType(String soilType) { this.soilType = soilType; }
        public String getIrrigationSource() { return irrigationSource; }
        public void setIrrigationSource(String irrigationSource) { this.irrigationSource = irrigationSource; }
        public String getGrowingSeason() { return growingSeason; }
        public void setGrowingSeason(String growingSeason) { this.growingSeason = growingSeason; }
        public String getCurrentOrPreviousCrop() { return currentOrPreviousCrop; }
        public void setCurrentOrPreviousCrop(String currentOrPreviousCrop) { this.currentOrPreviousCrop = currentOrPreviousCrop; }
        public Double getLandSizeAcres() { return landSizeAcres; }
        public void setLandSizeAcres(Double landSizeAcres) { this.landSizeAcres = landSizeAcres; }
    }

    public static class RecommendedCropItem {
        private CropKnowledgeDto crop;
        private String suitabilityBand;
        private List<String> matchReasonsEn;
        private List<String> matchReasonsKn;
        private List<String> cautionsEn;
        private List<String> cautionsKn;
        private boolean rotationRecommended;

        public CropKnowledgeDto getCrop() { return crop; }
        public void setCrop(CropKnowledgeDto crop) { this.crop = crop; }
        public String getSuitabilityBand() { return suitabilityBand; }
        public void setSuitabilityBand(String suitabilityBand) { this.suitabilityBand = suitabilityBand; }
        public List<String> getMatchReasonsEn() { return matchReasonsEn; }
        public void setMatchReasonsEn(List<String> matchReasonsEn) { this.matchReasonsEn = matchReasonsEn; }
        public List<String> getMatchReasonsKn() { return matchReasonsKn; }
        public void setMatchReasonsKn(List<String> matchReasonsKn) { this.matchReasonsKn = matchReasonsKn; }
        public List<String> getCautionsEn() { return cautionsEn; }
        public void setCautionsEn(List<String> cautionsEn) { this.cautionsEn = cautionsEn; }
        public List<String> getCautionsKn() { return cautionsKn; }
        public void setCautionsKn(List<String> cautionsKn) { this.cautionsKn = cautionsKn; }
        public boolean isRotationRecommended() { return rotationRecommended; }
        public void setRotationRecommended(boolean rotationRecommended) { this.rotationRecommended = rotationRecommended; }
    }

    public FarmerContextSummary getProfileContext() { return profileContext; }
    public void setProfileContext(FarmerContextSummary profileContext) { this.profileContext = profileContext; }
    public List<String> getMissingInformationEn() { return missingInformationEn; }
    public void setMissingInformationEn(List<String> missingInformationEn) { this.missingInformationEn = missingInformationEn; }
    public List<String> getMissingInformationKn() { return missingInformationKn; }
    public void setMissingInformationKn(List<String> missingInformationKn) { this.missingInformationKn = missingInformationKn; }
    public List<String> getLimitationsEn() { return limitationsEn; }
    public void setLimitationsEn(List<String> limitationsEn) { this.limitationsEn = limitationsEn; }
    public List<String> getLimitationsKn() { return limitationsKn; }
    public void setLimitationsKn(List<String> limitationsKn) { this.limitationsKn = limitationsKn; }
    public List<RecommendedCropItem> getRecommendations() { return recommendations; }
    public void setRecommendations(List<RecommendedCropItem> recommendations) { this.recommendations = recommendations; }
}
