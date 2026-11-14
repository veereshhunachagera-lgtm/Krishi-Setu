package com.krishisetu.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import java.math.BigDecimal;

public record SoilReportDto(
    @DecimalMin(value = "0.0", message = "Nitrogen must be >= 0 kg/ha")
    @DecimalMax(value = "1000.0", message = "Nitrogen must be <= 1000 kg/ha")
    BigDecimal nitrogenKgPerHa,

    @DecimalMin(value = "0.0", message = "Phosphorus must be >= 0 kg/ha")
    @DecimalMax(value = "400.0", message = "Phosphorus must be <= 400 kg/ha")
    BigDecimal phosphorusKgPerHa,

    @DecimalMin(value = "0.0", message = "Potassium must be >= 0 kg/ha")
    @DecimalMax(value = "1200.0", message = "Potassium must be <= 1200 kg/ha")
    BigDecimal potassiumKgPerHa,

    @DecimalMin(value = "3.5", message = "Soil pH must be >= 3.5")
    @DecimalMax(value = "10.0", message = "Soil pH must be <= 10.0")
    BigDecimal phLevel,

    boolean nitrogenUnknown,
    boolean phosphorusUnknown,
    boolean potassiumUnknown,
    boolean phUnknown,
    String labName,
    String sampleDate
) {}
