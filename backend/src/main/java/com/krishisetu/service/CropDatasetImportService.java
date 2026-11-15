package com.krishisetu.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.krishisetu.dto.CropKnowledgeDto;
import com.krishisetu.dto.CropUpsertRequest;
import com.krishisetu.entity.CropKnowledge;
import com.krishisetu.exception.BadRequestException;
import com.krishisetu.repository.CropKnowledgeRepository;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class CropDatasetImportService {

    private final CropKnowledgeRepository cropRepository;
    private final ObjectMapper objectMapper;

    public CropDatasetImportService(CropKnowledgeRepository cropRepository, ObjectMapper objectMapper) {
        this.cropRepository = cropRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public int importSeedDatasetIfEmpty() {
        if (cropRepository.count() > 0) {
            return 0;
        }
        return reimportSeedDataset();
    }

    @Transactional
    public int reimportSeedDataset() {
        ClassPathResource resource = new ClassPathResource("data/crop_soil_knowledge_seed.json");
        try (InputStream is = resource.getInputStream()) {
            List<CropUpsertRequest> records = objectMapper.readValue(
                is,
                new TypeReference<List<CropUpsertRequest>>() {}
            );
            return upsertBatch(records);
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to import crop knowledge seed dataset.", ex);
        }
    }

    @Transactional
    public int upsertBatch(List<CropUpsertRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new BadRequestException("Dataset import payload cannot be empty.");
        }
        int processed = 0;
        for (CropUpsertRequest req : requests) {
            upsertOne(req);
            processed++;
        }
        return processed;
    }

    @Transactional
    public CropKnowledge upsertOne(CropUpsertRequest req) {
        String normalizedCode = req.getCropCode().trim().toLowerCase();
        CropKnowledge entity = cropRepository.findByCropCodeIgnoreCase(normalizedCode)
            .orElseGet(CropKnowledge::new);

        entity.setCropCode(normalizedCode);
        entity.setNameEn(req.getNameEn().trim());
        entity.setNameKn(req.getNameKn().trim());
        entity.setScientificName(req.getScientificName() != null ? req.getScientificName().trim() : null);
        entity.setCropCategory(req.getCropCategory().trim().toUpperCase());
        entity.setSuitableSoils(req.getSuitableSoils() != null ? new ArrayList<>(req.getSuitableSoils()) : new ArrayList<>());
        entity.setSeasons(req.getSeasons() != null ? new ArrayList<>(req.getSeasons()) : new ArrayList<>());
        entity.setWaterRequirement(req.getWaterRequirement().trim().toUpperCase());
        entity.setWaterNotesEn(req.getWaterNotesEn());
        entity.setWaterNotesKn(req.getWaterNotesKn());
        entity.setMinPh(req.getMinPh());
        entity.setMaxPh(req.getMaxPh());
        entity.setNitrogenDemand(req.getNitrogenDemand());
        entity.setPhosphorusDemand(req.getPhosphorusDemand());
        entity.setPotassiumDemand(req.getPotassiumDemand());
        entity.setNitrogenFixing(req.isNitrogenFixing());
        entity.setDurationMinDays(req.getDurationMinDays());
        entity.setDurationMaxDays(req.getDurationMaxDays());
        entity.setTempMinC(req.getTempMinC());
        entity.setTempMaxC(req.getTempMaxC());
        entity.setRainfallMinMm(req.getRainfallMinMm());
        entity.setRainfallMaxMm(req.getRainfallMaxMm());
        entity.setClimateNoteEn(req.getClimateNoteEn());
        entity.setClimateNoteKn(req.getClimateNoteKn());
        entity.setSupportedStates(req.getSupportedStates() != null ? new ArrayList<>(req.getSupportedStates()) : new ArrayList<>());
        entity.setSupportedDistricts(req.getSupportedDistricts() != null ? new ArrayList<>(req.getSupportedDistricts()) : new ArrayList<>());
        entity.setAdvantagesEnJson(writeJson(req.getAdvantagesEn() != null ? req.getAdvantagesEn() : Collections.emptyList()));
        entity.setAdvantagesKnJson(writeJson(req.getAdvantagesKn() != null ? req.getAdvantagesKn() : Collections.emptyList()));
        entity.setRisksEnJson(writeJson(req.getRisksEn() != null ? req.getRisksEn() : Collections.emptyList()));
        entity.setRisksKnJson(writeJson(req.getRisksKn() != null ? req.getRisksKn() : Collections.emptyList()));
        entity.setRotationalBenefitsEn(req.getRotationalBenefitsEn());
        entity.setRotationalBenefitsKn(req.getRotationalBenefitsKn());
        entity.setGrowingGuidanceEnJson(writeJson(req.getGrowingGuidanceEn() != null ? req.getGrowingGuidanceEn() : new CropKnowledgeDto.GrowingGuidanceDto()));
        entity.setGrowingGuidanceKnJson(writeJson(req.getGrowingGuidanceKn() != null ? req.getGrowingGuidanceKn() : new CropKnowledgeDto.GrowingGuidanceDto()));
        entity.setCommonPestsJson(writeJson(req.getCommonPests() != null ? req.getCommonPests() : Collections.emptyList()));
        entity.setDataReliability(req.getDataReliability() != null ? req.getDataReliability().trim().toUpperCase() : "CURATED_REFERENCE");
        entity.setSourceReference(req.getSourceReference());

        return cropRepository.save(entity);
    }

    public CropKnowledgeDto toDto(CropKnowledge entity) {
        CropKnowledgeDto dto = new CropKnowledgeDto();
        dto.setId(entity.getId());
        dto.setCropCode(entity.getCropCode());
        dto.setNameEn(entity.getNameEn());
        dto.setNameKn(entity.getNameKn());
        dto.setScientificName(entity.getScientificName());
        dto.setCropCategory(entity.getCropCategory());
        dto.setSuitableSoils(entity.getSuitableSoils());
        dto.setSeasons(entity.getSeasons());
        dto.setWaterRequirement(entity.getWaterRequirement());
        dto.setWaterNotesEn(entity.getWaterNotesEn());
        dto.setWaterNotesKn(entity.getWaterNotesKn());
        dto.setMinPh(entity.getMinPh());
        dto.setMaxPh(entity.getMaxPh());
        dto.setNitrogenDemand(entity.getNitrogenDemand());
        dto.setPhosphorusDemand(entity.getPhosphorusDemand());
        dto.setPotassiumDemand(entity.getPotassiumDemand());
        dto.setNitrogenFixing(entity.isNitrogenFixing());
        dto.setDurationMinDays(entity.getDurationMinDays());
        dto.setDurationMaxDays(entity.getDurationMaxDays());
        dto.setTempMinC(entity.getTempMinC());
        dto.setTempMaxC(entity.getTempMaxC());
        dto.setRainfallMinMm(entity.getRainfallMinMm());
        dto.setRainfallMaxMm(entity.getRainfallMaxMm());
        dto.setClimateNoteEn(entity.getClimateNoteEn());
        dto.setClimateNoteKn(entity.getClimateNoteKn());
        dto.setSupportedStates(entity.getSupportedStates());
        dto.setSupportedDistricts(entity.getSupportedDistricts());
        dto.setAdvantagesEn(readList(entity.getAdvantagesEnJson()));
        dto.setAdvantagesKn(readList(entity.getAdvantagesKnJson()));
        dto.setRisksEn(readList(entity.getRisksEnJson()));
        dto.setRisksKn(readList(entity.getRisksKnJson()));
        dto.setRotationalBenefitsEn(entity.getRotationalBenefitsEn());
        dto.setRotationalBenefitsKn(entity.getRotationalBenefitsKn());
        dto.setGrowingGuidanceEn(readGuidance(entity.getGrowingGuidanceEnJson()));
        dto.setGrowingGuidanceKn(readGuidance(entity.getGrowingGuidanceKnJson()));
        dto.setCommonPests(readPests(entity.getCommonPestsJson()));
        dto.setDataReliability(entity.getDataReliability());
        dto.setSourceReference(entity.getSourceReference());
        return dto;
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize crop metadata JSON.", ex);
        }
    }

    private List<String> readList(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (IOException ex) {
            return Collections.emptyList();
        }
    }

    private CropKnowledgeDto.GrowingGuidanceDto readGuidance(String json) {
        if (json == null || json.isBlank()) return new CropKnowledgeDto.GrowingGuidanceDto();
        try {
            return objectMapper.readValue(json, CropKnowledgeDto.GrowingGuidanceDto.class);
        } catch (IOException ex) {
            return new CropKnowledgeDto.GrowingGuidanceDto();
        }
    }

    private List<CropKnowledgeDto.CommonPestDto> readPests(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<CropKnowledgeDto.CommonPestDto>>() {});
        } catch (IOException ex) {
            return Collections.emptyList();
        }
    }
}
