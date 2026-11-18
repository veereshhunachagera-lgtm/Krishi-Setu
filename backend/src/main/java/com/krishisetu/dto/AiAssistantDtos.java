package com.krishisetu.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class AiAssistantDtos {

    private AiAssistantDtos() {}

    public record GroundedCropRef(
        String cropCode,
        String nameEn,
        String nameKn,
        String sourceReference
    ) {}

    public record AiAssistantStatusResponse(
        boolean configured,
        String provider,
        String model,
        List<String> supportedLanguages,
        String freeTierTermsEn,
        String freeTierTermsKn,
        List<String> setupInstructionsEn,
        List<String> setupInstructionsKn,
        String safetyScopeEn,
        String safetyScopeKn
    ) {}

    public record AiChatRequest(
        @NotBlank(message = "Please enter a farming question.") @Size(max = 1500) String message,
        String language
    ) {}

    public record AiChatMessageDto(
        UUID id,
        UUID userId,
        String role,
        String language,
        String content,
        String model,
        List<GroundedCropRef> groundedCrops,
        Instant createdAt
    ) {}

    public record AiChatExchangeResponse(
        AiChatMessageDto userMessage,
        AiChatMessageDto assistantMessage
    ) {}
}
