package com.krishisetu.repository;

import com.krishisetu.entity.AiChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AiChatMessageRepository extends JpaRepository<AiChatMessage, UUID> {
    List<AiChatMessage> findByUserIdOrderByCreatedAtAsc(UUID userId);
    void deleteByUserId(UUID userId);
}
