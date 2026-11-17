import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { FormField, inputBaseClass } from '../../components/FormField';
import { EmptyState, ErrorBanner, LoadingSkeleton } from '../../components/StatePanels';
import { marketWeatherService } from '../../services/marketWeatherService';
import type { MandiPriceRecord } from '../../types/marketWeather';

export function AdminMarketDataPanel() {
  const { t } = useTranslation();
  const [records, setRecords] = useState<MandiPriceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commodity, setCommodity] = useState('');
  const [variety, setVariety] = useState('FAQ');
  const [state, setState] = useState('Karnataka');
  const [district, setDistrict] = useState('Mandya');
  const [market, setMarket] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [modalPrice, setModalPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [arrivalDate, setArrivalDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [sourceName, setSourceName] = useState('Agmarknet Verified Bulletin');

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await marketWeatherService.adminListPrices();
      setRecords(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleSyncLive = async () => {
    setSyncing(true);
    setStatusMessage(null);
    setError(null);
    try {
      const res = await marketWeatherService.adminSyncLive({ state: 'Karnataka' });
      setStatusMessage(`${res.messageEn} (${res.syncedCount} synced, ${res.totalStored} stored)`);
      await loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setSyncing(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setStatusMessage(null);
    try {
      const created = await marketWeatherService.adminCreatePrice({
        commodity: commodity.trim(),
        variety: variety.trim() || 'FAQ',
        state: state.trim(),
        district: district.trim(),
        market: market.trim(),
        minPrice: minPrice ? Number(minPrice) : undefined,
        modalPrice: Number(modalPrice),
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        arrivalDate,
        sourceName: sourceName.trim() || undefined,
      });
      setRecords((prev) => [created, ...prev]);
      setStatusMessage(t('admin.market.createSuccess'));
      setCommodity('');
      setMarket('');
      setMinPrice('');
      setModalPrice('');
      setMaxPrice('');
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await marketWeatherService.adminDeletePrice(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#17221B]">
            {t('admin.market.heading')}
          </h2>
          <p className="text-xs text-[#4A5A50] mt-0.5">{t('admin.market.subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleSyncLive} loading={syncing}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            {t('admin.market.syncLiveBtn')}
          </Button>
          <Button size="sm" onClick={() => setShowForm((prev) => !prev)}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            {t('admin.market.addRecordBtn')}
          </Button>
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-xl border border-[#2D6A4F]/30 bg-[#E7F1EC] px-4 py-3 text-sm text-[#1B4332]">
          {statusMessage}
        </div>
      )}

      {error && <ErrorBanner message={error} onRetry={loadRecords} retryLabel={t('common.retry')} />}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-[#E5E1D8] bg-white p-6 space-y-4"
        >
          <h3 className="font-display text-base font-semibold text-[#17221B]">
            {t('admin.market.formTitle')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <FormField htmlFor="admin-mkt-commodity" label={t('marketWeather.mandi.cols.commodity')} required>
              <input
                id="admin-mkt-commodity"
                type="text"
                required
                value={commodity}
                onChange={(e) => setCommodity(e.target.value)}
                placeholder="e.g., Ragi (Finger Millet)"
                className={inputBaseClass}
              />
            </FormField>
            <FormField htmlFor="admin-mkt-variety" label={t('admin.market.varietyLabel')}>
              <input
                id="admin-mkt-variety"
                type="text"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                className={inputBaseClass}
              />
            </FormField>
            <FormField htmlFor="admin-mkt-state" label={t('marketWeather.mandi.stateLabel')} required>
              <input
                id="admin-mkt-state"
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className={inputBaseClass}
              />
            </FormField>
            <FormField htmlFor="admin-mkt-district" label={t('marketWeather.mandi.districtLabel')} required>
              <input
                id="admin-mkt-district"
                type="text"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className={inputBaseClass}
              />
            </FormField>
            <FormField htmlFor="admin-mkt-market" label={t('marketWeather.mandi.mandiLabel')} required>
              <input
                id="admin-mkt-market"
                type="text"
                required
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                placeholder="e.g., Mandya APMC"
                className={inputBaseClass}
              />
            </FormField>
            <FormField htmlFor="admin-mkt-min" label={t('marketWeather.mandi.cols.minPrice')}>
              <input
                id="admin-mkt-min"
                type="number"
                step="0.01"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className={inputBaseClass}
              />
            </FormField>
            <FormField htmlFor="admin-mkt-modal" label={t('marketWeather.mandi.cols.modalPrice')} required>
              <input
                id="admin-mkt-modal"
                type="number"
                step="0.01"
                required
                value={modalPrice}
                onChange={(e) => setModalPrice(e.target.value)}
                className={inputBaseClass}
              />
            </FormField>
            <FormField htmlFor="admin-mkt-max" label={t('marketWeather.mandi.cols.maxPrice')}>
              <input
                id="admin-mkt-max"
                type="number"
                step="0.01"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className={inputBaseClass}
              />
            </FormField>
            <FormField htmlFor="admin-mkt-date" label={t('marketWeather.mandi.cols.arrivalDate')} required>
              <input
                id="admin-mkt-date"
                type="date"
                required
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                className={inputBaseClass}
              />
            </FormField>
            <FormField htmlFor="admin-mkt-source" label={t('admin.market.sourceLabel')}>
              <input
                id="admin-mkt-source"
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                className={inputBaseClass}
              />
            </FormField>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" size="sm" loading={submitting}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : records.length === 0 ? (
        <EmptyState
          title={t('admin.market.emptyTitle')}
          description={t('admin.market.emptyDesc')}
        />
      ) : (
        <section className="rounded-xl border border-[#E5E1D8] bg-white overflow-hidden">
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
                  <th className="px-5 py-3 text-right">{t('admin.crops.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E1D8]">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#FAF8F4]/70">
                    <td className="px-5 py-3">
                      <p className="font-medium text-[#17221B]">{rec.commodity}</p>
                      <p className="text-xs text-[#748379]">{rec.sourceName}</p>
                    </td>
                    <td className="px-5 py-3 text-[#4A5A50]">
                      {rec.market} · {rec.district}, {rec.state}
                    </td>
                    <td className="px-5 py-3 text-right font-mono tabular-nums text-[#4A5A50]">
                      {rec.minPrice !== null ? `₹${rec.minPrice}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-semibold tabular-nums text-[#1B4332]">
                      {rec.modalPrice !== null ? `₹${rec.modalPrice}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-mono tabular-nums text-[#4A5A50]">
                      {rec.maxPrice !== null ? `₹${rec.maxPrice}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-xs tabular-nums text-[#4A5A50]">
                      {rec.arrivalDate}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(rec.id)}
                        aria-label={t('admin.market.deleteRecord')}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#748379] hover:text-[#991B1B] hover:bg-[#FEF2F2] cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
