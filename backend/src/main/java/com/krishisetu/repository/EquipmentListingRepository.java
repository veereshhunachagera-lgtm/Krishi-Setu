package com.krishisetu.repository;

import com.krishisetu.entity.EquipmentListing;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EquipmentListingRepository extends JpaRepository<EquipmentListing, UUID> {
    List<EquipmentListing> findByActiveTrueOrderByEquipmentNameEnAsc();
    boolean existsByListingCodeIgnoreCase(String listingCode);
}
