package com.krishisetu.service;

import com.krishisetu.dto.MandiPriceIngestRequest;
import com.krishisetu.dto.MandiPricesResponse;
import com.krishisetu.dto.MandiPricesResponse.AvailableFilters;
import com.krishisetu.dto.MandiPricesResponse.MandiPriceDto;
import com.krishisetu.dto.PriceTrendsResponse;
import com.krishisetu.dto.PriceTrendsResponse.DateRange;
import com.krishisetu.dto.PriceTrendsResponse.MarketOption;
import com.krishisetu.dto.PriceTrendsResponse.TrendPoint;
import com.krishisetu.dto.PriceTrendsResponse.TrendSummary;
import com.krishisetu.dto.SmartAlertsResponse;
import com.krishisetu.dto.SmartAlertsResponse.SmartAlertItem;
import com.krishisetu.dto.WeatherForecastResponse;
import com.krishisetu.dto.WeatherForecastResponse.*;
import com.krishisetu.entity.FarmerProfile;
import com.krishisetu.entity.MandiPriceRecord;
import com.krishisetu.entity.PestDiseaseAlert;
import com.krishisetu.exception.BadRequestException;
import com.krishisetu.exception.UpstreamServiceException;
import com.krishisetu.integration.DataGovMandiClient;
import com.krishisetu.integration.OpenMeteoClient;
import com.krishisetu.repository.FarmerProfileRepository;
import com.krishisetu.repository.MandiPriceRecordRepository;
import com.krishisetu.repository.PestDiseaseAlertRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Service
public class MarketWeatherService {

    private static final String DATA_GOV_CATALOG_URL =
        "https://data.gov.in/catalog/current-daily-price-various-commodities-various-markets-mandi";

    private final DataGovMandiClient dataGovClient;
    private final OpenMeteoClient openMeteoClient;
    private final MandiPriceRecordRepository mandiRepository;
    private final FarmerProfileRepository profileRepository;
    private final PestDiseaseAlertRepository pestAlertRepository;

    public MarketWeatherService(
        DataGovMandiClient dataGovClient,
        OpenMeteoClient openMeteoClient,
        MandiPriceRecordRepository mandiRepository,
        FarmerProfileRepository profileRepository,
        PestDiseaseAlertRepository pestAlertRepository
    ) {
        this.dataGovClient = dataGovClient;
        this.openMeteoClient = openMeteoClient;
        this.mandiRepository = mandiRepository;
        this.profileRepository = profileRepository;
        this.pestAlertRepository = pestAlertRepository;
    }

    @Transactional
    public MandiPricesResponse getMandiPrices(
        String commodity,
        String state,
        String district,
        String market,
        String q,
        int limit,
        int offset
    ) {
        String resourceId = dataGovClient.getMandiResourceId();
        String guideEn = "Set DATA_GOV_IN_API_KEY in the backend environment (register free at https://data.gov.in/) to stream live Agmarknet daily arrivals for resource " + resourceId + ".";
        String guideKn = "ನೇರ ಎಜಿಮಾರ್ಕ್‌ನೆಟ್ (Agmarknet) ಮಂಡಿ ಬೆಲೆಗಳನ್ನು ಪಡೆಯಲು ಬ್ಯಾಕ್‌ಎಂಡ್ ಪರಿಸರದಲ್ಲಿ DATA_GOV_IN_API_KEY ಅನ್ನು ಹೊಂದಿಸಿ (ಸಂಪನ್ಮೂಲ ID: " + resourceId + ").";

        List<MandiPriceRecord> allStored = mandiRepository.findAllByOrderByArrivalDateDesc();

        if (!dataGovClient.isConfigured()) {
            List<MandiPriceDto> filteredStored = filterRecords(allStored, commodity, state, district, market, q)
                .stream().map(this::toDto).toList();
            String msgEn = !filteredStored.isEmpty()
                ? "Live data.gov.in API key is not configured on the server. Displaying only previously verified or admin-imported Agmarknet records stored in PostgreSQL."
                : "Live Mandi Market Prices are currently unavailable because DATA_GOV_IN_API_KEY is not configured on the backend server. KrishiSetu never substitutes fabricated market prices.";
            String msgKn = !filteredStored.isEmpty()
                ? "ಬ್ಯಾಕ್‌ಎಂಡ್ ಸರ್ವರ್‌ನಲ್ಲಿ data.gov.in API ಕೀ ಹೊಂದಿಸಲಾಗಿಲ್ಲ. ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಸಂಗ್ರಹಿಸಿರುವ ಪರಿಶೀಲಿತ ದಾಖಲೆಗಳನ್ನು ಮಾತ್ರ ತೋರಿಸಲಾಗುತ್ತಿದೆ."
                : "ಬ್ಯಾಕ್‌ಎಂಡ್ ಸರ್ವರ್‌ನಲ್ಲಿ DATA_GOV_IN_API_KEY ಹೊಂದಿಸದ ಕಾರಣ ನೇರ ಮಂಡಿ ದರಗಳು ಪ್ರಸ್ತುತ ಲಭ್ಯವಿಲ್ಲ. ಕೃಷಿಸೇತು ನಕಲಿ ಬೆಲೆಗಳನ್ನು ತೋರಿಸುವುದಿಲ್ಲ.";

            return new MandiPricesResponse(
                "API_KEY_MISSING",
                false,
                "data.gov.in (OGD Platform India · Agmarknet)",
                DATA_GOV_CATALOG_URL,
                resourceId,
                filteredStored.isEmpty() ? null : filteredStored.get(0).fetchedAt(),
                filteredStored.size(),
                filteredStored,
                buildFacets(allStored),
                msgEn,
                msgKn,
                guideEn,
                guideKn
            );
        }

        try {
            var live = dataGovClient.fetchDailyPrices(commodity, state, district, market, limit, offset);
            List<MandiPriceRecord> persisted = upsertAll(live.records());
            List<MandiPriceRecord> display = (q != null && !q.isBlank())
                ? filterRecords(persisted, null, null, null, null, q)
                : persisted;

            List<MandiPriceRecord> facetPool = new ArrayList<>(persisted);
            facetPool.addAll(allStored);

            List<MandiPriceDto> dtoList = display.stream().map(this::toDto).toList();
            return new MandiPricesResponse(
                "LIVE_OK",
                true,
                "data.gov.in · Agmarknet OGD API",
                DATA_GOV_CATALOG_URL,
                resourceId,
                live.fetchedAt().toString(),
                (q != null && !q.isBlank()) ? dtoList.size() : live.totalAvailable(),
                dtoList,
                buildFacets(facetPool),
                !dtoList.isEmpty()
                    ? "Showing " + dtoList.size() + " Agmarknet market records retrieved live from data.gov.in."
                    : "Connected to data.gov.in, but no Agmarknet arrivals matched the selected filters.",
                !dtoList.isEmpty()
                    ? "data.gov.in ನಿಂದ ನೇರವಾಗಿ ಪಡೆದ " + dtoList.size() + " ಮಂಡಿ ಬೆಲೆ ದಾಖಲೆಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ."
                    : "data.gov.in ಸಂಪರ್ಕಗೊಂಡಿದೆ, ಆದರೆ ಆಯ್ದ ಫಿಲ್ಟರ್‌ಗಳಿಗೆ ಯಾವುದೇ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ.",
                guideEn,
                guideKn
            );
        } catch (UpstreamServiceException ex) {
            return new MandiPricesResponse(
                ex.getErrorCode(),
                true,
                "data.gov.in · Agmarknet OGD API",
                DATA_GOV_CATALOG_URL,
                resourceId,
                null,
                0,
                List.of(),
                buildFacets(allStored),
                "Unable to load live mandi prices from data.gov.in (" + ex.getMessage() + "). No simulated prices were substituted.",
                "data.gov.in ನಿಂದ ನೇರ ಮಂಡಿ ದರಗಳನ್ನು ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ (" + ex.getMessage() + "). ಯಾವುದೇ ನಕಲಿ ಬೆಲೆಗಳನ್ನು ತೋರಿಸಲಾಗಿಲ್ಲ.",
                guideEn,
                guideKn
            );
        }
    }

    @Transactional
    public PriceTrendsResponse getPriceTrends(
        String commodity,
        String market,
        String district,
        String state,
        Integer days
    ) {
        String apiNote = "";
        String reqCommodity = commodity != null ? commodity.trim() : "";
        if (dataGovClient.isConfigured() && !reqCommodity.isBlank()) {
            try {
                var hist = dataGovClient.fetchHistoricalPrices(reqCommodity, state, district, market);
                upsertAll(hist.records());
            } catch (Exception ex) {
                apiNote = "Live historical supplemental query was unavailable; showing only database-persisted records.";
            }
        }

        List<MandiPriceRecord> allStored = mandiRepository.findAllByOrderByArrivalDateDesc();
        List<String> availableCommodities = allStored.stream()
            .map(MandiPriceRecord::getCommodity)
            .filter(Objects::nonNull)
            .distinct()
            .sorted(String::compareToIgnoreCase)
            .toList();

        String selectedCommodity = !reqCommodity.isBlank()
            ? reqCommodity
            : (availableCommodities.size() == 1 ? availableCommodities.get(0) : "");

        List<MandiPriceRecord> commodityPool = selectedCommodity.isBlank()
            ? allStored
            : allStored.stream()
                .filter(r -> r.getCommodity().equalsIgnoreCase(selectedCommodity))
                .toList();

        Map<String, MarketOption> marketMap = new LinkedHashMap<>();
        for (MandiPriceRecord r : commodityPool) {
            String key = (r.getMarket() + "|" + r.getDistrict() + "|" + r.getState()).toLowerCase();
            marketMap.putIfAbsent(key, new MarketOption(r.getMarket(), r.getDistrict(), r.getState()));
        }
        List<MarketOption> availableMarkets = marketMap.values().stream()
            .sorted(Comparator.comparing(MarketOption::market, String.CASE_INSENSITIVE_ORDER))
            .toList();

        List<MandiPriceRecord> matched = selectedCommodity.isBlank() ? List.of() : commodityPool.stream()
            .filter(r -> market == null || market.isBlank() || r.getMarket().equalsIgnoreCase(market.trim()))
            .filter(r -> district == null || district.isBlank() || r.getDistrict().equalsIgnoreCase(district.trim()))
            .filter(r -> state == null || state.isBlank() || r.getState().equalsIgnoreCase(state.trim()))
            .toList();

        Map<String, List<MandiPriceRecord>> byDate = new TreeMap<>();
        for (MandiPriceRecord r : matched) {
            if (r.getArrivalDate() != null && !r.getArrivalDate().isBlank()) {
                byDate.computeIfAbsent(r.getArrivalDate(), k -> new ArrayList<>()).add(r);
            }
        }

        List<TrendPoint> points = new ArrayList<>();
        for (var entry : byDate.entrySet()) {
            List<Double> mins = new ArrayList<>();
            List<Double> modals = new ArrayList<>();
            List<Double> maxes = new ArrayList<>();
            Set<String> varieties = new LinkedHashSet<>();
            for (MandiPriceRecord r : entry.getValue()) {
                if (r.getMinPrice() != null) mins.add(r.getMinPrice());
                if (r.getModalPrice() != null) modals.add(r.getModalPrice());
                if (r.getMaxPrice() != null) maxes.add(r.getMaxPrice());
                if (r.getVariety() != null && !r.getVariety().isBlank()) varieties.add(r.getVariety());
            }
            Double minVal = mins.isEmpty() ? null : Collections.min(mins);
            Double maxVal = maxes.isEmpty() ? null : Collections.max(maxes);
            Double modalAvg = modals.isEmpty() ? null
                : Math.round((modals.stream().mapToDouble(Double::doubleValue).average().orElse(0.0)) * 100.0) / 100.0;
            points.add(new TrendPoint(entry.getKey(), minVal, modalAvg, maxVal, entry.getValue().size(), List.copyOf(varieties)));
        }

        if (days != null && days > 0 && !points.isEmpty()) {
            String cutoff = LocalDate.now().minusDays(days).toString();
            List<TrendPoint> windowed = points.stream().filter(p -> p.date().compareTo(cutoff) >= 0).toList();
            if (!windowed.isEmpty()) points = windowed;
        }

        boolean sufficientData = points.size() >= 2;
        String startDate = points.isEmpty() ? null : points.get(0).date();
        String endDate = points.isEmpty() ? null : points.get(points.size() - 1).date();

        TrendSummary summary = null;
        if (!points.isEmpty()) {
            List<Double> modals = points.stream().map(TrendPoint::modalPrice).filter(Objects::nonNull).toList();
            List<Double> mins = points.stream().map(TrendPoint::minPrice).filter(Objects::nonNull).toList();
            List<Double> maxes = points.stream().map(TrendPoint::maxPrice).filter(Objects::nonNull).toList();
            Double earliest = modals.isEmpty() ? null : modals.get(0);
            Double latest = modals.isEmpty() ? null : modals.get(modals.size() - 1);
            Double changeAbs = (sufficientData && earliest != null && latest != null)
                ? Math.round((latest - earliest) * 100.0) / 100.0 : null;
            Double changePct = (changeAbs != null && earliest > 0)
                ? Math.round((changeAbs / earliest) * 1000.0) / 10.0 : null;
            summary = new TrendSummary(
                latest,
                earliest,
                mins.isEmpty() ? null : Collections.min(mins),
                maxes.isEmpty() ? null : Collections.max(maxes),
                changeAbs,
                changePct
            );
        }

        String insEn = null;
        String insKn = null;
        if (selectedCommodity.isBlank()) {
            insEn = allStored.isEmpty()
                ? "No historical mandi price records exist in PostgreSQL yet. Configure DATA_GOV_IN_API_KEY to collect real Agmarknet arrivals, or ask an administrator to import verified Agmarknet records."
                : "Select a commodity from the recorded crops to inspect historical dates.";
            insKn = allStored.isEmpty()
                ? "ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಇನ್ನೂ ಯಾವುದೇ ಐತಿಹಾಸಿಕ ಮಂಡಿ ಬೆಲೆ ದಾಖಲೆಗಳಿಲ್ಲ. ನೈಜ Agmarknet ದರಗಳನ್ನು ಸಂಗ್ರಹಿಸಲು DATA_GOV_IN_API_KEY ಹೊಂದಿಸಿ ಅಥವಾ ನಿರ್ವಾಹಕರು ಪರಿಶೀಲಿಸಿದ ದಾಖಲೆಗಳನ್ನು ಸೇರಿಸಬೇಕು."
                : "ಬೆಲೆ ಪ್ರವೃತ್ತಿಯನ್ನು ನೋಡಲು ದಾಖಲಾದ ಬೆಳೆಗಳಲ್ಲಿ ಒಂದನ್ನು ಆಯ್ಕೆಮಾಡಿ.";
        } else if (!sufficientData) {
            insEn = points.size() == 1
                ? "Only 1 dated record (" + points.get(0).date() + ") exists for " + selectedCommodity + ". At least 2 distinct arrival dates are required to display an honest historical trend."
                : "No historical records found for " + selectedCommodity + ". KrishiSetu never fabricates historical curves when records are absent.";
            insKn = points.size() == 1
                ? selectedCommodity + " ಬೆಳೆಗೆ ಕೇವಲ 1 ದಿನಾಂಕದ ದಾಖಲೆ (" + points.get(0).date() + ") ಮಾತ್ರ ಲಭ್ಯವಿದೆ. ಪ್ರವೃತ್ತಿ ನಕ್ಷೆ ತೋರಿಸಲು ಕನಿಷ್ಠ 2 ವಿಭಿನ್ನ ದಿನಾಂಕಗಳ ನೈಜ ದಾಖಲೆಗಳು ಅಗತ್ಯ."
                : selectedCommodity + " ಬೆಳೆಗೆ ಯಾವುದೇ ಐತಿಹಾಸಿಕ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ದಾಖಲೆಗಳಿಲ್ಲದಿದ್ದಾಗ ಕೃಷಿಸೇತು ನಕಲಿ ಪ್ರವೃತ್ತಿ ನಕ್ಷೆಯನ್ನು ರಚಿಸುವುದಿಲ್ಲ.";
        }

        return new PriceTrendsResponse(
            selectedCommodity,
            market != null && !market.isBlank() ? market.trim() : null,
            district != null && !district.isBlank() ? district.trim() : null,
            state != null && !state.isBlank() ? state.trim() : null,
            "INR / Quintal",
            sufficientData,
            points.size(),
            new DateRange(startDate, endDate),
            points,
            summary,
            apiNote.isBlank()
                ? "Built exclusively from stored database records ingested via data.gov.in Agmarknet API or admin-verified Agmarknet bulletins."
                : apiNote,
            "data.gov.in Agmarknet API ಅಥವಾ ನಿರ್ವಾಹಕರಿಂದ ಪರಿಶೀಲಿತ ದಾಖಲೆಗಳಿಂದ ಮಾತ್ರ ಈ ಐತಿಹಾಸಿಕ ಪ್ರವೃತ್ತಿಯನ್ನು ತಯಾರಿಸಲಾಗಿದೆ.",
            insEn,
            insKn,
            "Historical prices reflect past mandi arrivals only. Future prices, market demand, and farm profits cannot be predicted or guaranteed.",
            "ಐತಿಹಾಸಿಕ ಬೆಲೆಗಳು ಹಿಂದಿನ ಮಂಡಿ ದರಗಳನ್ನು ಮಾತ್ರ ಪ್ರತಿಬಿಂಬಿಸುತ್ತವೆ. ಭವಿಷ್ಯದ ಬೆಲೆಗಳು ಅಥವಾ ಲಾಭವನ್ನು ಖಾತರಿಪಡಿಸಲಾಗುವುದಿಲ್ಲ.",
            availableCommodities,
            availableMarkets
        );
    }

    public List<GeoLocationResult> searchLocations(String q) {
        return openMeteoClient.searchLocations(q);
    }

    public WeatherForecastResponse getWeatherForecast(
        UUID userId,
        Double latitude,
        Double longitude,
        String locationName,
        String q
    ) {
        FarmerProfile profile = profileRepository.findByUserId(userId).orElse(null);

        if ((latitude != null && longitude == null) || (latitude == null && longitude != null)) {
            throw new BadRequestException("Provide both latitude and longitude coordinates.");
        }

        double resolvedLat;
        double resolvedLon;
        String resolvedName = locationName != null ? locationName.trim() : "";
        String resolvedState = profile != null ? profile.getState() : null;
        String resolvedDistrict = profile != null ? profile.getDistrict() : null;
        Double resolvedElevation = null;

        if (latitude != null) {
            if (!Double.isFinite(latitude) || !Double.isFinite(longitude)
                || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                throw new BadRequestException("Coordinates out of range: latitude [-90, 90], longitude [-180, 180].");
            }
            resolvedLat = latitude;
            resolvedLon = longitude;
            if (resolvedName.isBlank()) {
                resolvedName = String.format(Locale.US, "%.3f, %.3f", resolvedLat, resolvedLon);
            }
        } else {
            List<String> candidates = new ArrayList<>();
            if (q != null && q.trim().length() >= 2) candidates.add(q.trim());
            if (q == null && resolvedDistrict != null && resolvedDistrict.trim().length() >= 2) candidates.add(resolvedDistrict.trim());
            if (q == null && resolvedState != null && resolvedState.trim().length() >= 2) candidates.add(resolvedState.trim());

            if (candidates.isEmpty()) {
                throw new BadRequestException("Provide a location search name or latitude/longitude coordinates.");
            }

            GeoLocationResult matched = null;
            for (String candidate : candidates) {
                List<GeoLocationResult> hits = openMeteoClient.searchLocations(candidate);
                if (!hits.isEmpty()) {
                    String st = resolvedState != null ? resolvedState.toLowerCase() : "";
                    matched = hits.stream()
                        .filter(h -> "IN".equalsIgnoreCase(h.countryCode()) && h.state() != null && h.state().toLowerCase().contains(st))
                        .findFirst()
                        .orElse(hits.get(0));
                    break;
                }
            }

            if (matched == null) {
                throw new UpstreamServiceException(
                    HttpStatus.NOT_FOUND,
                    "LOCATION_NOT_FOUND",
                    "Could not resolve coordinates for \"" + candidates.get(0) + "\"."
                );
            }
            resolvedLat = matched.latitude();
            resolvedLon = matched.longitude();
            resolvedName = matched.name();
            resolvedState = matched.state();
            if (matched.district() != null) resolvedDistrict = matched.district();
            resolvedElevation = matched.elevation();
        }

        var raw = openMeteoClient.fetchForecast(resolvedLat, resolvedLon);
        List<FarmingAdvisory> advisories = buildWeatherAdvisories(raw.current(), raw.daily());
        String startDate = raw.daily().isEmpty() ? "" : raw.daily().get(0).date();
        String endDate = raw.daily().isEmpty() ? "" : raw.daily().get(raw.daily().size() - 1).date();

        return new WeatherForecastResponse(
            "LIVE_OK",
            new LocationInfo(
                resolvedName,
                resolvedState,
                resolvedDistrict,
                raw.latitude(),
                raw.longitude(),
                raw.timezone(),
                raw.elevation() != null ? raw.elevation() : resolvedElevation
            ),
            "Open-Meteo Weather Forecast API",
            "Weather data by Open-Meteo.com (CC BY 4.0)",
            "https://open-meteo.com/",
            new ForecastPeriod(startDate, endDate, raw.daily().size()),
            Instant.now().toString(),
            raw.current(),
            raw.daily(),
            advisories
        );
    }

    public SmartAlertsResponse getSmartAlerts(UUID userId, Double latitude, Double longitude) {
        FarmerProfile profile = profileRepository.findByUserId(userId).orElse(null);
        String state = profile != null ? profile.getState() : null;
        String district = profile != null ? profile.getDistrict() : null;

        List<SmartAlertItem> alerts = new ArrayList<>();
        String stateLower = state != null ? state.trim().toLowerCase() : "";
        String districtLower = district != null ? district.trim().toLowerCase() : "";

        List<PestDiseaseAlert> activePests = pestAlertRepository.findByActiveTrueOrderByObservedDateDesc();
        activePests.stream()
            .filter(a -> {
                if (stateLower.isBlank() && districtLower.isBlank()) return true;
                String aState = a.getState() != null ? a.getState().toLowerCase() : "";
                String aDist = a.getDistrict() != null ? a.getDistrict().toLowerCase() : "";
                if (!districtLower.isBlank() && !aDist.isBlank() && aDist.equals(districtLower)) return true;
                return !stateLower.isBlank() && aState.equals(stateLower);
            })
            .limit(8)
            .forEach(p -> {
                String verEn = switch (p.getVerificationStatus()) {
                    case "CONFIRMED_OUTBREAK" -> "Confirmed Outbreak";
                    case "REPORTED_CASE" -> "Reported Case";
                    default -> "Seasonal Risk Rule";
                };
                String verKn = switch (p.getVerificationStatus()) {
                    case "CONFIRMED_OUTBREAK" -> "ದೃಢೀಕೃತ ರೋಗ ಉಲ್ಬಣ";
                    case "REPORTED_CASE" -> "ವರದಿಯಾದ ಪ್ರಕರಣ";
                    default -> "ಋತುಮಾನದ ಮುನ್ನೆಚ್ಚರಿಕೆ ನಿಯಮ";
                };
                alerts.add(new SmartAlertItem(
                    "pest-" + p.getId(),
                    "PEST_DISEASE",
                    p.getSeverity(),
                    verEn,
                    verKn,
                    p.getTitleEn(),
                    p.getTitleKn(),
                    p.getSummaryEn(),
                    p.getSummaryKn(),
                    p.getDistrict() != null ? p.getDistrict() + ", " + p.getState() : p.getState(),
                    p.getCropNameEn(),
                    p.getSourceName(),
                    p.getSourceUrl(),
                    p.getObservedDate()
                ));
            });

        String weatherStatus = "NO_LOCATION";
        String noteEn = "No district or coordinates available to evaluate live weather risks.";
        String noteKn = "ನೇರ ಹವಾಮಾನ ಅಪಾಯಗಳನ್ನು ಪರಿಶೀಲಿಸಲು ಜಿಲ್ಲೆ ಅಥವಾ ಅಕ್ಷಾಂಶ/ರೇಖಾಂಶ ಲಭ್ಯವಿಲ್ಲ.";
        String locationLabel = (district != null && !district.isBlank())
            ? district + (state != null ? ", " + state : "")
            : (state != null ? state : "Selected region");

        boolean hasCoords = latitude != null && longitude != null
            && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
        boolean hasLocQuery = (district != null && !district.isBlank()) || (state != null && !state.isBlank());

        if (hasCoords || hasLocQuery) {
            try {
                WeatherForecastResponse forecast = getWeatherForecast(
                    userId,
                    hasCoords ? latitude : null,
                    hasCoords ? longitude : null,
                    null,
                    !hasCoords ? (district != null && !district.isBlank() ? district : state) : null
                );
                weatherStatus = "LIVE_OK";
                locationLabel = forecast.location().name()
                    + (forecast.location().state() != null ? ", " + forecast.location().state() : "");
                noteEn = "Evaluated live against Open-Meteo forecast (" + forecast.forecastPeriod().startDate() + " to " + forecast.forecastPeriod().endDate() + ").";
                noteKn = "Open-Meteo ನೇರ ಮುನ್ಸೂಚನೆಯೊಂದಿಗೆ ಪರಿಶೀಲಿಸಲಾಗಿದೆ (" + forecast.forecastPeriod().startDate() + " ರಿಂದ " + forecast.forecastPeriod().endDate() + ").";

                for (FarmingAdvisory adv : forecast.advisories()) {
                    if ("HIGH".equals(adv.severity()) || "MODERATE".equals(adv.severity())) {
                        alerts.add(new SmartAlertItem(
                            "weather-" + adv.code(),
                            "WEATHER_RISK",
                            adv.severity(),
                            "Open-Meteo Forecast · " + adv.triggerMetric(),
                            "Open-Meteo ಮುನ್ಸೂಚನೆ · " + adv.triggerMetric(),
                            adv.titleEn(),
                            adv.titleKn(),
                            adv.detailEn(),
                            adv.detailKn(),
                            locationLabel,
                            null,
                            "Open-Meteo Weather API (CC BY 4.0)",
                            "https://open-meteo.com/",
                            forecast.forecastPeriod().startDate()
                        ));
                    }
                }
            } catch (Exception ex) {
                weatherStatus = "UNAVAILABLE";
                noteEn = "Live Open-Meteo weather check could not complete right now. Only verified stored agricultural advisories are shown below.";
                noteKn = "ಪ್ರಸ್ತುತ Open-Meteo ನೇರ ಹವಾಮಾನ ಪರಿಶೀಲನೆ ಪೂರ್ಣಗೊಳ್ಳಲಿಲ್ಲ. ಪರಿಶೀಲಿಸಿದ ಕೃಷಿ ಸಲಹೆಗಳನ್ನು ಮಾತ್ರ ಕೆಳಗೆ ತೋರಿಸಲಾಗಿದೆ.";
            }
        }

        alerts.sort(Comparator.comparingInt(a -> switch (a.severity()) {
            case "HIGH" -> 0;
            case "MODERATE" -> 1;
            default -> 2;
        }));

        return new SmartAlertsResponse(
            Instant.now().toString(),
            locationLabel,
            weatherStatus,
            noteEn,
            noteKn,
            alerts,
            "Smart Alerts combine real Open-Meteo forecast thresholds with documented pest bulletins. Synthetic weather warnings or unverified market price spike alerts are never generated.",
            "ಸ್ಮಾರ್ಟ್ ಎಚ್ಚರಿಕೆಗಳು ನೈಜ Open-Meteo ಹವಾಮಾನ ಮೌಲ್ಯಗಳು ಮತ್ತು ದಾಖಲಿತ ಕೀಟ/ರೋಗ ಸೂಚನೆಗಳನ್ನು ಮಾತ್ರ ಒಳಗೊಂಡಿವೆ."
        );
    }

    @Transactional
    public MandiPriceDto createAdminMandiRecord(MandiPriceIngestRequest req) {
        String isoDate = DataGovMandiClient.normalizeDate(req.arrivalDate());
        if (!isoDate.matches("^\\d{4}-\\d{2}-\\d{2}$")) {
            throw new BadRequestException("Arrival date must be YYYY-MM-DD or DD/MM/YYYY.");
        }
        double min = req.minPrice() != null ? req.minPrice() : req.modalPrice();
        double max = req.maxPrice() != null ? req.maxPrice() : req.modalPrice();
        if (min <= 0 || max < min) {
            throw new BadRequestException("Min price must be > 0 and <= Max price.");
        }

        MandiPriceRecord record = new MandiPriceRecord();
        record.setCommodity(req.commodity().trim());
        record.setVariety(req.variety() != null && !req.variety().isBlank() ? req.variety().trim() : "FAQ");
        record.setGrade(req.grade() != null && !req.grade().isBlank() ? req.grade().trim() : "FAQ");
        record.setState(req.state().trim());
        record.setDistrict(req.district().trim());
        record.setMarket(req.market().trim());
        record.setMinPrice(min);
        record.setMaxPrice(max);
        record.setModalPrice(req.modalPrice());
        record.setUnit("INR / Quintal");
        record.setArrivalDate(isoDate);
        record.setReportedDateRaw(req.arrivalDate().trim());
        record.setSourceName(req.sourceName() != null && !req.sourceName().isBlank()
            ? req.sourceName().trim()
            : "Admin Verified Agmarknet Bulletin");
        record.setFetchedAt(Instant.now());

        List<MandiPriceRecord> saved = upsertAll(List.of(record));
        return toDto(saved.get(0));
    }

    public List<MandiPriceDto> listAllAdminRecords() {
        return mandiRepository.findAllByOrderByArrivalDateDesc().stream().map(this::toDto).toList();
    }

    @Transactional
    public Map<String, Object> syncLiveAdmin(String state, String commodity) {
        MandiPricesResponse res = getMandiPrices(commodity, state != null ? state : "Karnataka", null, null, null, 100, 0);
        long total = mandiRepository.count();
        return Map.of(
            "status", res.status(),
            "syncedCount", "LIVE_OK".equals(res.status()) ? res.records().size() : 0,
            "totalStored", total,
            "messageEn", res.messageEn()
        );
    }

    private List<FarmingAdvisory> buildWeatherAdvisories(CurrentConditions current, List<DailyForecast> daily) {
        List<FarmingAdvisory> list = new ArrayList<>();
        List<DailyForecast> next3 = daily.stream().limit(3).toList();

        double maxRainDay = next3.stream().map(DailyForecast::precipitationSumMm).filter(Objects::nonNull).mapToDouble(Double::doubleValue).max().orElse(0.0);
        int maxRainProb = next3.stream().map(DailyForecast::precipitationProbabilityMaxPct).filter(Objects::nonNull).mapToInt(Integer::intValue).max().orElse(0);
        double maxWind = next3.stream().map(DailyForecast::windSpeedMaxKmh).filter(Objects::nonNull).mapToDouble(Double::doubleValue).max().orElse(0.0);
        double maxTemp = next3.stream().map(DailyForecast::tempMaxC).filter(Objects::nonNull).mapToDouble(Double::doubleValue).max().orElse(-99.0);
        double minTemp = next3.stream().map(DailyForecast::tempMinC).filter(Objects::nonNull).mapToDouble(Double::doubleValue).min().orElse(99.0);

        if (maxRainDay >= 20 || maxRainProb >= 70) {
            list.add(new FarmingAdvisory(
                "HEAVY_RAIN_DRAINAGE",
                "HIGH",
                "Rainfall & Drainage Caution",
                "ಮಳೆ ಮತ್ತು ನೀರು ಬಸಿದುಹೋಗುವ ಎಚ್ಚರಿಕೆ",
                String.format(Locale.US, "Up to %.1f mm rainfall (%d%% probability) forecast in the next 3 days. Pause scheduled irrigation, clear drainage channels, and defer fertilizer top-dressing.", maxRainDay, maxRainProb),
                String.format(Locale.US, "ಮುಂದಿನ 3 ದಿನಗಳಲ್ಲಿ %.1f ಮಿ.ಮೀ ವರೆಗೆ ಮಳೆ (%d%% ಸಂಭವನೀಯತೆ) ಮುನ್ಸೂಚನೆ ಇದೆ. ನೀರಾವರಿ ನಿಲ್ಲಿಸಿ ಮತ್ತು ಹೊಲದ ಕಾಲುವೆಗಳನ್ನು ಸ್ವಚ್ಛಗೊಳಿಸಿ.", maxRainDay, maxRainProb),
                String.format(Locale.US, "%.1f mm · %d%% prob", maxRainDay, maxRainProb)
            ));
        } else if (maxRainDay >= 5 || maxRainProb >= 45 || maxWind >= 18) {
            list.add(new FarmingAdvisory(
                "SPRAY_WINDOW_CAUTION",
                "MODERATE",
                "Foliar Spraying Window Caution",
                "ಸಿಂಪಡಣೆ ಸಮಯದ ಎಚ್ಚರಿಕೆ",
                String.format(Locale.US, "Forecast shows wind gusts up to %.1f km/h and rain chance up to %d%%. Avoid foliar spraying during windy or rainy spells.", maxWind, maxRainProb),
                String.format(Locale.US, "ಗಾಳಿಯ ವೇಗ %.1f ಕಿ.ಮೀ/ಗಂ ವರೆಗೆ ಮತ್ತು ಮಳೆ ಸಾಧ್ಯತೆ %d%% ಇದೆ. ಜೋರು ಗಾಳಿ ಅಥವಾ ಮಳೆಯ ಸಮಯದಲ್ಲಿ ಸಿಂಪಡಣೆ ಮಾಡಬೇಡಿ.", maxWind, maxRainProb),
                String.format(Locale.US, "Wind %.1f km/h · Rain %d%%", maxWind, maxRainProb)
            ));
        }

        if (maxTemp >= 36) {
            list.add(new FarmingAdvisory(
                "HEAT_IRRIGATION_TIMING",
                maxTemp >= 40 ? "HIGH" : "MODERATE",
                "High Daytime Temperature Watch",
                "ಗರಿಷ್ಠ ತಾಪಮಾನದ ಎಚ್ಚರಿಕೆ",
                String.format(Locale.US, "Daytime highs may reach %.1f°C. Prefer early morning or evening irrigation and retain mulch.", maxTemp),
                String.format(Locale.US, "ಹಗಲಿನ ತಾಪಮಾನ %.1f°C ತಲುಪಬಹುದು. ಬೆಳಗ್ಗೆ ಅಥವಾ ಸಂಜೆ ನೀರಾವರಿ ನೀಡಿ.", maxTemp),
                String.format(Locale.US, "Max %.1f°C", maxTemp)
            ));
        }

        if (minTemp <= 10 && minTemp > -90) {
            list.add(new FarmingAdvisory(
                "COOL_NIGHT_NURSERY",
                "MODERATE",
                "Cool Night Temperature Watch",
                "ತಂಪಾದ ರಾತ್ರಿ ತಾಪಮಾನದ ಎಚ್ಚರಿಕೆ",
                String.format(Locale.US, "Night temperatures may dip to %.1f°C. Shield sensitive nurseries overnight.", minTemp),
                String.format(Locale.US, "ರಾತ್ರಿ ತಾಪಮಾನ %.1f°C ವರೆಗೆ ಇಳಿಯಬಹುದು. ಸೂಕ್ಷ್ಮ ಸಸಿಮಡಿಗಳನ್ನು ರಾತ್ರಿ ರಕ್ಷಿಸಿ.", minTemp),
                String.format(Locale.US, "Min %.1f°C", minTemp)
            ));
        }

        long wetDays = next3.stream().filter(d -> d.precipitationSumMm() != null && d.precipitationSumMm() >= 3.0).count();
        if ((current.relativeHumidityPct() != null && current.relativeHumidityPct() >= 82) || wetDays >= 2) {
            list.add(new FarmingAdvisory(
                "HUMID_DISEASE_SCOUTING",
                "MODERATE",
                "Humid Foliage Scouting Advisory",
                "ತೇವಾಂಶದಿಂದ ರೋಗ ಗಮನಿಸುವ ಸಲಹೆ",
                "Elevated humidity or repeated wet spells can favor fungal and bacterial leaf spots. Inspect lower leaves regularly.",
                "ಹೆಚ್ಚಿನ ಆರ್ದ್ರತೆ ಅಥವಾ ಸತತ ಮಳೆಯು ಶಿಲೀಂಧ್ರ ರೋಗಗಳಿಗೆ ಅನುಕೂಲವಾಗಬಹುದು. ಎಲೆಗಳನ್ನು ನಿಯಮಿತವಾಗಿ ಪರಿಶೀಲಿಸಿ.",
                current.relativeHumidityPct() != null ? "RH " + Math.round(current.relativeHumidityPct()) + "%" : "Consecutive wet days"
            ));
        }

        if (maxRainDay < 2 && maxWind < 15 && maxTemp < 36) {
            list.add(new FarmingAdvisory(
                "CLEAR_FIELD_WINDOW",
                "INFO",
                "Favorable Clear Field Operations Window",
                "ಕೃಷಿ ಚಟುವಟಿಕೆಗಳಿಗೆ ಅನುಕೂಲಕರ ಒಣ ಹವಾಮಾನ",
                String.format(Locale.US, "Low rainfall and calm winds (< %.1f km/h) over the next 3 days suit harvesting, threshing, and drying.", maxWind),
                "ಮುಂದಿನ 3 ದಿನಗಳಲ್ಲಿ ಕಡಿಮೆ ಮಳೆ ಮತ್ತು ಶಾಂತ ಗಾಳಿ ಇರುವುದರಿಂದ ಕೊಯ್ಲು ಮತ್ತು ಧಾನ್ಯ ಒಣಗಿಸಲು ಅನುಕೂಲಕರವಾಗಿದೆ.",
                String.format(Locale.US, "Rain < 2 mm · Wind %.1f km/h", maxWind)
            ));
        }

        return list;
    }

    private List<MandiPriceRecord> upsertAll(List<MandiPriceRecord> incoming) {
        List<MandiPriceRecord> saved = new ArrayList<>();
        for (MandiPriceRecord rec : incoming) {
            var existingOpt = mandiRepository
                .findFirstByCommodityIgnoreCaseAndVarietyIgnoreCaseAndStateIgnoreCaseAndDistrictIgnoreCaseAndMarketIgnoreCaseAndArrivalDate(
                    rec.getCommodity(), rec.getVariety(), rec.getState(), rec.getDistrict(), rec.getMarket(), rec.getArrivalDate()
                );
            MandiPriceRecord target = existingOpt.orElse(rec);
            target.setMinPrice(rec.getMinPrice());
            target.setMaxPrice(rec.getMaxPrice());
            target.setModalPrice(rec.getModalPrice());
            target.setSourceName(rec.getSourceName());
            target.setResourceId(rec.getResourceId());
            target.setFetchedAt(rec.getFetchedAt());
            saved.add(mandiRepository.save(target));
        }
        return saved;
    }

    private List<MandiPriceRecord> filterRecords(
        List<MandiPriceRecord> list,
        String commodity,
        String state,
        String district,
        String market,
        String q
    ) {
        String c = commodity != null ? commodity.trim().toLowerCase() : "";
        String s = state != null ? state.trim().toLowerCase() : "";
        String d = district != null ? district.trim().toLowerCase() : "";
        String m = market != null ? market.trim().toLowerCase() : "";
        String query = q != null ? q.trim().toLowerCase() : "";

        return list.stream()
            .filter(r -> c.isBlank() || r.getCommodity().toLowerCase().contains(c))
            .filter(r -> s.isBlank() || r.getState().toLowerCase().contains(s))
            .filter(r -> d.isBlank() || r.getDistrict().toLowerCase().contains(d))
            .filter(r -> m.isBlank() || r.getMarket().toLowerCase().contains(m))
            .filter(r -> {
                if (query.isBlank()) return true;
                String hay = (r.getCommodity() + " " + r.getVariety() + " " + r.getMarket() + " " + r.getDistrict() + " " + r.getState()).toLowerCase();
                return hay.contains(query);
            })
            .toList();
    }

    private AvailableFilters buildFacets(List<MandiPriceRecord> list) {
        Set<String> commodities = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        Set<String> states = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        Set<String> districts = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        Set<String> markets = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        for (MandiPriceRecord r : list) {
            if (r.getCommodity() != null && !r.getCommodity().isBlank()) commodities.add(r.getCommodity());
            if (r.getState() != null && !r.getState().isBlank()) states.add(r.getState());
            if (r.getDistrict() != null && !r.getDistrict().isBlank()) districts.add(r.getDistrict());
            if (r.getMarket() != null && !r.getMarket().isBlank()) markets.add(r.getMarket());
        }
        return new AvailableFilters(List.copyOf(commodities), List.copyOf(states), List.copyOf(districts), List.copyOf(markets));
    }

    private MandiPriceDto toDto(MandiPriceRecord r) {
        return new MandiPriceDto(
            r.getId() != null ? r.getId().toString() : "",
            r.getCommodity(),
            r.getVariety(),
            r.getGrade(),
            r.getState(),
            r.getDistrict(),
            r.getMarket(),
            r.getMinPrice(),
            r.getMaxPrice(),
            r.getModalPrice(),
            r.getUnit(),
            r.getArrivalDate(),
            r.getReportedDateRaw(),
            r.getSourceName(),
            r.getResourceId(),
            r.getFetchedAt() != null ? r.getFetchedAt().toString() : null
        );
    }
}
