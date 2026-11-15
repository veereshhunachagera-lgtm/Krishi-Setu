import { AlertTriangle, CheckCircle2, Sprout } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '../../components/Button';
import { ErrorBanner, LoadingSkeleton } from '../../components/StatePanels';
import { cropIntelligenceService } from '../../services/cropIntelligenceService';
import type { SoilAnalysisResponse } from '../../types/cropIntelligence';

interface SoilHealthAnalysisPanelProps {
  onEditOnboarding: () => void;
}

export function SoilHealthAnalysisPanel({ onEditOnboarding }: SoilHealthAnalysisPanelProps) {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [analysis, setAnalysis] = useState<SoilAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await cropIntelligenceService.getSoilAnalysis();
      setAnalysis(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadAnalysis();
  }, [loadAnalysis]);

  if (loading) {
    return <LoadingSkeleton rows={4} />;
  }

  if (error) {
    return <ErrorBanner message={error} onRetry={loadAnalysis} retryLabel={t('common.retry')} />;
  }

  if (!analysis) return null;

  const npkChartData = analysis.parameters
    .filter((p) => p.parameterKey !== 'ph' && !p.unknown && p.measuredValue !== null)
    .map((p) => ({
      name: t(`cropIntelligence.soilParams.${p.parameterKey}`),
      measured: p.measuredValue,
      mediumMin: p.lowThreshold,
      mediumMax: p.highThreshold,
    }));

  const statusTone = (band: string) => {
    if (band === 'LOW' || band === 'ACIDIC' || band === 'ALKALINE') return 'text-[#8C5A2B]';
    if (band === 'MEDIUM' || band === 'NEUTRAL' || band === 'HIGH') return 'text-[#1B4332]';
    return 'text-[#748379]';
  };

  return (
    <div className="space-y-6">
      {/* Missing Info & Scope Box */}
      <section className="rounded-xl border border-[#E5E1D8] bg-[#FAF8F4] p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[#17221B]">
            <AlertTriangle className="h-4 w-4 text-[#8C5A2B]" aria-hidden="true" />
            <h2 className="font-display text-sm font-semibold">
              {t('cropIntelligence.soil.limitationsTitle')}
            </h2>
          </div>
          <Button variant="secondary" size="sm" onClick={onEditOnboarding}>
            {t('subFeature.goToProfile')}
          </Button>
        </div>

        <ul className="space-y-1 text-xs text-[#4A5A50] list-disc pl-4">
          {(isKn ? analysis.missingInformationKn : analysis.missingInformationEn).map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
      </section>

      {analysis.hasSoilReport && analysis.parameters.length > 0 ? (
        <>
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.parameters.map((param) => (
              <div
                key={param.parameterKey}
                className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-base font-semibold text-[#17221B]">
                    {t(`cropIntelligence.soilParams.${param.parameterKey}`)}
                  </h3>
                  <span className={`text-xs font-semibold ${statusTone(param.statusBand)}`}>
                    {t(`cropIntelligence.soilStatus.${param.statusBand}`)}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-bold text-[#17221B] tabular-nums">
                    {param.unknown || param.measuredValue === null
                      ? t('common.unknown')
                      : param.measuredValue}
                  </span>
                  {!param.unknown && param.measuredValue !== null && (
                    <span className="text-xs text-[#748379]">{param.unit}</span>
                  )}
                </div>

                <p className="text-xs text-[#748379] font-mono tabular-nums">
                  {t('cropIntelligence.soil.referenceBand')}: {param.lowThreshold}–{param.highThreshold}{' '}
                  {param.unit}
                </p>

                <p className="text-xs text-[#4A5A50] leading-relaxed">
                  {isKn ? param.summaryKn : param.summaryEn}
                </p>
              </div>
            ))}
          </section>

          {npkChartData.length > 0 && (
            <section className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-3">
              <div>
                <h3 className="font-display text-base font-semibold text-[#17221B]">
                  {t('cropIntelligence.soil.chartTitle')}
                </h3>
                <p className="text-xs text-[#4A5A50]">{t('cropIntelligence.soil.chartSubtitle')}</p>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={npkChartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E1D8" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#4A5A50' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#4A5A50' }} />
                    <Tooltip />
                    <Bar
                      dataKey="measured"
                      name={t('cropIntelligence.soil.yourValue')}
                      fill="#1B4332"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="mediumMin"
                      name={t('cropIntelligence.soil.mediumLower')}
                      fill="#95B8A6"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="mediumMax"
                      name={t('cropIntelligence.soil.mediumUpper')}
                      fill="#8C5A2B"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
        </>
      ) : (
        <section className="rounded-xl border border-[#E5E1D8] bg-white p-6 space-y-3">
          <div className="flex items-center gap-2 text-[#17221B]">
            <Sprout className="h-5 w-5 text-[#1B4332]" aria-hidden="true" />
            <h3 className="font-display text-base font-semibold">
              {t('cropIntelligence.soil.noReportCardTitle')}
            </h3>
          </div>
          <p className="text-sm text-[#4A5A50]">
            {t('cropIntelligence.soil.noReportCardDesc', {
              soilType: analysis.soilType
                ? t(`onboarding.soilTypes.${analysis.soilType}`)
                : t('common.notProvided'),
            })}
          </p>
        </section>
      )}

      {/* Practical Soil Care Checklist */}
      <section className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-3">
        <div className="flex items-center gap-2 text-[#1B4332]">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          <h3 className="font-display text-sm font-semibold">
            {t('cropIntelligence.soil.baselineTitle')}
          </h3>
        </div>
        <ul className="space-y-2 text-sm text-[#4A5A50] list-disc pl-5">
          {(isKn ? analysis.baselinePracticesKn : analysis.baselinePracticesEn).map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
