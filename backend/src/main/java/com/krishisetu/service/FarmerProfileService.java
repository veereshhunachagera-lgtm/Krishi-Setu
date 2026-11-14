package com.krishisetu.service;

import com.krishisetu.dto.FarmerProfileRequest;
import com.krishisetu.dto.FarmerProfileResponse;
import com.krishisetu.dto.SoilReportDto;
import com.krishisetu.entity.FarmerProfile;
import com.krishisetu.entity.SoilReport;
import com.krishisetu.entity.User;
import com.krishisetu.exception.BadRequestException;
import com.krishisetu.exception.ResourceNotFoundException;
import com.krishisetu.repository.FarmerProfileRepository;
import com.krishisetu.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class FarmerProfileService {

    private final FarmerProfileRepository farmerProfileRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public FarmerProfileService(
        FarmerProfileRepository farmerProfileRepository,
        UserRepository userRepository,
        NotificationService notificationService
    ) {
        this.farmerProfileRepository = farmerProfileRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public FarmerProfileResponse getProfile(UUID userId) {
        FarmerProfile profile = farmerProfileRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Farmer profile not completed yet."));
        return toResponse(profile);
    }

    @Transactional
    public FarmerProfileResponse saveOrUpdateProfile(UUID userId, FarmerProfileRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        validateRequest(request);

        boolean firstOnboarding = !user.isOnboardingCompleted();
        FarmerProfile profile = farmerProfileRepository.findByUserId(userId)
            .orElseGet(() -> {
                FarmerProfile created = new FarmerProfile();
                created.setUser(user);
                return created;
            });

        profile.setHasSoilReport(Boolean.TRUE.equals(request.hasSoilReport()));
        String resolvedName = (request.farmerName() != null && !request.farmerName().isBlank())
            ? request.farmerName().trim()
            : user.getFullName();
        profile.setFarmerName(resolvedName);
        profile.setState(trimOrNull(request.state()));
        profile.setDistrict(trimOrNull(request.district()));
        profile.setVillage(trimOrNull(request.village()));
        profile.setLandSize(request.landSize());
        profile.setLandUnit(trimOrNull(request.landUnit()));
        profile.setSoilType(trimOrNull(request.soilType()));
        profile.setIrrigationSource(trimOrNull(request.irrigationSource()));
        profile.setCurrentOrPreviousCrop(trimOrNull(request.currentOrPreviousCrop()));
        profile.setGrowingSeason(trimOrNull(request.growingSeason()));

        if (Boolean.TRUE.equals(request.hasSoilReport()) && request.soilReport() != null) {
            SoilReport report = profile.getSoilReport();
            if (report == null) {
                report = new SoilReport();
                report.setFarmerProfile(profile);
            }
            SoilReportDto dto = request.soilReport();
            report.setNitrogenUnknown(dto.nitrogenUnknown());
            report.setPhosphorusUnknown(dto.phosphorusUnknown());
            report.setPotassiumUnknown(dto.potassiumUnknown());
            report.setPhUnknown(dto.phUnknown());
            report.setNitrogenKgPerHa(dto.nitrogenUnknown() ? null : dto.nitrogenKgPerHa());
            report.setPhosphorusKgPerHa(dto.phosphorusUnknown() ? null : dto.phosphorusKgPerHa());
            report.setPotassiumKgPerHa(dto.potassiumUnknown() ? null : dto.potassiumKgPerHa());
            report.setPhLevel(dto.phUnknown() ? null : dto.phLevel());
            report.setLabName(trimOrNull(dto.labName()));
            report.setSampleDate(trimOrNull(dto.sampleDate()));
            profile.setSoilReport(report);
        } else {
            profile.setSoilReport(null);
        }

        if (!resolvedName.equals(user.getFullName())) {
            user.setFullName(resolvedName);
        }
        user.setOnboardingCompleted(true);
        userRepository.save(user);
        profile = farmerProfileRepository.save(profile);

        if (firstOnboarding) {
            notificationService.createNotification(
                user,
                profile.isHasSoilReport()
                    ? "notifications.items.soilSavedTitle"
                    : "notifications.items.fieldSavedTitle",
                profile.isHasSoilReport()
                    ? "notifications.items.soilSavedMessage"
                    : "notifications.items.fieldSavedMessage",
                "ONBOARDING"
            );
        }

        return toResponse(profile);
    }

    private void validateRequest(FarmerProfileRequest request) {
        if (Boolean.TRUE.equals(request.hasSoilReport())) {
            if (request.soilReport() == null) {
                throw new BadRequestException("Soil report details are required when soil report is selected.");
            }
            SoilReportDto r = request.soilReport();
            boolean allUnknown = r.nitrogenUnknown() && r.phosphorusUnknown() && r.potassiumUnknown() && r.phUnknown();
            boolean anyEntered = r.nitrogenKgPerHa() != null || r.phosphorusKgPerHa() != null
                || r.potassiumKgPerHa() != null || r.phLevel() != null;
            if (!allUnknown && !anyEntered) {
                throw new BadRequestException("Enter at least one soil value or mark fields as unknown.");
            }
        } else {
            if (isBlank(request.farmerName()) || isBlank(request.state()) || isBlank(request.district())
                || isBlank(request.village()) || request.landSize() == null || isBlank(request.landUnit())
                || isBlank(request.soilType()) || isBlank(request.irrigationSource())
                || isBlank(request.currentOrPreviousCrop()) || isBlank(request.growingSeason())) {
                throw new BadRequestException("Please complete all field details for onboarding without a soil report.");
            }
        }
    }

    public FarmerProfileResponse toResponse(FarmerProfile profile) {
        SoilReportDto reportDto = null;
        if (profile.getSoilReport() != null) {
            SoilReport r = profile.getSoilReport();
            reportDto = new SoilReportDto(
                r.getNitrogenKgPerHa(),
                r.getPhosphorusKgPerHa(),
                r.getPotassiumKgPerHa(),
                r.getPhLevel(),
                r.isNitrogenUnknown(),
                r.isPhosphorusUnknown(),
                r.isPotassiumUnknown(),
                r.isPhUnknown(),
                r.getLabName(),
                r.getSampleDate()
            );
        }
        return new FarmerProfileResponse(
            profile.getId(),
            profile.getUser().getId(),
            profile.isHasSoilReport(),
            profile.getFarmerName(),
            profile.getUser().getEmail(),
            profile.getState(),
            profile.getDistrict(),
            profile.getVillage(),
            profile.getLandSize(),
            profile.getLandUnit(),
            profile.getSoilType(),
            profile.getIrrigationSource(),
            profile.getCurrentOrPreviousCrop(),
            profile.getGrowingSeason(),
            reportDto,
            profile.getUpdatedAt()
        );
    }

    private String trimOrNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
