package com.krishisetu.controller;

import com.krishisetu.dto.PestDiseaseAlertCreateRequest;
import com.krishisetu.dto.PestDiseaseAlertDto;
import com.krishisetu.entity.PestDiseaseAlert;
import com.krishisetu.exception.ResourceNotFoundException;
import com.krishisetu.repository.PestDiseaseAlertRepository;
import com.krishisetu.service.PlantHealthDatasetImportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/plant-health")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPlantHealthController {

    private final PestDiseaseAlertRepository alertRepository;
    private final PlantHealthDatasetImportService importService;

    public AdminPlantHealthController(
        PestDiseaseAlertRepository alertRepository,
        PlantHealthDatasetImportService importService
    ) {
        this.alertRepository = alertRepository;
        this.importService = importService;
    }

    @GetMapping("/alerts")
    public List<PestDiseaseAlertDto> listAllAlerts() {
        return alertRepository.findAllByOrderByObservedDateDesc().stream()
            .map(importService::toAlertDto)
            .toList();
    }

    @PostMapping("/alerts")
    public ResponseEntity<PestDiseaseAlertDto> upsertAlert(@Valid @RequestBody PestDiseaseAlertCreateRequest req) {
        PestDiseaseAlert saved = importService.upsertAlert(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(importService.toAlertDto(saved));
    }

    @DeleteMapping("/alerts/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAlert(@PathVariable UUID id) {
        PestDiseaseAlert existing = alertRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Alert record not found."));
        alertRepository.delete(existing);
    }

    @PostMapping("/sync-seed")
    public Map<String, Integer> syncSeedDatasets() {
        int alerts = importService.reimportAlerts();
        int guides = importService.reimportGuides();
        return Map.of("alertsImported", alerts, "guidesImported", guides);
    }
}
