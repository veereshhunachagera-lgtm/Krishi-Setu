package com.krishisetu.controller;

import com.krishisetu.dto.CropKnowledgeDto;
import com.krishisetu.dto.CropUpsertRequest;
import com.krishisetu.service.AdminCropService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/crops")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCropController {

    private final AdminCropService adminCropService;

    public AdminCropController(AdminCropService adminCropService) {
        this.adminCropService = adminCropService;
    }

    @GetMapping
    public ResponseEntity<List<CropKnowledgeDto>> listAllCrops() {
        return ResponseEntity.ok(adminCropService.listAllCrops());
    }

    @PostMapping
    public ResponseEntity<CropKnowledgeDto> createCrop(@Valid @RequestBody CropUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminCropService.createCrop(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CropKnowledgeDto> updateCrop(
        @PathVariable UUID id,
        @Valid @RequestBody CropUpsertRequest request
    ) {
        return ResponseEntity.ok(adminCropService.updateCrop(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCrop(@PathVariable UUID id) {
        adminCropService.deleteCrop(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/sync-seed")
    public ResponseEntity<Map<String, Object>> syncSeedDataset() {
        int count = adminCropService.syncCuratedSeedDataset();
        return ResponseEntity.ok(Map.of("importedCount", count));
    }

    @PostMapping("/import")
    public ResponseEntity<Map<String, Object>> importBulk(@Valid @RequestBody List<CropUpsertRequest> requests) {
        int count = adminCropService.importBulk(requests);
        return ResponseEntity.ok(Map.of("importedCount", count));
    }
}
