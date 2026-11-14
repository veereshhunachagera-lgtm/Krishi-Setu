import { ArrowLeft, Info, Sprout } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { FormField, inputBaseClass } from '../components/FormField';
import { LanguageSelector } from '../components/LanguageSelector';
import { ErrorBanner } from '../components/StatePanels';
import { useAuth } from '../hooks/useAuth';
import { ApiClientError } from '../services/apiClient';
import { authService } from '../services/authService';
import type { AuthResponse } from '../types/auth';
import { cn } from '../utils/cn';
import { isValidEmail } from '../utils/validation';

interface FarmerAuthPageProps {
  initialMode?: 'login' | 'register';
  onAuthenticated: (res: AuthResponse) => void;
  onBackHome: () => void;
}

export function FarmerAuthPage({
  initialMode = 'login',
  onAuthenticated,
  onBackHome,
}: FarmerAuthPageProps) {
  const { t } = useTranslation();
  const { language, applyAuthResponse } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const nextErrors: Record<string, string> = {};
    if (mode === 'register' && fullName.trim().length < 2) {
      nextErrors.fullName = 'validation.fullNameRequired';
    }
    if (!isValidEmail(email)) {
      nextErrors.email = 'validation.emailInvalid';
    }
    if (password.length < 8) {
      nextErrors.password = 'validation.passwordMin';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const response =
        mode === 'register'
          ? await authService.registerFarmer({
              fullName: fullName.trim(),
              email: email.trim(),
              password,
              preferredLanguage: language,
            })
          : await authService.loginFarmer({
              email: email.trim(),
              password,
            });
      applyAuthResponse(response);
      onAuthenticated(response);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setServerError(err.message);
      } else {
        setServerError(t('errors.generic'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setServerError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      const response = await authService.loginFarmer({
        email: 'ramesh.farmer@krishisetu.in',
        password: 'Farmer@123',
      });
      applyAuthResponse(response);
      onAuthenticated(response);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4] text-[#17221B]">
      <header className="border-b border-[#E5E1D8] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 sm:px-6 py-3.5">
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-2 font-display text-lg font-bold text-[#1B4332] cursor-pointer whitespace-nowrap"
          >
            <Sprout className="h-5 w-5 text-[#2D6A4F]" aria-hidden="true" />
            <span>{t('brand.name')}</span>
          </button>
          <div className="flex items-center gap-3">
            <LanguageSelector compact />
            <Button variant="ghost" size="sm" onClick={onBackHome}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t('auth.backToPublic')}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-5">
          <div className="rounded-xl border border-[#E5E1D8] bg-white p-6 sm:p-8 space-y-6">
            <div className="space-y-1.5">
              <h1 className="font-display text-2xl font-bold tracking-tight text-[#17221B]">
                {t('auth.farmerPortalTitle')}
              </h1>
              <p className="text-sm text-[#4A5A50]">{t('auth.farmerPortalSubtitle')}</p>
            </div>

            {/* Segmented Mode Tabs */}
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#F2EFE8] p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setFieldErrors({});
                  setServerError(null);
                }}
                className={cn(
                  'rounded-md py-2 text-xs font-semibold transition-colors cursor-pointer',
                  mode === 'login'
                    ? 'bg-white text-[#17221B] shadow-xs'
                    : 'text-[#4A5A50] hover:text-[#17221B]',
                )}
              >
                {t('auth.signInTab')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setFieldErrors({});
                  setServerError(null);
                }}
                className={cn(
                  'rounded-md py-2 text-xs font-semibold transition-colors cursor-pointer',
                  mode === 'register'
                    ? 'bg-white text-[#17221B] shadow-xs'
                    : 'text-[#4A5A50] hover:text-[#17221B]',
                )}
              >
                {t('auth.registerTab')}
              </button>
            </div>

            {serverError && <ErrorBanner message={serverError} />}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {mode === 'register' && (
                <FormField
                  label={t('auth.fullNameLabel')}
                  htmlFor="auth-fullname"
                  required
                  error={fieldErrors.fullName ? t(fieldErrors.fullName) : undefined}
                >
                  <input
                    id="auth-fullname"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('auth.fullNamePlaceholder')}
                    className={inputBaseClass}
                  />
                </FormField>
              )}

              <FormField
                label={t('auth.emailLabel')}
                htmlFor="auth-email"
                required
                error={fieldErrors.email ? t(fieldErrors.email) : undefined}
              >
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  className={inputBaseClass}
                />
              </FormField>

              <FormField
                label={t('auth.passwordLabel')}
                htmlFor="auth-password"
                required
                error={fieldErrors.password ? t(fieldErrors.password) : undefined}
              >
                <input
                  id="auth-password"
                  type="password"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className={inputBaseClass}
                />
              </FormField>

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting
                  ? mode === 'register'
                    ? t('auth.registering')
                    : t('auth.signingIn')
                  : mode === 'register'
                    ? t('auth.registerButton')
                    : t('auth.signInButton')}
              </Button>
            </form>

            <div className="border-t border-[#E5E1D8] pt-4 space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#17221B]">{t('auth.demoAccountTitle')}</p>
                <p className="text-xs text-[#4A5A50] font-mono">{t('auth.demoAccountDetails')}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={handleDemoLogin}
                disabled={submitting}
              >
                {t('auth.useDemoFarmer')}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-[#E5E1D8] bg-white px-4 py-3.5 text-xs text-[#4A5A50] flex items-start gap-2.5">
            <Info className="h-4 w-4 text-[#2D6A4F] shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-0.5">
              <p className="font-semibold text-[#17221B]">{t('auth.devNoticeTitle')}</p>
              <p className="leading-relaxed">{t('auth.devNoticeBody')}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
