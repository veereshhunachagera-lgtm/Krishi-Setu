package com.krishisetu.service;

import com.krishisetu.dto.AdminSummaryResponse;
import com.krishisetu.dto.FarmerProfileResponse;
import com.krishisetu.entity.Role;
import com.krishisetu.entity.User;
import com.krishisetu.repository.FarmerProfileRepository;
import com.krishisetu.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final FarmerProfileService farmerProfileService;

    public AdminService(
        UserRepository userRepository,
        FarmerProfileRepository farmerProfileRepository,
        FarmerProfileService farmerProfileService
    ) {
        this.userRepository = userRepository;
        this.farmerProfileRepository = farmerProfileRepository;
        this.farmerProfileService = farmerProfileService;
    }

    @Transactional(readOnly = true)
    public AdminSummaryResponse getOverview() {
        long totalFarmers = userRepository.countByRole(Role.FARMER);
        long onboardedFarmers = userRepository.countByRoleAndOnboardingCompletedTrue(Role.FARMER);
        long withSoilReportCount = farmerProfileRepository.countByHasSoilReportTrue();
        long withoutSoilReportCount = farmerProfileRepository.countByHasSoilReportFalse();

        Map<String, Long> languageBreakdown = new HashMap<>();
        for (User user : userRepository.findAll()) {
            if (user.getRole() == Role.FARMER) {
                languageBreakdown.merge(user.getPreferredLanguage(), 1L, Long::sum);
            }
        }

        List<FarmerProfileResponse> farmers = farmerProfileRepository.findAll()
            .stream()
            .map(farmerProfileService::toResponse)
            .toList();

        return new AdminSummaryResponse(
            totalFarmers,
            onboardedFarmers,
            withSoilReportCount,
            withoutSoilReportCount,
            languageBreakdown,
            farmers
        );
    }
}
