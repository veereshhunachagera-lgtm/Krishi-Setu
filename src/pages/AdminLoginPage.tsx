import { ArrowLeft, ShieldCheck } from 'lucide-react';
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
import { isValidEmail } from '../utils/validation';

interface AdminLoginPageProps {
  onAuthenticated: (res: AuthResponse) => void;
  onBackHome: () => void;
}

export function AdminLoginPage({ onAuthenticated, onBackHome }: AdminLoginPageProps) {
  const { t } = useTranslation();
  const { applyAuthResponse } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(email)) {
      setError(t('validation.emailInvalid'));
      return;
    }
    if (password.length < 8) {
      setError(t('validation.passwordMin'));
      return;
    }

    setSubmitting(true);
    try {
      const response = await authService.loginAdmin({ email: email.trim(), password });
      applyAuthResponse(response);
      onAuthenticated(response);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError(t('errors.generic'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setEmail('admin@krishisetu.in');
    setPassword('Admin@123');
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4] text-[#17221B]">
      <header className="border-b border-[#E5E1D8] bg-[#0F291E] text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 sm:px-6 py-3.5">
          <div className="inline-flex items-center gap-2 font-display text-lg font-bold">
            <ShieldCheck className="h-5 w-5 text-[#A7F3D0]" aria-hidden="true" />
            <span>{t('brand.name')}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector compact />
            <Button variant="secondary" size="sm" onClick={onBackHome}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t('auth.backToPublic')}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-xl border border-[#E5E1D8] bg-white p-6 sm:p-8 space-y-6">
          <div className="space-y-1.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#17221B]">
              {t('auth.adminLoginTitle')}
            </h1>
            <p className="text-sm text-[#4A5A50]">{t('auth.adminLoginSubtitle')}</p>
          </div>

          {error && <ErrorBanner message={error} />}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <FormField label={t('auth.emailLabel')} htmlFor="admin-email" required>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.adminEmailPlaceholder')}
                className={inputBaseClass}
              />
            </FormField>

            <FormField label={t('auth.passwordLabel')} htmlFor="admin-password" required>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                className={inputBaseClass}
              />
            </FormField>

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? t('auth.signingIn') : t('auth.adminSignInButton')}
            </Button>
          </form>

          <div className="border-t border-[#E5E1D8] pt-4 space-y-2.5">
            <p className="text-xs font-mono text-[#4A5A50]">{t('auth.adminDemoNote')}</p>
            <Button type="button" variant="secondary" size="sm" onClick={handleFillDemoAdmin}>
              {t('auth.useDemoAdmin')}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
