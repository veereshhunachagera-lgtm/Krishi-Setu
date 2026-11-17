import { AlertTriangle, ExternalLink, RefreshCw, Search, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { FormField, inputBaseClass } from '../../components/FormField';
import { EmptyState, ErrorBanner, LoadingSkeleton } from '../../components/StatePanels';
import { INDIAN_STATES } from '../../data/dashboardCatalog';
import { marketWeatherService } from '../../services/marketWeatherService';
import type { FarmerProfile } from '../../types/farmer';
import type { MandiPricesResponse } from '../../types/marketWeather';
import { cn } from '../../utils/cn';

interface MandiPricesPanelProps {
  profile: FarmerProfile | null;
  onOpenTrends?: (commodity: string, market?: string) => void;
}

export function MandiPricesPanel({ profile, onOpenTrends }: MandiPricesPanelProps) {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [commodity, setCommodity] = useState('');
  const [stateFilter, setStateFilter] = useState(profile?.state || '');
  const [districtFilter, setDistrictFilter] = useState('');
  const [marketFilter, setMarketFilter] = useState('');
  const [searchText, setSearchText] = useState('');

  const [data, setData] = useState<MandiPricesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPrices = useCallback(
    async (overrides?: {
      commodity?: string;
      state?: string;
      district?: string;
      market?: string;
      q?: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await marketWeatherService.getMandiPrices({
          commodity: overrides?.commodity ?? (commodity.trim() || undefined),
          state: overrides?.state ?? (stateFilter.trim() || undefined),
          district: overrides?.district ?? (districtFilter.trim() || undefined),
          market: overrides?.market ?? (marketFilter.trim() || undefined),
          q: overrides?.q ?? (searchText.trim() || undefined),
          limit: 50,
        });
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('errors.generic'));
      } finally {
        setLoading(false);
      }
    },
    [commodity, districtFilter, marketFilter, searchText, stateFilter, t],
  );

  useEffect(() => {
    loadPrices();
  }, [loadPrices]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    loadPrices();
  };

  const handleResetFilters = () => {
    setCommodity('');
    setStateFilter('');
    setDistrictFilter('');
    setMarketFilter('');
    setSearchText('');
    loadPrices({ commodity: '', state: '', district: '', market: '', q: '' });
  };

  const handleUseMyDistrict = () => {
    const nextState = profile?.state || 'Karnataka';
    const nextDist = profile?.district || '';
    setStateFilter(nextState);
    setDistrictFilter(nextDist);
    loadPrices({ state: nextState, district: nextDist });
  };

  const isUnavailable =
    data &&
    (data.status === 'API_KEY_MISSING' ||
      data.status === 'UPSTREAM_ERROR' ||
      data.status === 'UPSTREAM_TIMEOUT' ||
      data.status === 'RATE_LIMITED');

  return (
    <div className="space-y-6">
      {/* Filter & Search Bar */}
      <form
        onSubmit={handleApplyFilters}
        className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-[#17221B]">
              {t('marketWeather.mandi.filterTitle')}
            </h2>
            <p className="text-xs text-[#4A5A50] mt-0.5">
              {t('marketWeather.mandi.filterSubtitle')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {profile?.district && (
              <Button type="button" variant="secondary" size="sm" onClick={handleUseMyDistrict}>
                {t('marketWeather.mandi.myDistrictBtn', { district: profile.district })}
              </Button>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={handleResetFilters}>
              {t('marketWeather.mandi.resetBtn')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <FormField htmlFor="mandi-search" label={t('marketWeather.mandi.searchLabel')}>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#748379]"
                aria-hidden="true"
              />
              <input
                id="mandi-search"
                type="search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={t('marketWeather.mandi.searchPlaceholder')}
                className={cn(inputBaseClass, 'pl-9')}
              />
            </div>
          </FormField>

          <FormField htmlFor="mandi-commodity" label={t('marketWeather.mandi.cropLabel')}>
            <input
              id="mandi-commodity"
              type="text"
              value={commodity}
              onChange={(e) => setCommodity(e.target.value)}
              placeholder={t('marketWeather.mandi.cropPlaceholder')}
              list="mandi-commodities-list"
              className={inputBaseClass}
            />
            <datalist id="mandi-commodities-list">
              {(data?.availableFilters.commodities || []).map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </FormField>

          <FormField htmlFor="mandi-state" label={t('marketWeather.mandi.stateLabel')}>
            <select
              id="mandi-state"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className={inputBaseClass}
            >
              <option value="">{t('marketWeather.mandi.allStates')}</option>
              {Array.from(
                new Set([...INDIAN_STATES, ...(data?.availableFilters.states || [])]),
              )
                .sort((a, b) => a.localeCompare(b))
                .map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
            </select>
          </FormField>

          <FormField htmlFor="mandi-district" label={t('marketWeather.mandi.districtLabel')}>
            <input
              id="mandi-district"
              type="text"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              placeholder={t('marketWeather.mandi.districtPlaceholder')}
              list="mandi-districts-list"
              className={inputBaseClass}
            />
            <datalist id="mandi-districts-list">
              {(data?.availableFilters.districts || []).map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </FormField>

          <FormField htmlFor="mandi-market" label={t('marketWeather.mandi.mandiLabel')}>
            <input
              id="mandi-market"
              type="text"
              value={marketFilter}
              onChange={(e) => setMarketFilter(e.target.value)}
              placeholder={t('marketWeather.mandi.mandiPlaceholder')}
              list="mandi-markets-list"
              className={inputBaseClass}
            />
            <datalist id="mandi-markets-list">
              {(data?.availableFilters.markets || []).map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </FormField>
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <Button type="submit" size="sm" loading={loading}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            {t('marketWeather.mandi.applyBtn')}
          </Button>
        </div>
      </form>

      {error && <ErrorBanner message={error} onRetry={() => loadPrices()} retryLabel={t('common.retry')} />}

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : data ? (
        <div className="space-y-5">
          {/* Honest Status / Source & Update Metadata */}
          <div className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#17221B]">
                {isUnavailable && (
                  <AlertTriangle className="h-4 w-4 text-[#B45309] shrink-0" aria-hidden="true" />
                )}
                <span>{t(`marketWeather.mandi.statuses.${data.status}`)}</span>
              </div>
              <a
                href={data.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#1B4332] hover:underline whitespace-nowrap"
              >
                <span>{data.sourceName}</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>

            <p className="text-sm text-[#4A5A50] leading-relaxed">
              {isKn ? data.messageKn : data.messageEn}
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#748379] font-mono tabular-nums pt-1 border-t border-[#E5E1D8]">
              <span>
                {t('marketWeather.mandi.resourceIdLabel')}: {data.resourceId}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {t('marketWeather.mandi.updatedLabel')}:{' '}
                {data.updatedAt ? new Date(data.updatedAt).toLocaleString() : t('common.notProvided')}
              </span>
              <span aria-hidden="true">·</span>
              <span>{t('marketWeather.mandi.unitLabel')}: INR / Quintal</span>
            </div>

            {data.status === 'API_KEY_MISSING' && (
              <div className="rounded-lg border border-[#E5E1D8] bg-[#FAF8F4] p-4 space-y-1.5">
                <p className="text-xs font-semibold text-[#17221B]">
                  {t('marketWeather.mandi.configRequiredHeading')}
                </p>
                <p className="text-xs text-[#4A5A50] leading-relaxed">
                  {isKn ? data.configurationGuideKn : data.configurationGuideEn}
                </p>
              </div>
            )}
          </div>

          {/* Records Table or Honest Empty State */}
          {data.records.length === 0 ? (
            <EmptyState
              title={t('marketWeather.mandi.emptyTitle')}
              description={
                data.status === 'API_KEY_MISSING'
                  ? t('marketWeather.mandi.emptyUnconfiguredDesc')
                  : t('marketWeather.mandi.emptyFilteredDesc')
              }
              action={
                <Button variant="secondary" size="sm" onClick={() => loadPrices()}>
                  {t('common.retry')}
                </Button>
              }
            />
          ) : (
            <section className="rounded-xl border border-[#E5E1D8] bg-white overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E1D8] px-6 py-4">
                <h3 className="font-display text-base font-semibold text-[#17221B]">
                  {t('marketWeather.mandi.tableTitle')}
                </h3>
                <p className="text-xs text-[#748379] font-mono tabular-nums">
                  {t('marketWeather.mandi.rowsShown', { count: data.records.length })}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#E5E1D8] bg-[#FAF8F4] text-xs font-semibold text-[#4A5A50]">
                    <tr>
                      <th className="px-5 py-3">{t('marketWeather.mandi.cols.commodity')}</th>
                      <th className="px-5 py-3">{t('marketWeather.mandi.cols.market')}</th>
                      <th className="px-5 py-3 text-right">{t('marketWeather.mandi.cols.minPrice')}</th>
                      <th className="px-5 py-3 text-right">{t('marketWeather.mandi.cols.modalPrice')}</th>
                      <th className="px-5 py-3 text-right">{t('marketWeather.mandi.cols.maxPrice')}</th>
                      <th className="px-5 py-3 text-right">{t('marketWeather.mandi.cols.arrivalDate')}</th>
                      {onOpenTrends && <th className="px-5 py-3 text-right">{t('marketWeather.mandi.cols.trend')}</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E1D8]">
                    {data.records.map((row) => (
                      <tr key={row.id} className="hover:bg-[#FAF8F4]/70">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-[#17221B]">{row.commodity}</p>
                          <p className="text-xs text-[#748379]">
                            {row.variety} · {row.grade}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-[#17221B]">{row.market}</p>
                          <p className="text-xs text-[#4A5A50]">
                            {[row.district, row.state].filter(Boolean).join(', ')}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono tabular-nums text-[#4A5A50]">
                          {row.minPrice !== null ? `₹${row.minPrice.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-semibold tabular-nums text-[#1B4332]">
                          {row.modalPrice !== null ? `₹${row.modalPrice.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono tabular-nums text-[#4A5A50]">
                          {row.maxPrice !== null ? `₹${row.maxPrice.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-xs tabular-nums text-[#4A5A50]">
                          {row.arrivalDate}
                        </td>
                        {onOpenTrends && (
                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => onOpenTrends(row.commodity, row.market)}
                              className="inline-flex items-center gap-1 rounded-md border border-[#E5E1D8] bg-[#FAF8F4] px-2.5 py-1 text-xs font-medium text-[#1B4332] hover:bg-[#E7F1EC] cursor-pointer whitespace-nowrap"
                            >
                              <TrendingUp className="h-3 w-3" aria-hidden="true" />
                              {t('marketWeather.mandi.viewTrendBtn')}
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      ) : null}
    </div>
  );
}
