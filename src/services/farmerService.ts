import { apiRequest } from './apiClient';
import type { FarmerProfile, FarmerProfilePayload } from '../types/farmer';

export const farmerService = {
  getProfile(): Promise<FarmerProfile> {
    return apiRequest<FarmerProfile>('/api/v1/farmer/profile');
  },

  saveProfile(payload: FarmerProfilePayload): Promise<FarmerProfile> {
    return apiRequest<FarmerProfile>('/api/v1/farmer/profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
