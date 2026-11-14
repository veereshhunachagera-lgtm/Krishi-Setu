import { ArrowLeft, Edit3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Button } from '../components/Button';
import { ErrorBanner, LoadingSkeleton } from '../components/StatePanels';
import { useAuth } from '../hooks/useAuth';
import { FarmerShellLayout } from '../layouts/FarmerShellLayout';
import type { FarmerProfile } from '../types/farmer';
import { formatLandArea } from '../utils/formatters';

interface FarmerProfilePageProps {
  profile: FarmerProfile | null;
  loading: boolean;
  error: string | null;
  onReload: () => void;
  onBackDashboard: () => void;
  onEditOnboarding: () => void;
  onLogout: () => void;
}

export function FarmerProfilePage({
  profile,
  loading,
  error,
  onReload,
  onBackDashboard,
  onEditOnboarding,
  onLogout,
}: FarmerProfilePageProps) {
  const { t } = useTranslation();
  const { user, language } = useAuth();

  return (
    <FarmerShellLayout
      onNavigateDashboard={onBackDashboard}
      onNavigateProfile={() => undefined}
      onLogout={onLogout}
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E1D8] pb-5">
          <div className="space-y-2">
            <Breadcrumbs
              items={[
                { label: t('common.dashboard'), onClick: onBackDashboard },
                { label: t('common.profile') },
              ]}
            />
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#17221B]">
              {t('profile.pageTitle')}
            </h1>
            <p className="text-sm text-[#4A5A50]">{t('profile.pageSubtitle')}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="secondary" size="sm" onClick={onBackDashboard}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t('common.backToDashboard')}
            </Button>
            <Button size="sm" onClick={onEditOnboarding}>
              <Edit3 className="h-4 w-4" aria-hidden="true" />
              {t('common.edit')}
            </Button>
          </div>
        </div>

        {error && (
          <ErrorBanner message={t(error)} onRetry={onReload} retryLabel={t('common.retry')} />
        )}

        {loading ? (
          <LoadingSkeleton rows={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="rounded-xl border border-[#E5E1D8] bg-white p-6 space-y-4">
              <h2 className="font-display text-base font-semibold text-[#17221B]">
                {t('profile.accountSection')}
              </h2>
              <dl className="divide-y divide-[#E5E1D8] text-sm">
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-[#748379]">{t('onboarding.farmerNameLabel')}</dt>
                  <dd className="font-medium text-[#17221B]">{profile?.farmerName || user?.fullName}</dd>
                </div>
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-[#748379]">{t('profile.email')}</dt>
                  <dd className="font-mono text-xs text-[#17221B]">{user?.email}</dd>
                </div>
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-[#748379]">{t('profile.preferredLanguage')}</dt>
                  <dd className="font-medium text-[#17221B]">
                    {language === 'kn' ? 'ಕನ್ನಡ (Kannada)' : 'English'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-[#748379]">{t('profile.onboardingStatus')}</dt>
                  <dd className="font-medium text-[#1B4332]">{t('profile.completed')}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-[#E5E1D8] bg-white p-6 space-y-4">
              <h2 className="font-display text-base font-semibold text-[#17221B]">
                {t('profile.fieldSection')}
              </h2>
              <dl className="divide-y divide-[#E5E1D8] text-sm">
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-[#748379]">{t('onboarding.stateLabel')}</dt>
                  <dd className="font-medium text-[#17221B]">{profile?.state || t('common.notProvided')}</dd>
                </div>
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-[#748379]">{t('onboarding.districtLabel')}</dt>
                  <dd className="font-medium text-[#17221B]">{profile?.district || t('common.notProvided')}</dd>
                </div>
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-[#748379]">{t('onboarding.villageLabel')}</dt>
                  <dd className="font-medium text-[#17221B]">{profile?.village || t('common.notProvided')}</dd>
                </div>
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-[#748379]">{t('common.landArea')}</dt>
                  <dd className="font-medium text-[#17221B] tabular-nums">
                    {formatLandArea(profile?.landSize, profile?.landUnit, t)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-[#748379]">{t('onboarding.soilTypeLabel')}</dt>
                  <dd className="font-medium text-[#17221B]">
                    {profile?.soilType
                      ? t(`onboarding.soilTypes.${profile.soilType}`)
                      : t('common.notProvided')}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-[#748379]">{t('onboarding.irrigationLabel')}</dt>
                  <dd className="font-medium text-[#17221B]">
                    {profile?.irrigationSource
                      ? t(`onboarding.irrigationSources.${profile.irrigationSource}`)
                      : t('common.notProvided')}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-[#748379]">{t('onboarding.cropLabel')}</dt>
                  <dd className="font-medium text-[#17221B]">
                    {profile?.currentOrPreviousCrop || t('common.notProvided')}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-[#748379]">{t('onboarding.seasonLabel')}</dt>
                  <dd className="font-medium text-[#17221B]">
                    {profile?.growingSeason
                      ? t(`onboarding.seasons.${profile.growingSeason}`)
                      : t('common.notProvided')}
                  </dd>
                </div>
              </dl>
            </section>

            {profile?.hasSoilReport && profile.soilReport && (
              <section className="md:col-span-2 rounded-xl border border-[#E5E1D8] bg-white p-6 space-y-4">
                <h2 className="font-display text-base font-semibold text-[#17221B]">
                  {t('profile.soilSection')}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-lg bg-[#FAF8F4] p-4 border border-[#E5E1D8]">
                    <p className="text-xs text-[#748379]">{t('onboarding.nitrogenLabel')}</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-[#17221B] tabular-nums">
                      {profile.soilReport.nitrogenUnknown
                        ? t('common.unknown')
                        : profile.soilReport.nitrogenKgPerHa !== null
                          ? `${profile.soilReport.nitrogenKgPerHa} ${t('common.kgPerHa')}`
                          : t('common.notProvided')}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#FAF8F4] p-4 border border-[#E5E1D8]">
                    <p className="text-xs text-[#748379]">{t('onboarding.phosphorusLabel')}</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-[#17221B] tabular-nums">
                      {profile.soilReport.phosphorusUnknown
                        ? t('common.unknown')
                        : profile.soilReport.phosphorusKgPerHa !== null
                          ? `${profile.soilReport.phosphorusKgPerHa} ${t('common.kgPerHa')}`
                          : t('common.notProvided')}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#FAF8F4] p-4 border border-[#E5E1D8]">
                    <p className="text-xs text-[#748379]">{t('onboarding.potassiumLabel')}</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-[#17221B] tabular-nums">
                      {profile.soilReport.potassiumUnknown
                        ? t('common.unknown')
                        : profile.soilReport.potassiumKgPerHa !== null
                          ? `${profile.soilReport.potassiumKgPerHa} ${t('common.kgPerHa')}`
                          : t('common.notProvided')}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#FAF8F4] p-4 border border-[#E5E1D8]">
                    <p className="text-xs text-[#748379]">{t('onboarding.phLabel')}</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-[#17221B] tabular-nums">
                      {profile.soilReport.phUnknown
                        ? t('common.unknown')
                        : (profile.soilReport.phLevel ?? t('common.notProvided'))}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </FarmerShellLayout>
  );
}
