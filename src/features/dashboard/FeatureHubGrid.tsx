import {
  ArrowRight,
  Bot,
  CloudSun,
  Landmark,
  ShieldPlus,
  Sprout,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FEATURE_CATEGORIES } from '../../data/dashboardCatalog';
import type { FeatureCategoryId } from '../../types/dashboard';

interface FeatureHubGridProps {
  onSelectCategory: (categoryId: FeatureCategoryId) => void;
}

const CATEGORY_ICONS: Record<FeatureCategoryId, typeof Sprout> = {
  'crop-soil': Sprout,
  'plant-health': ShieldPlus,
  'market-weather': CloudSun,
  'agri-services': Landmark,
  'ai-assistant': Bot,
};

export function FeatureHubGrid({ onSelectCategory }: FeatureHubGridProps) {
  const { t } = useTranslation();

  return (
    <section aria-labelledby="hub-heading" className="space-y-5">
      <div>
        <h2 id="hub-heading" className="font-display text-xl font-semibold text-[#17221B]">
          {t('dashboard.hubTitle')}
        </h2>
        <p className="mt-1 text-sm text-[#4A5A50]">{t('dashboard.hubSubtitle')}</p>
      </div>

      {/* Exactly five main feature cards on the dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURE_CATEGORIES.map((category, idx) => {
          const Icon = CATEGORY_ICONS[category.id];
          const isWideOnLg = idx === 0;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelectCategory(category.id)}
              className={`group flex flex-col justify-between rounded-xl border border-[#E5E1D8] bg-white p-6 text-left transition-all duration-150 hover:border-[#1B4332] hover:shadow-sm cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332] ${
                isWideOnLg ? 'md:col-span-2 lg:col-span-2' : ''
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: category.accentHex }}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span className="text-xs font-medium text-[#748379] tabular-nums">
                    {t('dashboard.subFeatureCount', { count: category.subFeatures.length })}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-display text-lg font-semibold text-[#17221B] group-hover:text-[#1B4332] transition-colors">
                    {t(category.titleKey)}
                  </h3>
                  <p className="text-sm text-[#4A5A50] leading-relaxed">
                    {t(category.subtitleKey)}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-[#1B4332]">
                <span>{t('dashboard.openModule')}</span>
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
