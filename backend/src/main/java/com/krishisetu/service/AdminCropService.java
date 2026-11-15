package com.krishisetu.service;

import com.krishisetu.dto.CropKnowledgeDto;
import com.krishisetu.dto.CropUpsertRequest;
import com.krishisetu.entity.CropKnowledge;
import com.krishisetu.exception.BadRequestException;
import com.krishisetu.exception.ResourceNotFoundException;
import com.krishisetu.repository.CropKnowledgeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AdminCropService {

    private final CropKnowledgeRepository cropRepository;
    private final CropDatasetImportService importService;

    public AdminCropService(CropKnowledgeRepository cropRepository, CropDatasetImportService importService) {
        this.cropRepository = cropRepository;
        this.importService = importService;
    }

    public List<CropKnowledgeDto> listAllCrops() {
        return cropRepository.findAllByOrderByNameEnAsc().stream()
            .map(importService::toDto)
            .toList();
    }

    @Transactional
    public CropKnowledgeDto createCrop(CropUpsertRequest request) {
        if (cropRepository.existsByCropCodeIgnoreCase(request.getCropCode().trim())) {
            throw new BadRequestException("A crop with code '" + request.getCropCode().trim() + "' already exists.");
        }
        validateDurationAndPh(request);
        CropKnowledge saved = importService.upsertOne(request);
        return importService.toDto(saved);
    }

    @Transactional
    public CropKnowledgeDto updateCrop(UUID id, CropUpsertRequest request) {
        CropKnowledge existing = cropRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Crop entry not found."));
        validateDurationAndPh(request);
        request.setCropCode(existing.getCropCode());
        CropKnowledge saved = importService.upsertOne(request);
        return importService.toDto(saved);
    }

    @Transactional
    public void deleteCrop(UUID id) {
        CropKnowledge existing = cropRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Crop entry not found."));
        cropRepository.delete(existing);
    }

    @Transactional
    public int syncCuratedSeedDataset() {
        return importService.reimportSeedDataset();
    }

    @Transactional
    public int importBulk(List<CropUpsertRequest> requests) {
        for (CropUpsertRequest req : requests) {
            validateDurationAndPh(req);
        }
        return importService.upsertBatch(requests);
    }

    private void validateDurationAndPh(CropUpsertRequest req) {
        if (req.getDurationMinDays() > req.getDurationMaxDays()) {
            throw new BadRequestException("Minimum duration days cannot exceed maximum duration days.");
        }
        if (req.getMinPh() != null && req.getMaxPh() != null && req.getMinPh().compareTo(req.getMaxPh()) > 0) {
            throw new BadRequestException("Minimum soil pH cannot exceed maximum soil pH.");
        }
    }
}
