import { Activity, CheckCircle2, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { ErrorBanner, LoadingSkeleton } from '../../components/StatePanels';
import { adminService } from '../../services/adminService';
import type {
  IntegrationProbeItem,
  IntegrationsOverviewResponse,
} from '../../types/notification';

export function AdminIntegrationsPanel() {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [overview, setOverview] = useState<IntegrationsOverviewResponse | null>(null);
  const [probeResults, setProbeResults] = useState<Record<string, IntegrationProbeItem>>({});
  const [probedAt, setProbedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [probing, setProbing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getIntegrationsStatus();
      setOverview(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleRunProbe = async () => {
    setProbing(true);
    setError(null);
    try {
      const probe = await adminService.probeIntegrations();
      const map: Record<string, IntegrationProbeItem> = {};
      for (const item of probe.results) {
        map[item.id] = item;
      }
      setProbeResults(map);
      setProbedAt(probe.probedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setProbing(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton rows={3} />;
  }

  if (error && !overview) {
    return <ErrorBanner message={error} onRetry={loadStatus} retryLabel={t('common.retry')} />;
  }

  if (!overview) return null;

  return (
    <section className="rounded-xl border border-[#E5E1D8] bg-white p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E1D8] pb-4">
        <div>
          <h2 className="font-display text-base font-semibold text-[#17221B]">
            {t('admin.integrations.heading')}
          </h2>
          <p className="text-xs text-[#4A5A50] mt-0.5">
            {t('admin.integrations.subtitle')}
            {probedAt && (
              <>
                {' '}
                · {t('admin.integrations.lastChecked')}:{' '}
                <span className="font-mono tabular-nums">
                  {new Date(probedAt).toLocaleTimeString()}
                </span>
              </>
            )}
          </p>
        </div>

        <Button variant="secondary" size="sm" loading={probing} onClick={handleRunProbe}>
          <Activity className="h-3.5 w-3.5" aria-hidden="true" />
          {t('admin.integrations.probeBtn')}
        </Button>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadStatus} retryLabel={t('common.retry')} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {overview.integrations.map((item) => {
          const probe = probeResults[item.id];
          return (
            <div
              key={item.id}
              className="rounded-xl border border-[#E5E1D8] bg-[#FAF8F4] p-4 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-sm font-semibold text-[#17221B]">
                    {item.name}
                  </h3>
                  <p className="font-mono text-xs text-[#748379] mt-0.5 break-all">
                    {item.endpointOrModel}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap ${
                    item.configured ? 'text-[#1B4332]' : 'text-[#991B1B]'
                  }`}
                >
                  {item.configured ? (
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {item.configured
                    ? t('admin.integrations.configured')
                    : t('admin.integrations.unconfigured')}
                </span>
              </div>

              <p className="text-xs text-[#4A5A50] leading-relaxed">
                {isKn ? item.notesKn : item.notesEn}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#748379] tabular-nums pt-1 border-t border-[#E5E1D8]/80">
                <span>
                  {t('admin.integrations.storedRecords')}:{' '}
                  <strong className="font-mono text-[#17221B]">{item.storedRecordsCount}</strong>
                </span>
                {item.lastRecordTimestamp && (
                  <span>
                    · {t('admin.integrations.lastActivity')}:{' '}
                    <span className="font-mono">
                      {new Date(item.lastRecordTimestamp).toLocaleDateString()}
                    </span>
                  </span>
                )}
              </div>

              {probe && (
                <div className="rounded-lg border border-[#E5E1D8] bg-white px-3 py-2 text-xs">
                  <div className="flex items-center justify-between font-semibold text-[#17221B]">
                    <span>
                      {t(`admin.integrations.probeStatuses.${probe.status}`)}
                    </span>
                    {probe.latencyMs !== null && (
                      <span className="font-mono tabular-nums text-[#748379]">
                        {probe.latencyMs} ms
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[#4A5A50]">{isKn ? probe.detailKn : probe.detailEn}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
