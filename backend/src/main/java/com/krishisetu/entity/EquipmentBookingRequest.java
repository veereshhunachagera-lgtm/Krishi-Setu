package com.krishisetu.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "equipment_booking_requests")
public class EquipmentBookingRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 120)
    private String farmerName;

    @Column(nullable = false)
    private UUID equipmentId;

    @Column(nullable = false, length = 200)
    private String equipmentNameEn;

    @Column(nullable = false, length = 200)
    private String equipmentNameKn;

    @Column(nullable = false, length = 200)
    private String providerNameEn;

    @Column(nullable = false, length = 80)
    private String district;

    @Column(nullable = false, length = 80)
    private String state;

    @Column(nullable = false, length = 20)
    private String requestedDate;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal durationValue;

    @Column(nullable = false, length = 20)
    private String durationUnit; // HOURS, ACRES, DAYS

    @Column(nullable = false, length = 30)
    private String contactPhone;

    @Column(length = 400)
    private String notes;

    @Column(nullable = false, length = 40)
    private String status = "REQUESTED";

    @Column(nullable = false, length = 300)
    private String confirmationNote;

    @Column(length = 300)
    private String adminNote;

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

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getFarmerName() { return farmerName; }
    public void setFarmerName(String farmerName) { this.farmerName = farmerName; }

    public UUID getEquipmentId() { return equipmentId; }
    public void setEquipmentId(UUID equipmentId) { this.equipmentId = equipmentId; }

    public String getEquipmentNameEn() { return equipmentNameEn; }
    public void setEquipmentNameEn(String equipmentNameEn) { this.equipmentNameEn = equipmentNameEn; }

    public String getEquipmentNameKn() { return equipmentNameKn; }
    public void setEquipmentNameKn(String equipmentNameKn) { this.equipmentNameKn = equipmentNameKn; }

    public String getProviderNameEn() { return providerNameEn; }
    public void setProviderNameEn(String providerNameEn) { this.providerNameEn = providerNameEn; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getRequestedDate() { return requestedDate; }
    public void setRequestedDate(String requestedDate) { this.requestedDate = requestedDate; }

    public BigDecimal getDurationValue() { return durationValue; }
    public void setDurationValue(BigDecimal durationValue) { this.durationValue = durationValue; }

    public String getDurationUnit() { return durationUnit; }
    public void setDurationUnit(String durationUnit) { this.durationUnit = durationUnit; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getConfirmationNote() { return confirmationNote; }
    public void setConfirmationNote(String confirmationNote) { this.confirmationNote = confirmationNote; }

    public String getAdminNote() { return adminNote; }
    public void setAdminNote(String adminNote) { this.adminNote = adminNote; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
