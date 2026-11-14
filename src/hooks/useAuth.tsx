import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/authService';
import type { AuthResponse, SupportedLanguage, UserSummary } from '../types/auth';
import {
  clearStoredSession,
  getStoredLanguage,
  getStoredToken,
  getStoredUser,
  setStoredLanguage,
  setStoredSession,
} from '../utils/storage';

interface AuthContextValue {
  user: UserSummary | null;
  token: string | null;
  initializing: boolean;
  language: SupportedLanguage;
  switchLanguage: (lang: SupportedLanguage) => Promise<void>;
  applyAuthResponse: (res: AuthResponse) => void;
  refreshUser: () => Promise<UserSummary | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const [user, setUser] = useState<UserSummary | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [initializing, setInitializing] = useState<boolean>(() => Boolean(getStoredToken()));
  const [language, setLanguage] = useState<SupportedLanguage>(() => getStoredLanguage());

  useEffect(() => {
    let active = true;
    const existingToken = getStoredToken();
    if (!existingToken) {
      setInitializing(false);
      return;
    }

    authService
      .getCurrentUser()
      .then((freshUser) => {
        if (!active) return;
        setUser(freshUser);
        setStoredSession(existingToken, freshUser);
      })
      .catch(() => {
        if (!active) return;
        clearStoredSession();
        setUser(null);
        setToken(null);
      })
      .finally(() => {
        if (active) setInitializing(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const switchLanguage = useCallback(
    async (lang: SupportedLanguage) => {
      setLanguage(lang);
      setStoredLanguage(lang);
      await i18n.changeLanguage(lang);
      document.documentElement.lang = lang;

      if (getStoredToken()) {
        try {
          const updated = await authService.updateLanguage(lang);
          const currentToken = getStoredToken();
          if (currentToken) {
            setUser(updated);
            setStoredSession(currentToken, updated);
          }
        } catch {
          // Keep local UI language active even if network sync fails temporarily
        }
      }
    },
    [i18n],
  );

  const applyAuthResponse = useCallback((res: AuthResponse) => {
    setToken(res.token);
    setUser(res.user);
    setStoredSession(res.token, res.user);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) return null;
    const fresh = await authService.getCurrentUser();
    setUser(fresh);
    setStoredSession(currentToken, fresh);
    return fresh;
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        initializing,
        language,
        switchLanguage,
        applyAuthResponse,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
