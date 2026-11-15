package com.krishisetu.repository;

import com.krishisetu.entity.CropKnowledge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CropKnowledgeRepository extends JpaRepository<CropKnowledge, UUID> {
    Optional<CropKnowledge> findByCropCodeIgnoreCase(String cropCode);
    boolean existsByCropCodeIgnoreCase(String cropCode);
    List<CropKnowledge> findAllByOrderByNameEnAsc();
}
