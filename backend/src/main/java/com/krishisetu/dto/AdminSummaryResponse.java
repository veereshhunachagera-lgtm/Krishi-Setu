package com.krishisetu.dto;

import java.util.List;
import java.util.Map;

public record AdminSummaryResponse(
    long totalFarmers,
    long onboardedFarmers,
    long withSoilReportCount,
    long withoutSoilReportCount,
    Map<String, Long> languageBreakdown,
    List<FarmerProfileResponse> farmers
) {}
