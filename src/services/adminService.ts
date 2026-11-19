import { apiRequest } from './apiClient';
import type {
  AdminAnalyticsResponse,
  AdminFarmerAccount,
  AdminOverview,
  IntegrationsOverviewResponse,
  IntegrationsProbeResponse,
} from '../types/notification';

export const adminService = {
  getOverview(): Promise<AdminOverview> {
    return apiRequest<AdminOverview>('/api/v1/admin/overview');
  },

  listFarmers(): Promise<AdminFarmerAccount[]> {
    return apiRequest<AdminFarmerAccount[]>('/api/v1/admin/farmers');
  },

  updateFarmerStatus(id: string, active: boolean): Promise<AdminFarmerAccount> {
    return apiRequest<AdminFarmerAccount>(`/api/v1/admin/farmers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    });
  },

  getAnalytics(): Promise<AdminAnalyticsResponse> {
    return apiRequest<AdminAnalyticsResponse>('/api/v1/admin/analytics');
  },

  getIntegrationsStatus(): Promise<IntegrationsOverviewResponse> {
    return apiRequest<IntegrationsOverviewResponse>('/api/v1/admin/integrations/status');
  },

  probeIntegrations(): Promise<IntegrationsProbeResponse> {
    return apiRequest<IntegrationsProbeResponse>('/api/v1/admin/integrations/probe', {
      method: 'POST',
    });
  },
};
