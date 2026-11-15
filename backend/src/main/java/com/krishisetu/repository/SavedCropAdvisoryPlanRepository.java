package com.krishisetu.repository;

import com.krishisetu.entity.SavedCropAdvisoryPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SavedCropAdvisoryPlanRepository extends JpaRepository<SavedCropAdvisoryPlan, UUID> {
    List<SavedCropAdvisoryPlan> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<SavedCropAdvisoryPlan> findByIdAndUserId(UUID id, UUID userId);
}
