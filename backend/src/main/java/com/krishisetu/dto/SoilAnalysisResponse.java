package com.krishisetu.dto;

import java.util.List;

public class SoilAnalysisResponse {

    private boolean hasSoilReport;
    private String soilType;
    private List<NutrientStatusItem> parameters;
    private List<String> baselinePracticesEn;
    private List<String> baselinePracticesKn;
    private List<String> missingInformationEn;
    private List<String> missingInformationKn;

    public static class NutrientStatusItem {
        private String parameterKey;
        private Double measuredValue;
        private boolean unknown;
        private String unit;
        private String statusBand;
        private Double lowThreshold;
        private Double highThreshold;
        private String summaryEn;
        private String summaryKn;

        public String getParameterKey() { return parameterKey; }
        public void setParameterKey(String parameterKey) { this.parameterKey = parameterKey; }
        public Double getMeasuredValue() { return measuredValue; }
        public void setMeasuredValue(Double measuredValue) { this.measuredValue = measuredValue; }
        public boolean isUnknown() { return unknown; }
        public void setUnknown(boolean unknown) { this.unknown = unknown; }
        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }
        public String getStatusBand() { return statusBand; }
        public void setStatusBand(String statusBand) { this.statusBand = statusBand; }
        public Double getLowThreshold() { return lowThreshold; }
        public void setLowThreshold(Double lowThreshold) { this.lowThreshold = lowThreshold; }
        public Double getHighThreshold() { return highThreshold; }
        public void setHighThreshold(Double highThreshold) { this.highThreshold = highThreshold; }
        public String getSummaryEn() { return summaryEn; }
        public void setSummaryEn(String summaryEn) { this.summaryEn = summaryEn; }
        public String getSummaryKn() { return summaryKn; }
        public void setSummaryKn(String summaryKn) { this.summaryKn = summaryKn; }
    }

    public boolean isHasSoilReport() { return hasSoilReport; }
    public void setHasSoilReport(boolean hasSoilReport) { this.hasSoilReport = hasSoilReport; }
    public String getSoilType() { return soilType; }
    public void setSoilType(String soilType) { this.soilType = soilType; }
    public List<NutrientStatusItem> getParameters() { return parameters; }
    public void setParameters(List<NutrientStatusItem> parameters) { this.parameters = parameters; }
    public List<String> getBaselinePracticesEn() { return baselinePracticesEn; }
    public void setBaselinePracticesEn(List<String> baselinePracticesEn) { this.baselinePracticesEn = baselinePracticesEn; }
    public List<String> getBaselinePracticesKn() { return baselinePracticesKn; }
    public void setBaselinePracticesKn(List<String> baselinePracticesKn) { this.baselinePracticesKn = baselinePracticesKn; }
    public List<String> getMissingInformationEn() { return missingInformationEn; }
    public void setMissingInformationEn(List<String> missingInformationEn) { this.missingInformationEn = missingInformationEn; }
    public List<String> getMissingInformationKn() { return missingInformationKn; }
    public void setMissingInformationKn(List<String> missingInformationKn) { this.missingInformationKn = missingInformationKn; }
}
