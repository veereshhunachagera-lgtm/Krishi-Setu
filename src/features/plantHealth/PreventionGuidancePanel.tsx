import { ChevronDown, ChevronUp, Search, ShieldAlert } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { inputBaseClass } from '../../components/FormField';
import { EmptyState, ErrorBanner, LoadingSkeleton } from '../../components/StatePanels';
import { plantHealthService } from '../../services/plantHealthService';
import type { PlantProtectionGuideItem } from '../../types/plantHealth';
import { cn } from '../../utils/cn';

interface PreventionGuidancePanelProps {
  initialCropCode?: string;
}

export function PreventionGuidancePanel({ initialCropCode }: PreventionGuidancePanelProps) {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [query, setQuery] = useState('');
  const [cropFilter, setCropFilter] = useState(initialCropCode || '');
  const [issueTypeFilter, setIssueTypeFilter] = useState('');

  const [guides, setGuides] = useState<PlantProtectionGuideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  useEffect(() => {
    if (initialCropCode) setCropFilter(initialCropCode);
  }, [initialCropCode]);

  const loadGuides = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await plantHealthService.listGuides({
        q: query.trim() || undefined,
        cropCode: cropFilter || undefined,
        issueType: issueTypeFilter || undefined,
      });
      setGuides(list);
      if (list.length > 0 && !expandedCode) {
        setExpandedCode(list[0].guideCode);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [query, cropFilter, issueTypeFilter, expandedCode, t]);

  useEffect(() => {
    const timer = setTimeout(loadGuides, 180);
    return () => clearTimeout(timer);
  }, [loadGuides]);

  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} onRetry={loadGuides} retryLabel={t('common.retry')} />}

      {/* Responsible Treatment & No-Invented-Dosage Notice */}
      <section className="rounded-xl border border-[#E5D5B8] bg-[#FBF6EC] p-4 flex items-start gap-3 text-xs text-[#4A5A50]">
        <ShieldAlert className="h-4 w-4 text-[#8C5A2B] shrink-0 mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed">{t('plantHealth.guidance.safetyBanner')}</p>
      </section>

      {/* Search & Filters */}
      <section className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#748379]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('plantHealth.guidance.searchPlaceholder')}
            className={cn(inputBaseClass, 'pl-9')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            aria-label={t('plantHealth.alerts.cropFilterLabel')}
            className={inputBaseClass}
          >
            <option value="">{t('plantHealth.alerts.allCrops')}</option>
            <option value="ragi">{t('plantHealth.crops.ragi')}</option>
            <option value="paddy">{t('plantHealth.crops.paddy')}</option>
            <option value="maize">{t('plantHealth.crops.maize')}</option>
            <option value="tur-dal">{t('plantHealth.crops.turDal')}</option>
            <option value="groundnut">{t('plantHealth.crops.groundnut')}</option>
            <option value="tomato">{t('plantHealth.crops.tomato')}</option>
            <option value="onion">{t('plantHealth.crops.onion')}</option>
            <option value="cotton">{t('plantHealth.crops.cotton')}</option>
          </select>

          <select
            value={issueTypeFilter}
            onChange={(e) => setIssueTypeFilter(e.target.value)}
            aria-label={t('plantHealth.guidance.issueTypeLabel')}
            className={inputBaseClass}
          >
            <option value="">{t('plantHealth.guidance.allIssueTypes')}</option>
            <option value="FUNGAL_DISEASE">{t('plantHealth.guidance.types.FUNGAL_DISEASE')}</option>
            <option value="BACTERIAL_DISEASE">
              {t('plantHealth.guidance.types.BACTERIAL_DISEASE')}
            </option>
            <option value="INSECT_PEST">{t('plantHealth.guidance.types.INSECT_PEST')}</option>
          </select>
        </div>
      </section>

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : guides.length === 0 ? (
        <EmptyState
          title={t('plantHealth.guidance.emptyTitle')}
          description={t('plantHealth.guidance.emptyDesc')}
        />
      ) : (
        <div className="space-y-4">
          {guides.map((guide) => {
            const expanded = expandedCode === guide.guideCode;
            const symptoms = isKn ? guide.symptomsKn : guide.symptomsEn;
            const preventive = isKn ? guide.preventivePracticesKn : guide.preventivePracticesEn;
            const management = isKn
              ? guide.responsibleManagementKn
              : guide.responsibleManagementEn;

            return (
              <article
                key={guide.id}
                className="rounded-xl border border-[#E5E1D8] bg-white overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedCode(expanded ? null : guide.guideCode)}
                  className="w-full p-5 text-left flex items-start justify-between gap-4 hover:bg-[#FAF8F4]/70 transition-colors cursor-pointer"
                >
                  <div className="space-y-1">
                    <p className="text-xs text-[#748379]">
                      <span className="font-semibold text-[#1B4332]">
                        {isKn ? guide.cropNameKn : guide.cropNameEn}
                      </span>
                      <span aria-hidden="true"> · </span>
                      <span>
                        {t(`plantHealth.guidance.types.${guide.issueType}`, {
                          defaultValue: guide.issueType,
                        })}
                      </span>
                      {guide.dataReliability === 'SAMPLE_REGIONAL_REFERENCE' && (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span className="font-medium text-[#8C5A2B]">
                            {t('cropIntelligence.sampleDataLabel')}
                          </span>
                        </>
                      )}
                    </p>
                    <h3 className="font-display text-base font-semibold text-[#17221B]">
                      {isKn ? guide.issueNameKn : guide.issueNameEn}
                      {guide.scientificName ? (
                        <span className="ml-2 text-xs font-normal italic text-[#748379]">
                          ({guide.scientificName})
                        </span>
                      ) : null}
                    </h3>
                    <p className="text-xs text-[#4A5A50]">
                      {isKn ? guide.favorableConditionsKn : guide.favorableConditionsEn}
                    </p>
                  </div>
                  {expanded ? (
                    <ChevronUp className="h-5 w-5 text-[#748379] shrink-0" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-[#748379] shrink-0" aria-hidden="true" />
                  )}
                </button>

                {expanded && (
                  <div className="border-t border-[#E5E1D8] bg-[#FAF8F4] p-5 space-y-5 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <p className="font-semibold text-[#17221B]">
                          {t('plantHealth.guidance.symptomsTitle')}
                        </p>
                        <ul className="list-disc pl-4 space-y-1 text-[#4A5A50]">
                          {symptoms.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-1.5">
                        <p className="font-semibold text-[#1B4332]">
                          {t('plantHealth.guidance.preventiveTitle')}
                        </p>
                        <ul className="list-disc pl-4 space-y-1 text-[#4A5A50]">
                          {preventive.map((p, idx) => (
                            <li key={idx}>{p}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-1.5">
                        <p className="font-semibold text-[#8C5A2B]">
                          {t('plantHealth.guidance.managementTitle')}
                        </p>
                        <ul className="list-disc pl-4 space-y-1 text-[#4A5A50]">
                          {management.map((m, idx) => (
                            <li key={idx}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="border-t border-[#E5E1D8] pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[#4A5A50]">
                      <p>
                        <span className="font-semibold text-[#17221B]">
                          {t('plantHealth.guidance.safetyNoteLabel')}:{' '}
                        </span>
                        {isKn ? guide.safetyNotesKn : guide.safetyNotesEn}
                      </p>
                      <p className="text-[#748379] shrink-0">
                        {t('cropIntelligence.sourceLabel')}: {guide.sourceReference}
                      </p>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
