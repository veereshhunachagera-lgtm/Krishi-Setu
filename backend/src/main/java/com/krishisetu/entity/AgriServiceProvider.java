package com.krishisetu.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "agri_service_providers")
public class AgriServiceProvider {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 80)
    private String providerCode;

    @Column(nullable = false, length = 40)
    private String serviceType; // SOIL_LAB_KVK, COLD_STORAGE, MANDI_APMC, CUSTOM_HIRING_CENTRE, INPUT_SEED_CENTRE, EXTENSION_BANK

    @Column(nullable = false, length = 200)
    private String nameEn;

    @Column(nullable = false, length = 200)
    private String nameKn;

    @Column(nullable = false, length = 80)
    private String state;

    @Column(nullable = false, length = 80)
    private String district;

    @Column(nullable = false, length = 400)
    private String addressEn;

    @Column(nullable = false, length = 400)
    private String addressKn;

    @Column(length = 40)
    private String contactPhone;

    @Column(length = 120)
    private String contactEmail;

    @Column(length = 300)
    private String websiteUrl;

    @Column(columnDefinition = "TEXT")
    private String servicesOfferedEnJson;

    @Column(columnDefinition = "TEXT")
    private String servicesOfferedKnJson;

    @Column(length = 400)
    private String capacityNoteEn;

    @Column(length = 400)
    private String capacityNoteKn;

    private Double latitude;
    private Double longitude;

    @Column(nullable = false)
    private boolean coordinatesVerified = false;

    @Column(nullable = false, length = 40)
    private String verificationStatus = "DEMONSTRATION_SAMPLE"; // VERIFIED_DIRECTORY or DEMONSTRATION_SAMPLE

    @Column(nullable = false, length = 240)
    private String sourceReference;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getProviderCode() { return providerCode; }
    public void setProviderCode(String providerCode) { this.providerCode = providerCode; }

    public String getServiceType() { return serviceType; }
    public void setServiceType(String serviceType) { this.serviceType = serviceType; }

    public String getNameEn() { return nameEn; }
    public void setNameEn(String nameEn) { this.nameEn = nameEn; }

    public String getNameKn() { return nameKn; }
    public void setNameKn(String nameKn) { this.nameKn = nameKn; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getAddressEn() { return addressEn; }
    public void setAddressEn(String addressEn) { this.addressEn = addressEn; }

    public String getAddressKn() { return addressKn; }
    public void setAddressKn(String addressKn) { this.addressKn = addressKn; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public String getWebsiteUrl() { return websiteUrl; }
    public void setWebsiteUrl(String websiteUrl) { this.websiteUrl = websiteUrl; }

    public String getServicesOfferedEnJson() { return servicesOfferedEnJson; }
    public void setServicesOfferedEnJson(String servicesOfferedEnJson) { this.servicesOfferedEnJson = servicesOfferedEnJson; }

    public String getServicesOfferedKnJson() { return servicesOfferedKnJson; }
    public void setServicesOfferedKnJson(String servicesOfferedKnJson) { this.servicesOfferedKnJson = servicesOfferedKnJson; }

    public String getCapacityNoteEn() { return capacityNoteEn; }
    public void setCapacityNoteEn(String capacityNoteEn) { this.capacityNoteEn = capacityNoteEn; }

    public String getCapacityNoteKn() { return capacityNoteKn; }
    public void setCapacityNoteKn(String capacityNoteKn) { this.capacityNoteKn = capacityNoteKn; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public boolean isCoordinatesVerified() { return coordinatesVerified; }
    public void setCoordinatesVerified(boolean coordinatesVerified) { this.coordinatesVerified = coordinatesVerified; }

    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }

    public String getSourceReference() { return sourceReference; }
    public void setSourceReference(String sourceReference) { this.sourceReference = sourceReference; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Instant getCreatedAt() { return createdAt; }
}
