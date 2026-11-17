package com.krishisetu.controller;

import com.krishisetu.dto.MandiPricesResponse;
import com.krishisetu.dto.PriceTrendsResponse;
import com.krishisetu.dto.SmartAlertsResponse;
import com.krishisetu.dto.WeatherForecastResponse;
import com.krishisetu.dto.WeatherForecastResponse.GeoLocationResult;
import com.krishisetu.security.AuthenticatedUser;
import com.krishisetu.service.MarketWeatherService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/market-weather")
public class MarketWeatherController {

    private final MarketWeatherService marketWeatherService;

    public MarketWeatherController(MarketWeatherService marketWeatherService) {
        this.marketWeatherService = marketWeatherService;
    }

    @GetMapping("/mandi-prices")
    public MandiPricesResponse getMandiPrices(
        @RequestParam(required = false) String commodity,
        @RequestParam(required = false) String state,
        @RequestParam(required = false) String district,
        @RequestParam(required = false) String market,
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "50") int limit,
        @RequestParam(defaultValue = "0") int offset
    ) {
        return marketWeatherService.getMandiPrices(commodity, state, district, market, q, limit, offset);
    }

    @GetMapping("/trends")
    public PriceTrendsResponse getPriceTrends(
        @RequestParam(required = false) String commodity,
        @RequestParam(required = false) String market,
        @RequestParam(required = false) String district,
        @RequestParam(required = false) String state,
        @RequestParam(required = false) Integer days
    ) {
        return marketWeatherService.getPriceTrends(commodity, market, district, state, days);
    }

    @GetMapping("/locations/search")
    public List<GeoLocationResult> searchLocations(@RequestParam String q) {
        return marketWeatherService.searchLocations(q);
    }

    @GetMapping("/weather")
    public WeatherForecastResponse getWeather(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestParam(required = false) Double lat,
        @RequestParam(required = false) Double lon,
        @RequestParam(required = false) String locationName,
        @RequestParam(required = false) String q
    ) {
        return marketWeatherService.getWeatherForecast(user.getId(), lat, lon, locationName, q);
    }

    @GetMapping("/smart-alerts")
    public SmartAlertsResponse getSmartAlerts(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestParam(required = false) Double lat,
        @RequestParam(required = false) Double lon
    ) {
        return marketWeatherService.getSmartAlerts(user.getId(), lat, lon);
    }
}
