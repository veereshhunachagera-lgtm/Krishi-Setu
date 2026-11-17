import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Button } from '../components/Button';
import { FEATURE_CATEGORIES } from '../data/dashboardCatalog';
import { SmartAlertsPanel } from '../features/marketWeather/SmartAlertsPanel';
import { FarmerShellLayout } from '../layouts/FarmerShellLayout';
import type { FeatureCategoryId } from '../types/dashboard';

interface FeatureCategoryPageProps {
  categoryId: FeatureCategoryId;
  onBackDashboard: () => void;
  onSelectSubFeature: (subFeatureId: string) => void;
  onNavigateProfile: () => void;
  onLogout: () => void;
}

export function FeatureCategoryPage({
  categoryId,
  onBackDashboard,
  onSelectSubFeature,
  onNavigateProfile,
  onLogout,
}: FeatureCategoryPageProps) {
  const { t } = useTranslation();
  const category = FEATURE_CATEGORIES.find((c) => c.id === categoryId) || FEATURE_CATEGORIES[0];

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
                { label: t(category.titleKey) },
              ]}
            />
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#17221B]">
              {t(category.titleKey)}
            </h1>
            <p className="text-sm text-[#4A5A50] max-w-2xl">{t(category.subtitleKey)}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={onBackDashboard}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('common.backToDashboard')}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {category.subFeatures.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => onSelectSubFeature(sub.id)}
              className="group flex flex-col justify-between rounded-xl border border-[#E5E1D8] bg-white p-6 text-left transition-all duration-150 hover:border-[#1B4332] hover:shadow-sm cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]"
            >
              <div className="space-y-2.5">
                <p className="text-xs font-medium text-[#2D6A4F]">{t(sub.statusTagKey)}</p>
                <h2 className="font-display text-lg font-semibold text-[#17221B] group-hover:text-[#1B4332]">
                  {t(sub.titleKey)}
                </h2>
                <p className="text-sm text-[#4A5A50] leading-relaxed">
                  {t(sub.descriptionKey)}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-[#1B4332]">
                <span>{t('common.continue')}</span>
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </div>
            </button>
          ))}
        </div>

        {category.id === 'market-weather' && <SmartAlertsPanel />}
      </div>
    </FarmerShellLayout>
  );
}
