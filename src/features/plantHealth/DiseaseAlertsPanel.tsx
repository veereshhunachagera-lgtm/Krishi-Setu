import { AlertCircle, ExternalLink, Info, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { inputBaseClass } from '../../components/FormField';
import { EmptyState, ErrorBanner, LoadingSkeleton } from '../../components/StatePanels';
import { plantHealthService } from '../../services/plantHealthService';
import type { FarmerProfile } from '../../types/farmer';
import type { AlertVerificationStatus, PestDiseaseAlertItem } from '../../types/plantHealth';

interface DiseaseAlertsPanelProps {
  profile: FarmerProfile | null;
}

export function DiseaseAlertsPanel({ profile }: DiseaseAlertsPanelProps) {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [alerts, setAlerts] = useState<PestDiseaseAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [districtFilter, setDistrictFilter] = useState<string>('');
  const [cropFilter, setCropFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await plantHealthService.listAlerts({
        district: districtFilter.trim() || undefined,
        cropCode: cropFilter || undefined,
        verificationStatus: statusFilter || undefined,
      });
      setAlerts(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [districtFilter, cropFilter, statusFilter, t]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const statusTone = (status: AlertVerificationStatus) => {
    if (status === 'CONFIRMED_OUTBREAK') return 'text-[#B42318]';
    if (status === 'REPORTED_CASE') return 'text-[#8C5A2B]';
    return 'text-[#1B4332]';
  };

  const resetFilters = () => {
    setDistrictFilter('');
    setCropFilter('');
    setStatusFilter('');
  };

  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} onRetry={loadAlerts} retryLabel={t('common.retry')} />}

      {/* Verification Legend & Authenticity Disclosure */}
      <section className="rounded-xl border border-[#E5E1D8] bg-[#FAF8F4] p-5 space-y-2.5">
        <div className="flex items-center gap-2 text-[#17221B]">
          <Info className="h-4 w-4 text-[#1B4332] shrink-0" aria-hidden="true" />
          <h2 className="font-display text-sm font-semibold">
            {t('plantHealth.alerts.verificationLegendTitle')}
          </h2>
        </div>
        <p className="text-xs text-[#4A5A50] leading-relaxed">
          {t('plantHealth.alerts.verificationLegendBody')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
          <div>
            <p className="font-semibold text-[#B42318]">
              {t('plantHealth.alerts.statuses.CONFIRMED_OUTBREAK')}
            </p>
            <p className="text-[#4A5A50]">{t('plantHealth.alerts.statusDefs.CONFIRMED_OUTBREAK')}</p>
          </div>
          <div>
            <p className="font-semibold text-[#8C5A2B]">
              {t('plantHealth.alerts.statuses.REPORTED_CASE')}
            </p>
            <p className="text-[#4A5A50]">{t('plantHealth.alerts.statusDefs.REPORTED_CASE')}</p>
          </div>
          <div>
            <p className="font-semibold text-[#1B4332]">
              {t('plantHealth.alerts.statuses.SEASONAL_RULE_ADVISORY')}
            </p>
            <p className="text-[#4A5A50]">
              {t('plantHealth.alerts.statusDefs.SEASONAL_RULE_ADVISORY')}
            </p>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="space-y-1 block">
            <span className="text-xs font-medium text-[#4A5A50]">
              {t('plantHealth.alerts.districtFilterLabel')}
            </span>
            <input
              type="text"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              placeholder={t('plantHealth.alerts.districtPlaceholder')}
              className={inputBaseClass}
            />
          </label>

          <label className="space-y-1 block">
            <span className="text-xs font-medium text-[#4A5A50]">
              {t('plantHealth.alerts.cropFilterLabel')}
            </span>
            <select
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
              className={inputBaseClass}
            >
              <option value="">{t('plantHealth.alerts.allCrops')}</option>
              <option value="paddy">{t('plantHealth.crops.paddy')}</option>
              <option value="maize">{t('plantHealth.crops.maize')}</option>
              <option value="tur-dal">{t('plantHealth.crops.turDal')}</option>
              <option value="tomato">{t('plantHealth.crops.tomato')}</option>
              <option value="groundnut">{t('plantHealth.crops.groundnut')}</option>
              <option value="ragi">{t('plantHealth.crops.ragi')}</option>
            </select>
          </label>

          <label className="space-y-1 block">
            <span className="text-xs font-medium text-[#4A5A50]">
              {t('plantHealth.alerts.statusFilterLabel')}
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={inputBaseClass}
            >
              <option value="">{t('plantHealth.alerts.allStatuses')}</option>
              <option value="CONFIRMED_OUTBREAK">
                {t('plantHealth.alerts.statuses.CONFIRMED_OUTBREAK')}
              </option>
              <option value="REPORTED_CASE">
                {t('plantHealth.alerts.statuses.REPORTED_CASE')}
              </option>
              <option value="SEASONAL_RULE_ADVISORY">
                {t('plantHealth.alerts.statuses.SEASONAL_RULE_ADVISORY')}
              </option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {profile?.district && (
              <Button
                type="button"
                variant={districtFilter === profile.district ? 'primary' : 'secondary'}
                size="sm"
                onClick={() =>
                  setDistrictFilter((prev) =>
                    prev === profile.district ? '' : profile.district || '',
                  )
                }
              >
                {t('plantHealth.alerts.myDistrictBtn', { district: profile.district })}
              </Button>
            )}
            {(districtFilter || cropFilter || statusFilter) && (
              <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
                {t('plantHealth.alerts.resetFilters')}
              </Button>
            )}
          </div>
          <p className="font-mono text-xs text-[#748379] tabular-nums">
            {t('plantHealth.alerts.resultCount', { count: alerts.length })}
          </p>
        </div>
      </section>

      {/* Alerts List or Empty State */}
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : alerts.length === 0 ? (
        <EmptyState
          title={t('plantHealth.alerts.emptyTitle')}
          description={t('plantHealth.alerts.emptyDesc')}
          action={
            (districtFilter || cropFilter || statusFilter) ? (
              <Button type="button" variant="secondary" size="sm" onClick={resetFilters}>
                {t('plantHealth.alerts.resetFilters')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const precautions = isKn ? alert.precautionsKn : alert.precautionsEn;
            return (
              <article
                key={alert.id}
                className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#748379]">
                  <span className={`font-semibold ${statusTone(alert.verificationStatus)}`}>
                    {t(`plantHealth.alerts.statuses.${alert.verificationStatus}`)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {t('plantHealth.alerts.severityLabel')}:{' '}
                    {t(`plantHealth.alerts.severities.${alert.severity}`)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{isKn ? alert.cropNameKn : alert.cropNameEn}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {[alert.district, alert.state].filter(Boolean).join(', ')}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{alert.observedDate}</span>
                </div>

                <h3 className="font-display text-base font-semibold text-[#17221B]">
                  {isKn ? alert.titleKn : alert.titleEn}
                </h3>

                <p className="text-sm text-[#4A5A50] leading-relaxed">
                  {isKn ? alert.summaryKn : alert.summaryEn}
                </p>

                {precautions.length > 0 && (
                  <div className="space-y-1.5 border-t border-[#E5E1D8] pt-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-[#1B4332]">
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('plantHealth.alerts.precautionsHeading')}
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-[#4A5A50]">
                      {precautions.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E1D8] pt-3 text-xs text-[#748379]">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('plantHealth.alerts.sourceLabel')}: {alert.sourceName}
                  </span>
                  {alert.sourceUrl && (
                    <a
                      href={alert.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-[#1B4332] hover:underline"
                    >
                      {t('plantHealth.alerts.viewSourceLink')}
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
