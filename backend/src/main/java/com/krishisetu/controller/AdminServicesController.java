package com.krishisetu.controller;

import com.krishisetu.dto.AgriServicesDtos.*;
import com.krishisetu.service.AgriServicesService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/services")
@PreAuthorize("hasRole('ADMIN')")
public class AdminServicesController {

    private final AgriServicesService agriServicesService;

    public AdminServicesController(AgriServicesService agriServicesService) {
        this.agriServicesService = agriServicesService;
    }

    @GetMapping("/providers")
    public List<ServiceProviderDto> listProviders() {
        return agriServicesService.listAllProvidersAdmin();
    }

    @PostMapping("/providers")
    public ResponseEntity<ServiceProviderDto> createProvider(
        @Valid @RequestBody AdminServiceProviderCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(agriServicesService.createProviderAdmin(request));
    }

    @DeleteMapping("/providers/{id}")
    public ResponseEntity<Void> deleteProvider(@PathVariable UUID id) {
        agriServicesService.deleteProviderAdmin(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/equipment")
    public List<EquipmentListingDto> listEquipment() {
        return agriServicesService.listAllEquipmentAdmin();
    }

    @PostMapping("/equipment")
    public ResponseEntity<EquipmentListingDto> createEquipment(
        @Valid @RequestBody AdminEquipmentCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(agriServicesService.createEquipmentAdmin(request));
    }

    @DeleteMapping("/equipment/{id}")
    public ResponseEntity<Void> deleteEquipment(@PathVariable UUID id) {
        agriServicesService.deleteEquipmentAdmin(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/bookings")
    public List<BookingRequestDto> listBookings() {
        return agriServicesService.listAllBookingsAdmin();
    }

    @PatchMapping("/bookings/{id}")
    public BookingRequestDto updateBookingStatus(
        @PathVariable UUID id,
        @Valid @RequestBody AdminBookingStatusUpdateRequest request
    ) {
        return agriServicesService.updateBookingStatusAdmin(id, request);
    }
}
