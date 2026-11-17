import { AlertCircle, Info, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '../../components/Button';
import { FormField, inputBaseClass } from '../../components/FormField';
import { EmptyState, ErrorBanner, LoadingSkeleton } from '../../components/StatePanels';
import { marketWeatherService } from '../../services/marketWeatherService';
import type { PriceTrendsResponse } from '../../types/marketWeather';

interface PriceTrendsPanelProps {
  initialCommodity?: string;
  initialMarket?: string;
}

export function PriceTrendsPanel({ initialCommodity, initialMarket }: PriceTrendsPanelProps) {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [commodity, setCommodity] = useState(initialCommodity || '');
  const [market, setMarket] = useState(initialMarket || '');
  const [days, setDays] = useState<string>('');
  const [data, setData] = useState<PriceTrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCommodity) setCommodity(initialCommodity);
    if (initialMarket) setMarket(initialMarket);
  }, [initialCommodity, initialMarket]);

  const loadTrends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await marketWeatherService.getPriceTrends({
        commodity: commodity || undefined,
        market: market || undefined,
        days: days ? Number(days) : undefined,
      });
      setData(res);
      if (!commodity && res.commodity) {
        setCommodity(res.commodity);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [commodity, days, market, t]);

  useEffect(() => {
    loadTrends();
  }, [loadTrends]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-[#17221B]">
              {t('marketWeather.trends.controlsTitle')}
            </h2>
            <p className="text-xs text-[#4A5A50] mt-0.5">
              {t('marketWeather.trends.controlsSubtitle')}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={loadTrends} loading={loading}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            {t('marketWeather.trends.refreshBtn')}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField htmlFor="trends-commodity" label={t('marketWeather.trends.commodityLabel')}>
            <select
              id="trends-commodity"
              value={commodity}
              onChange={(e) => {
                setCommodity(e.target.value);
                setMarket('');
              }}
              className={inputBaseClass}
            >
              <option value="">{t('marketWeather.trends.selectCommodity')}</option>
              {(data?.availableCommodities || []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FormField>

          <FormField htmlFor="trends-market" label={t('marketWeather.trends.marketLabel')}>
            <select
              id="trends-market"
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              className={inputBaseClass}
            >
              <option value="">{t('marketWeather.trends.allMarkets')}</option>
              {(data?.availableMarkets || []).map((m) => (
                <option key={`${m.market}-${m.district}`} value={m.market}>
                  {m.market} ({m.district}, {m.state})
                </option>
              ))}
            </select>
          </FormField>

          <FormField htmlFor="trends-window" label={t('marketWeather.trends.windowLabel')}>
            <select
              id="trends-window"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className={inputBaseClass}
            >
              <option value="">{t('marketWeather.trends.windowAll')}</option>
              <option value="30">{t('marketWeather.trends.window30')}</option>
              <option value="90">{t('marketWeather.trends.window90')}</option>
            </select>
          </FormField>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadTrends} retryLabel={t('common.retry')} />}

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : data ? (
        <div className="space-y-5">
          {/* Disclaimer Banner */}
          <div className="rounded-xl border border-[#E5E1D8] bg-[#FAF8F4] p-4 flex items-start gap-3">
            <Info className="h-4 w-4 text-[#1B4332] mt-0.5 shrink-0" aria-hidden="true" />
            <div className="space-y-1 text-xs text-[#4A5A50] leading-relaxed">
              <p className="font-semibold text-[#17221B]">{t('marketWeather.trends.honestyTitle')}</p>
              <p>{isKn ? data.disclaimerKn : data.disclaimerEn}</p>
              <p className="text-[#748379]">{isKn ? data.sourceNoteKn : data.sourceNoteEn}</p>
            </div>
          </div>

          {!data.sufficientData ? (
            <EmptyState
              title={t('marketWeather.trends.insufficientTitle')}
              description={
                (isKn ? data.insufficientReasonKn : data.insufficientReasonEn) ||
                t('marketWeather.trends.insufficientFallback')
              }
            />
          ) : (
            <>
              {/* Factual Observed Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-xl border border-[#E5E1D8] bg-white p-4">
                  <p className="text-xs text-[#748379]">{t('marketWeather.trends.latestModalLabel')}</p>
                  <p className="mt-1.5 font-mono text-xl font-bold text-[#1B4332] tabular-nums">
                    {data.summary?.latestModalPrice !== null && data.summary?.latestModalPrice !== undefined
                      ? `₹${data.summary.latestModalPrice.toLocaleString('en-IN')}`
                      : '—'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#748379] font-mono tabular-nums">
                    {data.unit}
                  </p>
                </div>

                <div className="rounded-xl border border-[#E5E1D8] bg-white p-4">
                  <p className="text-xs text-[#748379]">{t('marketWeather.trends.observedRangeLabel')}</p>
                  <p className="mt-1.5 font-mono text-base font-semibold text-[#17221B] tabular-nums">
                    {data.summary?.observedMinPrice !== null && data.summary?.observedMinPrice !== undefined
                      ? `₹${data.summary.observedMinPrice.toLocaleString('en-IN')}`
                      : '—'}{' '}
                    –{' '}
                    {data.summary?.observedMaxPrice !== null && data.summary?.observedMaxPrice !== undefined
                      ? `₹${data.summary.observedMaxPrice.toLocaleString('en-IN')}`
                      : '—'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#748379] font-mono tabular-nums">
                    {data.unit}
                  </p>
                </div>

                <div className="rounded-xl border border-[#E5E1D8] bg-white p-4">
                  <p className="text-xs text-[#748379]">{t('marketWeather.trends.periodChangeLabel')}</p>
                  <p className="mt-1.5 font-mono text-xl font-bold text-[#17221B] tabular-nums">
                    {data.summary?.changeAbsolute !== null && data.summary?.changeAbsolute !== undefined
                      ? `${data.summary.changeAbsolute >= 0 ? '+' : ''}₹${data.summary.changeAbsolute.toLocaleString('en-IN')}`
                      : '—'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#748379] font-mono tabular-nums">
                    {data.summary?.changePercent !== null && data.summary?.changePercent !== undefined
                      ? `${data.summary.changePercent >= 0 ? '+' : ''}${data.summary.changePercent}%`
                      : ''}
                  </p>
                </div>

                <div className="rounded-xl border border-[#E5E1D8] bg-white p-4">
                  <p className="text-xs text-[#748379]">{t('marketWeather.trends.dateSpanLabel')}</p>
                  <p className="mt-1.5 font-mono text-sm font-semibold text-[#17221B] tabular-nums">
                    {data.dateRange.startDate} → {data.dateRange.endDate}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#748379] font-mono tabular-nums">
                    {t('marketWeather.trends.dataPointsCount', { count: data.pointCount })}
                  </p>
                </div>
              </div>

              {/* Recharts Historical Line Chart */}
              <div className="rounded-xl border border-[#E5E1D8] bg-white p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base font-semibold text-[#17221B]">
                      {data.commodity}
                      {data.market ? ` · ${data.market}` : ` · ${t('marketWeather.trends.allMarkets')}`}
                    </h3>
                    <p className="text-xs text-[#748379] font-mono tabular-nums">
                      {data.dateRange.startDate} – {data.dateRange.endDate} · {data.unit}
                    </p>
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.points} margin={{ top: 10, right: 20, left: 6, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E1D8" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#4A5A50' }} />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#4A5A50' }}
                        tickFormatter={(val) => `₹${val}`}
                        width={64}
                      />
                      <Tooltip
                        formatter={(value: unknown) =>
                          typeof value === 'number' ? [`₹${value.toLocaleString('en-IN')} / qtl`, ''] : ['—', '']
                        }
                        contentStyle={{
                          borderRadius: '8px',
                          borderColor: '#E5E1D8',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line
                        type="monotone"
                        dataKey="modalPrice"
                        name={t('marketWeather.mandi.cols.modalPrice')}
                        stroke="#1B4332"
                        strokeWidth={2.5}
                        dot={{ r: 3.5 }}
                        connectNulls={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="minPrice"
                        name={t('marketWeather.mandi.cols.minPrice')}
                        stroke="#8C5A2B"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={{ r: 2.5 }}
                        connectNulls={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="maxPrice"
                        name={t('marketWeather.mandi.cols.maxPrice')}
                        stroke="#2D6A4F"
                        strokeWidth={1.5}
                        dot={{ r: 2.5 }}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Historical Data Table for Exact Audit */}
                <div className="overflow-x-auto border-t border-[#E5E1D8] pt-4">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[#4A5A50] border-b border-[#E5E1D8]">
                      <tr>
                        <th className="py-2 pr-4">{t('marketWeather.mandi.cols.arrivalDate')}</th>
                        <th className="py-2 px-4 text-right">{t('marketWeather.mandi.cols.minPrice')}</th>
                        <th className="py-2 px-4 text-right">{t('marketWeather.mandi.cols.modalPrice')}</th>
                        <th className="py-2 px-4 text-right">{t('marketWeather.mandi.cols.maxPrice')}</th>
                        <th className="py-2 pl-4 text-right">{t('marketWeather.trends.recordsCol')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E1D8]">
                      {data.points.map((pt) => (
                        <tr key={pt.date}>
                          <td className="py-2 pr-4 font-mono tabular-nums text-[#17221B]">{pt.date}</td>
                          <td className="py-2 px-4 text-right font-mono tabular-nums text-[#4A5A50]">
                            {pt.minPrice !== null ? `₹${pt.minPrice.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="py-2 px-4 text-right font-mono font-semibold tabular-nums text-[#1B4332]">
                            {pt.modalPrice !== null ? `₹${pt.modalPrice.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="py-2 px-4 text-right font-mono tabular-nums text-[#4A5A50]">
                            {pt.maxPrice !== null ? `₹${pt.maxPrice.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="py-2 pl-4 text-right font-mono tabular-nums text-[#748379]">
                            {pt.recordCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {data.pointCount === 1 && (
            <div className="rounded-xl border border-[#E5E1D8] bg-white p-4 flex items-start gap-2.5 text-xs text-[#4A5A50]">
              <AlertCircle className="h-4 w-4 text-[#8C5A2B] shrink-0 mt-0.5" aria-hidden="true" />
              <p>
                {t('marketWeather.trends.singleRecordNotice', {
                  date: data.points[0].date,
                  price:
                    data.points[0].modalPrice !== null
                      ? `₹${data.points[0].modalPrice.toLocaleString('en-IN')}`
                      : '—',
                })}
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
