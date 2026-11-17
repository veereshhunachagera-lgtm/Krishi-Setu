package com.krishisetu.repository;

import com.krishisetu.entity.MandiPriceRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MandiPriceRecordRepository extends JpaRepository<MandiPriceRecord, UUID> {
    List<MandiPriceRecord> findAllByOrderByArrivalDateDesc();

    List<MandiPriceRecord> findByCommodityIgnoreCaseOrderByArrivalDateAsc(String commodity);

    Optional<MandiPriceRecord> findFirstByCommodityIgnoreCaseAndVarietyIgnoreCaseAndStateIgnoreCaseAndDistrictIgnoreCaseAndMarketIgnoreCaseAndArrivalDate(
        String commodity,
        String variety,
        String state,
        String district,
        String market,
        String arrivalDate
    );
}
