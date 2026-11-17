export interface MandiPriceRecord {
  id: string;
  commodity: string;
  variety: string;
  grade: string;
  state: string;
  district: string;
  market: string;
  minPrice: number | null;
  maxPrice: number | null;
  modalPrice: number | null;
  unit: string;
  arrivalDate: string;
  reportedDateRaw: string;
  sourceName: string;
  resourceId: string | null;
  fetchedAt: string;
}

export type MandiFeedStatus =
  | 'LIVE_OK'
  | 'API_KEY_MISSING'
  | 'RATE_LIMITED'
  | 'UPSTREAM_TIMEOUT'
  | 'UPSTREAM_ERROR';

export interface MandiPricesResponse {
  status: MandiFeedStatus;
  configured: boolean;
  sourceName: string;
  sourceUrl: string;
  resourceId: string;
  updatedAt: string | null;
  totalAvailable: number;
  records: MandiPriceRecord[];
  availableFilters: {
    commodities: string[];
    states: string[];
    districts: string[];
    markets: string[];
  };
  messageEn: string;
  messageKn: string;
  configurationGuideEn: string;
  configurationGuideKn: string;
}

export interface PriceTrendPoint {
  date: string;
  minPrice: number | null;
  modalPrice: number | null;
  maxPrice: number | null;
  recordCount: number;
  varieties: string[];
}

export interface PriceTrendsResponse {
  commodity: string;
  market: string | null;
  district: string | null;
  state: string | null;
  unit: string;
  sufficientData: boolean;
  pointCount: number;
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
  points: PriceTrendPoint[];
  summary: {
    latestModalPrice: number | null;
    earliestModalPrice: number | null;
    observedMinPrice: number | null;
    observedMaxPrice: number | null;
    changeAbsolute: number | null;
    changePercent: number | null;
  } | null;
  sourceNoteEn: string;
  sourceNoteKn: string;
  insufficientReasonEn: string | null;
  insufficientReasonKn: string | null;
  disclaimerEn: string;
  disclaimerKn: string;
  availableCommodities: string[];
  availableMarkets: Array<{ market: string; district: string; state: string }>;
}

export interface GeoLocationResult {
  id: number;
  name: string;
  state: string | null;
  district: string | null;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  elevation: number | null;
}

export interface WeatherCurrentConditions {
  time: string;
  temperatureC: number | null;
  relativeHumidityPct: number | null;
  precipitationMm: number | null;
  rainMm: number | null;
  windSpeedKmh: number | null;
  weatherCode: number | null;
  conditionEn: string;
  conditionKn: string;
}

export interface WeatherDailyForecast {
  date: string;
  weatherCode: number | null;
  conditionEn: string;
  conditionKn: string;
  tempMaxC: number | null;
  tempMinC: number | null;
  precipitationSumMm: number | null;
  precipitationProbabilityMaxPct: number | null;
  windSpeedMaxKmh: number | null;
  sunrise: string | null;
  sunset: string | null;
}

export interface WeatherFarmingAdvisory {
  code: string;
  severity: 'HIGH' | 'MODERATE' | 'INFO';
  titleEn: string;
  titleKn: string;
  detailEn: string;
  detailKn: string;
  triggerMetric: string;
}

export interface WeatherForecastResponse {
  status: 'LIVE_OK';
  location: {
    name: string;
    state: string | null;
    district: string | null;
    latitude: number;
    longitude: number;
    timezone: string;
    elevationM: number | null;
  };
  sourceName: string;
  attributionText: string;
  attributionUrl: string;
  forecastPeriod: {
    startDate: string;
    endDate: string;
    days: number;
  };
  updatedAt: string;
  current: WeatherCurrentConditions;
  daily: WeatherDailyForecast[];
  advisories: WeatherFarmingAdvisory[];
}

export interface SmartAlertItem {
  id: string;
  category: 'WEATHER_RISK' | 'PEST_DISEASE';
  severity: 'HIGH' | 'MODERATE' | 'LOW';
  verificationLabelEn: string;
  verificationLabelKn: string;
  titleEn: string;
  titleKn: string;
  detailEn: string;
  detailKn: string;
  regionLabel: string;
  cropLabel: string | null;
  sourceName: string;
  sourceUrl: string | null;
  observedOrValidDate: string;
}

export interface SmartAlertsResponse {
  generatedAt: string;
  locationLabel: string;
  weatherCheckStatus: 'LIVE_OK' | 'NO_LOCATION' | 'UNAVAILABLE';
  weatherStatusNoteEn: string;
  weatherStatusNoteKn: string;
  alerts: SmartAlertItem[];
  honestyDisclosureEn: string;
  honestyDisclosureKn: string;
}

export interface AdminMandiCreatePayload {
  commodity: string;
  variety?: string;
  grade?: string;
  state: string;
  district: string;
  market: string;
  minPrice?: number;
  maxPrice?: number;
  modalPrice: number;
  arrivalDate: string;
  sourceName?: string;
}
