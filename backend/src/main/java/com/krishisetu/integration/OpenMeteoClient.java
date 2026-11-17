package com.krishisetu.integration;

import com.krishisetu.dto.WeatherForecastResponse.*;
import com.krishisetu.exception.UpstreamServiceException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Component
public class OpenMeteoClient {

    public record RawOpenMeteoPayload(
        double latitude,
        double longitude,
        Double elevation,
        String timezone,
        CurrentConditions current,
        List<DailyForecast> daily
    ) {}

    private final String forecastUrl;
    private final String geocodingUrl;
    private final RestClient restClient;

    public OpenMeteoClient(
        @Value("${krishisetu.market-weather.open-meteo-forecast-url:https://api.open-meteo.com/v1/forecast}") String forecastUrl,
        @Value("${krishisetu.market-weather.open-meteo-geocoding-url:https://geocoding-api.open-meteo.com/v1/search}") String geocodingUrl
    ) {
        this.forecastUrl = forecastUrl != null && !forecastUrl.isBlank()
            ? forecastUrl.trim()
            : "https://api.open-meteo.com/v1/forecast";
        this.geocodingUrl = geocodingUrl != null && !geocodingUrl.isBlank()
            ? geocodingUrl.trim()
            : "https://geocoding-api.open-meteo.com/v1/search";

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(9000);
        this.restClient = RestClient.builder().requestFactory(factory).build();
    }

    @SuppressWarnings("unchecked")
    public List<GeoLocationResult> searchLocations(String query) {
        String trimmed = query != null ? query.trim() : "";
        if (trimmed.length() < 2) {
            throw new UpstreamServiceException(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_ERROR",
                "Enter at least 2 characters to search locations."
            );
        }

        UriComponentsBuilder uri = UriComponentsBuilder.fromHttpUrl(geocodingUrl)
            .queryParam("name", trimmed)
            .queryParam("count", 10)
            .queryParam("language", "en")
            .queryParam("format", "json");

        try {
            Map<String, Object> body = restClient.get()
                .uri(uri.build().encode().toUri())
                .retrieve()
                .body(Map.class);

            List<GeoLocationResult> results = new ArrayList<>();
            if (body != null && body.get("results") instanceof List<?> rawList) {
                for (Object item : rawList) {
                    if (item instanceof Map<?, ?> m) {
                        results.add(new GeoLocationResult(
                            toLong(m.get("id")),
                            str(m.get("name")),
                            nullableStr(m.get("admin1")),
                            nullableStr(m.get("admin2")),
                            str(m.get("country")),
                            str(m.get("country_code")),
                            toDouble(m.get("latitude"), 0),
                            toDouble(m.get("longitude"), 0),
                            nullableDouble(m.get("elevation"))
                        ));
                    }
                }
            }

            results.sort(Comparator.comparingInt(r -> "IN".equalsIgnoreCase(r.countryCode()) ? 0 : 1));
            return results;
        } catch (HttpClientErrorException.TooManyRequests ex) {
            throw new UpstreamServiceException(
                HttpStatus.TOO_MANY_REQUESTS,
                "RATE_LIMITED",
                "Open-Meteo geocoding rate limit reached. Please retry shortly."
            );
        } catch (ResourceAccessException ex) {
            throw new UpstreamServiceException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "UPSTREAM_TIMEOUT",
                "Timed out while contacting Open-Meteo location search."
            );
        } catch (UpstreamServiceException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new UpstreamServiceException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "UPSTREAM_ERROR",
                "Could not reach Open-Meteo location service."
            );
        }
    }

    @SuppressWarnings("unchecked")
    public RawOpenMeteoPayload fetchForecast(double latitude, double longitude) {
        UriComponentsBuilder uri = UriComponentsBuilder.fromHttpUrl(forecastUrl)
            .queryParam("latitude", latitude)
            .queryParam("longitude", longitude)
            .queryParam("timezone", "auto")
            .queryParam("forecast_days", 7)
            .queryParam("current", "temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m,weather_code")
            .queryParam("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset");

        try {
            Map<String, Object> body = restClient.get()
                .uri(uri.build().encode().toUri())
                .retrieve()
                .body(Map.class);

            if (body == null || !(body.get("current") instanceof Map<?, ?> currMap)
                || !(body.get("daily") instanceof Map<?, ?> dailyMap)
                || !(dailyMap.get("time") instanceof List<?> timeList)) {
                throw new UpstreamServiceException(
                    HttpStatus.BAD_GATEWAY,
                    "UPSTREAM_ERROR",
                    "Open-Meteo returned an incomplete forecast response."
                );
            }

            Integer currCode = nullableInt(currMap.get("weather_code"));
            String[] currLabel = describeWmoCode(currCode);
            CurrentConditions current = new CurrentConditions(
                str(currMap.get("time")),
                nullableDouble(currMap.get("temperature_2m")),
                nullableDouble(currMap.get("relative_humidity_2m")),
                nullableDouble(currMap.get("precipitation")),
                nullableDouble(currMap.get("rain")),
                nullableDouble(currMap.get("wind_speed_10m")),
                currCode,
                currLabel[0],
                currLabel[1]
            );

            List<?> codes = listAt(dailyMap, "weather_code");
            List<?> tMax = listAt(dailyMap, "temperature_2m_max");
            List<?> tMin = listAt(dailyMap, "temperature_2m_min");
            List<?> pSum = listAt(dailyMap, "precipitation_sum");
            List<?> pProb = listAt(dailyMap, "precipitation_probability_max");
            List<?> wMax = listAt(dailyMap, "wind_speed_10m_max");
            List<?> sunrises = listAt(dailyMap, "sunrise");
            List<?> sunsets = listAt(dailyMap, "sunset");

            List<DailyForecast> daily = new ArrayList<>();
            for (int i = 0; i < timeList.size(); i++) {
                Integer code = nullableInt(at(codes, i));
                String[] label = describeWmoCode(code);
                daily.add(new DailyForecast(
                    String.valueOf(timeList.get(i)),
                    code,
                    label[0],
                    label[1],
                    nullableDouble(at(tMax, i)),
                    nullableDouble(at(tMin, i)),
                    nullableDouble(at(pSum, i)),
                    nullableInt(at(pProb, i)),
                    nullableDouble(at(wMax, i)),
                    nullableStr(at(sunrises, i)),
                    nullableStr(at(sunsets, i))
                ));
            }

            return new RawOpenMeteoPayload(
                toDouble(body.get("latitude"), latitude),
                toDouble(body.get("longitude"), longitude),
                nullableDouble(body.get("elevation")),
                str(body.get("timezone")).isBlank() ? "auto" : str(body.get("timezone")),
                current,
                daily
            );
        } catch (HttpClientErrorException.TooManyRequests ex) {
            throw new UpstreamServiceException(
                HttpStatus.TOO_MANY_REQUESTS,
                "RATE_LIMITED",
                "Open-Meteo API limit reached. Please retry later."
            );
        } catch (ResourceAccessException ex) {
            throw new UpstreamServiceException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "UPSTREAM_TIMEOUT",
                "Timed out while fetching Open-Meteo weather forecast."
            );
        } catch (UpstreamServiceException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new UpstreamServiceException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "UPSTREAM_ERROR",
                "Network failure while contacting Open-Meteo forecast API."
            );
        }
    }

    public static String[] describeWmoCode(Integer code) {
        if (code == null) return new String[] { "Not reported", "ಲಭ್ಯವಿಲ್ಲ" };
        if (code == 0) return new String[] { "Clear sky", "ಸ್ಪಷ್ಟ ಆಕಾಶ" };
        if (code == 1) return new String[] { "Mainly clear", "ಮುಖ್ಯವಾಗಿ ಸ್ಪಷ್ಟ" };
        if (code == 2) return new String[] { "Partly cloudy", "ಭಾಗಶಃ ಮೋಡ" };
        if (code == 3) return new String[] { "Overcast", "ದಟ್ಟ ಮೋಡ" };
        if (code == 45 || code == 48) return new String[] { "Fog / Mist", "ಮಂಜು" };
        if (code >= 51 && code <= 57) return new String[] { "Light drizzle", "ತುಂತುರು ಮಳೆ" };
        if (code >= 61 && code <= 67) return new String[] { "Rain", "ಮಳೆ" };
        if (code >= 71 && code <= 77) return new String[] { "Snow / Ice", "ಹಿಮ" };
        if (code >= 80 && code <= 82) return new String[] { "Rain showers", "ಮಳೆ ಸಿಂಚನ" };
        if (code >= 95 && code <= 99) return new String[] { "Thunderstorm", "ಗುಡುಗು ಸಹಿತ ಮಳೆ" };
        return new String[] { "Weather code " + code, "ಹವಾಮಾನ ಸಂಕೇತ " + code };
    }

    private List<?> listAt(Map<?, ?> map, String key) {
        return map.get(key) instanceof List<?> l ? l : List.of();
    }

    private Object at(List<?> list, int idx) {
        return idx < list.size() ? list.get(idx) : null;
    }

    private String str(Object o) {
        return o == null ? "" : String.valueOf(o).trim();
    }

    private String nullableStr(Object o) {
        String s = str(o);
        return s.isBlank() ? null : s;
    }

    private long toLong(Object o) {
        return o instanceof Number n ? n.longValue() : 0L;
    }

    private double toDouble(Object o, double fallback) {
        return o instanceof Number n ? n.doubleValue() : fallback;
    }

    private Double nullableDouble(Object o) {
        return o instanceof Number n ? n.doubleValue() : null;
    }

    private Integer nullableInt(Object o) {
        return o instanceof Number n ? n.intValue() : null;
    }
}
