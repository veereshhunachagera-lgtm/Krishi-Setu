package com.krishisetu.repository;

import com.krishisetu.entity.EquipmentBookingRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EquipmentBookingRequestRepository extends JpaRepository<EquipmentBookingRequest, UUID> {
    List<EquipmentBookingRequest> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<EquipmentBookingRequest> findByIdAndUserId(UUID id, UUID userId);
    List<EquipmentBookingRequest> findAllByOrderByCreatedAtDesc();
}
