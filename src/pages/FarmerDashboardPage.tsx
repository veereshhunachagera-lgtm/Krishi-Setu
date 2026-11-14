import { Edit3, FileSpreadsheet, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import farmerPanoramaImg from '../assets/images/farmer_field_panorama_1794682475385.jpg';
import { Button } from '../components/Button';
import { ErrorBanner, LoadingSkeleton } from '../components/StatePanels';
import { FeatureHubGrid } from '../features/dashboard/FeatureHubGrid';
import { useAuth } from '../hooks/useAuth';
import { FarmerShellLayout } from '../layouts/FarmerShellLayout';
import type { FeatureCategoryId } from '../types/dashboard';
import type { FarmerProfile } from '../types/farmer';
import { formatLandArea } from '../utils/formatters';

interface FarmerDashboardPageProps {
  profile: FarmerProfile | null;
  loading: boolean;
  error: string | null;
  onReloadProfile: () => void;
  onSelectCategory: (categoryId: FeatureCategoryId) => void;
  onNavigateProfile: () => void;
  onEditOnboarding: () => void;
  onLogout: () => void;
}

export function FarmerDashboardPage({
  profile,
  loading,
  error,
  onReloadProfile,
  onSelectCategory,
  onNavigateProfile,
  onEditOnboarding,
  onLogout,
}: FarmerDashboardPageProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const displayName = profile?.farmerName || user?.fullName || '';

  return (
    <FarmerShellLayout
      onNavigateDashboard={() => undefined}
      onNavigateProfile={onNavigateProfile}
      onLogout={onLogout}
    >
      <div className="space-y-8">
        {error && (
          <ErrorBanner
            message={t(error)}
            onRetry={onReloadProfile}
            retryLabel={t('common.retry')}
          />
        )}

        {loading ? (
          <LoadingSkeleton rows={3} />
        ) : (
          <section className="overflow-hidden rounded-2xl border border-[#E5E1D8] bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
              <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[#2D6A4F]">
                    {t('dashboard.fieldSummaryPrefix')} ·{' '}
                    {profile?.hasSoilReport
                      ? t('dashboard.soilReportBadge')
                      : t('dashboard.fieldSurveyBadge')}
                  </p>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#17221B]">
                    {t('dashboard.welcomeHeading', { name: displayName })}
                  </h1>
                </div>

                {profile && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-[#E5E1D8] pt-5">
                    <div className="space-y-1">
                      <p className="text-xs text-[#748379] flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t('onboarding.districtLabel')}</span>
                      </p>
                      <p className="text-sm font-semibold text-[#17221B]">
                        {[profile.village, profile.district || profile.state]
                          .filter(Boolean)
                          .join(', ') || t('common.notProvided')}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-[#748379]">{t('common.landArea')}</p>
                      <p className="text-sm font-semibold text-[#17221B] tabular-nums">
                        {formatLandArea(profile.landSize, profile.landUnit, t)}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-[#748379]">{t('onboarding.cropLabel')}</p>
                      <p className="text-sm font-semibold text-[#17221B]">
                        {profile.currentOrPreviousCrop || t('common.notProvided')}
                      </p>
                    </div>

                    {profile.hasSoilReport ? (
                      <div className="space-y-1">
                        <p className="text-xs text-[#748379] flex items-center gap-1">
                          <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{t('onboarding.soilTypeLabel')}</span>
                        </p>
                        <p className="text-sm font-semibold text-[#17221B]">
                          {t('dashboard.soilSummaryValue')}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs text-[#748379]">{t('onboarding.soilTypeLabel')}</p>
                        <p className="text-sm font-semibold text-[#17221B]">
                          {profile.soilType
                            ? t(`onboarding.soilTypes.${profile.soilType}`)
                            : t('common.notProvided')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" size="sm" onClick={onEditOnboarding}>
                    <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('dashboard.editProfileButton')}
                  </Button>
                </div>
              </div>

              <div className="hidden lg:block lg:col-span-4 relative bg-[#E7F1EC]">
                <img
                  src={farmerPanoramaImg}
                  alt={t('dashboard.fieldSummaryPrefix')}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </section>
        )}

        {/* Exactly five main feature cards */}
        <FeatureHubGrid onSelectCategory={onSelectCategory} />
      </div>
    </FarmerShellLayout>
  );
}
