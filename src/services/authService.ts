import { apiRequest } from './apiClient';
import type { AuthResponse, SupportedLanguage, UserSummary } from '../types/auth';

export const authService = {
  registerFarmer(payload: {
    fullName: string;
    email: string;
    password: string;
    preferredLanguage: SupportedLanguage;
  }): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  loginFarmer(payload: { email: string; password: string }): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  loginAdmin(payload: { email: string; password: string }): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/api/v1/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getCurrentUser(): Promise<UserSummary> {
    return apiRequest<UserSummary>('/api/v1/auth/me');
  },

  updateLanguage(preferredLanguage: SupportedLanguage): Promise<UserSummary> {
    return apiRequest<UserSummary>('/api/v1/auth/language', {
      method: 'PATCH',
      body: JSON.stringify({ preferredLanguage }),
    });
  },
};
