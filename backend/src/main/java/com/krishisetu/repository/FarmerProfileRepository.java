package com.krishisetu.repository;

import com.krishisetu.entity.FarmerProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface FarmerProfileRepository extends JpaRepository<FarmerProfile, UUID> {
    Optional<FarmerProfile> findByUserId(UUID userId);
    long countByHasSoilReportTrue();
    long countByHasSoilReportFalse();
}
