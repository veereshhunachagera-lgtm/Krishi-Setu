package com.krishisetu.integration;

import com.krishisetu.dto.PlantDiseaseScanResponse.CandidatePrediction;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Component
public class PlantDiseaseModelClient {

    public record InferenceHealthResult(
        boolean connected,
        String modelId,
        double confidenceThreshold,
        List<String> supportedCrops,
        String errorMessage
    ) {}

    public record InferencePredictionResult(
        String status,
        String modelId,
        String predictedLabel,
        Double confidence,
        String reason,
        List<CandidatePrediction> topCandidates
    ) {}

    private static final List<String> DEFAULT_SUPPORTED_CROPS = List.of(
        "apple", "bell-pepper", "blueberry", "cherry", "corn", "grape",
        "maize", "orange", "peach", "potato", "raspberry", "soybean",
        "squash", "strawberry", "tomato"
    );

    private final String inferenceBaseUrl;
    private final String inferenceApiKey;
    private final RestClient restClient;

    public PlantDiseaseModelClient(
        @Value("${krishisetu.plant-health.inference-url:}") String inferenceBaseUrl,
        @Value("${krishisetu.plant-health.inference-api-key:}") String inferenceApiKey
    ) {
        this.inferenceBaseUrl = inferenceBaseUrl != null ? inferenceBaseUrl.trim().replaceAll("/+$", "") : "";
        this.inferenceApiKey = inferenceApiKey != null ? inferenceApiKey.trim() : "";
        this.restClient = RestClient.builder().build();
    }

    public boolean isConfigured() {
        return !inferenceBaseUrl.isBlank();
    }

    @SuppressWarnings("unchecked")
    public InferenceHealthResult checkHealth() {
        if (!isConfigured()) {
            return new InferenceHealthResult(
                false,
                "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification",
                0.60,
                DEFAULT_SUPPORTED_CROPS,
                "Inference service URL is not configured (PLANT_DISEASE_INFERENCE_URL)."
            );
        }
        try {
            Map<String, Object> body = restClient.get()
                .uri(inferenceBaseUrl + "/health")
                .retrieve()
                .body(Map.class);
            if (body == null || !"UP".equalsIgnoreCase(String.valueOf(body.get("status")))) {
                return new InferenceHealthResult(
                    false,
                    "unknown",
                    0.60,
                    DEFAULT_SUPPORTED_CROPS,
                    "Configured inference service did not report UP status."
                );
            }
            String modelId = String.valueOf(body.getOrDefault("modelId", "configured-model"));
            double threshold = body.get("confidenceThreshold") instanceof Number n ? n.doubleValue() : 0.60;
            List<String> crops = body.get("supportedCrops") instanceof List<?> rawList
                ? rawList.stream().map(String::valueOf).toList()
                : DEFAULT_SUPPORTED_CROPS;
            return new InferenceHealthResult(true, modelId, threshold, crops, null);
        } catch (Exception ex) {
            return new InferenceHealthResult(
                false,
                "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification",
                0.60,
                DEFAULT_SUPPORTED_CROPS,
                "Could not reach plant disease inference service."
            );
        }
    }

    @SuppressWarnings("unchecked")
    public InferencePredictionResult predict(byte[] imageBytes, String filename, String mimeType, String cropCode) {
        if (!isConfigured()) {
            return new InferencePredictionResult(
                "MODEL_UNAVAILABLE",
                null,
                null,
                null,
                "Crop disease inference service is not connected (PLANT_DISEASE_INFERENCE_URL is unset).",
                Collections.emptyList()
            );
        }

        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        ByteArrayResource resource = new ByteArrayResource(imageBytes) {
            @Override
            public String getFilename() {
                return filename != null && !filename.isBlank() ? filename : "leaf.jpg";
            }
        };
        MediaType mediaType = mimeType != null && !mimeType.isBlank()
            ? MediaType.parseMediaType(mimeType)
            : MediaType.IMAGE_JPEG;
        builder.part("image", resource).contentType(mediaType);
        if (cropCode != null && !cropCode.isBlank()) {
            builder.part("cropCode", cropCode.trim().toLowerCase());
        }
        MultiValueMap<String, org.springframework.http.HttpEntity<?>> multipart = builder.build();

        try {
            var requestSpec = restClient.post()
                .uri(inferenceBaseUrl + "/predict")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(multipart);

            if (!inferenceApiKey.isBlank()) {
                requestSpec = requestSpec.header("X-API-Key", inferenceApiKey);
            }

            Map<String, Object> body = requestSpec.retrieve().body(Map.class);
            if (body == null) {
                return new InferencePredictionResult(
                    "MODEL_UNAVAILABLE",
                    null,
                    null,
                    null,
                    "Empty response from inference service.",
                    Collections.emptyList()
                );
            }

            String status = String.valueOf(body.getOrDefault("status", "MODEL_UNAVAILABLE"));
            String modelId = body.get("modelId") != null ? String.valueOf(body.get("modelId")) : null;
            String predictedLabel = body.get("predictedLabel") != null ? String.valueOf(body.get("predictedLabel")) : null;
            Double confidence = body.get("confidence") instanceof Number n ? n.doubleValue() : null;
            String reason = body.get("reason") != null ? String.valueOf(body.get("reason")) : null;

            List<CandidatePrediction> candidates = Collections.emptyList();
            if (body.get("topCandidates") instanceof List<?> rawCandidates) {
                candidates = rawCandidates.stream()
                    .filter(Map.class::isInstance)
                    .map(Map.class::cast)
                    .map(item -> new CandidatePrediction(
                        String.valueOf(item.getOrDefault("label", "")),
                        item.get("confidence") instanceof Number cn ? cn.doubleValue() : 0.0
                    ))
                    .toList();
            }

            return new InferencePredictionResult(status, modelId, predictedLabel, confidence, reason, candidates);
        } catch (Exception ex) {
            return new InferencePredictionResult(
                "MODEL_UNAVAILABLE",
                null,
                null,
                null,
                "Plant disease inference service could not be reached or failed during classification.",
                Collections.emptyList()
            );
        }
    }
}
