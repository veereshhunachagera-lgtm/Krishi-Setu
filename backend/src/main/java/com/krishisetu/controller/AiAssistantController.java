package com.krishisetu.controller;

import com.krishisetu.dto.AiAssistantDtos.*;
import com.krishisetu.security.AuthenticatedUser;
import com.krishisetu.service.AiAssistantService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ai-assistant")
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;

    public AiAssistantController(AiAssistantService aiAssistantService) {
        this.aiAssistantService = aiAssistantService;
    }

    @GetMapping("/status")
    public AiAssistantStatusResponse getStatus() {
        return aiAssistantService.getStatus();
    }

    @GetMapping("/messages")
    public List<AiChatMessageDto> getHistory(@AuthenticationPrincipal AuthenticatedUser user) {
        return aiAssistantService.getHistory(user.getId());
    }

    @PostMapping("/chat")
    public ResponseEntity<AiChatExchangeResponse> chat(
        @AuthenticationPrincipal AuthenticatedUser user,
        @Valid @RequestBody AiChatRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(aiAssistantService.chat(user.getId(), request));
    }

    @DeleteMapping("/messages")
    public ResponseEntity<Void> clearHistory(@AuthenticationPrincipal AuthenticatedUser user) {
        aiAssistantService.clearHistory(user.getId());
        return ResponseEntity.noContent().build();
    }
}
