import { useTranslation } from 'react-i18next';
import { LoadingSkeleton } from '../components/StatePanels';
import { OnboardingWizard } from '../features/onboarding/OnboardingWizard';
import { useAuth } from '../hooks/useAuth';
import { FarmerShellLayout } from '../layouts/FarmerShellLayout';
import type { FarmerProfile } from '../types/farmer';

interface OnboardingPageProps {
  existingProfile?: FarmerProfile | null;
  loadingProfile?: boolean;
  onCompleted: (profile: FarmerProfile) => void;
  onCancel?: () => void;
  onLogout: () => void;
}

export function OnboardingPage({
  existingProfile,
  loadingProfile = false,
  onCompleted,
  onCancel,
  onLogout,
}: OnboardingPageProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <FarmerShellLayout
      onNavigateDashboard={() => (onCancel ? onCancel() : undefined)}
      onNavigateProfile={() => undefined}
      onLogout={onLogout}
      showWorkspaceNav={Boolean(user?.onboardingCompleted)}
    >
      {loadingProfile ? (
        <div className="mx-auto max-w-4xl space-y-4">
          <p className="text-sm text-[#4A5A50]">{t('common.loading')}</p>
          <LoadingSkeleton rows={4} />
        </div>
      ) : (
        <OnboardingWizard
          defaultFarmerName={user?.fullName || ''}
          initialProfile={existingProfile}
          onCompleted={onCompleted}
          onCancel={onCancel}
        />
      )}
    </FarmerShellLayout>
  );
}
