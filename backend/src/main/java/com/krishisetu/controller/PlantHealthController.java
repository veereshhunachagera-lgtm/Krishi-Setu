package com.krishisetu.controller;

import com.krishisetu.dto.PestDiseaseAlertDto;
import com.krishisetu.dto.PlantDiseaseScanResponse;
import com.krishisetu.dto.PlantDiseaseScannerStatusResponse;
import com.krishisetu.dto.PlantProtectionGuideDto;
import com.krishisetu.security.AuthenticatedUser;
import com.krishisetu.service.PlantHealthService;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/plant-health")
public class PlantHealthController {

    private final PlantHealthService plantHealthService;

    public PlantHealthController(PlantHealthService plantHealthService) {
        this.plantHealthService = plantHealthService;
    }

    @GetMapping("/scanner/status")
    public PlantDiseaseScannerStatusResponse getScannerStatus() {
        return plantHealthService.getScannerStatus();
    }

    @PostMapping(value = "/scanner/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PlantDiseaseScanResponse analyzeLeaf(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestParam("image") MultipartFile image,
        @RequestParam(value = "cropCode", required = false) String cropCode,
        @RequestParam(value = "farmerNotes", required = false) String farmerNotes
    ) {
        return plantHealthService.analyzeLeafImage(user.getId(), image, cropCode, farmerNotes);
    }

    @GetMapping("/scanner/history")
    public List<PlantDiseaseScanResponse> getScanHistory(@AuthenticationPrincipal AuthenticatedUser user) {
        return plantHealthService.getScanHistory(user.getId());
    }

    @GetMapping("/alerts")
    public List<PestDiseaseAlertDto> listAlerts(
        @RequestParam(required = false) String state,
        @RequestParam(required = false) String district,
        @RequestParam(required = false) String cropCode,
        @RequestParam(required = false) String verificationStatus
    ) {
        return plantHealthService.listActiveAlerts(state, district, cropCode, verificationStatus);
    }

    @GetMapping("/guidance")
    public List<PlantProtectionGuideDto> listGuidance(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) String cropCode,
        @RequestParam(required = false) String issueType
    ) {
        return plantHealthService.searchGuides(q, cropCode, issueType);
    }
}
