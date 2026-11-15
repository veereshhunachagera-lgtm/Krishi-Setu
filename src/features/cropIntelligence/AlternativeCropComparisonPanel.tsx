import { AlertTriangle, Check, Scale } from 'lucide-react';
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
import type {
  AlternativeComparisonResponse,
  CropKnowledgeItem,
} from '../../types/cropIntelligence';

interface AlternativeCropComparisonPanelProps {
  initialCropCodes?: string[];
}

export function AlternativeCropComparisonPanel({
  initialCropCodes,
}: AlternativeCropComparisonPanelProps) {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [allCrops, setAllCrops] = useState<CropKnowledgeItem[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>(
    initialCropCodes && initialCropCodes.length >= 2
      ? initialCropCodes.slice(0, 4)
      : ['ragi', 'tur-dal', 'groundnut'],
  );
  const [comparison, setComparison] = useState<AlternativeComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCropCodes && initialCropCodes.length >= 2) {
      setSelectedCodes(initialCropCodes.slice(0, 4));
    }
  }, [initialCropCodes]);

  useEffect(() => {
    cropIntelligenceService
      .searchCrops()
      .then((list) => setAllCrops(list))
      .catch(() => {});
  }, []);

  const runComparison = useCallback(async (codes: string[]) => {
    if (codes.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const res = await cropIntelligenceService.compareAlternatives(codes);
      setComparison(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    runComparison(selectedCodes);
  }, [selectedCodes, runComparison]);

  const toggleCropSelection = (code: string) => {
    setSelectedCodes((prev) => {
      if (prev.includes(code)) {
        if (prev.length <= 2) return prev;
        return prev.filter((c) => c !== code);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), code];
      }
      return [...prev, code];
    });
  };

  const chartData =
    comparison?.comparedCrops.map((item) => ({
      name: isKn ? item.crop.nameKn : item.crop.nameEn,
      minDays: item.crop.durationMinDays,
      maxDays: item.crop.durationMaxDays,
    })) || [];

  return (
    <div className="space-y-6">
      {error && (
        <ErrorBanner
          message={error}
          onRetry={() => runComparison(selectedCodes)}
          retryLabel={t('common.retry')}
        />
      )}

      {/* Crop Picker Bar */}
      <section className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[#17221B]">
            <Scale className="h-4 w-4 text-[#1B4332]" aria-hidden="true" />
            <h2 className="font-display text-base font-semibold">
              {t('cropIntelligence.comparison.pickerTitle')}
            </h2>
          </div>
          <span className="text-xs text-[#748379] tabular-nums">
            {t('cropIntelligence.comparison.selectedCount', { count: selectedCodes.length })}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {allCrops.map((crop) => {
            const active = selectedCodes.includes(crop.cropCode);
            return (
              <button
                key={crop.cropCode}
                type="button"
                onClick={() => toggleCropSelection(crop.cropCode)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'border-[#1B4332] bg-[#1B4332] text-white'
                    : 'border-[#E5E1D8] bg-[#FAF8F4] text-[#17221B] hover:border-[#2D6A4F]'
                }`}
              >
                {active && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                <span>{isKn ? crop.nameKn : crop.nameEn}</span>
              </button>
            );
          })}
        </div>
      </section>

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : comparison ? (
        <>
          {/* Key Trade-Off Summary */}
          <section className="rounded-xl border border-[#E5E1D8] bg-[#FAF8F4] p-5 space-y-3">
            <h3 className="font-display text-sm font-semibold text-[#17221B]">
              {t('cropIntelligence.comparison.tradeoffSummaryTitle')}
            </h3>
            <ul className="space-y-1.5 text-xs text-[#4A5A50] list-disc pl-4">
              {(isKn ? comparison.comparisonNotesKn : comparison.comparisonNotesEn).map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
            <div className="flex items-start gap-2 pt-2 border-t border-[#E5E1D8] text-xs text-[#8C5A2B]">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{(isKn ? comparison.limitationsKn : comparison.limitationsEn)[0]}</span>
            </div>
          </section>

          {/* Side-by-side Table */}
          <section className="rounded-xl border border-[#E5E1D8] bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E1D8]">
              <h3 className="font-display text-base font-semibold text-[#17221B]">
                {t('cropIntelligence.comparison.matrixTitle')}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#E5E1D8] bg-[#FAF8F4] text-xs font-semibold text-[#4A5A50]">
                  <tr>
                    <th className="px-5 py-3 w-44">{t('cropIntelligence.comparison.attribute')}</th>
                    {comparison.comparedCrops.map((item) => (
                      <th key={item.crop.cropCode} className="px-5 py-3 min-w-[200px] text-[#17221B]">
                        <div>{isKn ? item.crop.nameKn : item.crop.nameEn}</div>
                        <div className="font-normal text-[11px] text-[#748379]">
                          {item.crop.dataReliability === 'SAMPLE_REGIONAL_REFERENCE'
                            ? t('cropIntelligence.sampleDataLabel')
                            : t('cropIntelligence.curatedDataLabel')}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8] text-xs">
                  <tr>
                    <td className="px-5 py-3.5 font-semibold text-[#17221B]">
                      {t('cropIntelligence.comparison.suitabilityRow')}
                    </td>
                    {comparison.comparedCrops.map((item) => (
                      <td key={item.crop.cropCode} className="px-5 py-3.5 font-semibold text-[#1B4332]">
                        {t(`cropIntelligence.suitability.${item.suitabilityBand}`)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-5 py-3.5 font-semibold text-[#17221B]">
                      {t('cropIntelligence.comparison.waterRow')}
                    </td>
                    {comparison.comparedCrops.map((item) => (
                      <td key={item.crop.cropCode} className="px-5 py-3.5 text-[#4A5A50]">
                        <p className="font-semibold text-[#17221B]">
                          {t(`cropIntelligence.waterLevels.${item.crop.waterRequirement}`)}
                        </p>
                        <p className="mt-0.5">
                          {isKn ? item.crop.waterNotesKn : item.crop.waterNotesEn}
                        </p>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-5 py-3.5 font-semibold text-[#17221B]">
                      {t('cropIntelligence.comparison.durationRow')}
                    </td>
                    {comparison.comparedCrops.map((item) => (
                      <td
                        key={item.crop.cropCode}
                        className="px-5 py-3.5 font-mono tabular-nums text-[#17221B]"
                      >
                        {item.crop.durationMinDays}–{item.crop.durationMaxDays}{' '}
                        {t('cropIntelligence.daysUnit')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-5 py-3.5 font-semibold text-[#17221B]">
                      {t('cropIntelligence.comparison.soilPhRow')}
                    </td>
                    {comparison.comparedCrops.map((item) => (
                      <td key={item.crop.cropCode} className="px-5 py-3.5 text-[#4A5A50]">
                        <p>{item.crop.suitableSoils.join(', ')}</p>
                        <p className="font-mono tabular-nums mt-0.5">
                          pH {item.crop.minPh}–{item.crop.maxPh}
                        </p>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-5 py-3.5 font-semibold text-[#17221B] align-top">
                      {t('cropIntelligence.comparison.advantagesRow')}
                    </td>
                    {comparison.comparedCrops.map((item) => (
                      <td key={item.crop.cropCode} className="px-5 py-3.5 text-[#4A5A50] align-top">
                        <ul className="space-y-1 list-disc pl-4">
                          {(isKn ? item.crop.advantagesKn : item.crop.advantagesEn).map((adv, idx) => (
                            <li key={idx}>{adv}</li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-5 py-3.5 font-semibold text-[#17221B] align-top">
                      {t('cropIntelligence.comparison.risksRow')}
                    </td>
                    {comparison.comparedCrops.map((item) => (
                      <td key={item.crop.cropCode} className="px-5 py-3.5 text-[#4A5A50] align-top">
                        <ul className="space-y-1 list-disc pl-4">
                          {(isKn ? item.crop.risksKn : item.crop.risksEn).map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Recharts Duration Comparison Chart */}
          <section className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-base font-semibold text-[#17221B]">
                  {t('cropIntelligence.comparison.durationChartTitle')}
                </h3>
                <p className="text-xs text-[#4A5A50]">
                  {t('cropIntelligence.comparison.durationChartSubtitle')}
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => runComparison(selectedCodes)}>
                {t('cropIntelligence.comparison.refreshBtn')}
              </Button>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E1D8" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#4A5A50' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#4A5A50' }} />
                  <Tooltip />
                  <Bar
                    dataKey="minDays"
                    name={t('cropIntelligence.comparison.minDaysLegend')}
                    fill="#2D6A4F"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="maxDays"
                    name={t('cropIntelligence.comparison.maxDaysLegend')}
                    fill="#8C5A2B"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
