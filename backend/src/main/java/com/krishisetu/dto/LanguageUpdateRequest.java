package com.krishisetu.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record LanguageUpdateRequest(
    @NotBlank
    @Pattern(regexp = "^(en|kn)$", message = "Supported languages in Phase 1 are en and kn")
    String preferredLanguage
) {}
