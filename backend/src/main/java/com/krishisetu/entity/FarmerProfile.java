package com.krishisetu.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "farmer_profiles")
public class FarmerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private boolean hasSoilReport;

    @Column(nullable = false, length = 120)
    private String farmerName;

    @Column(length = 80)
    private String state;

    @Column(length = 80)
    private String district;

    @Column(length = 120)
    private String village;

    @Column(precision = 10, scale = 2)
    private BigDecimal landSize;

    @Column(length = 20)
    private String landUnit;

    @Column(length = 40)
    private String soilType;

    @Column(length = 40)
    private String irrigationSource;

    @Column(length = 120)
    private String currentOrPreviousCrop;

    @Column(length = 30)
    private String growingSeason;

    @OneToOne(mappedBy = "farmerProfile", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private SoilReport soilReport;

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

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public boolean isHasSoilReport() { return hasSoilReport; }
    public void setHasSoilReport(boolean hasSoilReport) { this.hasSoilReport = hasSoilReport; }

    public String getFarmerName() { return farmerName; }
    public void setFarmerName(String farmerName) { this.farmerName = farmerName; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getVillage() { return village; }
    public void setVillage(String village) { this.village = village; }

    public BigDecimal getLandSize() { return landSize; }
    public void setLandSize(BigDecimal landSize) { this.landSize = landSize; }

    public String getLandUnit() { return landUnit; }
    public void setLandUnit(String landUnit) { this.landUnit = landUnit; }

    public String getSoilType() { return soilType; }
    public void setSoilType(String soilType) { this.soilType = soilType; }

    public String getIrrigationSource() { return irrigationSource; }
    public void setIrrigationSource(String irrigationSource) { this.irrigationSource = irrigationSource; }

    public String getCurrentOrPreviousCrop() { return currentOrPreviousCrop; }
    public void setCurrentOrPreviousCrop(String currentOrPreviousCrop) { this.currentOrPreviousCrop = currentOrPreviousCrop; }

    public String getGrowingSeason() { return growingSeason; }
    public void setGrowingSeason(String growingSeason) { this.growingSeason = growingSeason; }

    public SoilReport getSoilReport() { return soilReport; }
    public void setSoilReport(SoilReport soilReport) { this.soilReport = soilReport; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
