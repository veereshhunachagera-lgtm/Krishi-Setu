package com.krishisetu.integration;

import com.krishisetu.exception.UpstreamServiceException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Component
public class GeminiClient {

    private final String apiKey;
    private final String model;
    private final RestClient restClient;

    public GeminiClient(
        @Value("${krishisetu.ai.gemini-api-key:}") String apiKey,
        @Value("${krishisetu.ai.gemini-model:gemini-4-hydrogen}") String model
    ) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.model = model != null && !model.isBlank() ? model.trim() : "gemini-4-hydrogen";

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(6000);
        factory.setReadTimeout(25000);
        this.restClient = RestClient.builder().requestFactory(factory).build();
    }

    public boolean isConfigured() {
        return !apiKey.isBlank();
    }

    public String getModel() {
        return model;
    }

    @SuppressWarnings("unchecked")
    public String generateGroundedReply(String systemInstruction, String userPrompt) {
        if (!isConfigured()) {
            throw new UpstreamServiceException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "API_KEY_MISSING",
                "AI Farmer Assistant is unavailable because GEMINI_API_KEY is not configured on the backend server."
            );
        }

        String url = String.format(
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent",
            model
        );

        Map<String, Object> payload = Map.of(
            "systemInstruction", Map.of(
                "parts", List.of(Map.of("text", systemInstruction))
            ),
            "contents", List.of(
                Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text", userPrompt))
                )
            ),
            "generationConfig", Map.of(
                "thinkingConfig", Map.of("thinkingLevel", "LOW")
            )
        );

        try {
            Map<String, Object> body = restClient.post()
                .uri(url)
                .header("x-goog-api-key", apiKey)
                .header("User-Agent", "aistudio-build")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .body(Map.class);

            if (body == null || !(body.get("candidates") instanceof List<?> candidates) || candidates.isEmpty()) {
                throw new UpstreamServiceException(
                    HttpStatus.BAD_GATEWAY,
                    "UPSTREAM_ERROR",
                    "Gemini returned an empty response. Please retry."
                );
            }

            Object firstObj = candidates.get(0);
            if (!(firstObj instanceof Map<?, ?> first) || !(first.get("content") instanceof Map<?, ?> content)) {
                throw new UpstreamServiceException(
                    HttpStatus.BAD_GATEWAY,
                    "UPSTREAM_ERROR",
                    "Gemini returned an incomplete response candidate."
                );
            }

            if (!(content.get("parts") instanceof List<?> parts) || parts.isEmpty()) {
                throw new UpstreamServiceException(
                    HttpStatus.BAD_GATEWAY,
                    "UPSTREAM_ERROR",
                    "Gemini response did not contain text parts."
                );
            }

            StringBuilder sb = new StringBuilder();
            for (Object partObj : parts) {
                if (partObj instanceof Map<?, ?> part && part.get("text") instanceof String txt) {
                    if (!sb.isEmpty()) sb.append('\n');
                    sb.append(txt);
                }
            }

            String result = sb.toString().trim();
            if (result.isEmpty()) {
                throw new UpstreamServiceException(
                    HttpStatus.BAD_GATEWAY,
                    "UPSTREAM_ERROR",
                    "Gemini response text was blank."
                );
            }
            return result;
        } catch (HttpClientErrorException ex) {
            int code = ex.getStatusCode().value();
            if (code == 429) {
                throw new UpstreamServiceException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "QUOTA_EXHAUSTED",
                    "Gemini API rate or free-tier quota limit reached. Please retry after a short pause."
                );
            }
            if (code == 400 || code == 401 || code == 403) {
                throw new UpstreamServiceException(
                    HttpStatus.BAD_GATEWAY,
                    "API_KEY_INVALID",
                    "Configured GEMINI_API_KEY was rejected or permission denied by Gemini API."
                );
            }
            throw new UpstreamServiceException(
                HttpStatus.BAD_GATEWAY,
                "UPSTREAM_ERROR",
                "Gemini API returned HTTP " + code + "."
            );
        } catch (HttpServerErrorException ex) {
            if (ex.getStatusCode().value() == 503) {
                throw new UpstreamServiceException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "UPSTREAM_UNAVAILABLE",
                    "Gemini service is temporarily busy due to high demand. Please retry in a moment."
                );
            }
            throw new UpstreamServiceException(
                HttpStatus.BAD_GATEWAY,
                "UPSTREAM_ERROR",
                "Gemini API encountered a temporary server error (" + ex.getStatusCode().value() + ")."
            );
        } catch (ResourceAccessException ex) {
            throw new UpstreamServiceException(
                HttpStatus.GATEWAY_TIMEOUT,
                "UPSTREAM_TIMEOUT",
                "Timed out while reaching Gemini API. Please retry."
            );
        }
    }
}
