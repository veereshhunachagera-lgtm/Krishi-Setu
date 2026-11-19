import type {
  PestDiseaseAlertCreatePayload,
  PestDiseaseAlertItem,
  PlantDiseaseScanItem,
  PlantProtectionGuideItem,
  ScannerStatusInfo,
} from '../types/plantHealth';
import { apiRequest } from './apiClient';

export const plantHealthService = {
  getScannerStatus(): Promise<ScannerStatusInfo> {
    return apiRequest<ScannerStatusInfo>('/api/v1/plant-health/scanner/status');
  },

  analyzeLeafImage(params: {
    file: File;
    cropCode?: string;
    farmerNotes?: string;
  }): Promise<PlantDiseaseScanItem> {
    const formData = new FormData();
    formData.append('image', params.file);
    if (params.cropCode) {
      formData.append('cropCode', params.cropCode);
    }
    if (params.farmerNotes?.trim()) {
      formData.append('farmerNotes', params.farmerNotes.trim());
    }
    return apiRequest<PlantDiseaseScanItem>('/api/v1/plant-health/scanner/analyze', {
      method: 'POST',
      body: formData,
    });
  },

  getScanHistory(): Promise<PlantDiseaseScanItem[]> {
    return apiRequest<PlantDiseaseScanItem[]>('/api/v1/plant-health/scanner/history');
  },

  listAlerts(filters?: {
    state?: string;
    district?: string;
    cropCode?: string;
    verificationStatus?: string;
  }): Promise<PestDiseaseAlertItem[]> {
    const query = new URLSearchParams();
    if (filters?.state) query.set('state', filters.state);
    if (filters?.district) query.set('district', filters.district);
    if (filters?.cropCode) query.set('cropCode', filters.cropCode);
    if (filters?.verificationStatus) query.set('verificationStatus', filters.verificationStatus);
    const qs = query.toString();
    return apiRequest<PestDiseaseAlertItem[]>(`/api/v1/plant-health/alerts${qs ? `?${qs}` : ''}`);
  },

  listGuides(filters?: {
    q?: string;
    cropCode?: string;
    issueType?: string;
  }): Promise<PlantProtectionGuideItem[]> {
    const query = new URLSearchParams();
    if (filters?.q) query.set('q', filters.q);
    if (filters?.cropCode) query.set('cropCode', filters.cropCode);
    if (filters?.issueType) query.set('issueType', filters.issueType);
    const qs = query.toString();
    return apiRequest<PlantProtectionGuideItem[]>(
      `/api/v1/plant-health/guidance${qs ? `?${qs}` : ''}`,
    );
  },

  adminListAlerts(): Promise<PestDiseaseAlertItem[]> {
    return apiRequest<PestDiseaseAlertItem[]>('/api/v1/admin/plant-health/alerts');
  },

  adminCreateAlert(payload: PestDiseaseAlertCreatePayload): Promise<PestDiseaseAlertItem> {
    return apiRequest<PestDiseaseAlertItem>('/api/v1/admin/plant-health/alerts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  adminDeleteAlert(id: string): Promise<void> {
    return apiRequest<void>(`/api/v1/admin/plant-health/alerts/${id}`, {
      method: 'DELETE',
    });
  },

  adminSyncSeed(): Promise<{ alertsImported: number; guidesImported: number }> {
    return apiRequest<{ alertsImported: number; guidesImported: number }>(
      '/api/v1/admin/plant-health/sync-seed',
      { method: 'POST' },
    );
  },

  adminListGuides(): Promise<PlantProtectionGuideItem[]> {
    return apiRequest<PlantProtectionGuideItem[]>('/api/v1/admin/plant-health/guides');
  },

  adminCreateGuide(payload: import('../types/plantHealth').PlantProtectionGuideUpsertPayload): Promise<PlantProtectionGuideItem> {
    return apiRequest<PlantProtectionGuideItem>('/api/v1/admin/plant-health/guides', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  adminDeleteGuide(id: string): Promise<void> {
    return apiRequest<void>(`/api/v1/admin/plant-health/guides/${id}`, {
      method: 'DELETE',
    });
  },
};
