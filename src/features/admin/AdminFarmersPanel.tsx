import { Search, ShieldCheck, ShieldOff } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { inputBaseClass } from '../../components/FormField';
import { EmptyState, ErrorBanner, LoadingSkeleton } from '../../components/StatePanels';
import { adminService } from '../../services/adminService';
import type { AdminFarmerAccount } from '../../types/notification';
import { cn } from '../../utils/cn';
import { formatLandArea } from '../../utils/formatters';

export function AdminFarmersPanel() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<AdminFarmerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DISABLED'>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await adminService.listFarmers();
      setAccounts(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleToggleStatus = async (account: AdminFarmerAccount) => {
    setUpdatingId(account.id);
    setError(null);
    setStatusMessage(null);
    try {
      const updated = await adminService.updateFarmerStatus(account.id, !account.active);
      setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setStatusMessage(
        updated.active
          ? t('admin.farmers.activatedMessage', { name: updated.fullName })
          : t('admin.farmers.deactivatedMessage', { name: updated.fullName }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = accounts.filter((acc) => {
    if (statusFilter === 'ACTIVE' && !acc.active) return false;
    if (statusFilter === 'DISABLED' && acc.active) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      acc.fullName.toLowerCase().includes(q) ||
      acc.maskedEmail.toLowerCase().includes(q) ||
      (acc.district || '').toLowerCase().includes(q) ||
      (acc.state || '').toLowerCase().includes(q)
    );
  });

  const activeCount = accounts.filter((a) => a.active).length;
  const onboardedCount = accounts.filter((a) => a.onboardingCompleted).length;
  const withReportCount = accounts.filter((a) => a.hasSoilReport === true).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#E5E1D8] bg-white p-5">
          <p className="text-xs text-[#748379]">{t('admin.totalFarmers')}</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#17221B] tabular-nums">
            {accounts.length}
          </p>
        </div>
        <div className="rounded-xl border border-[#E5E1D8] bg-white p-5">
          <p className="text-xs text-[#748379]">{t('admin.farmers.activeAccountsLabel')}</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#1B4332] tabular-nums">
            {activeCount}
          </p>
        </div>
        <div className="rounded-xl border border-[#E5E1D8] bg-white p-5">
          <p className="text-xs text-[#748379]">{t('admin.onboardedFarmers')}</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#2D6A4F] tabular-nums">
            {onboardedCount}
          </p>
        </div>
        <div className="rounded-xl border border-[#E5E1D8] bg-white p-5">
          <p className="text-xs text-[#748379]">{t('admin.withSoilReport')}</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#8C5A2B] tabular-nums">
            {withReportCount}
          </p>
        </div>
      </div>

      <p className="text-xs text-[#4A5A50] rounded-lg border border-[#E5E1D8] bg-[#FAF8F4] px-4 py-2.5">
        {t('admin.farmers.privacyNote')}
      </p>

      {error && <ErrorBanner message={error} onRetry={loadAccounts} retryLabel={t('common.retry')} />}

      {statusMessage && (
        <div className="rounded-lg border border-[#B8D4C5] bg-[#E7F1EC] px-4 py-3 text-xs font-medium text-[#1B4332]">
          {statusMessage}
        </div>
      )}

      <section className="rounded-xl border border-[#E5E1D8] bg-white overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E1D8] px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-base font-semibold text-[#17221B]">
              {t('admin.farmersTableTitle')} ({filtered.length})
            </h2>
            <div className="flex items-center gap-1 rounded-lg bg-[#EDEAE2] p-1">
              {(['ALL', 'ACTIVE', 'DISABLED'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    statusFilter === status
                      ? 'bg-white text-[#17221B] shadow-xs'
                      : 'text-[#4A5A50] hover:text-[#17221B]'
                  }`}
                >
                  {t(`admin.farmers.filters.${status}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#748379]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('admin.searchPlaceholder')}
              aria-label={t('admin.searchPlaceholder')}
              className={cn(inputBaseClass, 'pl-9 min-h-[38px] py-1.5')}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={4} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState title={t('admin.emptyFarmers')} description={t('admin.consoleSubtitle')} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#E5E1D8] bg-[#FAF8F4] text-xs font-semibold text-[#4A5A50]">
                <tr>
                  <th className="px-5 py-3">{t('admin.columns.farmer')}</th>
                  <th className="px-5 py-3">{t('admin.columns.location')}</th>
                  <th className="px-5 py-3 text-right">{t('admin.columns.land')}</th>
                  <th className="px-5 py-3">{t('admin.farmers.colOnboarding')}</th>
                  <th className="px-5 py-3">{t('admin.farmers.colAccountStatus')}</th>
                  <th className="px-5 py-3 text-right">{t('admin.crops.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E1D8] text-xs">
                {filtered.map((acc) => (
                  <tr key={acc.id} className="hover:bg-[#FAF8F4]/70">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-[#17221B]">{acc.fullName}</p>
                      <p className="font-mono text-[#748379]">
                        {acc.maskedEmail} · {acc.preferredLanguage.toUpperCase()}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-[#4A5A50]">
                      {[acc.district, acc.state].filter(Boolean).join(', ') ||
                        t('common.notProvided')}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono tabular-nums text-[#17221B]">
                      {acc.landSize ? formatLandArea(acc.landSize, acc.landUnit, t) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-[#4A5A50]">
                      {acc.onboardingCompleted ? (
                        <span>
                          {t('admin.farmers.onboardedYes')} ·{' '}
                          {acc.hasSoilReport ? t('admin.hasReportYes') : t('admin.hasReportNo')}
                        </span>
                      ) : (
                        <span className="text-[#8C5A2B]">{t('admin.farmers.pendingOnboarding')}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-medium">
                      {acc.active ? (
                        <span className="text-[#1B4332]">{t('admin.farmers.statusActive')}</span>
                      ) : (
                        <span className="text-[#991B1B]">{t('admin.farmers.statusDisabled')}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        variant={acc.active ? 'secondary' : 'primary'}
                        size="sm"
                        loading={updatingId === acc.id}
                        onClick={() => handleToggleStatus(acc)}
                      >
                        {acc.active ? (
                          <>
                            <ShieldOff className="h-3.5 w-3.5" aria-hidden="true" />
                            {t('admin.farmers.deactivateBtn')}
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                            {t('admin.farmers.activateBtn')}
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
