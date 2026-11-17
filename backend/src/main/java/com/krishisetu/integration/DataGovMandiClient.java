package com.krishisetu.integration;

import com.krishisetu.entity.MandiPriceRecord;
import com.krishisetu.exception.UpstreamServiceException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class DataGovMandiClient {

    private static final Pattern DMY_PATTERN = Pattern.compile("^(\\d{1,2})[/-](\\d{1,2})[/-](\\d{4})$");
    private static final Pattern YMD_PATTERN = Pattern.compile("^(\\d{4})[/-](\\d{1,2})[/-](\\d{1,2})$");

    public record LiveMandiResult(List<MandiPriceRecord> records, int totalAvailable, Instant fetchedAt) {}

    private final String apiKey;
    private final String mandiResourceId;
    private final String historyResourceId;
    private final String baseUrl;
    private final RestClient restClient;

    public DataGovMandiClient(
        @Value("${krishisetu.market-weather.data-gov-api-key:}") String apiKey,
        @Value("${krishisetu.market-weather.mandi-resource-id:9ef84268-d588-465a-a308-a864a43d0070}") String mandiResourceId,
        @Value("${krishisetu.market-weather.history-resource-id:35985678-0d79-46b4-9ed6-6f13308a1d24}") String historyResourceId,
        @Value("${krishisetu.market-weather.data-gov-base-url:https://api.data.gov.in/resource}") String baseUrl
    ) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.mandiResourceId = mandiResourceId != null && !mandiResourceId.isBlank()
            ? mandiResourceId.trim()
            : "9ef84268-d588-465a-a308-a864a43d0070";
        this.historyResourceId = historyResourceId != null && !historyResourceId.isBlank()
            ? historyResourceId.trim()
            : "35985678-0d79-46b4-9ed6-6f13308a1d24";
        this.baseUrl = baseUrl != null ? baseUrl.trim().replaceAll("/+$", "") : "https://api.data.gov.in/resource";

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(5000);
        requestFactory.setReadTimeout(9000);
        this.restClient = RestClient.builder().requestFactory(requestFactory).build();
    }

    public boolean isConfigured() {
        return !apiKey.isBlank();
    }

    public String getMandiResourceId() {
        return mandiResourceId;
    }

    public String getHistoryResourceId() {
        return historyResourceId;
    }

    public LiveMandiResult fetchDailyPrices(String commodity, String state, String district, String market, int limit, int offset) {
        return queryResource(mandiResourceId, commodity, state, district, market, limit, offset);
    }

    public LiveMandiResult fetchHistoricalPrices(String commodity, String state, String district, String market) {
        return queryResource(historyResourceId, commodity, state, district, market, 100, 0);
    }

    @SuppressWarnings("unchecked")
    private LiveMandiResult queryResource(
        String resourceId,
        String commodity,
        String state,
        String district,
        String market,
        int limit,
        int offset
    ) {
        if (!isConfigured()) {
            throw new UpstreamServiceException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "API_KEY_MISSING",
                "DATA_GOV_IN_API_KEY is not configured."
            );
        }

        UriComponentsBuilder builder = UriComponentsBuilder
            .fromHttpUrl(baseUrl + "/" + resourceId)
            .queryParam("api-key", apiKey)
            .queryParam("format", "json")
            .queryParam("limit", Math.min(Math.max(limit, 1), 100))
            .queryParam("offset", Math.max(offset, 0));

        if (state != null && !state.isBlank()) builder.queryParam("filters[state]", state.trim());
        if (district != null && !district.isBlank()) builder.queryParam("filters[district]", district.trim());
        if (market != null && !market.isBlank()) builder.queryParam("filters[market]", market.trim());
        if (commodity != null && !commodity.isBlank()) builder.queryParam("filters[commodity]", commodity.trim());

        try {
            Map<String, Object> body = restClient.get()
                .uri(builder.build().encode().toUri())
                .retrieve()
                .body(Map.class);

            if (body == null) {
                throw new UpstreamServiceException(HttpStatus.BAD_GATEWAY, "UPSTREAM_ERROR", "Empty response from data.gov.in.");
            }
            if ("error".equalsIgnoreCase(String.valueOf(body.get("status")))) {
                throw new UpstreamServiceException(
                    HttpStatus.BAD_GATEWAY,
                    "UPSTREAM_ERROR",
                    String.valueOf(body.getOrDefault("message", "data.gov.in upstream error."))
                );
            }

            Instant fetchedAt = Instant.now();
            List<MandiPriceRecord> records = new ArrayList<>();
            if (body.get("records") instanceof List<?> rawList) {
                for (Object item : rawList) {
                    if (item instanceof Map<?, ?> row) {
                        MandiPriceRecord mapped = mapRow(row, resourceId, fetchedAt);
                        if (mapped != null) records.add(mapped);
                    }
                }
            }

            int total = records.size();
            Object rawTotal = body.get("total") != null ? body.get("total") : body.get("count");
            if (rawTotal != null) {
                try {
                    total = Integer.parseInt(String.valueOf(rawTotal));
                } catch (NumberFormatException ignored) {}
            }
            return new LiveMandiResult(records, total, fetchedAt);
        } catch (HttpClientErrorException.TooManyRequests ex) {
            throw new UpstreamServiceException(
                HttpStatus.TOO_MANY_REQUESTS,
                "RATE_LIMITED",
                "data.gov.in API rate limit reached. Please retry shortly."
            );
        } catch (HttpClientErrorException.Unauthorized | HttpClientErrorException.Forbidden ex) {
            throw new UpstreamServiceException(
                HttpStatus.BAD_GATEWAY,
                "UPSTREAM_ERROR",
                "Configured DATA_GOV_IN_API_KEY was rejected by data.gov.in."
            );
        } catch (ResourceAccessException ex) {
            throw new UpstreamServiceException(
                HttpStatus.GATEWAY_TIMEOUT,
                "UPSTREAM_TIMEOUT",
                "Timed out or network unreachable while contacting data.gov.in."
            );
        } catch (UpstreamServiceException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new UpstreamServiceException(
                HttpStatus.BAD_GATEWAY,
                "UPSTREAM_ERROR",
                "Failed to fetch data.gov.in mandi quotes: " + ex.getMessage()
            );
        }
    }

    public static String normalizeDate(String raw) {
        if (raw == null || raw.isBlank()) return "";
        String trimmed = raw.trim();
        Matcher dmy = DMY_PATTERN.matcher(trimmed);
        if (dmy.matches()) {
            return String.format("%s-%02d-%02d", dmy.group(3), Integer.parseInt(dmy.group(2)), Integer.parseInt(dmy.group(1)));
        }
        Matcher ymd = YMD_PATTERN.matcher(trimmed);
        if (ymd.matches()) {
            return String.format("%s-%02d-%02d", ymd.group(1), Integer.parseInt(ymd.group(2)), Integer.parseInt(ymd.group(3)));
        }
        return trimmed;
    }

    private MandiPriceRecord mapRow(Map<?, ?> row, String resourceId, Instant fetchedAt) {
        String commodity = str(row, "commodity", "Commodity");
        String market = str(row, "market", "Market");
        if (commodity.isBlank() || market.isBlank()) return null;

        String rawDate = str(row, "arrival_date", "Arrival_Date");
        String isoDate = normalizeDate(rawDate);
        if (isoDate.isBlank()) {
            isoDate = fetchedAt.toString().substring(0, 10);
        }

        MandiPriceRecord record = new MandiPriceRecord();
        record.setCommodity(commodity);
        String variety = str(row, "variety", "Variety");
        record.setVariety(variety.isBlank() ? "Other" : variety);
        String grade = str(row, "grade", "Grade");
        record.setGrade(grade.isBlank() ? "FAQ" : grade);
        record.setState(str(row, "state", "State"));
        record.setDistrict(str(row, "district", "District"));
        record.setMarket(market);
        record.setMinPrice(dbl(row, "min_price", "Min_Price"));
        record.setMaxPrice(dbl(row, "max_price", "Max_Price"));
        record.setModalPrice(dbl(row, "modal_price", "Modal_Price"));
        record.setUnit("INR / Quintal");
        record.setArrivalDate(isoDate);
        record.setReportedDateRaw(rawDate.isBlank() ? isoDate : rawDate);
        record.setSourceName("data.gov.in · Agmarknet OGD API");
        record.setResourceId(resourceId);
        record.setFetchedAt(fetchedAt);
        return record;
    }

    private String str(Map<?, ?> row, String key1, String key2) {
        Object val = row.containsKey(key1) ? row.get(key1) : row.get(key2);
        return val == null ? "" : String.valueOf(val).trim();
    }

    private Double dbl(Map<?, ?> row, String key1, String key2) {
        String s = str(row, key1, key2);
        if (s.isBlank()) return null;
        try {
            double v = Double.parseDouble(s);
            return Double.isFinite(v) ? v : null;
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
