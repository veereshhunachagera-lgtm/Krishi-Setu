package com.krishisetu.controller;

import com.krishisetu.dto.MandiPriceIngestRequest;
import com.krishisetu.dto.MandiPricesResponse.MandiPriceDto;
import com.krishisetu.entity.MandiPriceRecord;
import com.krishisetu.exception.ResourceNotFoundException;
import com.krishisetu.repository.MandiPriceRecordRepository;
import com.krishisetu.service.MarketWeatherService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/market")
@PreAuthorize("hasRole('ADMIN')")
public class AdminMarketController {

    private final MarketWeatherService marketWeatherService;
    private final MandiPriceRecordRepository mandiRepository;

    public AdminMarketController(
        MarketWeatherService marketWeatherService,
        MandiPriceRecordRepository mandiRepository
    ) {
        this.marketWeatherService = marketWeatherService;
        this.mandiRepository = mandiRepository;
    }

    @GetMapping("/prices")
    public List<MandiPriceDto> listStoredPrices() {
        return marketWeatherService.listAllAdminRecords();
    }

    @PostMapping("/prices")
    public ResponseEntity<MandiPriceDto> createVerifiedRecord(@Valid @RequestBody MandiPriceIngestRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(marketWeatherService.createAdminMandiRecord(req));
    }

    @DeleteMapping("/prices/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRecord(@PathVariable UUID id) {
        MandiPriceRecord existing = mandiRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Mandi price record not found."));
        mandiRepository.delete(existing);
    }

    @PostMapping("/sync-live")
    public Map<String, Object> syncLive(@RequestBody(required = false) Map<String, String> body) {
        String state = body != null ? body.get("state") : null;
        String commodity = body != null ? body.get("commodity") : null;
        return marketWeatherService.syncLiveAdmin(state, commodity);
    }
}
