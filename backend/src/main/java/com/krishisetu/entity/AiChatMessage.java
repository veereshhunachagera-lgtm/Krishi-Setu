package com.krishisetu.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_chat_messages")
public class AiChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 20)
    private String role; // USER or ASSISTANT

    @Column(nullable = false, length = 10)
    private String language; // en or kn

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(length = 80)
    private String model;

    @Column(columnDefinition = "TEXT")
    private String groundedCropsJson;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getGroundedCropsJson() { return groundedCropsJson; }
    public void setGroundedCropsJson(String groundedCropsJson) { this.groundedCropsJson = groundedCropsJson; }

    public Instant getCreatedAt() { return createdAt; }
}
