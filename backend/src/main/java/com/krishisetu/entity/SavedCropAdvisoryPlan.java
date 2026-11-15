package com.krishisetu.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "saved_crop_advisory_plans")
public class SavedCropAdvisoryPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 60)
    private String primaryCropCode;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "saved_crop_plan_alternatives", joinColumns = @JoinColumn(name = "plan_id"))
    @Column(name = "alternative_crop_code", length = 60)
    private List<String> alternativeCropCodes = new ArrayList<>();

    @Column(length = 30)
    private String plannedSeason;

    @Column(length = 500)
    private String farmerNotes;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getPrimaryCropCode() { return primaryCropCode; }
    public void setPrimaryCropCode(String primaryCropCode) { this.primaryCropCode = primaryCropCode; }

    public List<String> getAlternativeCropCodes() { return alternativeCropCodes; }
    public void setAlternativeCropCodes(List<String> alternativeCropCodes) { this.alternativeCropCodes = alternativeCropCodes; }

    public String getPlannedSeason() { return plannedSeason; }
    public void setPlannedSeason(String plannedSeason) { this.plannedSeason = plannedSeason; }

    public String getFarmerNotes() { return farmerNotes; }
    public void setFarmerNotes(String farmerNotes) { this.farmerNotes = farmerNotes; }

    public Instant getCreatedAt() { return createdAt; }
}
