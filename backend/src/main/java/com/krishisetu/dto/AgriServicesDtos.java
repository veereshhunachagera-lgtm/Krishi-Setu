package com.krishisetu.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class AgriServicesDtos {

    private AgriServicesDtos() {}

    public record ServiceProviderDto(
        UUID id,
        String providerCode,
        String serviceType,
        String nameEn,
        String nameKn,
        String state,
        String district,
        String addressEn,
        String addressKn,
        String contactPhone,
        String contactEmail,
        String websiteUrl,
        List<String> servicesOfferedEn,
        List<String> servicesOfferedKn,
        String capacityNoteEn,
        String capacityNoteKn,
        Double latitude,
        Double longitude,
        boolean coordinatesVerified,
        String verificationStatus,
        String sourceReference,
        boolean active
    ) {}

    public record SoilTestingChecklistItemDto(
        int step,
        String titleEn,
        String titleKn,
        String detailEn,
        String detailKn
    ) {}

    public record SoilLabsResponse(
        List<ServiceProviderDto> providers,
        List<SoilTestingChecklistItemDto> checklist,
        List<String> availableStates,
        List<String> availableDistricts
    ) {}

    public record DirectoryResponse(
        List<ServiceProviderDto> providers,
        List<String> availableStates,
        List<String> availableDistricts
    ) {}

    public record EquipmentListingDto(
        UUID id,
        String listingCode,
        String category,
        String equipmentNameEn,
        String equipmentNameKn,
        String modelOrSpecEn,
        String modelOrSpecKn,
        String providerNameEn,
        String providerNameKn,
        String state,
        String district,
        String contactPhone,
        BigDecimal rateInr,
        String rateUnit,
        boolean rateVerified,
        String availabilityStatus,
        String verificationStatus,
        String sourceReference,
        boolean active
    ) {}

    public record EquipmentCatalogResponse(
        List<EquipmentListingDto> listings,
        List<String> availableStates,
        List<String> availableDistricts
    ) {}

    public record BookingCreateRequest(
        @NotNull(message = "Select an equipment listing.") UUID equipmentId,
        @NotBlank(message = "Provide a preferred date.") @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "Use YYYY-MM-DD date format.") String requestedDate,
        @NotNull(message = "Enter requested duration or acres.") @DecimalMin(value = "0.5", message = "Duration must be > 0.") @DecimalMax(value = "500.0", message = "Duration exceeds limit.") BigDecimal durationValue,
        @NotBlank(message = "Duration unit is required.") String durationUnit,
        @NotBlank(message = "Enter a callback mobile number.") @Size(min = 10, max = 20, message = "Enter a valid mobile number.") String contactPhone,
        @Size(max = 400) String notes
    ) {}

    public record BookingRequestDto(
        UUID id,
        UUID userId,
        String farmerName,
        UUID equipmentId,
        String equipmentNameEn,
        String equipmentNameKn,
        String providerNameEn,
        String district,
        String state,
        String requestedDate,
        BigDecimal durationValue,
        String durationUnit,
        String contactPhone,
        String notes,
        String status,
        String confirmationNote,
        String adminNote,
        Instant createdAt,
        Instant updatedAt
    ) {}

    public record AdminServiceProviderCreateRequest(
        String providerCode,
        @NotBlank String serviceType,
        @NotBlank String nameEn,
        String nameKn,
        @NotBlank String state,
        @NotBlank String district,
        @NotBlank String addressEn,
        String addressKn,
        String contactPhone,
        String contactEmail,
        String websiteUrl,
        List<String> servicesOfferedEn,
        List<String> servicesOfferedKn,
        String capacityNoteEn,
        String capacityNoteKn,
        Double latitude,
        Double longitude,
        boolean coordinatesVerified,
        String verificationStatus,
        String sourceReference
    ) {}

    public record AdminEquipmentCreateRequest(
        @NotBlank String category,
        @NotBlank String equipmentNameEn,
        String equipmentNameKn,
        String modelOrSpecEn,
        String modelOrSpecKn,
        @NotBlank String providerNameEn,
        String providerNameKn,
        @NotBlank String state,
        @NotBlank String district,
        String contactPhone,
        BigDecimal rateInr,
        String rateUnit,
        boolean rateVerified,
        String availabilityStatus,
        String verificationStatus,
        String sourceReference
    ) {}

    public record AdminBookingStatusUpdateRequest(
        @NotBlank String status,
        String adminNote
    ) {}
}
