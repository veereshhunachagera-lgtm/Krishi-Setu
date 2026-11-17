import { AlertTriangle, CloudLightning, ExternalLink, RefreshCw, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { EmptyState, ErrorBanner, LoadingSkeleton } from '../../components/StatePanels';
import { useSmartAlerts } from '../../hooks/useSmartAlerts';
import { cn } from '../../utils/cn';

interface SmartAlertsPanelProps {
  compact?: boolean;
}

export function SmartAlertsPanel({ compact = false }: SmartAlertsPanelProps) {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';
  const { data, alerts, loading, error, reload } = useSmartAlerts(true);

  if (loading && !data) {
    return <LoadingSkeleton rows={compact ? 2 : 3} />;
  }

  if (error) {
    return <ErrorBanner message={error} onRetry={reload} retryLabel={t('common.retry')} />;
  }

  if (!data) return null;

  return (
    <section
      className={cn(
        'rounded-xl border border-[#E5E1D8] bg-white space-y-4',
        compact ? 'p-5' : 'p-6',
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E1D8] pb-3.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-[#8C5A2B] shrink-0" aria-hidden="true" />
            <h2 className="font-display text-base font-semibold text-[#17221B]">
              {t('marketWeather.smartAlerts.title')}
            </h2>
          </div>
          <p className="text-xs text-[#4A5A50]">
            {data.locationLabel} · {isKn ? data.weatherStatusNoteKn : data.weatherStatusNoteEn}
          </p>
        </div>

        <Button type="button" variant="ghost" size="sm" onClick={reload} loading={loading}>
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          {t('marketWeather.smartAlerts.refreshBtn')}
        </Button>
      </div>

      {alerts.length === 0 ? (
        <EmptyState
          title={t('marketWeather.smartAlerts.emptyTitle')}
          description={t('marketWeather.smartAlerts.emptyDesc')}
        />
      ) : (
        <div className="space-y-3">
          {alerts.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-[#E5E1D8] bg-[#FAF8F4] p-4 space-y-1.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {item.category === 'WEATHER_RISK' ? (
                    <CloudLightning className="h-4 w-4 text-[#8C5A2B] shrink-0" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-[#1B4332] shrink-0" aria-hidden="true" />
                  )}
                  <p className="text-sm font-semibold text-[#17221B]">
                    {isKn ? item.titleKn : item.titleEn}
                  </p>
                </div>
                <span
                  className={cn(
                    'text-xs font-mono font-semibold whitespace-nowrap shrink-0',
                    item.severity === 'HIGH'
                      ? 'text-[#991B1B]'
                      : item.severity === 'MODERATE'
                        ? 'text-[#B45309]'
                        : 'text-[#1B4332]',
                  )}
                >
                  {t(`marketWeather.smartAlerts.severity.${item.severity}`)}
                </span>
              </div>

              <p className="text-xs text-[#4A5A50] leading-relaxed">
                {isKn ? item.detailKn : item.detailEn}
              </p>

              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-[#748379] pt-1">
                <span className="font-medium text-[#1B4332]">
                  {isKn ? item.verificationLabelKn : item.verificationLabelEn}
                </span>
                <span aria-hidden="true">·</span>
                <span>{item.regionLabel}</span>
                {item.cropLabel && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{item.cropLabel}</span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{item.observedOrValidDate}</span>
                <span aria-hidden="true">·</span>
                {item.sourceUrl ? (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#1B4332] hover:underline"
                  >
                    <span>{item.sourceName}</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                ) : (
                  <span>{item.sourceName}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-[#748379] leading-relaxed border-t border-[#E5E1D8] pt-3">
        {isKn ? data.honestyDisclosureKn : data.honestyDisclosureEn}
      </p>
    </section>
  );
}
