package com.krishisetu.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "equipment_listings")
public class EquipmentListing {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 80)
    private String listingCode;

    @Column(nullable = false, length = 30)
    private String category; // TRACTOR, HARVESTER, OTHER

    @Column(nullable = false, length = 200)
    private String equipmentNameEn;

    @Column(nullable = false, length = 200)
    private String equipmentNameKn;

    @Column(length = 400)
    private String modelOrSpecEn;

    @Column(length = 400)
    private String modelOrSpecKn;

    @Column(nullable = false, length = 200)
    private String providerNameEn;

    @Column(nullable = false, length = 200)
    private String providerNameKn;

    @Column(nullable = false, length = 80)
    private String state;

    @Column(nullable = false, length = 80)
    private String district;

    @Column(length = 40)
    private String contactPhone;

    @Column(precision = 10, scale = 2)
    private BigDecimal rateInr;

    @Column(length = 20)
    private String rateUnit; // HOUR, ACRE, DAY

    @Column(nullable = false)
    private boolean rateVerified = false;

    @Column(nullable = false, length = 30)
    private String availabilityStatus = "UNVERIFIED"; // AVAILABLE, SEASONAL_DEMAND, UNVERIFIED

    @Column(nullable = false, length = 40)
    private String verificationStatus = "DEMONSTRATION_SAMPLE";

    @Column(nullable = false, length = 240)
    private String sourceReference;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getListingCode() { return listingCode; }
    public void setListingCode(String listingCode) { this.listingCode = listingCode; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getEquipmentNameEn() { return equipmentNameEn; }
    public void setEquipmentNameEn(String equipmentNameEn) { this.equipmentNameEn = equipmentNameEn; }

    public String getEquipmentNameKn() { return equipmentNameKn; }
    public void setEquipmentNameKn(String equipmentNameKn) { this.equipmentNameKn = equipmentNameKn; }

    public String getModelOrSpecEn() { return modelOrSpecEn; }
    public void setModelOrSpecEn(String modelOrSpecEn) { this.modelOrSpecEn = modelOrSpecEn; }

    public String getModelOrSpecKn() { return modelOrSpecKn; }
    public void setModelOrSpecKn(String modelOrSpecKn) { this.modelOrSpecKn = modelOrSpecKn; }

    public String getProviderNameEn() { return providerNameEn; }
    public void setProviderNameEn(String providerNameEn) { this.providerNameEn = providerNameEn; }

    public String getProviderNameKn() { return providerNameKn; }
    public void setProviderNameKn(String providerNameKn) { this.providerNameKn = providerNameKn; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public BigDecimal getRateInr() { return rateInr; }
    public void setRateInr(BigDecimal rateInr) { this.rateInr = rateInr; }

    public String getRateUnit() { return rateUnit; }
    public void setRateUnit(String rateUnit) { this.rateUnit = rateUnit; }

    public boolean isRateVerified() { return rateVerified; }
    public void setRateVerified(boolean rateVerified) { this.rateVerified = rateVerified; }

    public String getAvailabilityStatus() { return availabilityStatus; }
    public void setAvailabilityStatus(String availabilityStatus) { this.availabilityStatus = availabilityStatus; }

    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }

    public String getSourceReference() { return sourceReference; }
    public void setSourceReference(String sourceReference) { this.sourceReference = sourceReference; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Instant getCreatedAt() { return createdAt; }
}
