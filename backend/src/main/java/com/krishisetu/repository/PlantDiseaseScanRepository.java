package com.krishisetu.repository;

import com.krishisetu.entity.PlantDiseaseScan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PlantDiseaseScanRepository extends JpaRepository<PlantDiseaseScan, UUID> {
    List<PlantDiseaseScan> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
