import { ArrowLeft, CheckCircle2, Info, Sprout } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Button } from '../components/Button';
import { FEATURE_CATEGORIES } from '../data/dashboardCatalog';
import { AlternativeCropComparisonPanel } from '../features/cropIntelligence/AlternativeCropComparisonPanel';
import { CropAdvisoryPanel } from '../features/cropIntelligence/CropAdvisoryPanel';
import { CropKnowledgeBankPanel } from '../features/cropIntelligence/CropKnowledgeBankPanel';
import { CropRotationPanel } from '../features/cropIntelligence/CropRotationPanel';
import { FertilizerPlannerPanel } from '../features/cropIntelligence/FertilizerPlannerPanel';
import { SoilHealthAnalysisPanel } from '../features/cropIntelligence/SoilHealthAnalysisPanel';
import { FarmerShellLayout } from '../layouts/FarmerShellLayout';
import type { FeatureCategoryId } from '../types/dashboard';
import type { FarmerProfile } from '../types/farmer';
import { formatLandArea } from '../utils/formatters';

interface SubFeatureWorkflowPageProps {
  categoryId: FeatureCategoryId;
  subFeatureId: string;
  profile: FarmerProfile | null;
  onBackDashboard: () => void;
  onBackCategory: () => void;
  onSelectSubFeature: (subFeatureId: string) => void;
  onNavigateProfile: () => void;
  onEditOnboarding: () => void;
  onLogout: () => void;
}

export function SubFeatureWorkflowPage({
  categoryId,
  subFeatureId,
  profile,
  onBackDashboard,
  onBackCategory,
  onSelectSubFeature,
  onNavigateProfile,
  onEditOnboarding,
  onLogout,
}: SubFeatureWorkflowPageProps) {
  const { t } = useTranslation();
  const [compareCodes, setCompareCodes] = useState<string[] | undefined>(undefined);

  const category = FEATURE_CATEGORIES.find((c) => c.id === categoryId) || FEATURE_CATEGORIES[0];
  const subFeature =
    category.subFeatures.find((s) => s.id === subFeatureId) || category.subFeatures[0];

  const categoryTitle = t(category.titleKey);
  const subTitle = t(subFeature.titleKey);

  const handleOpenComparison = (codes: string[]) => {
    setCompareCodes(codes);
    onSelectSubFeature('alternative-crops');
  };

  const isCropSoilPhase2 = category.id === 'crop-soil';

  return (
    <FarmerShellLayout
      onNavigateDashboard={onBackDashboard}
      onNavigateProfile={onNavigateProfile}
      onLogout={onLogout}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E1D8] pb-5">
          <div className="space-y-2">
            <Breadcrumbs
              items={[
                { label: t('common.dashboard'), onClick: onBackDashboard },
                { label: categoryTitle, onClick: onBackCategory },
                { label: subTitle },
              ]}
            />
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#17221B]">
              {subTitle}
            </h1>
            <p className="text-sm text-[#4A5A50] max-w-2xl">{t(subFeature.descriptionKey)}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={onBackCategory}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('subFeature.backToCategory', { category: categoryTitle })}
          </Button>
        </div>

        {/* Sub-feature quick navigation tabs inside Crop & Soil Intelligence */}
        {isCropSoilPhase2 && (
          <nav
            aria-label={categoryTitle}
            className="flex flex-wrap items-center gap-1.5 border-b border-[#E5E1D8] pb-4"
          >
            {category.subFeatures.map((sf) => {
              const active = sf.id === subFeature.id;
              return (
                <button
                  key={sf.id}
                  type="button"
                  onClick={() => onSelectSubFeature(sf.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#1B4332] text-white'
                      : 'bg-white border border-[#E5E1D8] text-[#4A5A50] hover:text-[#17221B]'
                  }`}
                >
                  {t(sf.titleKey)}
                </button>
              );
            })}
          </nav>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {subFeature.id === 'crop-advisory' ? (
              <CropAdvisoryPanel
                profile={profile}
                onEditProfile={onEditOnboarding}
                onCompareCrops={handleOpenComparison}
              />
            ) : subFeature.id === 'alternative-crops' ? (
              <AlternativeCropComparisonPanel initialCropCodes={compareCodes} />
            ) : subFeature.id === 'soil-health-analysis' ? (
              <SoilHealthAnalysisPanel onEditOnboarding={onEditOnboarding} />
            ) : subFeature.id === 'crop-knowledge-bank' ? (
              <CropKnowledgeBankPanel />
            ) : subFeature.id === 'fertilizer-planner' ? (
              <FertilizerPlannerPanel profile={profile} />
            ) : subFeature.id === 'crop-rotation' ? (
              <CropRotationPanel profile={profile} onCompareCrops={handleOpenComparison} />
            ) : (
              <>
                <div className="rounded-xl border border-[#E5E1D8] bg-white p-6 space-y-4">
                  <div className="flex items-center gap-2 text-[#1B4332]">
                    <Sprout className="h-5 w-5" aria-hidden="true" />
                    <h2 className="font-display text-base font-semibold">
                      {t('subFeature.workflowTitle')}
                    </h2>
                  </div>

                  <ol className="space-y-3">
                    {subFeature.workflowStepsKeys.map((stepKey, idx) => (
                      <li key={stepKey} className="flex items-start gap-3 text-sm text-[#17221B]">
                        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#E7F1EC] font-mono text-xs font-semibold text-[#1B4332] tabular-nums">
                          0{idx + 1}
                        </span>
                        <span className="leading-relaxed text-[#4A5A50]">{t(stepKey)}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="rounded-xl border border-[#E5E1D8] bg-white p-6 space-y-3">
                  <div className="flex items-center gap-2 text-[#17221B]">
                    <Info className="h-4 w-4 text-[#2D6A4F]" aria-hidden="true" />
                    <h2 className="font-display text-sm font-semibold">
                      {t('subFeature.integrationStatusTitle')} · {t(subFeature.statusTagKey)}
                    </h2>
                  </div>
                  <p className="text-sm text-[#4A5A50] leading-relaxed">
                    {t(subFeature.integrationNoteKey)}
                  </p>
                </div>
              </>
            )}
          </div>

          <aside className="lg:col-span-4">
            <div className="rounded-xl border border-[#E5E1D8] bg-white p-6 space-y-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-base font-semibold text-[#17221B]">
                  {t('subFeature.farmerContextTitle')}
                </h2>
                <CheckCircle2 className="h-4 w-4 text-[#2D6A4F] shrink-0" aria-hidden="true" />
              </div>

              {profile ? (
                <dl className="divide-y divide-[#E5E1D8] text-sm">
                  <div className="flex justify-between gap-3 py-2.5">
                    <dt className="text-[#748379]">{t('onboarding.farmerNameLabel')}</dt>
                    <dd className="font-medium text-[#17221B] text-right">{profile.farmerName}</dd>
                  </div>
                  <div className="flex justify-between gap-3 py-2.5">
                    <dt className="text-[#748379]">{t('onboarding.districtLabel')}</dt>
                    <dd className="font-medium text-[#17221B] text-right">
                      {profile.district || t('common.notProvided')}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 py-2.5">
                    <dt className="text-[#748379]">{t('common.landArea')}</dt>
                    <dd className="font-medium text-[#17221B] text-right tabular-nums">
                      {formatLandArea(profile.landSize, profile.landUnit, t)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 py-2.5">
                    <dt className="text-[#748379]">{t('onboarding.cropLabel')}</dt>
                    <dd className="font-medium text-[#17221B] text-right">
                      {profile.currentOrPreviousCrop || t('common.notProvided')}
                    </dd>
                  </div>

                  {profile.hasSoilReport && profile.soilReport ? (
                    <>
                      <div className="flex justify-between gap-3 py-2.5">
                        <dt className="text-[#748379]">{t('onboarding.nitrogenLabel')}</dt>
                        <dd className="font-mono font-medium text-[#17221B] tabular-nums">
                          {profile.soilReport.nitrogenUnknown
                            ? t('common.unknown')
                            : profile.soilReport.nitrogenKgPerHa !== null
                              ? `${profile.soilReport.nitrogenKgPerHa} ${t('common.kgPerHa')}`
                              : t('common.notProvided')}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3 py-2.5">
                        <dt className="text-[#748379]">{t('onboarding.phosphorusLabel')}</dt>
                        <dd className="font-mono font-medium text-[#17221B] tabular-nums">
                          {profile.soilReport.phosphorusUnknown
                            ? t('common.unknown')
                            : profile.soilReport.phosphorusKgPerHa !== null
                              ? `${profile.soilReport.phosphorusKgPerHa} ${t('common.kgPerHa')}`
                              : t('common.notProvided')}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3 py-2.5">
                        <dt className="text-[#748379]">{t('onboarding.potassiumLabel')}</dt>
                        <dd className="font-mono font-medium text-[#17221B] tabular-nums">
                          {profile.soilReport.potassiumUnknown
                            ? t('common.unknown')
                            : profile.soilReport.potassiumKgPerHa !== null
                              ? `${profile.soilReport.potassiumKgPerHa} ${t('common.kgPerHa')}`
                              : t('common.notProvided')}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3 py-2.5">
                        <dt className="text-[#748379]">{t('onboarding.phLabel')}</dt>
                        <dd className="font-mono font-medium text-[#17221B] tabular-nums">
                          {profile.soilReport.phUnknown
                            ? t('common.unknown')
                            : (profile.soilReport.phLevel ?? t('common.notProvided'))}
                        </dd>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between gap-3 py-2.5">
                        <dt className="text-[#748379]">{t('onboarding.soilTypeLabel')}</dt>
                        <dd className="font-medium text-[#17221B] text-right">
                          {profile.soilType
                            ? t(`onboarding.soilTypes.${profile.soilType}`)
                            : t('common.notProvided')}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3 py-2.5">
                        <dt className="text-[#748379]">{t('onboarding.irrigationLabel')}</dt>
                        <dd className="font-medium text-[#17221B] text-right">
                          {profile.irrigationSource
                            ? t(`onboarding.irrigationSources.${profile.irrigationSource}`)
                            : t('common.notProvided')}
                        </dd>
                      </div>
                      <p className="pt-3 text-xs text-[#4A5A50] leading-relaxed">
                        {t('subFeature.noSoilCardNote')}
                      </p>
                    </>
                  )}
                </dl>
              ) : null}

              <Button variant="secondary" size="sm" className="w-full" onClick={onEditOnboarding}>
                {t('subFeature.goToProfile')}
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </FarmerShellLayout>
  );
}
