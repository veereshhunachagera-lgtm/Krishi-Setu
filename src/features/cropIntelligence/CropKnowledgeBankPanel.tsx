import { Bug, ChevronDown, ChevronUp, Search, Sprout } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { inputBaseClass } from '../../components/FormField';
import { EmptyState, ErrorBanner, LoadingSkeleton } from '../../components/StatePanels';
import { cropIntelligenceService } from '../../services/cropIntelligenceService';
import type { CropKnowledgeItem } from '../../types/cropIntelligence';
import { cn } from '../../utils/cn';

export function CropKnowledgeBankPanel() {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [query, setQuery] = useState('');
  const [season, setSeason] = useState('ALL');
  const [soilType, setSoilType] = useState('ALL');
  const [waterRequirement, setWaterRequirement] = useState('ALL');
  const [category, setCategory] = useState('ALL');

  const [crops, setCrops] = useState<CropKnowledgeItem[]>([]);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCrops = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await cropIntelligenceService.searchCrops({
        q: query,
        season,
        soilType,
        waterRequirement,
        category,
      });
      setCrops(list);
      if (list.length > 0 && (!expandedCode || !list.some((c) => c.cropCode === expandedCode))) {
        setExpandedCode(list[0].cropCode);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [query, season, soilType, waterRequirement, category, expandedCode, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadCrops();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [loadCrops]);

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <section className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#748379]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('cropIntelligence.knowledgeBank.searchPlaceholder')}
              className={cn(inputBaseClass, 'pl-9')}
            />
          </div>

          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            aria-label={t('onboarding.seasonLabel')}
            className={inputBaseClass}
          >
            <option value="ALL">{t('cropIntelligence.knowledgeBank.allSeasons')}</option>
            <option value="KHARIF">{t('onboarding.seasons.KHARIF')}</option>
            <option value="RABI">{t('onboarding.seasons.RABI')}</option>
            <option value="ZAID">{t('onboarding.seasons.ZAID')}</option>
            <option value="PERENNIAL">{t('onboarding.seasons.PERENNIAL')}</option>
          </select>

          <select
            value={soilType}
            onChange={(e) => setSoilType(e.target.value)}
            aria-label={t('onboarding.soilTypeLabel')}
            className={inputBaseClass}
          >
            <option value="ALL">{t('cropIntelligence.knowledgeBank.allSoils')}</option>
            <option value="RED">{t('onboarding.soilTypes.RED')}</option>
            <option value="BLACK">{t('onboarding.soilTypes.BLACK')}</option>
            <option value="ALLUVIAL">{t('onboarding.soilTypes.ALLUVIAL')}</option>
            <option value="LATERITE">{t('onboarding.soilTypes.LATERITE')}</option>
            <option value="SANDY_LOAM">{t('onboarding.soilTypes.SANDY_LOAM')}</option>
          </select>

          <select
            value={waterRequirement}
            onChange={(e) => setWaterRequirement(e.target.value)}
            aria-label={t('cropIntelligence.waterLabel')}
            className={inputBaseClass}
          >
            <option value="ALL">{t('cropIntelligence.knowledgeBank.allWater')}</option>
            <option value="LOW">{t('cropIntelligence.waterLevels.LOW')}</option>
            <option value="MEDIUM">{t('cropIntelligence.waterLevels.MEDIUM')}</option>
            <option value="HIGH">{t('cropIntelligence.waterLevels.HIGH')}</option>
          </select>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'MILLET', 'PULSE', 'OILSEED', 'CEREAL', 'CASH_CROP', 'VEGETABLE'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                category === cat
                  ? 'bg-[#1B4332] text-white'
                  : 'bg-[#FAF8F4] text-[#4A5A50] hover:text-[#17221B]'
              }`}
            >
              {cat === 'ALL'
                ? t('cropIntelligence.knowledgeBank.allCategories')
                : t(`cropIntelligence.categories.${cat}`)}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <ErrorBanner message={error} onRetry={loadCrops} retryLabel={t('common.retry')} />
      )}

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : crops.length === 0 ? (
        <EmptyState
          title={t('cropIntelligence.knowledgeBank.emptyTitle')}
          description={t('cropIntelligence.knowledgeBank.emptyDesc')}
        />
      ) : (
        <div className="space-y-4">
          {crops.map((crop) => {
            const isOpen = expandedCode === crop.cropCode;
            const guidance = isKn ? crop.growingGuidanceKn : crop.growingGuidanceEn;

            return (
              <article
                key={crop.cropCode}
                className="rounded-xl border border-[#E5E1D8] bg-white overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedCode(isOpen ? null : crop.cropCode)}
                  className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-[#FAF8F4]/70 transition-colors cursor-pointer"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#748379]">
                      <span className="font-medium text-[#2D6A4F]">
                        {t(`cropIntelligence.categories.${crop.cropCategory}`)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{crop.seasons.join(', ')}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {crop.durationMinDays}–{crop.durationMaxDays} {t('cropIntelligence.daysUnit')}
                      </span>
                      {crop.dataReliability === 'SAMPLE_REGIONAL_REFERENCE' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-[#8C5A2B]">
                            {t('cropIntelligence.sampleDataLabel')}
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="font-display text-base font-semibold text-[#17221B]">
                      {isKn ? crop.nameKn : crop.nameEn}
                      {crop.scientificName && (
                        <span className="ml-2 text-xs font-normal italic text-[#748379]">
                          {crop.scientificName}
                        </span>
                      )}
                    </h3>
                  </div>

                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-[#4A5A50] shrink-0" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-[#4A5A50] shrink-0" aria-hidden="true" />
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-[#E5E1D8] px-5 py-5 space-y-5 bg-[#FAF8F4]/40">
                    {/* Quick Agronomic Metadata */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <p className="text-[#748379]">{t('onboarding.soilTypeLabel')}</p>
                        <p className="mt-0.5 font-medium text-[#17221B]">
                          {crop.suitableSoils.join(', ')}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#748379]">{t('cropIntelligence.waterLabel')}</p>
                        <p className="mt-0.5 font-medium text-[#17221B]">
                          {t(`cropIntelligence.waterLevels.${crop.waterRequirement}`)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#748379]">{t('onboarding.phLabel')}</p>
                        <p className="mt-0.5 font-mono font-medium text-[#17221B] tabular-nums">
                          {crop.minPh}–{crop.maxPh}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#748379]">
                          {t('cropIntelligence.knowledgeBank.supportedRegions')}
                        </p>
                        <p className="mt-0.5 font-medium text-[#17221B]">
                          {crop.supportedDistricts.slice(0, 4).join(', ')}
                          {crop.supportedDistricts.length > 4
                            ? ` +${crop.supportedDistricts.length - 4}`
                            : ''}
                        </p>
                      </div>
                    </div>

                    {/* Growing Guidance */}
                    <div className="space-y-3 border-t border-[#E5E1D8] pt-4">
                      <div className="flex items-center gap-2 text-[#1B4332]">
                        <Sprout className="h-4 w-4" aria-hidden="true" />
                        <h4 className="font-display text-sm font-semibold">
                          {t('cropIntelligence.knowledgeBank.growingGuidanceTitle')}
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#4A5A50]">
                        <div>
                          <p className="font-semibold text-[#17221B]">
                            {t('cropIntelligence.knowledgeBank.landPrep')}
                          </p>
                          <p className="mt-1 leading-relaxed">{guidance.landPreparation}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-[#17221B]">
                            {t('cropIntelligence.knowledgeBank.sowingSpacing')}
                          </p>
                          <p className="mt-1 leading-relaxed">{guidance.sowingAndSpacing}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-[#17221B]">
                            {t('cropIntelligence.knowledgeBank.irrigation')}
                          </p>
                          <p className="mt-1 leading-relaxed">{guidance.irrigationSchedule}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-[#17221B]">
                            {t('cropIntelligence.knowledgeBank.nutrition')}
                          </p>
                          <p className="mt-1 leading-relaxed">{guidance.nutrientPractice}</p>
                        </div>
                      </div>
                    </div>

                    {/* Common Pests & Diseases */}
                    <div className="space-y-3 border-t border-[#E5E1D8] pt-4">
                      <div className="flex items-center gap-2 text-[#8C5A2B]">
                        <Bug className="h-4 w-4" aria-hidden="true" />
                        <h4 className="font-display text-sm font-semibold">
                          {t('cropIntelligence.knowledgeBank.pestsTitle')}
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {crop.commonPests.map((pest, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg border border-[#E5E1D8] bg-white p-4 space-y-1.5 text-xs"
                          >
                            <p className="font-semibold text-[#17221B]">
                              {isKn ? pest.pestNameKn : pest.pestNameEn}
                            </p>
                            <p className="text-[#4A5A50]">
                              <span className="font-medium text-[#17221B]">
                                {t('cropIntelligence.knowledgeBank.symptomsLabel')}:{' '}
                              </span>
                              {isKn ? pest.symptomsKn : pest.symptomsEn}
                            </p>
                            <p className="text-[#4A5A50]">
                              <span className="font-medium text-[#1B4332]">
                                {t('cropIntelligence.knowledgeBank.managementLabel')}:{' '}
                              </span>
                              {isKn ? pest.managementKn : pest.managementEn}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {crop.sourceReference && (
                      <p className="text-[11px] text-[#748379] pt-1">
                        {t('cropIntelligence.sourceLabel')}: {crop.sourceReference}
                      </p>
                    )}
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
