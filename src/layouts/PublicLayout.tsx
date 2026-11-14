import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { LanguageSelector } from '../components/LanguageSelector';
import { useAuth } from '../hooks/useAuth';

interface PublicLayoutProps {
  children: React.ReactNode;
  onNavigateHome: () => void;
  onNavigateLogin: () => void;
  onNavigateDashboard: () => void;
  onNavigateAdminLogin: () => void;
}

export function PublicLayout({
  children,
  onNavigateHome,
  onNavigateLogin,
  onNavigateDashboard,
  onNavigateAdminLogin,
}: PublicLayoutProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4] text-[#17221B]">
      <header className="sticky top-0 z-30 border-b border-[#E5E1D8] bg-[#FAF8F4]/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 py-3.5">
          <button
            type="button"
            onClick={onNavigateHome}
            className="font-display text-xl font-bold tracking-tight text-[#1B4332] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]"
          >
            {t('brand.name')}
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#4A5A50]">
            <a
              href="#capabilities"
              className="hover:text-[#1B4332] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              {t('nav.capabilities')}
            </a>
            <a
              href="#onboarding-paths"
              className="hover:text-[#1B4332] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              {t('nav.onboarding')}
            </a>
            <a
              href="#languages"
              className="hover:text-[#1B4332] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              {t('nav.languages')}
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <LanguageSelector compact />
            {user?.role === 'FARMER' ? (
              <Button size="sm" onClick={onNavigateDashboard}>
                {t('nav.openDashboard')}
              </Button>
            ) : (
              <Button size="sm" onClick={onNavigateLogin}>
                {t('nav.farmerLogin')}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[#E5E1D8] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-8 text-sm text-[#4A5A50]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display font-semibold text-[#17221B]">{t('brand.name')}</span>
            <span aria-hidden="true">·</span>
            <span>{t('landing.footer.copyright')}</span>
            <span aria-hidden="true">·</span>
            <span>{t('landing.footer.phaseLabel')}</span>
          </div>
          <button
            type="button"
            onClick={onNavigateAdminLogin}
            className="text-xs font-medium text-[#4A5A50] hover:text-[#1B4332] hover:underline underline-offset-4 cursor-pointer whitespace-nowrap"
          >
            {t('landing.footer.adminLink')}
          </button>
        </div>
      </footer>
    </div>
  );
}
