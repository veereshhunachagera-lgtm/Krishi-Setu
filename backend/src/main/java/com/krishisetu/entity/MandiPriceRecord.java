package com.krishisetu.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "mandi_price_records",
    indexes = {
        @Index(name = "idx_mandi_commodity_date", columnList = "commodity, arrivalDate"),
        @Index(name = "idx_mandi_state_district", columnList = "state, district, market")
    }
)
public class MandiPriceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 120)
    private String commodity;

    @Column(nullable = false, length = 120)
    private String variety;

    @Column(nullable = false, length = 60)
    private String grade;

    @Column(nullable = false, length = 100)
    private String state;

    @Column(nullable = false, length = 100)
    private String district;

    @Column(nullable = false, length = 140)
    private String market;

    @Column
    private Double minPrice;

    @Column
    private Double maxPrice;

    @Column
    private Double modalPrice;

    @Column(nullable = false, length = 40)
    private String unit = "INR / Quintal";

    @Column(nullable = false, length = 20)
    private String arrivalDate;

    @Column(nullable = false, length = 30)
    private String reportedDateRaw;

    @Column(nullable = false, length = 160)
    private String sourceName;

    @Column(length = 80)
    private String resourceId;

    @Column(nullable = false)
    private Instant fetchedAt = Instant.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getCommodity() { return commodity; }
    public void setCommodity(String commodity) { this.commodity = commodity; }

    public String getVariety() { return variety; }
    public void setVariety(String variety) { this.variety = variety; }

    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getMarket() { return market; }
    public void setMarket(String market) { this.market = market; }

    public Double getMinPrice() { return minPrice; }
    public void setMinPrice(Double minPrice) { this.minPrice = minPrice; }

    public Double getMaxPrice() { return maxPrice; }
    public void setMaxPrice(Double maxPrice) { this.maxPrice = maxPrice; }

    public Double getModalPrice() { return modalPrice; }
    public void setModalPrice(Double modalPrice) { this.modalPrice = modalPrice; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getArrivalDate() { return arrivalDate; }
    public void setArrivalDate(String arrivalDate) { this.arrivalDate = arrivalDate; }

    public String getReportedDateRaw() { return reportedDateRaw; }
    public void setReportedDateRaw(String reportedDateRaw) { this.reportedDateRaw = reportedDateRaw; }

    public String getSourceName() { return sourceName; }
    public void setSourceName(String sourceName) { this.sourceName = sourceName; }

    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }

    public Instant getFetchedAt() { return fetchedAt; }
    public void setFetchedAt(Instant fetchedAt) { this.fetchedAt = fetchedAt; }
}
