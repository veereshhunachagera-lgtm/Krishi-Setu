import { Bell, LogOut, Sprout, User as UserIcon } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../components/LanguageSelector';
import { NotificationDrawer } from '../components/NotificationDrawer';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';

interface FarmerShellLayoutProps {
  children: React.ReactNode;
  onNavigateDashboard: () => void;
  onNavigateProfile: () => void;
  onLogout: () => void;
  showWorkspaceNav?: boolean;
}

export function FarmerShellLayout({
  children,
  onNavigateDashboard,
  onNavigateProfile,
  onLogout,
  showWorkspaceNav = true,
}: FarmerShellLayoutProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { items, unreadCount, loading, markRead, markAllRead } = useNotifications(
    Boolean(user) && showWorkspaceNav,
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4] text-[#17221B]">
      <header className="sticky top-0 z-30 border-b border-[#E5E1D8] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-3">
          <button
            type="button"
            onClick={onNavigateDashboard}
            className="inline-flex items-center gap-2 font-display text-lg font-bold tracking-tight text-[#1B4332] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]"
          >
            <Sprout className="h-5 w-5 text-[#2D6A4F]" aria-hidden="true" />
            <span>{t('brand.name')}</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <LanguageSelector />

            {showWorkspaceNav && (
              <>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  aria-label={t('common.notifications')}
                  className="relative inline-flex items-center gap-1.5 rounded-lg border border-[#E5E1D8] bg-white px-3 py-2 text-xs font-medium text-[#17221B] hover:bg-[#FAF8F4] transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[38px]"
                >
                  <Bell className="h-4 w-4 text-[#1B4332]" aria-hidden="true" />
                  <span className="hidden md:inline">{t('common.notifications')}</span>
                  {unreadCount > 0 && (
                    <span className="ml-0.5 inline-flex min-w-[18px] items-center justify-center rounded-md bg-[#1B4332] px-1.5 py-0.5 text-[11px] font-semibold text-white tabular-nums">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onNavigateProfile}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E1D8] bg-white px-3 py-2 text-xs font-medium text-[#17221B] hover:bg-[#FAF8F4] transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[38px]"
                >
                  <UserIcon className="h-4 w-4 text-[#1B4332]" aria-hidden="true" />
                  <span className="hidden sm:inline max-w-[130px] truncate">
                    {user?.fullName || t('common.profile')}
                  </span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E1D8] bg-white px-3 py-2 text-xs font-medium text-[#4A5A50] hover:text-[#991B1B] hover:border-[#FECACA] hover:bg-[#FEF2F2] transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[38px]"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t('common.logout')}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      <NotificationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={items}
        loading={loading}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
      />
    </div>
  );
}
