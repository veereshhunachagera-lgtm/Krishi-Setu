import type { SupportedLanguage, UserSummary } from '../types/auth';

const TOKEN_KEY = 'krishisetu_auth_token';
const USER_KEY = 'krishisetu_auth_user';
const LANG_KEY = 'krishisetu_preferred_language';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredSession(token: string, user: UserSummary): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(LANG_KEY, user.preferredLanguage);
  } catch {
    // Ignore storage quota errors
  }
}

export function getStoredUser(): UserSummary | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UserSummary) : null;
  } catch {
    return null;
  }
}

export function clearStoredSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // Ignore
  }
}

export function getStoredLanguage(): SupportedLanguage {
  try {
    const val = localStorage.getItem(LANG_KEY);
    return val === 'kn' ? 'kn' : 'en';
  } catch {
    return 'en';
  }
}

export function setStoredLanguage(lang: SupportedLanguage): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // Ignore
  }
}
