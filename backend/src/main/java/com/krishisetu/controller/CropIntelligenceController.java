package com.krishisetu.controller;

import com.krishisetu.dto.*;
import com.krishisetu.service.CropIntelligenceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/crop-intelligence")
public class CropIntelligenceController {

    private final CropIntelligenceService cropIntelligenceService;

    public CropIntelligenceController(CropIntelligenceService cropIntelligenceService) {
        this.cropIntelligenceService = cropIntelligenceService;
    }

    @GetMapping("/crops")
    @PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
    public ResponseEntity<List<CropKnowledgeDto>> searchCrops(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) String season,
        @RequestParam(required = false) String soilType,
        @RequestParam(required = false) String waterRequirement,
        @RequestParam(required = false) String category
    ) {
        return ResponseEntity.ok(
            cropIntelligenceService.searchKnowledgeBank(q, season, soilType, waterRequirement, category)
        );
    }

    @GetMapping("/crops/{cropCode}")
    @PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
    public ResponseEntity<CropKnowledgeDto> getCropDetail(@PathVariable String cropCode) {
        return ResponseEntity.ok(cropIntelligenceService.getCropByCode(cropCode));
    }

    @GetMapping("/recommendations")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<CropRecommendationResponse> getRecommendations(
        @AuthenticationPrincipal UserDetails principal,
        @RequestParam(required = false) String season,
        @RequestParam(required = false) String irrigation,
        @RequestParam(required = false) String soilType
    ) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.ok(
            cropIntelligenceService.generateRecommendations(userId, season, irrigation, soilType)
        );
    }

    @GetMapping("/compare")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<AlternativeComparisonResponse> compareAlternatives(
        @AuthenticationPrincipal UserDetails principal,
        @RequestParam String crops,
        @RequestParam(required = false) String season,
        @RequestParam(required = false) String irrigation
    ) {
        UUID userId = UUID.fromString(principal.getUsername());
        List<String> cropCodes = Arrays.stream(crops.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toList();
        return ResponseEntity.ok(
            cropIntelligenceService.compareAlternatives(userId, cropCodes, season, irrigation)
        );
    }

    @GetMapping("/soil-analysis")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<SoilAnalysisResponse> getSoilAnalysis(@AuthenticationPrincipal UserDetails principal) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.ok(cropIntelligenceService.analyzeSoilHealth(userId));
    }

    @GetMapping("/plans")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<List<SavedCropPlanResponse>> listSavedPlans(@AuthenticationPrincipal UserDetails principal) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.ok(cropIntelligenceService.getSavedPlans(userId));
    }

    @PostMapping("/plans")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<SavedCropPlanResponse> savePlan(
        @AuthenticationPrincipal UserDetails principal,
        @Valid @RequestBody SavedCropPlanRequest request
    ) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(cropIntelligenceService.savePlan(userId, request));
    }

    @DeleteMapping("/plans/{id}")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<Void> deletePlan(
        @AuthenticationPrincipal UserDetails principal,
        @PathVariable UUID id
    ) {
        UUID userId = UUID.fromString(principal.getUsername());
        cropIntelligenceService.deletePlan(userId, id);
        return ResponseEntity.noContent().build();
    }
}
