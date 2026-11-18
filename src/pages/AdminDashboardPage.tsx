import { Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { inputBaseClass } from '../components/FormField';
import { EmptyState, ErrorBanner, LoadingSkeleton } from '../components/StatePanels';
import { AdminCropDatasetPanel } from '../features/cropIntelligence/AdminCropDatasetPanel';
import { AdminMarketDataPanel } from '../features/marketWeather/AdminMarketDataPanel';
import { AdminPlantHealthPanel } from '../features/plantHealth/AdminPlantHealthPanel';
import { AdminServicesPanel } from '../features/agriServices/AdminServicesPanel';
import { AdminShellLayout } from '../layouts/AdminShellLayout';
import { adminService } from '../services/adminService';
import type { AdminOverview } from '../types/notification';
import { cn } from '../utils/cn';
import { formatLandArea } from '../utils/formatters';

interface AdminDashboardPageProps {
  onLogout: () => void;
}

export function AdminDashboardPage({ onLogout }: AdminDashboardPageProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<
    'farmers' | 'crops' | 'plantHealth' | 'marketData' | 'services'
  >('farmers');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getOverview();
      setOverview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const filteredFarmers = (overview?.farmers || []).filter((f) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      f.farmerName.toLowerCase().includes(q) ||
      (f.district || '').toLowerCase().includes(q) ||
      (f.currentOrPreviousCrop || '').toLowerCase().includes(q) ||
      f.email.toLowerCase().includes(q)
    );
  });

  return (
    <AdminShellLayout onLogout={onLogout}>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E1D8] pb-5">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#17221B]">
              {t('admin.consoleTitle')}
            </h1>
            <p className="mt-1.5 text-sm text-[#4A5A50]">{t('admin.consoleSubtitle')}</p>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-[#EDEAE2] p-1 self-start">
            <button
              type="button"
              onClick={() => setActiveTab('farmers')}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'farmers'
                  ? 'bg-white text-[#17221B] shadow-xs'
                  : 'text-[#4A5A50] hover:text-[#17221B]'
              }`}
            >
              {t('admin.tabs.farmers')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('crops')}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'crops'
                  ? 'bg-white text-[#17221B] shadow-xs'
                  : 'text-[#4A5A50] hover:text-[#17221B]'
              }`}
            >
              {t('admin.tabs.crops')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('plantHealth')}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'plantHealth'
                  ? 'bg-white text-[#17221B] shadow-xs'
                  : 'text-[#4A5A50] hover:text-[#17221B]'
              }`}
            >
              {t('admin.tabs.plantHealth')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('marketData')}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'marketData'
                  ? 'bg-white text-[#17221B] shadow-xs'
                  : 'text-[#4A5A50] hover:text-[#17221B]'
              }`}
            >
              {t('admin.tabs.marketData')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'services'
                  ? 'bg-white text-[#17221B] shadow-xs'
                  : 'text-[#4A5A50] hover:text-[#17221B]'
              }`}
            >
              {t('admin.tabs.services')}
            </button>
          </div>
        </div>

        {activeTab === 'crops' ? (
          <AdminCropDatasetPanel />
        ) : activeTab === 'plantHealth' ? (
          <AdminPlantHealthPanel />
        ) : activeTab === 'marketData' ? (
          <AdminMarketDataPanel />
        ) : activeTab === 'services' ? (
          <AdminServicesPanel />
        ) : (
          <>
            {error && (
              <ErrorBanner message={error} onRetry={loadOverview} retryLabel={t('common.retry')} />
            )}

            {loading ? (
              <LoadingSkeleton rows={4} />
            ) : overview ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-[#E5E1D8] bg-white p-5">
                    <p className="text-xs text-[#748379]">{t('admin.totalFarmers')}</p>
                    <p className="mt-2 font-mono text-2xl font-bold text-[#17221B] tabular-nums">
                      {overview.totalFarmers}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#E5E1D8] bg-white p-5">
                    <p className="text-xs text-[#748379]">{t('admin.onboardedFarmers')}</p>
                    <p className="mt-2 font-mono text-2xl font-bold text-[#1B4332] tabular-nums">
                      {overview.onboardedFarmers}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#E5E1D8] bg-white p-5">
                    <p className="text-xs text-[#748379]">{t('admin.withSoilReport')}</p>
                    <p className="mt-2 font-mono text-2xl font-bold text-[#2D6A4F] tabular-nums">
                      {overview.withSoilReportCount}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#E5E1D8] bg-white p-5">
                    <p className="text-xs text-[#748379]">{t('admin.withoutSoilReport')}</p>
                    <p className="mt-2 font-mono text-2xl font-bold text-[#8C5A2B] tabular-nums">
                      {overview.withoutSoilReportCount}
                    </p>
                  </div>
                </div>

                <section className="rounded-xl border border-[#E5E1D8] bg-white overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E1D8] px-6 py-4">
                    <h2 className="font-display text-base font-semibold text-[#17221B]">
                      {t('admin.farmersTableTitle')}
                    </h2>
                    <div className="relative w-full sm:w-80">
                      <Search
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#748379]"
                        aria-hidden="true"
                      />
                      <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('admin.searchPlaceholder')}
                        className={cn(inputBaseClass, 'pl-9 min-h-[38px] py-1.5')}
                      />
                    </div>
                  </div>

                  {filteredFarmers.length === 0 ? (
                    <div className="p-6">
                      <EmptyState
                        title={t('admin.emptyFarmers')}
                        description={t('admin.consoleSubtitle')}
                      />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-[#E5E1D8] bg-[#FAF8F4] text-xs font-semibold text-[#4A5A50]">
                          <tr>
                            <th className="px-6 py-3">{t('admin.columns.farmer')}</th>
                            <th className="px-6 py-3">{t('admin.columns.location')}</th>
                            <th className="px-6 py-3 text-right">{t('admin.columns.land')}</th>
                            <th className="px-6 py-3">{t('admin.columns.onboardingPath')}</th>
                            <th className="px-6 py-3">{t('admin.columns.cropSeason')}</th>
                            <th className="px-6 py-3 text-right">{t('admin.columns.updated')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E1D8]">
                          {filteredFarmers.map((farmer) => (
                            <tr key={farmer.id} className="hover:bg-[#FAF8F4]/70">
                              <td className="px-6 py-3.5">
                                <p className="font-medium text-[#17221B]">{farmer.farmerName}</p>
                                <p className="font-mono text-xs text-[#748379]">{farmer.email}</p>
                              </td>
                              <td className="px-6 py-3.5 text-[#4A5A50]">
                                {[farmer.village, farmer.district, farmer.state]
                                  .filter(Boolean)
                                  .join(', ') || t('common.notProvided')}
                              </td>
                              <td className="px-6 py-3.5 text-right font-mono tabular-nums text-[#17221B]">
                                {farmer.landSize
                                  ? formatLandArea(farmer.landSize, farmer.landUnit, t)
                                  : '—'}
                              </td>
                              <td className="px-6 py-3.5 text-[#17221B]">
                                {farmer.hasSoilReport
                                  ? t('admin.hasReportYes')
                                  : t('admin.hasReportNo')}
                              </td>
                              <td className="px-6 py-3.5 text-[#4A5A50]">
                                {farmer.currentOrPreviousCrop || '—'}
                                {farmer.growingSeason
                                  ? ` · ${t(`onboarding.seasons.${farmer.growingSeason}`)}`
                                  : ''}
                              </td>
                              <td className="px-6 py-3.5 text-right font-mono text-xs text-[#748379] tabular-nums">
                                {new Date(farmer.updatedAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            ) : null}
          </>
        )}
      </div>
    </AdminShellLayout>
  );
}
