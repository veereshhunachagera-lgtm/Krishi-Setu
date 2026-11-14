package com.krishisetu.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "soil_reports")
public class SoilReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "farmer_profile_id", nullable = false, unique = true)
    private FarmerProfile farmerProfile;

    @Column(precision = 8, scale = 2)
    private BigDecimal nitrogenKgPerHa;

    @Column(precision = 8, scale = 2)
    private BigDecimal phosphorusKgPerHa;

    @Column(precision = 8, scale = 2)
    private BigDecimal potassiumKgPerHa;

    @Column(precision = 4, scale = 2)
    private BigDecimal phLevel;

    @Column(nullable = false)
    private boolean nitrogenUnknown = false;

    @Column(nullable = false)
    private boolean phosphorusUnknown = false;

    @Column(nullable = false)
    private boolean potassiumUnknown = false;

    @Column(nullable = false)
    private boolean phUnknown = false;

    @Column(length = 120)
    private String labName;

    @Column(length = 30)
    private String sampleDate;

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public FarmerProfile getFarmerProfile() { return farmerProfile; }
    public void setFarmerProfile(FarmerProfile farmerProfile) { this.farmerProfile = farmerProfile; }

    public BigDecimal getNitrogenKgPerHa() { return nitrogenKgPerHa; }
    public void setNitrogenKgPerHa(BigDecimal nitrogenKgPerHa) { this.nitrogenKgPerHa = nitrogenKgPerHa; }

    public BigDecimal getPhosphorusKgPerHa() { return phosphorusKgPerHa; }
    public void setPhosphorusKgPerHa(BigDecimal phosphorusKgPerHa) { this.phosphorusKgPerHa = phosphorusKgPerHa; }

    public BigDecimal getPotassiumKgPerHa() { return potassiumKgPerHa; }
    public void setPotassiumKgPerHa(BigDecimal potassiumKgPerHa) { this.potassiumKgPerHa = potassiumKgPerHa; }

    public BigDecimal getPhLevel() { return phLevel; }
    public void setPhLevel(BigDecimal phLevel) { this.phLevel = phLevel; }

    public boolean isNitrogenUnknown() { return nitrogenUnknown; }
    public void setNitrogenUnknown(boolean nitrogenUnknown) { this.nitrogenUnknown = nitrogenUnknown; }

    public boolean isPhosphorusUnknown() { return phosphorusUnknown; }
    public void setPhosphorusUnknown(boolean phosphorusUnknown) { this.phosphorusUnknown = phosphorusUnknown; }

    public boolean isPotassiumUnknown() { return potassiumUnknown; }
    public void setPotassiumUnknown(boolean potassiumUnknown) { this.potassiumUnknown = potassiumUnknown; }

    public boolean isPhUnknown() { return phUnknown; }
    public void setPhUnknown(boolean phUnknown) { this.phUnknown = phUnknown; }

    public String getLabName() { return labName; }
    public void setLabName(String labName) { this.labName = labName; }

    public String getSampleDate() { return sampleDate; }
    public void setSampleDate(String sampleDate) { this.sampleDate = sampleDate; }

    public Instant getUpdatedAt() { return updatedAt; }
}
