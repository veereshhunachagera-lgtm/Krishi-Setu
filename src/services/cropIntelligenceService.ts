import type {
  AlternativeComparisonResponse,
  CropKnowledgeItem,
  CropRecommendationResponse,
  SavedCropPlan,
  SavedCropPlanPayload,
  SoilAnalysisResponse,
} from '../types/cropIntelligence';
import { apiRequest } from './apiClient';

export const cropIntelligenceService = {
  searchCrops(filters: {
    q?: string;
    season?: string;
    soilType?: string;
    waterRequirement?: string;
    category?: string;
  } = {}) {
    const params = new URLSearchParams();
    if (filters.q?.trim()) params.set('q', filters.q.trim());
    if (filters.season && filters.season !== 'ALL') params.set('season', filters.season);
    if (filters.soilType && filters.soilType !== 'ALL') params.set('soilType', filters.soilType);
    if (filters.waterRequirement && filters.waterRequirement !== 'ALL') {
      params.set('waterRequirement', filters.waterRequirement);
    }
    if (filters.category && filters.category !== 'ALL') params.set('category', filters.category);

    const qs = params.toString();
    return apiRequest<CropKnowledgeItem[]>(`/api/v1/crop-intelligence/crops${qs ? `?${qs}` : ''}`);
  },

  getCropDetail(cropCode: string) {
    return apiRequest<CropKnowledgeItem>(`/api/v1/crop-intelligence/crops/${encodeURIComponent(cropCode)}`);
  },

  getRecommendations(overrides: {
    season?: string;
    irrigation?: string;
    soilType?: string;
  } = {}) {
    const params = new URLSearchParams();
    if (overrides.season) params.set('season', overrides.season);
    if (overrides.irrigation) params.set('irrigation', overrides.irrigation);
    if (overrides.soilType) params.set('soilType', overrides.soilType);
    const qs = params.toString();
    return apiRequest<CropRecommendationResponse>(
      `/api/v1/crop-intelligence/recommendations${qs ? `?${qs}` : ''}`,
    );
  },

  compareAlternatives(
    cropCodes: string[],
    overrides: { season?: string; irrigation?: string } = {},
  ) {
    const params = new URLSearchParams();
    params.set('crops', cropCodes.join(','));
    if (overrides.season) params.set('season', overrides.season);
    if (overrides.irrigation) params.set('irrigation', overrides.irrigation);
    return apiRequest<AlternativeComparisonResponse>(
      `/api/v1/crop-intelligence/compare?${params.toString()}`,
    );
  },

  getSoilAnalysis() {
    return apiRequest<SoilAnalysisResponse>('/api/v1/crop-intelligence/soil-analysis');
  },

  listSavedPlans() {
    return apiRequest<SavedCropPlan[]>('/api/v1/crop-intelligence/plans');
  },

  savePlan(payload: SavedCropPlanPayload) {
    return apiRequest<SavedCropPlan>('/api/v1/crop-intelligence/plans', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  deletePlan(planId: string) {
    return apiRequest<void>(`/api/v1/crop-intelligence/plans/${encodeURIComponent(planId)}`, {
      method: 'DELETE',
    });
  },

  // Admin Dataset Management
  adminListCrops() {
    return apiRequest<CropKnowledgeItem[]>('/api/v1/admin/crops');
  },

  adminCreateCrop(payload: Record<string, unknown>) {
    return apiRequest<CropKnowledgeItem>('/api/v1/admin/crops', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  adminDeleteCrop(id: string) {
    return apiRequest<void>(`/api/v1/admin/crops/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  adminSyncSeed() {
    return apiRequest<{ importedCount: number }>('/api/v1/admin/crops/sync-seed', {
      method: 'POST',
    });
  },
};
