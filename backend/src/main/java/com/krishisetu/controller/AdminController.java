package com.krishisetu.controller;

import com.krishisetu.dto.AdminPhase6Dtos.*;
import com.krishisetu.dto.AdminSummaryResponse;
import com.krishisetu.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/overview")
    public ResponseEntity<AdminSummaryResponse> getOverview() {
        return ResponseEntity.ok(adminService.getOverview());
    }

    @GetMapping("/farmers")
    public ResponseEntity<List<AdminFarmerAccountDto>> listFarmers() {
        return ResponseEntity.ok(adminService.listFarmerAccounts());
    }

    @PatchMapping("/farmers/{id}/status")
    public ResponseEntity<AdminFarmerAccountDto> updateFarmerStatus(
        @PathVariable UUID id,
        @Valid @RequestBody FarmerAccountStatusRequest request
    ) {
        return ResponseEntity.ok(adminService.updateFarmerAccountStatus(id, request.active()));
    }

    @GetMapping("/analytics")
    public ResponseEntity<AdminAnalyticsResponse> getAnalytics() {
        return ResponseEntity.ok(adminService.getAnalytics());
    }

    @GetMapping("/integrations/status")
    public ResponseEntity<IntegrationsOverviewResponse> getIntegrationsStatus() {
        return ResponseEntity.ok(adminService.getIntegrationsStatus());
    }

    @PostMapping("/integrations/probe")
    public ResponseEntity<IntegrationsProbeResponse> probeIntegrations() {
        return ResponseEntity.ok(adminService.probeIntegrations());
    }
}
