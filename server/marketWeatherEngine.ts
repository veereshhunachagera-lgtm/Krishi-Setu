import crypto from 'node:crypto';

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
  arrivalDate: string; // Normalized YYYY-MM-DD when parseable
  reportedDateRaw: string;
  sourceName: string;
  resourceId: string | null;
  fetchedAt: string;
}

export interface MandiPricesQuery {
  commodity?: string;
  state?: string;
  district?: string;
  market?: string;
  q?: string;
  limit?: number;
  offset?: number;
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

const DEFAULT_MANDI_RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
const DEFAULT_HISTORY_RESOURCE_ID = '35985678-0d79-46b4-9ed6-6f13308a1d24';
const DEFAULT_DATA_GOV_BASE = 'https://api.data.gov.in/resource';
const DEFAULT_OPEN_METEO_FORECAST = 'https://api.open-meteo.com/v1/forecast';
const DEFAULT_OPEN_METEO_GEOCODING = 'https://geocoding-api.open-meteo.com/v1/search';

const DATA_GOV_CATALOG_URL =
  'https://data.gov.in/catalog/current-daily-price-various-commodities-various-markets-mandi';

export class UpstreamApiError extends Error {
  statusCode: number;
  errorCode: string;

  constructor(statusCode: number, errorCode: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

function getDataGovConfig() {
  return {
    apiKey: (process.env.DATA_GOV_IN_API_KEY || '').trim(),
    mandiResourceId:
      (process.env.DATA_GOV_IN_MANDI_RESOURCE_ID || '').trim() || DEFAULT_MANDI_RESOURCE_ID,
    historyResourceId:
      (process.env.DATA_GOV_IN_HISTORY_RESOURCE_ID || '').trim() || DEFAULT_HISTORY_RESOURCE_ID,
    baseUrl: (process.env.DATA_GOV_IN_BASE_URL || '').trim().replace(/\/+$/, '') || DEFAULT_DATA_GOV_BASE,
  };
}

function getOpenMeteoConfig() {
  return {
    forecastUrl:
      (process.env.OPEN_METEO_FORECAST_URL || '').trim() || DEFAULT_OPEN_METEO_FORECAST,
    geocodingUrl:
      (process.env.OPEN_METEO_GEOCODING_URL || '').trim() || DEFAULT_OPEN_METEO_GEOCODING,
  };
}

export function normalizeAgmarknetDate(raw: unknown): { iso: string; rawText: string } {
  const str = String(raw ?? '').trim();
  if (!str) {
    return { iso: '', rawText: '' };
  }
  // Agmarknet typically uses DD/MM/YYYY or DD-MM-YYYY
  const dmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    const year = dmy[3];
    return { iso: `${year}-${month}-${day}`, rawText: str };
  }
  const ymd = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (ymd) {
    const year = ymd[1];
    const month = ymd[2].padStart(2, '0');
    const day = ymd[3].padStart(2, '0');
    return { iso: `${year}-${month}-${day}`, rawText: str };
  }
  return { iso: str, rawText: str };
}

function parseNullableNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
}

function mapRawAgmarknetRow(
  row: Record<string, unknown>,
  resourceId: string,
  fetchedAt: string,
): MandiPriceRecord | null {
  const commodity = String(row.commodity ?? row.Commodity ?? '').trim();
  const market = String(row.market ?? row.Market ?? '').trim();
  const state = String(row.state ?? row.State ?? '').trim();
  const district = String(row.district ?? row.District ?? '').trim();
  if (!commodity || !market) return null;

  const variety = String(row.variety ?? row.Variety ?? 'Other').trim() || 'Other';
  const grade = String(row.grade ?? row.Grade ?? 'FAQ').trim() || 'FAQ';
  const { iso, rawText } = normalizeAgmarknetDate(row.arrival_date ?? row.Arrival_Date ?? '');

  return {
    id: crypto.randomUUID(),
    commodity,
    variety,
    grade,
    state,
    district,
    market,
    minPrice: parseNullableNumber(row.min_price ?? row.Min_Price),
    maxPrice: parseNullableNumber(row.max_price ?? row.Max_Price),
    modalPrice: parseNullableNumber(row.modal_price ?? row.Modal_Price),
    unit: 'INR / Quintal',
    arrivalDate: iso || fetchedAt.slice(0, 10),
    reportedDateRaw: rawText || iso || fetchedAt.slice(0, 10),
    sourceName: 'data.gov.in · Agmarknet OGD API',
    resourceId,
    fetchedAt,
  };
}

export function mergeMandiRecords(
  existing: MandiPriceRecord[],
  incoming: MandiPriceRecord[],
): { merged: MandiPriceRecord[]; addedOrUpdated: number } {
  const byKey = new Map<string, MandiPriceRecord>();
  const makeKey = (r: MandiPriceRecord) =>
    [
      r.commodity.toLowerCase(),
      r.variety.toLowerCase(),
      r.state.toLowerCase(),
      r.district.toLowerCase(),
      r.market.toLowerCase(),
      r.arrivalDate,
    ].join('|');

  for (const item of existing) {
    byKey.set(makeKey(item), item);
  }

  let addedOrUpdated = 0;
  for (const item of incoming) {
    const k = makeKey(item);
    const prev = byKey.get(k);
    byKey.set(k, prev ? { ...item, id: prev.id } : item);
    addedOrUpdated++;
  }

  const merged = Array.from(byKey.values()).sort((a, b) =>
    b.arrivalDate.localeCompare(a.arrivalDate),
  );
  return { merged, addedOrUpdated };
}

function buildFilterFacetValues(records: MandiPriceRecord[]) {
  const commodities = new Set<string>();
  const states = new Set<string>();
  const districts = new Set<string>();
  const markets = new Set<string>();

  for (const r of records) {
    if (r.commodity) commodities.add(r.commodity);
    if (r.state) states.add(r.state);
    if (r.district) districts.add(r.district);
    if (r.market) markets.add(r.market);
  }

  return {
    commodities: Array.from(commodities).sort((a, b) => a.localeCompare(b)),
    states: Array.from(states).sort((a, b) => a.localeCompare(b)),
    districts: Array.from(districts).sort((a, b) => a.localeCompare(b)),
    markets: Array.from(markets).sort((a, b) => a.localeCompare(b)),
  };
}

function filterStoredMandiRecords(records: MandiPriceRecord[], query: MandiPricesQuery) {
  const q = query.q?.trim().toLowerCase() || '';
  const commodity = query.commodity?.trim().toLowerCase() || '';
  const state = query.state?.trim().toLowerCase() || '';
  const district = query.district?.trim().toLowerCase() || '';
  const market = query.market?.trim().toLowerCase() || '';

  return records
    .filter((r) => {
      if (commodity && !r.commodity.toLowerCase().includes(commodity)) return false;
      if (state && !r.state.toLowerCase().includes(state)) return false;
      if (district && !r.district.toLowerCase().includes(district)) return false;
      if (market && !r.market.toLowerCase().includes(market)) return false;
      if (q) {
        const hay = `${r.commodity} ${r.variety} ${r.market} ${r.district} ${r.state}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => b.arrivalDate.localeCompare(a.arrivalDate));
}

async function queryDataGovResource(
  resourceId: string,
  apiKey: string,
  baseUrl: string,
  query: MandiPricesQuery,
): Promise<{ records: MandiPriceRecord[]; total: number; fetchedAt: string }> {
  const params = new URLSearchParams({
    'api-key': apiKey,
    format: 'json',
    limit: String(Math.min(Math.max(query.limit || 50, 1), 100)),
    offset: String(Math.max(query.offset || 0, 0)),
  });

  if (query.state?.trim()) params.set('filters[state]', query.state.trim());
  if (query.district?.trim()) params.set('filters[district]', query.district.trim());
  if (query.market?.trim()) params.set('filters[market]', query.market.trim());
  if (query.commodity?.trim()) params.set('filters[commodity]', query.commodity.trim());

  const url = `${baseUrl}/${encodeURIComponent(resourceId)}?${params.toString()}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(9000),
  });

  if (res.status === 429) {
    throw new UpstreamApiError(
      429,
      'RATE_LIMITED',
      'data.gov.in API rate limit reached. Please retry after a short pause.',
    );
  }
  if (res.status === 401 || res.status === 403) {
    throw new UpstreamApiError(
      502,
      'UPSTREAM_ERROR',
      'Configured DATA_GOV_IN_API_KEY was rejected by data.gov.in.',
    );
  }
  if (!res.ok) {
    throw new UpstreamApiError(
      502,
      'UPSTREAM_ERROR',
      `data.gov.in API returned HTTP ${res.status}.`,
    );
  }

  const payload = (await res.json()) as {
    total?: number | string;
    count?: number | string;
    records?: Array<Record<string, unknown>>;
    status?: string;
    message?: string;
  };

  if (payload.status === 'error') {
    throw new UpstreamApiError(
      502,
      'UPSTREAM_ERROR',
      payload.message || 'data.gov.in API reported an upstream error.',
    );
  }

  const fetchedAt = new Date().toISOString();
  const rawList = Array.isArray(payload.records) ? payload.records : [];
  const mapped: MandiPriceRecord[] = [];
  for (const row of rawList) {
    const parsed = mapRawAgmarknetRow(row, resourceId, fetchedAt);
    if (parsed) mapped.push(parsed);
  }

  const totalNum = Number(payload.total ?? payload.count ?? mapped.length);
  return {
    records: mapped,
    total: Number.isFinite(totalNum) ? totalNum : mapped.length,
    fetchedAt,
  };
}

export async function fetchMandiPrices(
  query: MandiPricesQuery,
  storedRecords: MandiPriceRecord[],
): Promise<{ response: MandiPricesResponse; newlyFetched: MandiPriceRecord[] }> {
  const cfg = getDataGovConfig();
  const configGuideEn =
    'Set DATA_GOV_IN_API_KEY in the backend environment (register free at https://data.gov.in/) to stream live Agmarknet daily arrivals for resource ' +
    cfg.mandiResourceId +
    '.';
  const configGuideKn =
    'ನೇರ ಎಜಿಮಾರ್ಕ್‌ನೆಟ್ (Agmarknet) ಮಂಡಿ ಬೆಲೆಗಳನ್ನು ಪಡೆಯಲು ಬ್ಯಾಕ್‌ಎಂಡ್ ಪರಿಸರದಲ್ಲಿ DATA_GOV_IN_API_KEY (https://data.gov.in/ ನಿಂದ ಉಚಿತವಾಗಿ ಪಡೆಯಿರಿ) ಅನ್ನು ಹೊಂದಿಸಿ (ಸಂಪನ್ಮೂಲ ID: ' +
    cfg.mandiResourceId +
    ').';

  if (!cfg.apiKey) {
    const filteredStored = filterStoredMandiRecords(storedRecords, query);
    return {
      newlyFetched: [],
      response: {
        status: 'API_KEY_MISSING',
        configured: false,
        sourceName: 'data.gov.in (OGD Platform India · Agmarknet)',
        sourceUrl: DATA_GOV_CATALOG_URL,
        resourceId: cfg.mandiResourceId,
        updatedAt: filteredStored[0]?.fetchedAt || null,
        totalAvailable: filteredStored.length,
        records: filteredStored,
        availableFilters: buildFilterFacetValues(storedRecords),
        messageEn:
          filteredStored.length > 0
            ? 'Live data.gov.in API key is not configured on the server. Displaying only previously verified or admin-imported Agmarknet records stored in the database.'
            : 'Live Mandi Market Prices are currently unavailable because DATA_GOV_IN_API_KEY is not configured on the backend server. KrishiSetu never substitutes fabricated market prices.',
        messageKn:
          filteredStored.length > 0
            ? 'ಬ್ಯಾಕ್‌ಎಂಡ್ ಸರ್ವರ್‌ನಲ್ಲಿ data.gov.in API ಕೀ ಹೊಂದಿಸಲಾಗಿಲ್ಲ. ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಸಂಗ್ರಹಿಸಿರುವ ಪರಿಶೀಲಿತ ದಾಖಲೆಗಳನ್ನು ಮಾತ್ರ ತೋರಿಸಲಾಗುತ್ತಿದೆ.'
            : 'ಬ್ಯಾಕ್‌ಎಂಡ್ ಸರ್ವರ್‌ನಲ್ಲಿ DATA_GOV_IN_API_KEY ಹೊಂದಿಸದ ಕಾರಣ ನೇರ ಮಂಡಿ ದರಗಳು ಪ್ರಸ್ತುತ ಲಭ್ಯವಿಲ್ಲ. ಕೃಷಿಸೇತು ನಕಲಿ ಬೆಲೆಗಳನ್ನು ತೋರಿಸುವುದಿಲ್ಲ.',
        configurationGuideEn: configGuideEn,
        configurationGuideKn: configGuideKn,
      },
    };
  }

  try {
    const live = await queryDataGovResource(cfg.mandiResourceId, cfg.apiKey, cfg.baseUrl, query);
    const filtered = query.q?.trim()
      ? filterStoredMandiRecords(live.records, { q: query.q })
      : live.records;

    return {
      newlyFetched: live.records,
      response: {
        status: 'LIVE_OK',
        configured: true,
        sourceName: 'data.gov.in · Agmarknet OGD API',
        sourceUrl: DATA_GOV_CATALOG_URL,
        resourceId: cfg.mandiResourceId,
        updatedAt: live.fetchedAt,
        totalAvailable: query.q?.trim() ? filtered.length : live.total,
        records: filtered,
        availableFilters: buildFilterFacetValues([...live.records, ...storedRecords]),
        messageEn:
          filtered.length > 0
            ? `Showing ${filtered.length} Agmarknet market records retrieved live from data.gov.in.`
            : 'Connected to data.gov.in, but no Agmarknet arrivals matched the selected crop, state, district, or mandi filters.',
        messageKn:
          filtered.length > 0
            ? `data.gov.in ನಿಂದ ನೇರವಾಗಿ ಪಡೆದ ${filtered.length} ಮಂಡಿ ಬೆಲೆ ದಾಖಲೆಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.`
            : 'data.gov.in ಸಂಪರ್ಕಗೊಂಡಿದೆ, ಆದರೆ ಆಯ್ದ ಬೆಳೆ, ರಾಜ್ಯ, ಜಿಲ್ಲೆ ಅಥವಾ ಮಂಡಿಗೆ ಯಾವುದೇ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ.',
        configurationGuideEn: configGuideEn,
        configurationGuideKn: configGuideKn,
      },
    };
  } catch (err) {
    const isTimeout =
      err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
    const status: MandiFeedStatus =
      err instanceof UpstreamApiError && err.errorCode === 'RATE_LIMITED'
        ? 'RATE_LIMITED'
        : isTimeout
          ? 'UPSTREAM_TIMEOUT'
          : 'UPSTREAM_ERROR';

    const detail = err instanceof Error ? err.message : 'Unable to reach data.gov.in.';
    return {
      newlyFetched: [],
      response: {
        status,
        configured: true,
        sourceName: 'data.gov.in · Agmarknet OGD API',
        sourceUrl: DATA_GOV_CATALOG_URL,
        resourceId: cfg.mandiResourceId,
        updatedAt: null,
        totalAvailable: 0,
        records: [],
        availableFilters: buildFilterFacetValues(storedRecords),
        messageEn: `Unable to load live mandi prices from data.gov.in (${detail}). No simulated prices were substituted.`,
        messageKn: `data.gov.in ನಿಂದ ನೇರ ಮಂಡಿ ದರಗಳನ್ನು ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ (${detail}). ಯಾವುದೇ ನಕಲಿ ಬೆಲೆಗಳನ್ನು ತೋರಿಸಲಾಗಿಲ್ಲ.`,
        configurationGuideEn: configGuideEn,
        configurationGuideKn: configGuideKn,
      },
    };
  }
}

export async function getPriceTrends(
  params: {
    commodity?: string;
    market?: string;
    district?: string;
    state?: string;
    days?: number;
  },
  storedRecords: MandiPriceRecord[],
): Promise<{ response: PriceTrendsResponse; newlyFetched: MandiPriceRecord[] }> {
  const cfg = getDataGovConfig();
  const newlyFetched: MandiPriceRecord[] = [];
  let apiSupplementNote = '';

  const requestedCommodity = params.commodity?.trim() || '';
  if (cfg.apiKey && requestedCommodity) {
    try {
      const hist = await queryDataGovResource(cfg.historyResourceId, cfg.apiKey, cfg.baseUrl, {
        commodity: requestedCommodity,
        state: params.state,
        district: params.district,
        market: params.market,
        limit: 100,
      });
      newlyFetched.push(...hist.records);
    } catch {
      apiSupplementNote =
        'Live historical supplemental query was unavailable; showing only database-persisted records.';
    }
  }

  const allPool =
    newlyFetched.length > 0 ? mergeMandiRecords(storedRecords, newlyFetched).merged : storedRecords;

  const availableCommodities = Array.from(
    new Set(allPool.map((r) => r.commodity).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));

  const selectedCommodity =
    requestedCommodity || (availableCommodities.length === 1 ? availableCommodities[0] : '');

  const commodityPool = selectedCommodity
    ? allPool.filter((r) => r.commodity.toLowerCase() === selectedCommodity.toLowerCase())
    : allPool;

  const marketMap = new Map<string, { market: string; district: string; state: string }>();
  for (const r of commodityPool) {
    const key = `${r.market}|${r.district}|${r.state}`.toLowerCase();
    if (!marketMap.has(key)) {
      marketMap.set(key, { market: r.market, district: r.district, state: r.state });
    }
  }
  const availableMarkets = Array.from(marketMap.values()).sort((a, b) =>
    a.market.localeCompare(b.market),
  );

  const matched = commodityPool.filter((r) => {
    if (!selectedCommodity) return false;
    if (params.market?.trim() && r.market.toLowerCase() !== params.market.trim().toLowerCase()) {
      return false;
    }
    if (
      params.district?.trim() &&
      r.district.toLowerCase() !== params.district.trim().toLowerCase()
    ) {
      return false;
    }
    if (params.state?.trim() && r.state.toLowerCase() !== params.state.trim().toLowerCase()) {
      return false;
    }
    return true;
  });

  // Group by arrivalDate ascending without fabricating missing dates
  const byDate = new Map<
    string,
    { mins: number[]; modals: number[]; maxes: number[]; varieties: Set<string>; count: number }
  >();
  for (const r of matched) {
    if (!r.arrivalDate) continue;
    let bucket = byDate.get(r.arrivalDate);
    if (!bucket) {
      bucket = { mins: [], modals: [], maxes: [], varieties: new Set(), count: 0 };
      byDate.set(r.arrivalDate, bucket);
    }
    if (r.minPrice !== null) bucket.mins.push(r.minPrice);
    if (r.modalPrice !== null) bucket.modals.push(r.modalPrice);
    if (r.maxPrice !== null) bucket.maxes.push(r.maxPrice);
    if (r.variety) bucket.varieties.add(r.variety);
    bucket.count++;
  }

  let points: PriceTrendPoint[] = Array.from(byDate.entries())
    .sort(([d1], [d2]) => d1.localeCompare(d2))
    .map(([date, bucket]) => {
      const avg = (arr: number[]) =>
        arr.length ? Math.round((arr.reduce((s, n) => s + n, 0) / arr.length) * 100) / 100 : null;
      return {
        date,
        minPrice: bucket.mins.length ? Math.min(...bucket.mins) : null,
        modalPrice: avg(bucket.modals),
        maxPrice: bucket.maxes.length ? Math.max(...bucket.maxes) : null,
        recordCount: bucket.count,
        varieties: Array.from(bucket.varieties),
      };
    });

  if (params.days && params.days > 0 && points.length > 0) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - params.days);
    const cutoffIso = cutoff.toISOString().slice(0, 10);
    const windowed = points.filter((p) => p.date >= cutoffIso);
    if (windowed.length > 0) {
      points = windowed;
    }
  }

  const sufficientData = points.length >= 2;
  const startDate = points[0]?.date || null;
  const endDate = points[points.length - 1]?.date || null;

  let summary: PriceTrendsResponse['summary'] = null;
  if (points.length > 0) {
    const modals = points.map((p) => p.modalPrice).filter((v): v is number => v !== null);
    const mins = points.map((p) => p.minPrice).filter((v): v is number => v !== null);
    const maxes = points.map((p) => p.maxPrice).filter((v): v is number => v !== null);
    const earliest = modals[0] ?? null;
    const latest = modals[modals.length - 1] ?? null;
    const changeAbs =
      sufficientData && earliest !== null && latest !== null
        ? Math.round((latest - earliest) * 100) / 100
        : null;
    const changePct =
      changeAbs !== null && earliest && earliest > 0
        ? Math.round((changeAbs / earliest) * 1000) / 10
        : null;
    summary = {
      latestModalPrice: latest,
      earliestModalPrice: earliest,
      observedMinPrice: mins.length ? Math.min(...mins) : null,
      observedMaxPrice: maxes.length ? Math.max(...maxes) : null,
      changeAbsolute: changeAbs,
      changePercent: changePct,
    };
  }

  let insufficientReasonEn: string | null = null;
  let insufficientReasonKn: string | null = null;
  if (!selectedCommodity) {
    insufficientReasonEn =
      allPool.length === 0
        ? 'No historical mandi price records exist in the database yet. Configure DATA_GOV_IN_API_KEY to collect real Agmarknet daily arrivals over time, or ask an administrator to import verified Agmarknet historical records.'
        : 'Select a commodity from the available recorded crops to check whether multiple arrival dates exist for trend plotting.';
    insufficientReasonKn =
      allPool.length === 0
        ? 'ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಇನ್ನೂ ಯಾವುದೇ ಐತಿಹಾಸಿಕ ಮಂಡಿ ಬೆಲೆ ದಾಖಲೆಗಳಿಲ್ಲ. ನೈಜ Agmarknet ದರಗಳನ್ನು ಸಂಗ್ರಹಿಸಲು DATA_GOV_IN_API_KEY ಹೊಂದಿಸಿ ಅಥವಾ ನಿರ್ವಾಹಕರು ಪರಿಶೀಲಿಸಿದ ದಾಖಲೆಗಳನ್ನು ಸೇರಿಸಬೇಕು.'
        : 'ಬೆಲೆ ಪ್ರವೃತ್ತಿಯನ್ನು ನೋಡಲು ದಾಖಲಾದ ಬೆಳೆಗಳಲ್ಲಿ ಒಂದನ್ನು ಆಯ್ಕೆಮಾಡಿ.';
  } else if (!sufficientData) {
    insufficientReasonEn =
      points.length === 1
        ? `Only 1 dated record (${points[0].date}) exists for ${selectedCommodity}${params.market ? ` at ${params.market}` : ''}. At least 2 distinct arrival dates are required to display an honest historical trend.`
        : `No historical records found for ${selectedCommodity}${params.market ? ` at ${params.market}` : ''}. KrishiSetu never fabricates historical curves when records are absent.`;
    insufficientReasonKn =
      points.length === 1
        ? `${selectedCommodity} ಬೆಳೆಗೆ ಕೇವಲ 1 ದಿನಾಂಕದ ದಾಖಲೆ (${points[0].date}) ಮಾತ್ರ ಲಭ್ಯವಿದೆ. ಪ್ರವೃತ್ತಿ ನಕ್ಷೆ ತೋರಿಸಲು ಕನಿಷ್ಠ 2 ವಿಭಿನ್ನ ದಿನಾಂಕಗಳ ನೈಜ ದಾಖಲೆಗಳು ಅಗತ್ಯ.`
        : `${selectedCommodity} ಬೆಳೆಗೆ ಯಾವುದೇ ಐತಿಹಾಸಿಕ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ದಾಖಲೆಗಳಿಲ್ಲದಿದ್ದಾಗ ಕೃಷಿಸೇತು ನಕಲಿ ಪ್ರವೃತ್ತಿ ನಕ್ಷೆಯನ್ನು ರಚಿಸುವುದಿಲ್ಲ.`;
  }

  return {
    newlyFetched,
    response: {
      commodity: selectedCommodity,
      market: params.market?.trim() || null,
      district: params.district?.trim() || null,
      state: params.state?.trim() || null,
      unit: 'INR / Quintal',
      sufficientData,
      pointCount: points.length,
      dateRange: { startDate, endDate },
      points,
      summary,
      sourceNoteEn:
        apiSupplementNote ||
        'Built exclusively from stored database records ingested via data.gov.in Agmarknet API or admin-verified Agmarknet bulletins.',
      sourceNoteKn:
        'data.gov.in Agmarknet API ಅಥವಾ ನಿರ್ವಾಹಕರಿಂದ ಪರಿಶೀಲಿತ ದಾಖಲೆಗಳಿಂದ ಮಾತ್ರ ಈ ಐತಿಹಾಸಿಕ ಪ್ರವೃತ್ತಿಯನ್ನು ತಯಾರಿಸಲಾಗಿದೆ.',
      insufficientReasonEn,
      insufficientReasonKn,
      disclaimerEn:
        'Historical prices reflect past mandi arrivals only. Future prices, market demand, and farm profits cannot be predicted or guaranteed.',
      disclaimerKn:
        'ಐತಿಹಾಸಿಕ ಬೆಲೆಗಳು ಹಿಂದಿನ ಮಂಡಿ ದರಗಳನ್ನು ಮಾತ್ರ ಪ್ರತಿಬಿಂಬಿಸುತ್ತವೆ. ಭವಿಷ್ಯದ ಬೆಲೆಗಳು ಅಥವಾ ಲಾಭವನ್ನು ಖಾತರಿಪಡಿಸಲಾಗುವುದಿಲ್ಲ.',
      availableCommodities,
      availableMarkets,
    },
  };
}

function describeWmoCode(code: number | null): { en: string; kn: string } {
  if (code === null || code === undefined) {
    return { en: 'Not reported', kn: 'ಲಭ್ಯವಿಲ್ಲ' };
  }
  if (code === 0) return { en: 'Clear sky', kn: 'ಸ್ಪಷ್ಟ ಆಕಾಶ' };
  if (code === 1) return { en: 'Mainly clear', kn: 'ಮುಖ್ಯವಾಗಿ ಸ್ಪಷ್ಟ' };
  if (code === 2) return { en: 'Partly cloudy', kn: 'ಭಾಗಶಃ ಮೋಡ' };
  if (code === 3) return { en: 'Overcast', kn: 'ದಟ್ಟ ಮೋಡ' };
  if (code === 45 || code === 48) return { en: 'Fog / Mist', kn: 'ಮಂಜು' };
  if (code >= 51 && code <= 57) return { en: 'Light drizzle', kn: 'ತುಂತುರು ಮಳೆ' };
  if (code >= 61 && code <= 67) return { en: 'Rain', kn: 'ಮಳೆ' };
  if (code >= 71 && code <= 77) return { en: 'Snow / Ice', kn: 'ಹಿಮ' };
  if (code >= 80 && code <= 82) return { en: 'Rain showers', kn: 'ಮಳೆ ಸಿಂಚನ' };
  if (code >= 95 && code <= 99) return { en: 'Thunderstorm', kn: 'ಗುಡುಗು ಸಹಿತ ಮಳೆ' };
  return { en: `Weather code ${code}`, kn: `ಹವಾಮಾನ ಸಂಕೇತ ${code}` };
}

export async function searchOpenMeteoLocations(
  query: string,
): Promise<GeoLocationResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    throw new UpstreamApiError(400, 'VALIDATION_ERROR', 'Enter at least 2 characters to search locations.');
  }
  const cfg = getOpenMeteoConfig();
  const url = `${cfg.geocodingUrl}?name=${encodeURIComponent(trimmed)}&count=10&language=en&format=json`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 429) {
      throw new UpstreamApiError(
        429,
        'RATE_LIMITED',
        'Open-Meteo geocoding rate limit reached. Please try again shortly.',
      );
    }
    if (!res.ok) {
      throw new UpstreamApiError(
        502,
        'UPSTREAM_ERROR',
        `Open-Meteo geocoding returned HTTP ${res.status}.`,
      );
    }
    const payload = (await res.json()) as {
      results?: Array<{
        id: number;
        name: string;
        admin1?: string;
        admin2?: string;
        country?: string;
        country_code?: string;
        latitude: number;
        longitude: number;
        elevation?: number;
      }>;
    };
    const list = (payload.results || []).map((item) => ({
      id: item.id,
      name: item.name,
      state: item.admin1 || null,
      district: item.admin2 || null,
      country: item.country || '',
      countryCode: item.country_code || '',
      latitude: item.latitude,
      longitude: item.longitude,
      elevation: item.elevation ?? null,
    }));

    // Prioritize Indian locations cleanly while preserving remaining global hits
    list.sort((a, b) => {
      const aIn = a.countryCode === 'IN' ? 0 : 1;
      const bIn = b.countryCode === 'IN' ? 0 : 1;
      return aIn - bIn;
    });
    return list;
  } catch (err) {
    if (err instanceof UpstreamApiError) throw err;
    const isTimeout =
      err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
    throw new UpstreamApiError(
      503,
      isTimeout ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_ERROR',
      isTimeout
        ? 'Timed out while contacting Open-Meteo location search.'
        : 'Could not reach Open-Meteo location service.',
    );
  }
}

export function buildWeatherAdvisories(
  current: WeatherCurrentConditions,
  daily: WeatherDailyForecast[],
): WeatherFarmingAdvisory[] {
  const advisories: WeatherFarmingAdvisory[] = [];
  const next3Days = daily.slice(0, 3);

  const maxRainDay = next3Days.reduce(
    (max, d) => ((d.precipitationSumMm ?? 0) > max ? (d.precipitationSumMm ?? 0) : max),
    0,
  );
  const maxRainProb = next3Days.reduce(
    (max, d) =>
      (d.precipitationProbabilityMaxPct ?? 0) > max
        ? (d.precipitationProbabilityMaxPct ?? 0)
        : max,
    0,
  );
  const maxWind3d = next3Days.reduce(
    (max, d) => ((d.windSpeedMaxKmh ?? 0) > max ? (d.windSpeedMaxKmh ?? 0) : max),
    0,
  );
  const maxTemp3d = next3Days.reduce(
    (max, d) => ((d.tempMaxC ?? -99) > max ? (d.tempMaxC ?? -99) : max),
    -99,
  );
  const minTemp3d = next3Days.reduce(
    (min, d) => ((d.tempMinC ?? 99) < min ? (d.tempMinC ?? 99) : min),
    99,
  );

  if (maxRainDay >= 20 || maxRainProb >= 70) {
    advisories.push({
      code: 'HEAVY_RAIN_DRAINAGE',
      severity: 'HIGH',
      titleEn: 'Rainfall & Drainage Caution',
      titleKn: 'ಮಳೆ ಮತ್ತು ನೀರು ಬಸಿದುಹೋಗುವ ಎಚ್ಚರಿಕೆ',
      detailEn: `Up to ${maxRainDay.toFixed(1)} mm rainfall (${maxRainProb}% probability) forecast in the next 3 days. Pause scheduled irrigation, clear field drainage channels, and defer fertilizer top-dressing.`,
      detailKn: `ಮುಂದಿನ 3 ದಿನಗಳಲ್ಲಿ ${maxRainDay.toFixed(1)} ಮಿ.ಮೀ ವರೆಗೆ ಮಳೆ (${maxRainProb}% ಸಂಭವನೀಯತೆ) ಮುನ್ಸೂಚನೆ ಇದೆ. ನೀರಾವರಿ ನಿಲ್ಲಿಸಿ, ಹೊಲದ ನೀರು ಬಸಿದುಹೋಗುವ ಕಾಲುವೆಗಳನ್ನು ಸ್ವಚ್ಛಗೊಳಿಸಿ ಮತ್ತು ರಸಗೊಬ್ಬರ ನೀಡುವುದನ್ನು ಮುಂದೂಡಿ.`,
      triggerMetric: `${maxRainDay.toFixed(1)} mm · ${maxRainProb}% prob`,
    });
  } else if (maxRainDay >= 5 || maxRainProb >= 45 || maxWind3d >= 18) {
    advisories.push({
      code: 'SPRAY_WINDOW_CAUTION',
      severity: 'MODERATE',
      titleEn: 'Foliar Spraying Window Caution',
      titleKn: 'ಸಿಂಪಡಣೆ ಸಮಯದ ಎಚ್ಚರಿಕೆ',
      detailEn: `Forecast shows wind gusts up to ${maxWind3d.toFixed(1)} km/h and rain chance up to ${maxRainProb}%. Avoid spraying during high wind or imminent rain to reduce drift and wash-off.`,
      detailKn: `ಗಾಳಿಯ ವೇಗ ${maxWind3d.toFixed(1)} ಕಿ.ಮೀ/ಗಂ ವರೆಗೆ ಮತ್ತು ಮಳೆ ಸಾಧ್ಯತೆ ${maxRainProb}% ಇದೆ. ಔಷಧಿ ವ್ಯರ್ಥವಾಗುವುದನ್ನು ತಡೆಯಲು ಜೋರು ಗಾಳಿ ಅಥವಾ ಮಳೆಯ ಸಮಯದಲ್ಲಿ ಸಿಂಪಡಣೆ ಮಾಡಬೇಡಿ.`,
      triggerMetric: `Wind ${maxWind3d.toFixed(1)} km/h · Rain ${maxRainProb}%`,
    });
  }

  if (maxTemp3d >= 36) {
    advisories.push({
      code: 'HEAT_IRRIGATION_TIMING',
      severity: maxTemp3d >= 40 ? 'HIGH' : 'MODERATE',
      titleEn: 'High Daytime Temperature Watch',
      titleKn: 'ಗರಿಷ್ಠ ತಾಪಮಾನದ ಎಚ್ಚರಿಕೆ',
      detailEn: `Daytime highs may reach ${maxTemp3d.toFixed(1)}°C. Prefer early morning or evening irrigation where water is available and retain soil mulch to limit evaporation.`,
      detailKn: `ಹಗಲಿನ ತಾಪಮಾನ ${maxTemp3d.toFixed(1)}°C ತಲುಪಬಹುದು. ನೀರು ಲಭ್ಯವಿದ್ದಲ್ಲಿ ಬೆಳಗ್ಗೆ ಅಥವಾ ಸಂಜೆ ನೀರಾವರಿ ನೀಡಿ ಮತ್ತು ತೇವಾಂಶ ಉಳಿಸಲು ಮಲ್ಚಿಂಗ್ ಬಳಸಿ.`,
      triggerMetric: `Max ${maxTemp3d.toFixed(1)}°C`,
    });
  }

  if (minTemp3d <= 10 && minTemp3d > -90) {
    advisories.push({
      code: 'COOL_NIGHT_NURSERY',
      severity: 'MODERATE',
      titleEn: 'Cool Night Temperature Watch',
      titleKn: 'ತಂಪಾದ ರಾತ್ರಿ ತಾಪಮಾನದ ಎಚ್ಚರಿಕೆ',
      detailEn: `Night temperatures may dip to ${minTemp3d.toFixed(1)}°C. Shield sensitive vegetable nurseries and young seedlings overnight.`,
      detailKn: `ರಾತ್ರಿ ತಾಪಮಾನ ${minTemp3d.toFixed(1)}°C ವರೆಗೆ ಇಳಿಯಬಹುದು. ಸೂಕ್ಷ್ಮ ಸಸಿಮಡಿಗಳನ್ನು ರಾತ್ರಿ ವೇಳೆ ರಕ್ಷಿಸಿ.`,
      triggerMetric: `Min ${minTemp3d.toFixed(1)}°C`,
    });
  }

  if (
    (current.relativeHumidityPct !== null && current.relativeHumidityPct >= 82) ||
    next3Days.filter((d) => (d.precipitationSumMm ?? 0) >= 3).length >= 2
  ) {
    advisories.push({
      code: 'HUMID_DISEASE_SCOUTING',
      severity: 'MODERATE',
      titleEn: 'Humid Foliage Scouting Advisory',
      titleKn: 'ತೇವಾಂಶದಿಂದ ರೋಗ ಗಮನಿಸುವ ಸಲಹೆ',
      detailEn:
        'Elevated relative humidity or repeated wet spells can favor fungal and bacterial leaf spots. Inspect lower leaves regularly and ensure clean drainage.',
      detailKn:
        'ಹೆಚ್ಚಿನ ಆರ್ದ್ರತೆ ಅಥವಾ ಸತತ ತೇವಾಂಶವು ಶಿಲೀಂಧ್ರ ಮತ್ತು ಬ್ಯಾಕ್ಟೀರಿಯಾ ಎಲೆ ಚುಕ್ಕೆ ರೋಗಗಳಿಗೆ ಅನುಕೂಲವಾಗಬಹುದು. ಕೆಳಗಿನ ಎಲೆಗಳನ್ನು ನಿಯಮಿತವಾಗಿ ಪರಿಶೀಲಿಸಿ.',
      triggerMetric:
        current.relativeHumidityPct !== null
          ? `RH ${Math.round(current.relativeHumidityPct)}%`
          : 'Consecutive wet days',
    });
  }

  if (maxRainDay < 2 && maxWind3d < 15 && maxTemp3d < 36) {
    advisories.push({
      code: 'CLEAR_FIELD_WINDOW',
      severity: 'INFO',
      titleEn: 'Favorable Clear Field Operations Window',
      titleKn: 'ಕೃಷಿ ಚಟುವಟಿಕೆಗಳಿಗೆ ಅನುಕೂಲಕರ ಒಣ ಹವಾಮಾನ',
      detailEn: `Low rainfall (< ${Math.max(maxRainDay, 0).toFixed(1)} mm) and calm winds (< ${maxWind3d.toFixed(1)} km/h) over the next 3 days suit harvesting, threshing, and grain drying.`,
      detailKn:
        'ಮುಂದಿನ 3 ದಿನಗಳಲ್ಲಿ ಕಡಿಮೆ ಮಳೆ ಮತ್ತು ಶಾಂತ ಗಾಳಿ ಇರುವುದರಿಂದ ಕೊಯ್ಲು, ಒಕ್ಕಣೆ ಮತ್ತು ಧಾನ್ಯ ಒಣಗಿಸಲು ಅನುಕೂಲಕರವಾಗಿದೆ.',
      triggerMetric: `Rain < 2 mm · Wind ${maxWind3d.toFixed(1)} km/h`,
    });
  }

  return advisories;
}

export async function getWeatherForecast(params: {
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
  state?: string | null;
  district?: string | null;
  q?: string | null;
}): Promise<WeatherForecastResponse> {
  let lat = params.latitude ?? null;
  let lon = params.longitude ?? null;
  let resolvedName = params.locationName?.trim() || '';
  let resolvedState = params.state?.trim() || null;
  let resolvedDistrict = params.district?.trim() || null;
  let resolvedElevation: number | null = null;

  if ((lat !== null && lon === null) || (lat === null && lon !== null)) {
    throw new UpstreamApiError(
      400,
      'VALIDATION_ERROR',
      'Provide both latitude and longitude coordinates.',
    );
  }

  if (lat !== null && lon !== null) {
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      throw new UpstreamApiError(
        400,
        'VALIDATION_ERROR',
        'Coordinates out of range: latitude must be between -90 and 90, longitude between -180 and 180.',
      );
    }
    if (!resolvedName) {
      resolvedName = `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
    }
  } else {
    const queryCandidates = [
      params.q?.trim(),
      params.district?.trim(),
      params.state?.trim(),
    ].filter((v): v is string => Boolean(v && v.length >= 2));

    if (queryCandidates.length === 0) {
      throw new UpstreamApiError(
        400,
        'VALIDATION_ERROR',
        'Provide a location search name or latitude/longitude coordinates.',
      );
    }

    let matchedLoc: GeoLocationResult | null = null;
    for (const candidate of queryCandidates) {
      const hits = await searchOpenMeteoLocations(candidate);
      if (hits.length > 0) {
        if (params.state?.trim()) {
          const stateLower = params.state.trim().toLowerCase();
          matchedLoc =
            hits.find(
              (h) =>
                h.countryCode === 'IN' &&
                (h.state || '').toLowerCase().includes(stateLower),
            ) || hits[0];
        } else {
          matchedLoc = hits[0];
        }
        break;
      }
    }

    if (!matchedLoc) {
      throw new UpstreamApiError(
        404,
        'LOCATION_NOT_FOUND',
        `Could not resolve coordinates for "${queryCandidates[0]}". Try a nearby town or enter latitude and longitude manually.`,
      );
    }

    lat = matchedLoc.latitude;
    lon = matchedLoc.longitude;
    resolvedName = matchedLoc.name;
    resolvedState = matchedLoc.state;
    resolvedDistrict = matchedLoc.district || resolvedDistrict;
    resolvedElevation = matchedLoc.elevation;
  }

  const cfg = getOpenMeteoConfig();
  const qs = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: 'auto',
    forecast_days: '7',
    current:
      'temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m,weather_code',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset',
  });

  try {
    const res = await fetch(`${cfg.forecastUrl}?${qs.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(9000),
    });

    if (res.status === 429) {
      throw new UpstreamApiError(
        429,
        'RATE_LIMITED',
        'Open-Meteo daily/minute API limit reached. Please try again later.',
      );
    }
    if (!res.ok) {
      throw new UpstreamApiError(
        502,
        'UPSTREAM_ERROR',
        `Open-Meteo forecast API returned HTTP ${res.status}.`,
      );
    }

    const payload = (await res.json()) as {
      latitude: number;
      longitude: number;
      elevation?: number;
      timezone?: string;
      current?: {
        time?: string;
        temperature_2m?: number;
        relative_humidity_2m?: number;
        precipitation?: number;
        rain?: number;
        wind_speed_10m?: number;
        weather_code?: number;
      };
      daily?: {
        time?: string[];
        weather_code?: Array<number | null>;
        temperature_2m_max?: Array<number | null>;
        temperature_2m_min?: Array<number | null>;
        precipitation_sum?: Array<number | null>;
        precipitation_probability_max?: Array<number | null>;
        wind_speed_10m_max?: Array<number | null>;
        sunrise?: Array<string | null>;
        sunset?: Array<string | null>;
      };
    };

    if (!payload.current || !payload.daily || !Array.isArray(payload.daily.time)) {
      throw new UpstreamApiError(
        502,
        'UPSTREAM_ERROR',
        'Open-Meteo returned an incomplete forecast payload.',
      );
    }

    const currCode = payload.current.weather_code ?? null;
    const currDesc = describeWmoCode(currCode);
    const current: WeatherCurrentConditions = {
      time: payload.current.time || new Date().toISOString(),
      temperatureC: payload.current.temperature_2m ?? null,
      relativeHumidityPct: payload.current.relative_humidity_2m ?? null,
      precipitationMm: payload.current.precipitation ?? null,
      rainMm: payload.current.rain ?? null,
      windSpeedKmh: payload.current.wind_speed_10m ?? null,
      weatherCode: currCode,
      conditionEn: currDesc.en,
      conditionKn: currDesc.kn,
    };

    const dailyTimes = payload.daily.time;
    const daily: WeatherDailyForecast[] = dailyTimes.map((date, idx) => {
      const code = payload.daily?.weather_code?.[idx] ?? null;
      const desc = describeWmoCode(code);
      return {
        date,
        weatherCode: code,
        conditionEn: desc.en,
        conditionKn: desc.kn,
        tempMaxC: payload.daily?.temperature_2m_max?.[idx] ?? null,
        tempMinC: payload.daily?.temperature_2m_min?.[idx] ?? null,
        precipitationSumMm: payload.daily?.precipitation_sum?.[idx] ?? null,
        precipitationProbabilityMaxPct:
          payload.daily?.precipitation_probability_max?.[idx] ?? null,
        windSpeedMaxKmh: payload.daily?.wind_speed_10m_max?.[idx] ?? null,
        sunrise: payload.daily?.sunrise?.[idx] ?? null,
        sunset: payload.daily?.sunset?.[idx] ?? null,
      };
    });

    const advisories = buildWeatherAdvisories(current, daily);

    return {
      status: 'LIVE_OK',
      location: {
        name: resolvedName,
        state: resolvedState,
        district: resolvedDistrict,
        latitude: payload.latitude ?? lat,
        longitude: payload.longitude ?? lon,
        timezone: payload.timezone || 'auto',
        elevationM: payload.elevation ?? resolvedElevation,
      },
      sourceName: 'Open-Meteo Weather Forecast API',
      attributionText: 'Weather data by Open-Meteo.com (CC BY 4.0)',
      attributionUrl: 'https://open-meteo.com/',
      forecastPeriod: {
        startDate: daily[0]?.date || '',
        endDate: daily[daily.length - 1]?.date || '',
        days: daily.length,
      },
      updatedAt: new Date().toISOString(),
      current,
      daily,
      advisories,
    };
  } catch (err) {
    if (err instanceof UpstreamApiError) throw err;
    const isTimeout =
      err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
    throw new UpstreamApiError(
      503,
      isTimeout ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_ERROR',
      isTimeout
        ? 'Timed out while fetching weather data from Open-Meteo.'
        : 'Network failure while contacting Open-Meteo forecast API.',
    );
  }
}

export async function buildSmartAlerts(params: {
  state?: string | null;
  district?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  pestAlerts: Array<{
    id: string;
    titleEn: string;
    titleKn: string;
    cropNameEn: string;
    cropNameKn: string;
    state: string;
    district: string | null;
    verificationStatus: string;
    severity: 'LOW' | 'MODERATE' | 'HIGH';
    observedDate: string;
    sourceName: string;
    sourceUrl: string | null;
    summaryEn: string;
    summaryKn: string;
    active: boolean;
  }>;
}): Promise<SmartAlertsResponse> {
  const alerts: SmartAlertItem[] = [];
  const stateLower = (params.state || '').trim().toLowerCase();
  const districtLower = (params.district || '').trim().toLowerCase();

  // 1. Documented agricultural pest & disease alerts from DB
  const matchingPestAlerts = params.pestAlerts
    .filter((a) => a.active)
    .filter((a) => {
      if (!stateLower && !districtLower) return true;
      const alertState = a.state.toLowerCase();
      const alertDist = (a.district || '').toLowerCase();
      if (districtLower && alertDist && alertDist === districtLower) return true;
      if (stateLower && alertState === stateLower && (!alertDist || alertDist === districtLower)) {
        return true;
      }
      return alertState === stateLower;
    })
    .slice(0, 8);

  for (const p of matchingPestAlerts) {
    const verLabel =
      p.verificationStatus === 'CONFIRMED_OUTBREAK'
        ? { en: 'Confirmed Outbreak', kn: 'ದೃಢೀಕೃತ ರೋಗ ಉಲ್ಬಣ' }
        : p.verificationStatus === 'REPORTED_CASE'
          ? { en: 'Reported Case', kn: 'ವರದಿಯಾದ ಪ್ರಕರಣ' }
          : { en: 'Seasonal Risk Rule', kn: 'ಋತುಮಾನದ ಮುನ್ನೆಚ್ಚರಿಕೆ ನಿಯಮ' };

    alerts.push({
      id: `pest-${p.id}`,
      category: 'PEST_DISEASE',
      severity: p.severity,
      verificationLabelEn: verLabel.en,
      verificationLabelKn: verLabel.kn,
      titleEn: p.titleEn,
      titleKn: p.titleKn,
      detailEn: p.summaryEn,
      detailKn: p.summaryKn,
      regionLabel: p.district ? `${p.district}, ${p.state}` : p.state,
      cropLabel: p.cropNameEn,
      sourceName: p.sourceName,
      sourceUrl: p.sourceUrl,
      observedOrValidDate: p.observedDate,
    });
  }

  // 2. Live Open-Meteo weather risk alerts if location or coordinates available
  let weatherCheckStatus: SmartAlertsResponse['weatherCheckStatus'] = 'NO_LOCATION';
  let weatherStatusNoteEn =
    'No district or coordinates available to evaluate live weather risks.';
  let weatherStatusNoteKn =
    'ನೇರ ಹವಾಮಾನ ಅಪಾಯಗಳನ್ನು ಪರಿಶೀಲಿಸಲು ಜಿಲ್ಲೆ ಅಥವಾ ಅಕ್ಷಾಂಶ/ರೇಖಾಂಶ ಲಭ್ಯವಿಲ್ಲ.';
  let locationLabel =
    [params.district, params.state].filter(Boolean).join(', ') || 'Selected region';

  const hasCoords =
    params.latitude !== null &&
    params.latitude !== undefined &&
    params.longitude !== null &&
    params.longitude !== undefined;
  const hasLocationQuery = Boolean(params.district?.trim() || params.state?.trim());

  if (hasCoords || hasLocationQuery) {
    try {
      const weather = await getWeatherForecast({
        latitude: hasCoords ? params.latitude : null,
        longitude: hasCoords ? params.longitude : null,
        q: !hasCoords ? params.district || params.state : null,
        state: params.state,
        district: params.district,
      });
      weatherCheckStatus = 'LIVE_OK';
      locationLabel = [weather.location.name, weather.location.state].filter(Boolean).join(', ');
      weatherStatusNoteEn = `Evaluated live against Open-Meteo forecast (${weather.forecastPeriod.startDate} to ${weather.forecastPeriod.endDate}).`;
      weatherStatusNoteKn = `Open-Meteo ನೇರ ಮುನ್ಸೂಚನೆಯೊಂದಿಗೆ ಪರಿಶೀಲಿಸಲಾಗಿದೆ (${weather.forecastPeriod.startDate} ರಿಂದ ${weather.forecastPeriod.endDate}).`;

      for (const adv of weather.advisories) {
        if (adv.severity === 'HIGH' || adv.severity === 'MODERATE') {
          alerts.push({
            id: `weather-${adv.code}`,
            category: 'WEATHER_RISK',
            severity: adv.severity,
            verificationLabelEn: `Open-Meteo Forecast · ${adv.triggerMetric}`,
            verificationLabelKn: `Open-Meteo ಮುನ್ಸೂಚನೆ · ${adv.triggerMetric}`,
            titleEn: adv.titleEn,
            titleKn: adv.titleKn,
            detailEn: adv.detailEn,
            detailKn: adv.detailKn,
            regionLabel: locationLabel,
            cropLabel: null,
            sourceName: 'Open-Meteo Weather API (CC BY 4.0)',
            sourceUrl: 'https://open-meteo.com/',
            observedOrValidDate: weather.forecastPeriod.startDate,
          });
        }
      }
    } catch {
      weatherCheckStatus = 'UNAVAILABLE';
      weatherStatusNoteEn =
        'Live Open-Meteo weather check could not complete right now. Only verified stored agricultural advisories are shown below.';
      weatherStatusNoteKn =
        'ಪ್ರಸ್ತುತ Open-Meteo ನೇರ ಹವಾಮಾನ ಪರಿಶೀಲನೆ ಪೂರ್ಣಗೊಳ್ಳಲಿಲ್ಲ. ಪರಿಶೀಲಿಸಿದ ಕೃಷಿ ಸಲಹೆಗಳನ್ನು ಮಾತ್ರ ಕೆಳಗೆ ತೋರಿಸಲಾಗಿದೆ.';
    }
  }

  // Prioritize HIGH -> MODERATE -> LOW
  const rank = { HIGH: 0, MODERATE: 1, LOW: 2 };
  alerts.sort((a, b) => rank[a.severity] - rank[b.severity]);

  return {
    generatedAt: new Date().toISOString(),
    locationLabel,
    weatherCheckStatus,
    weatherStatusNoteEn,
    weatherStatusNoteKn,
    alerts,
    honestyDisclosureEn:
      'Smart Alerts combine real Open-Meteo forecast thresholds with documented pest bulletins. Synthetic weather warnings or unverified market price spike alerts are never generated.',
    honestyDisclosureKn:
      'ಸ್ಮಾರ್ಟ್ ಎಚ್ಚರಿಕೆಗಳು ನೈಜ Open-Meteo ಹವಾಮಾನ ಮೌಲ್ಯಗಳು ಮತ್ತು ದಾಖಲಿತ ಕೀಟ/ರೋಗ ಸೂಚನೆಗಳನ್ನು ಮಾತ್ರ ಒಳಗೊಂಡಿವೆ. ನಕಲಿ ಹವಾಮಾನ ಅಥವಾ ಮಾರುಕಟ್ಟೆ ಎಚ್ಚರಿಕೆಗಳನ್ನು ರಚಿಸಲಾಗುವುದಿಲ್ಲ.',
  };
}
