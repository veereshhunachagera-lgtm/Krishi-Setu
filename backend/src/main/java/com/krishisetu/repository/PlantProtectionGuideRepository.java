package com.krishisetu.repository;

import com.krishisetu.entity.PlantProtectionGuide;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlantProtectionGuideRepository extends JpaRepository<PlantProtectionGuide, UUID> {
    Optional<PlantProtectionGuide> findByGuideCodeIgnoreCase(String guideCode);
    List<PlantProtectionGuide> findAllByOrderByCropNameEnAsc();
}
