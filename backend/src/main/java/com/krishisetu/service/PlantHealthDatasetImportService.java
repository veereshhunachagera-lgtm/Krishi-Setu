package com.krishisetu.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.krishisetu.dto.PestDiseaseAlertCreateRequest;
import com.krishisetu.dto.PestDiseaseAlertDto;
import com.krishisetu.dto.PlantProtectionGuideDto;
import com.krishisetu.entity.PestDiseaseAlert;
import com.krishisetu.entity.PlantProtectionGuide;
import com.krishisetu.repository.PestDiseaseAlertRepository;
import com.krishisetu.repository.PlantProtectionGuideRepository;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;
import java.util.List;

@Service
public class PlantHealthDatasetImportService {

    private final PestDiseaseAlertRepository alertRepository;
    private final PlantProtectionGuideRepository guideRepository;
    private final ObjectMapper objectMapper;

    public PlantHealthDatasetImportService(
        PestDiseaseAlertRepository alertRepository,
        PlantProtectionGuideRepository guideRepository,
        ObjectMapper objectMapper
    ) {
        this.alertRepository = alertRepository;
        this.guideRepository = guideRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void importDatasetsIfEmpty() {
        if (alertRepository.count() == 0) {
            reimportAlerts();
        }
        if (guideRepository.count() == 0) {
            reimportGuides();
        }
    }

    @Transactional
    public int reimportAlerts() {
        ClassPathResource resource = new ClassPathResource("data/plant_health_alerts_seed.json");
        try (InputStream is = resource.getInputStream()) {
            List<PestDiseaseAlertCreateRequest> items = objectMapper.readValue(
                is,
                new TypeReference<List<PestDiseaseAlertCreateRequest>>() {}
            );
            int count = 0;
            for (PestDiseaseAlertCreateRequest req : items) {
                upsertAlert(req);
                count++;
            }
            return count;
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to import plant health alerts seed dataset.", ex);
        }
    }

    @Transactional
    public int reimportGuides() {
        ClassPathResource resource = new ClassPathResource("data/plant_protection_guidance_seed.json");
        try (InputStream is = resource.getInputStream()) {
            List<PlantProtectionGuideDto> items = objectMapper.readValue(
                is,
                new TypeReference<List<PlantProtectionGuideDto>>() {}
            );
            int count = 0;
            for (PlantProtectionGuideDto item : items) {
                String code = item.getGuideCode().trim().toLowerCase();
                PlantProtectionGuide entity = guideRepository.findByGuideCodeIgnoreCase(code)
                    .orElseGet(PlantProtectionGuide::new);
                entity.setGuideCode(code);
                entity.setCropCode(item.getCropCode().trim().toLowerCase());
                entity.setCropNameEn(item.getCropNameEn());
                entity.setCropNameKn(item.getCropNameKn());
                entity.setIssueNameEn(item.getIssueNameEn());
                entity.setIssueNameKn(item.getIssueNameKn());
                entity.setIssueType(item.getIssueType());
                entity.setScientificName(item.getScientificName());
                entity.setFavorableConditionsEn(item.getFavorableConditionsEn());
                entity.setFavorableConditionsKn(item.getFavorableConditionsKn());
                entity.setSymptomsEnJson(writeJson(item.getSymptomsEn()));
                entity.setSymptomsKnJson(writeJson(item.getSymptomsKn()));
                entity.setPreventivePracticesEnJson(writeJson(item.getPreventivePracticesEn()));
                entity.setPreventivePracticesKnJson(writeJson(item.getPreventivePracticesKn()));
                entity.setResponsibleManagementEnJson(writeJson(item.getResponsibleManagementEn()));
                entity.setResponsibleManagementKnJson(writeJson(item.getResponsibleManagementKn()));
                entity.setSafetyNotesEn(item.getSafetyNotesEn());
                entity.setSafetyNotesKn(item.getSafetyNotesKn());
                entity.setDataReliability(item.getDataReliability() != null ? item.getDataReliability() : "CURATED_REFERENCE");
                entity.setSourceReference(item.getSourceReference());
                guideRepository.save(entity);
                count++;
            }
            return count;
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to import plant protection guidance seed dataset.", ex);
        }
    }

    @Transactional
    public PestDiseaseAlert upsertAlert(PestDiseaseAlertCreateRequest req) {
        String code = req.getAlertCode().trim().toLowerCase();
        PestDiseaseAlert alert = alertRepository.findByAlertCodeIgnoreCase(code)
            .orElseGet(PestDiseaseAlert::new);
        alert.setAlertCode(code);
        alert.setTitleEn(req.getTitleEn().trim());
        alert.setTitleKn(req.getTitleKn().trim());
        alert.setCropCode(req.getCropCode().trim().toLowerCase());
        alert.setCropNameEn(req.getCropNameEn().trim());
        alert.setCropNameKn(req.getCropNameKn().trim());
        alert.setState(req.getState().trim());
        alert.setDistrict(req.getDistrict() != null && !req.getDistrict().isBlank() ? req.getDistrict().trim() : null);
        alert.setVerificationStatus(req.getVerificationStatus().trim().toUpperCase());
        alert.setSeverity(req.getSeverity().trim().toUpperCase());
        alert.setObservedDate(req.getObservedDate().trim());
        alert.setValidUntil(req.getValidUntil() != null && !req.getValidUntil().isBlank() ? req.getValidUntil().trim() : null);
        alert.setSourceName(req.getSourceName().trim());
        alert.setSourceUrl(req.getSourceUrl() != null && !req.getSourceUrl().isBlank() ? req.getSourceUrl().trim() : null);
        alert.setSummaryEn(req.getSummaryEn().trim());
        alert.setSummaryKn(req.getSummaryKn().trim());
        alert.setPrecautionsEnJson(writeJson(req.getPrecautionsEn()));
        alert.setPrecautionsKnJson(writeJson(req.getPrecautionsKn()));
        alert.setActive(req.isActive());
        return alertRepository.save(alert);
    }

    public PestDiseaseAlertDto toAlertDto(PestDiseaseAlert entity) {
        PestDiseaseAlertDto dto = new PestDiseaseAlertDto();
        dto.setId(entity.getId());
        dto.setAlertCode(entity.getAlertCode());
        dto.setTitleEn(entity.getTitleEn());
        dto.setTitleKn(entity.getTitleKn());
        dto.setCropCode(entity.getCropCode());
        dto.setCropNameEn(entity.getCropNameEn());
        dto.setCropNameKn(entity.getCropNameKn());
        dto.setState(entity.getState());
        dto.setDistrict(entity.getDistrict());
        dto.setVerificationStatus(entity.getVerificationStatus());
        dto.setSeverity(entity.getSeverity());
        dto.setObservedDate(entity.getObservedDate());
        dto.setValidUntil(entity.getValidUntil());
        dto.setSourceName(entity.getSourceName());
        dto.setSourceUrl(entity.getSourceUrl());
        dto.setSummaryEn(entity.getSummaryEn());
        dto.setSummaryKn(entity.getSummaryKn());
        dto.setPrecautionsEn(readList(entity.getPrecautionsEnJson()));
        dto.setPrecautionsKn(readList(entity.getPrecautionsKnJson()));
        dto.setActive(entity.isActive());
        return dto;
    }

    public PlantProtectionGuideDto toGuideDto(PlantProtectionGuide entity) {
        PlantProtectionGuideDto dto = new PlantProtectionGuideDto();
        dto.setId(entity.getId());
        dto.setGuideCode(entity.getGuideCode());
        dto.setCropCode(entity.getCropCode());
        dto.setCropNameEn(entity.getCropNameEn());
        dto.setCropNameKn(entity.getCropNameKn());
        dto.setIssueNameEn(entity.getIssueNameEn());
        dto.setIssueNameKn(entity.getIssueNameKn());
        dto.setIssueType(entity.getIssueType());
        dto.setScientificName(entity.getScientificName());
        dto.setFavorableConditionsEn(entity.getFavorableConditionsEn());
        dto.setFavorableConditionsKn(entity.getFavorableConditionsKn());
        dto.setSymptomsEn(readList(entity.getSymptomsEnJson()));
        dto.setSymptomsKn(readList(entity.getSymptomsKnJson()));
        dto.setPreventivePracticesEn(readList(entity.getPreventivePracticesEnJson()));
        dto.setPreventivePracticesKn(readList(entity.getPreventivePracticesKnJson()));
        dto.setResponsibleManagementEn(readList(entity.getResponsibleManagementEnJson()));
        dto.setResponsibleManagementKn(readList(entity.getResponsibleManagementKnJson()));
        dto.setSafetyNotesEn(entity.getSafetyNotesEn());
        dto.setSafetyNotesKn(entity.getSafetyNotesKn());
        dto.setDataReliability(entity.getDataReliability());
        dto.setSourceReference(entity.getSourceReference());
        return dto;
    }

    private String writeJson(List<String> list) {
        try {
            return objectMapper.writeValueAsString(list != null ? list : Collections.emptyList());
        } catch (JsonProcessingException ex) {
            return "[]";
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
}
