package com.krishisetu.dto;

import java.util.List;

public class PlantDiseaseScannerStatusResponse {
    private boolean modelConnected;
    private String mode;
    private String configuredModelId;
    private double confidenceThreshold;
    private List<String> supportedCrops;
    private String statusMessageEn;
    private String statusMessageKn;

    public boolean isModelConnected() { return modelConnected; }
    public void setModelConnected(boolean modelConnected) { this.modelConnected = modelConnected; }

    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }

    public String getConfiguredModelId() { return configuredModelId; }
    public void setConfiguredModelId(String configuredModelId) { this.configuredModelId = configuredModelId; }

    public double getConfidenceThreshold() { return confidenceThreshold; }
    public void setConfidenceThreshold(double confidenceThreshold) { this.confidenceThreshold = confidenceThreshold; }

    public List<String> getSupportedCrops() { return supportedCrops; }
    public void setSupportedCrops(List<String> supportedCrops) { this.supportedCrops = supportedCrops; }

    public String getStatusMessageEn() { return statusMessageEn; }
    public void setStatusMessageEn(String statusMessageEn) { this.statusMessageEn = statusMessageEn; }

    public String getStatusMessageKn() { return statusMessageKn; }
    public void setStatusMessageKn(String statusMessageKn) { this.statusMessageKn = statusMessageKn; }
}
