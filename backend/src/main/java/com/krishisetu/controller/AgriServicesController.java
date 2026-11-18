package com.krishisetu.controller;

import com.krishisetu.dto.AgriServicesDtos.*;
import com.krishisetu.security.AuthenticatedUser;
import com.krishisetu.service.AgriServicesService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/agri-services")
public class AgriServicesController {

    private final AgriServicesService agriServicesService;

    public AgriServicesController(AgriServicesService agriServicesService) {
        this.agriServicesService = agriServicesService;
    }

    @GetMapping("/soil-labs")
    public SoilLabsResponse getSoilLabs(
        @RequestParam(required = false) String state,
        @RequestParam(required = false) String district,
        @RequestParam(required = false) String q
    ) {
        return agriServicesService.searchSoilLabs(state, district, q);
    }

    @GetMapping("/directory")
    public DirectoryResponse getDirectory(
        @RequestParam(required = false) String serviceType,
        @RequestParam(required = false) String state,
        @RequestParam(required = false) String district,
        @RequestParam(required = false) String q
    ) {
        return agriServicesService.searchDirectory(serviceType, state, district, q);
    }

    @GetMapping("/equipment")
    public EquipmentCatalogResponse getEquipment(
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String state,
        @RequestParam(required = false) String district,
        @RequestParam(required = false) String q
    ) {
        return agriServicesService.searchEquipment(category, state, district, q);
    }

    @GetMapping("/equipment/bookings")
    public List<BookingRequestDto> getFarmerBookings(@AuthenticationPrincipal AuthenticatedUser user) {
        return agriServicesService.getFarmerBookings(user.getId());
    }

    @PostMapping("/equipment/bookings")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<BookingRequestDto> createBooking(
        @AuthenticationPrincipal AuthenticatedUser user,
        @Valid @RequestBody BookingCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(agriServicesService.createBookingRequest(user.getId(), request));
    }

    @PatchMapping("/equipment/bookings/{id}/cancel")
    public BookingRequestDto cancelBooking(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable UUID id
    ) {
        return agriServicesService.cancelFarmerBooking(user.getId(), id);
    }
}
