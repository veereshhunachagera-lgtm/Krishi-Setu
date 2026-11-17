import type {
  AdminMandiCreatePayload,
  GeoLocationResult,
  MandiPriceRecord,
  MandiPricesResponse,
  PriceTrendsResponse,
  SmartAlertsResponse,
  WeatherForecastResponse,
} from '../types/marketWeather';
import { apiRequest } from './apiClient';

export const marketWeatherService = {
  getMandiPrices(params?: {
    commodity?: string;
    state?: string;
    district?: string;
    market?: string;
    q?: string;
    limit?: number;
    offset?: number;
  }): Promise<MandiPricesResponse> {
    const qs = new URLSearchParams();
    if (params?.commodity) qs.set('commodity', params.commodity);
    if (params?.state) qs.set('state', params.state);
    if (params?.district) qs.set('district', params.district);
    if (params?.market) qs.set('market', params.market);
    if (params?.q) qs.set('q', params.q);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiRequest<MandiPricesResponse>(`/api/v1/market-weather/mandi-prices${suffix}`);
  },

  getPriceTrends(params?: {
    commodity?: string;
    market?: string;
    district?: string;
    state?: string;
    days?: number;
  }): Promise<PriceTrendsResponse> {
    const qs = new URLSearchParams();
    if (params?.commodity) qs.set('commodity', params.commodity);
    if (params?.market) qs.set('market', params.market);
    if (params?.district) qs.set('district', params.district);
    if (params?.state) qs.set('state', params.state);
    if (params?.days) qs.set('days', String(params.days));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiRequest<PriceTrendsResponse>(`/api/v1/market-weather/trends${suffix}`);
  },

  searchLocations(q: string): Promise<GeoLocationResult[]> {
    const qs = new URLSearchParams({ q: q.trim() });
    return apiRequest<GeoLocationResult[]>(`/api/v1/market-weather/locations/search?${qs.toString()}`);
  },

  getWeatherForecast(params?: {
    lat?: number;
    lon?: number;
    locationName?: string;
    q?: string;
  }): Promise<WeatherForecastResponse> {
    const qs = new URLSearchParams();
    if (params?.lat !== undefined && params?.lon !== undefined) {
      qs.set('lat', String(params.lat));
      qs.set('lon', String(params.lon));
    }
    if (params?.locationName) qs.set('locationName', params.locationName);
    if (params?.q) qs.set('q', params.q);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiRequest<WeatherForecastResponse>(`/api/v1/market-weather/weather${suffix}`);
  },

  getSmartAlerts(params?: { lat?: number; lon?: number }): Promise<SmartAlertsResponse> {
    const qs = new URLSearchParams();
    if (params?.lat !== undefined && params?.lon !== undefined) {
      qs.set('lat', String(params.lat));
      qs.set('lon', String(params.lon));
    }
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiRequest<SmartAlertsResponse>(`/api/v1/market-weather/smart-alerts${suffix}`);
  },

  adminListPrices(): Promise<MandiPriceRecord[]> {
    return apiRequest<MandiPriceRecord[]>('/api/v1/admin/market/prices');
  },

  adminCreatePrice(payload: AdminMandiCreatePayload): Promise<MandiPriceRecord> {
    return apiRequest<MandiPriceRecord>('/api/v1/admin/market/prices', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  adminDeletePrice(id: string): Promise<void> {
    return apiRequest<void>(`/api/v1/admin/market/prices/${id}`, {
      method: 'DELETE',
    });
  },

  adminSyncLive(params?: { state?: string; commodity?: string }): Promise<{
    status: string;
    syncedCount: number;
    totalStored: number;
    messageEn: string;
  }> {
    return apiRequest('/api/v1/admin/market/sync-live', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  },
};
