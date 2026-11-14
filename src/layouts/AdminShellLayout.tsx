import { LogOut, ShieldCheck } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../components/LanguageSelector';
import { useAuth } from '../hooks/useAuth';

interface AdminShellLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export function AdminShellLayout({ children, onLogout }: AdminShellLayoutProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4] text-[#17221B]">
      <header className="sticky top-0 z-30 border-b border-[#E5E1D8] bg-[#0F291E] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldCheck className="h-5 w-5 text-[#A7F3D0] shrink-0" aria-hidden="true" />
            <span className="font-display text-base font-bold tracking-tight whitespace-nowrap">
              {t('brand.name')}
            </span>
            <span className="hidden sm:inline text-white/40" aria-hidden="true">·</span>
            <span className="hidden sm:inline text-xs text-white/80 truncate">
              {user?.email}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <LanguageSelector compact />
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/15 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>{t('common.logout')}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
