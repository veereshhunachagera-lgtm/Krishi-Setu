export type UserRole = 'FARMER' | 'ADMIN';
export type SupportedLanguage = 'en' | 'kn';

export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  preferredLanguage: SupportedLanguage;
  onboardingCompleted: boolean;
}

export interface AuthResponse {
  token: string;
  user: UserSummary;
}

export interface ApiErrorPayload {
  status: number;
  error: string;
  message: string;
  fieldErrors: Record<string, string> | null;
  timestamp: string;
}
