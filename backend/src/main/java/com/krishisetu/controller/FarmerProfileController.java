package com.krishisetu.controller;

import com.krishisetu.dto.FarmerProfileRequest;
import com.krishisetu.dto.FarmerProfileResponse;
import com.krishisetu.service.FarmerProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/farmer/profile")
public class FarmerProfileController {

    private final FarmerProfileService farmerProfileService;

    public FarmerProfileController(FarmerProfileService farmerProfileService) {
        this.farmerProfileService = farmerProfileService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
    public ResponseEntity<FarmerProfileResponse> getMyProfile(@AuthenticationPrincipal UserDetails principal) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.ok(farmerProfileService.getProfile(userId));
    }

    @PostMapping
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<FarmerProfileResponse> saveProfile(
        @AuthenticationPrincipal UserDetails principal,
        @Valid @RequestBody FarmerProfileRequest request
    ) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.ok(farmerProfileService.saveOrUpdateProfile(userId, request));
    }
}
