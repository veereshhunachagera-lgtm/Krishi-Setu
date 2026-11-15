import { AlertTriangle, BookmarkCheck, CheckCircle2, Info, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { inputBaseClass } from '../../components/FormField';
import { EmptyState, ErrorBanner, LoadingSkeleton } from '../../components/StatePanels';
import { cropIntelligenceService } from '../../services/cropIntelligenceService';
import type {
  CropRecommendationResponse,
  RecommendedCropItem,
  SavedCropPlan,
} from '../../types/cropIntelligence';
import type { FarmerProfile } from '../../types/farmer';

interface CropAdvisoryPanelProps {
  profile: FarmerProfile | null;
  onEditProfile: () => void;
  onCompareCrops: (cropCodes: string[]) => void;
}

export function CropAdvisoryPanel({
  profile,
  onEditProfile,
  onCompareCrops,
}: CropAdvisoryPanelProps) {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [seasonFilter, setSeasonFilter] = useState<string>('');
  const [irrigationFilter, setIrrigationFilter] = useState<string>('');
  const [soilFilter, setSoilFilter] = useState<string>('');

  const [data, setData] = useState<CropRecommendationResponse | null>(null);
  const [savedPlans, setSavedPlans] = useState<SavedCropPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPrimary, setSelectedPrimary] = useState<string>('');
  const [selectedAlts, setSelectedAlts] = useState<string[]>([]);
  const [planNotes, setPlanNotes] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [recRes, plansRes] = await Promise.all([
        cropIntelligenceService.getRecommendations({
          season: seasonFilter || undefined,
          irrigation: irrigationFilter || undefined,
          soilType: soilFilter || undefined,
        }),
        cropIntelligenceService.listSavedPlans(),
      ]);
      setData(recRes);
      setSavedPlans(plansRes);
      if (recRes.recommendations.length > 0 && !selectedPrimary) {
        setSelectedPrimary(recRes.recommendations[0].crop.cropCode);
        const defaultAlts = recRes.recommendations.slice(1, 3).map((r) => r.crop.cropCode);
        setSelectedAlts(defaultAlts);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [seasonFilter, irrigationFilter, soilFilter, selectedPrimary, t]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const toggleAlternative = (cropCode: string) => {
    if (cropCode === selectedPrimary) return;
    setSelectedAlts((prev) => {
      if (prev.includes(cropCode)) return prev.filter((c) => c !== cropCode);
      if (prev.length >= 3) return [...prev.slice(1), cropCode];
      return [...prev, cropCode];
    });
  };

  const handleSavePlan = async () => {
    if (!selectedPrimary) return;
    setSavingPlan(true);
    setSaveMessage(null);
    setError(null);
    try {
      const created = await cropIntelligenceService.savePlan({
        primaryCropCode: selectedPrimary,
        alternativeCropCodes: selectedAlts,
        plannedSeason: seasonFilter || profile?.growingSeason || null,
        farmerNotes: planNotes.trim() || null,
      });
      setSavedPlans((prev) => [created, ...prev]);
      setPlanNotes('');
      setSaveMessage(t('cropIntelligence.advisory.planSavedMessage'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      await cropIntelligenceService.deletePlan(planId);
      setSavedPlans((prev) => prev.filter((p) => p.id !== planId));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    }
  };

  const renderSuitabilityLabel = (band: RecommendedCropItem['suitabilityBand']) => {
    if (band === 'STRONG_FIT') return t('cropIntelligence.suitability.STRONG_FIT');
    if (band === 'MODERATE_FIT') return t('cropIntelligence.suitability.MODERATE_FIT');
    return t('cropIntelligence.suitability.CONDITIONAL_FIT');
  };

  const suitabilityTextTone = (band: RecommendedCropItem['suitabilityBand']) => {
    if (band === 'STRONG_FIT') return 'text-[#1B4332]';
    if (band === 'MODERATE_FIT') return 'text-[#8C5A2B]';
    return 'text-[#748379]';
  };

  if (loading && !data) {
    return <LoadingSkeleton rows={5} />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <ErrorBanner message={error} onRetry={loadRecommendations} retryLabel={t('common.retry')} />
      )}

      {/* What-If / Season & Water Explorer */}
      <section className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-semibold text-[#17221B]">
              {t('cropIntelligence.advisory.filterTitle')}
            </h2>
            <p className="text-xs text-[#4A5A50]">
              {t('cropIntelligence.advisory.filterSubtitle')}
            </p>
          </div>
          {(seasonFilter || irrigationFilter || soilFilter) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSeasonFilter('');
                setIrrigationFilter('');
                setSoilFilter('');
              }}
            >
              {t('cropIntelligence.advisory.resetFilters')}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-[#4A5A50]">
              {t('onboarding.seasonLabel')}
            </span>
            <select
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              className={inputBaseClass}
            >
              <option value="">
                {t('cropIntelligence.advisory.usingSavedValue', {
                  value: profile?.growingSeason
                    ? t(`onboarding.seasons.${profile.growingSeason}`)
                    : t('common.notProvided'),
                })}
              </option>
              <option value="KHARIF">{t('onboarding.seasons.KHARIF')}</option>
              <option value="RABI">{t('onboarding.seasons.RABI')}</option>
              <option value="ZAID">{t('onboarding.seasons.ZAID')}</option>
              <option value="PERENNIAL">{t('onboarding.seasons.PERENNIAL')}</option>
            </select>
          </label>

          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-[#4A5A50]">
              {t('onboarding.irrigationLabel')}
            </span>
            <select
              value={irrigationFilter}
              onChange={(e) => setIrrigationFilter(e.target.value)}
              className={inputBaseClass}
            >
              <option value="">
                {t('cropIntelligence.advisory.usingSavedValue', {
                  value: profile?.irrigationSource
                    ? t(`onboarding.irrigationSources.${profile.irrigationSource}`)
                    : t('common.notProvided'),
                })}
              </option>
              <option value="RAINFED">{t('onboarding.irrigationSources.RAINFED')}</option>
              <option value="BOREWELL">{t('onboarding.irrigationSources.BOREWELL')}</option>
              <option value="CANAL">{t('onboarding.irrigationSources.CANAL')}</option>
              <option value="DRIP_SPRINKLER">{t('onboarding.irrigationSources.DRIP_SPRINKLER')}</option>
              <option value="OPEN_WELL">{t('onboarding.irrigationSources.OPEN_WELL')}</option>
              <option value="TANK_POND">{t('onboarding.irrigationSources.TANK_POND')}</option>
            </select>
          </label>

          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-[#4A5A50]">
              {t('onboarding.soilTypeLabel')}
            </span>
            <select
              value={soilFilter}
              onChange={(e) => setSoilFilter(e.target.value)}
              className={inputBaseClass}
            >
              <option value="">
                {t('cropIntelligence.advisory.usingSavedValue', {
                  value: profile?.soilType
                    ? t(`onboarding.soilTypes.${profile.soilType}`)
                    : t('common.notProvided'),
                })}
              </option>
              <option value="RED">{t('onboarding.soilTypes.RED')}</option>
              <option value="BLACK">{t('onboarding.soilTypes.BLACK')}</option>
              <option value="ALLUVIAL">{t('onboarding.soilTypes.ALLUVIAL')}</option>
              <option value="LATERITE">{t('onboarding.soilTypes.LATERITE')}</option>
              <option value="SANDY_LOAM">{t('onboarding.soilTypes.SANDY_LOAM')}</option>
            </select>
          </label>
        </div>
      </section>

      {/* Missing Info & Limitations Transparency Box */}
      {data && (
        <section className="rounded-xl border border-[#E5E1D8] bg-[#FAF8F4] p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[#17221B]">
              <AlertTriangle className="h-4 w-4 text-[#8C5A2B] shrink-0" aria-hidden="true" />
              <h3 className="font-display text-sm font-semibold">
                {t('cropIntelligence.advisory.limitationsHeading')}
              </h3>
            </div>
            <button
              type="button"
              onClick={onEditProfile}
              className="text-xs font-semibold text-[#1B4332] hover:underline text-left cursor-pointer"
            >
              {t('subFeature.goToProfile')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#4A5A50]">
            <div className="space-y-1.5">
              <p className="font-semibold text-[#17221B]">
                {t('cropIntelligence.advisory.missingFieldsLabel')}
              </p>
              {(isKn ? data.missingInformationKn : data.missingInformationEn).length === 0 ? (
                <p>{t('cropIntelligence.advisory.noMissingFields')}</p>
              ) : (
                <ul className="space-y-1 list-disc pl-4">
                  {(isKn ? data.missingInformationKn : data.missingInformationEn).map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-1.5">
              <p className="font-semibold text-[#17221B]">
                {t('cropIntelligence.advisory.scopeLimitsLabel')}
              </p>
              <ul className="space-y-1 list-disc pl-4">
                {(isKn ? data.limitationsKn : data.limitationsEn).map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Save Plan & Compare Action Bar */}
      {data && data.recommendations.length > 0 && (
        <section className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-[#17221B]">
                {t('cropIntelligence.advisory.planBuilderTitle')}
              </h2>
              <p className="text-xs text-[#4A5A50]">
                {t('cropIntelligence.advisory.planBuilderSubtitle')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={[selectedPrimary, ...selectedAlts].filter(Boolean).length < 2}
                onClick={() =>
                  onCompareCrops(
                    Array.from(new Set([selectedPrimary, ...selectedAlts].filter(Boolean))),
                  )
                }
              >
                {t('cropIntelligence.advisory.compareSelectedBtn', {
                  count: Array.from(new Set([selectedPrimary, ...selectedAlts].filter(Boolean))).length,
                })}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2 space-y-1">
              <label htmlFor="advisory-plan-notes" className="text-xs font-medium text-[#4A5A50]">
                {t('cropIntelligence.advisory.notesLabel')}
              </label>
              <input
                id="advisory-plan-notes"
                type="text"
                value={planNotes}
                onChange={(e) => setPlanNotes(e.target.value)}
                placeholder={t('cropIntelligence.advisory.notesPlaceholder')}
                maxLength={500}
                className={inputBaseClass}
              />
            </div>
            <Button
              variant="primary"
              size="md"
              loading={savingPlan}
              disabled={!selectedPrimary}
              onClick={handleSavePlan}
            >
              <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
              {t('cropIntelligence.advisory.savePlanBtn')}
            </Button>
          </div>

          {saveMessage && (
            <p className="text-xs font-medium text-[#1B4332]">{saveMessage}</p>
          )}
        </section>
      )}

      {/* Recommendations List */}
      {data && data.recommendations.length === 0 ? (
        <EmptyState
          title={t('cropIntelligence.advisory.emptyTitle')}
          description={t('cropIntelligence.advisory.emptyDesc')}
        />
      ) : (
        <div className="space-y-4">
          {data?.recommendations.map((item) => {
            const crop = item.crop;
            const reasons = isKn ? item.matchReasonsKn : item.matchReasonsEn;
            const cautions = isKn ? item.cautionsKn : item.cautionsEn;
            const isPrimary = selectedPrimary === crop.cropCode;
            const isAlt = selectedAlts.includes(crop.cropCode);

            return (
              <article
                key={crop.cropCode}
                className={`rounded-xl border bg-white p-5 space-y-4 transition-colors ${
                  isPrimary ? 'border-[#1B4332]' : 'border-[#E5E1D8]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#748379]">
                      <span className={`font-semibold ${suitabilityTextTone(item.suitabilityBand)}`}>
                        {renderSuitabilityLabel(item.suitabilityBand)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{t(`cropIntelligence.categories.${crop.cropCategory}`)}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {t('cropIntelligence.waterLabel')}:{' '}
                        {t(`cropIntelligence.waterLevels.${crop.waterRequirement}`)}
                      </span>
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

                    <h3 className="font-display text-lg font-semibold text-[#17221B]">
                      {isKn ? crop.nameKn : crop.nameEn}
                      {crop.scientificName ? (
                        <span className="ml-2 text-xs font-normal italic text-[#748379]">
                          ({crop.scientificName})
                        </span>
                      ) : null}
                    </h3>
                    <p className="text-xs text-[#4A5A50]">
                      {isKn ? crop.climateNoteKn : crop.climateNoteEn}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      variant={isPrimary ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => {
                        setSelectedPrimary(crop.cropCode);
                        setSelectedAlts((prev) => prev.filter((c) => c !== crop.cropCode));
                      }}
                    >
                      {isPrimary
                        ? t('cropIntelligence.advisory.selectedAsPrimary')
                        : t('cropIntelligence.advisory.selectPrimary')}
                    </Button>
                    <Button
                      variant={isAlt ? 'primary' : 'secondary'}
                      size="sm"
                      disabled={isPrimary}
                      onClick={() => toggleAlternative(crop.cropCode)}
                    >
                      {isAlt
                        ? t('cropIntelligence.advisory.selectedAsAlt')
                        : t('cropIntelligence.advisory.selectAlt')}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#E5E1D8] pt-4 text-sm">
                  <div className="space-y-1.5">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-[#1B4332]">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('cropIntelligence.advisory.whyRecommended')}
                    </p>
                    <ul className="space-y-1 text-xs text-[#4A5A50] list-disc pl-4">
                      {reasons.map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-[#8C5A2B]">
                      <Info className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('cropIntelligence.advisory.risksAndChecks')}
                    </p>
                    {cautions.length > 0 ? (
                      <ul className="space-y-1 text-xs text-[#4A5A50] list-disc pl-4">
                        {cautions.map((c, idx) => (
                          <li key={idx}>{c}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-[#4A5A50]">
                        {t('cropIntelligence.advisory.noMajorCautions')}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Saved Advisory Plans Persistence Section */}
      <section className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-4">
        <h2 className="font-display text-base font-semibold text-[#17221B]">
          {t('cropIntelligence.advisory.savedPlansTitle')}
        </h2>

        {savedPlans.length === 0 ? (
          <p className="text-xs text-[#4A5A50]">
            {t('cropIntelligence.advisory.noSavedPlans')}
          </p>
        ) : (
          <div className="divide-y divide-[#E5E1D8]">
            {savedPlans.map((plan) => (
              <div
                key={plan.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#17221B]">
                    {isKn ? plan.primaryCropNameKn : plan.primaryCropNameEn}
                    {plan.plannedSeason ? (
                      <span className="ml-2 text-xs font-normal text-[#748379]">
                        · {t(`onboarding.seasons.${plan.plannedSeason}`, { defaultValue: plan.plannedSeason })}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-[#4A5A50]">
                    {t('cropIntelligence.advisory.alternativesSaved')}:{' '}
                    {plan.alternativeCropCodes.length > 0
                      ? plan.alternativeCropCodes.join(', ')
                      : t('common.notProvided')}
                    {plan.farmerNotes ? ` · ${plan.farmerNotes}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {plan.alternativeCropCodes.length >= 1 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        onCompareCrops([plan.primaryCropCode, ...plan.alternativeCropCodes].slice(0, 4))
                      }
                    >
                      {t('cropIntelligence.advisory.openComparison')}
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeletePlan(plan.id)}
                    aria-label={t('cropIntelligence.advisory.deletePlan')}
                    className="p-2 text-[#748379] hover:text-[#B42318] rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
