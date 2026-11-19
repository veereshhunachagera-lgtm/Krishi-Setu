import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminAnalyticsPanel } from '../features/admin/AdminAnalyticsPanel';
import { AdminFarmersPanel } from '../features/admin/AdminFarmersPanel';
import { AdminIntegrationsPanel } from '../features/admin/AdminIntegrationsPanel';
import { AdminServicesPanel } from '../features/agriServices/AdminServicesPanel';
import { AdminCropDatasetPanel } from '../features/cropIntelligence/AdminCropDatasetPanel';
import { AdminMarketDataPanel } from '../features/marketWeather/AdminMarketDataPanel';
import { AdminPlantHealthPanel } from '../features/plantHealth/AdminPlantHealthPanel';
import { AdminShellLayout } from '../layouts/AdminShellLayout';

interface AdminDashboardPageProps {
  onLogout: () => void;
}

type AdminTab =
  | 'analytics'
  | 'farmers'
  | 'crops'
  | 'plantHealth'
  | 'marketData'
  | 'services';

export function AdminDashboardPage({ onLogout }: AdminDashboardPageProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');

  const tabs: Array<{ id: AdminTab; label: string }> = [
    { id: 'analytics', label: t('admin.tabs.analytics') },
    { id: 'farmers', label: t('admin.tabs.farmers') },
    { id: 'crops', label: t('admin.tabs.crops') },
    { id: 'plantHealth', label: t('admin.tabs.plantHealth') },
    { id: 'marketData', label: t('admin.tabs.marketData') },
    { id: 'services', label: t('admin.tabs.services') },
  ];

  return (
    <AdminShellLayout onLogout={onLogout}>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E5E1D8] pb-5">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#17221B]">
              {t('admin.consoleTitle')}
            </h1>
            <p className="mt-1.5 text-sm text-[#4A5A50]">{t('admin.consoleSubtitle')}</p>
          </div>

          <div
            role="tablist"
            aria-label={t('admin.consoleTitle')}
            className="flex flex-wrap items-center gap-1 rounded-lg bg-[#EDEAE2] p-1 self-start"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-[#17221B] shadow-xs'
                    : 'text-[#4A5A50] hover:text-[#17221B]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'analytics' ? (
          <AdminAnalyticsPanel />
        ) : activeTab === 'farmers' ? (
          <AdminFarmersPanel />
        ) : activeTab === 'crops' ? (
          <AdminCropDatasetPanel />
        ) : activeTab === 'plantHealth' ? (
          <AdminPlantHealthPanel />
        ) : activeTab === 'marketData' ? (
          <div className="space-y-8">
            <AdminIntegrationsPanel />
            <AdminMarketDataPanel />
          </div>
        ) : (
          <AdminServicesPanel />
        )}
      </div>
    </AdminShellLayout>
  );
}
