import { apiRequest } from './apiClient';
import type { AdminOverview } from '../types/notification';

export const adminService = {
  getOverview(): Promise<AdminOverview> {
    return apiRequest<AdminOverview>('/api/v1/admin/overview');
  },
};
