import { useCallback, useEffect, useState } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { LoadingSkeleton } from './components/StatePanels';
import { FEATURE_CATEGORIES } from './data/dashboardCatalog';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useFarmerProfile } from './hooks/useFarmerProfile';
import i18n from './i18n';
import { PublicLayout } from './layouts/PublicLayout';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { FarmerAuthPage } from './pages/FarmerAuthPage';
import { FarmerDashboardPage } from './pages/FarmerDashboardPage';
import { FarmerProfilePage } from './pages/FarmerProfilePage';
import { FeatureCategoryPage } from './pages/FeatureCategoryPage';
import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { SubFeatureWorkflowPage } from './pages/SubFeatureWorkflowPage';
import type { AuthResponse } from './types/auth';
import type { FeatureCategoryId } from './types/dashboard';
import type { FarmerProfile } from './types/farmer';

function KrishiSetuRouter() {
  const { t } = useTranslation();
  const { user, initializing, refreshUser, logout } = useAuth();
  const [pathname, setPathname] = useState<string>(() => window.location.pathname || '/');

  const navigate = useCallback((nextPath: string, replace = false) => {
    if (replace) {
      window.history.replaceState(null, '', nextPath);
    } else {
      window.history.pushState(null, '', nextPath);
    }
    setPathname(nextPath);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setPathname(window.location.pathname || '/');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const isFarmer = user?.role === 'FARMER';
  const isAdmin = user?.role === 'ADMIN';

  const {
    profile,
    setProfile,
    loading: loadingProfile,
    error: profileError,
    reload: reloadProfile,
  } = useFarmerProfile(Boolean(isFarmer && user?.onboardingCompleted));

  const handleFarmerAuthenticated = (res: AuthResponse) => {
    if (res.user.onboardingCompleted) {
      navigate('/dashboard');
    } else {
      navigate('/onboarding');
    }
  };

  const handleOnboardingCompleted = async (savedProfile: FarmerProfile) => {
    setProfile(savedProfile);
    await refreshUser();
    navigate('/dashboard');
  };

  const handleLogout = () => {
    const wasAdmin = isAdmin;
    logout();
    setProfile(null);
    navigate(wasAdmin ? '/admin/login' : '/');
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4">
          <p className="text-sm font-medium text-[#4A5A50]">{t('common.loading')}</p>
          <LoadingSkeleton rows={3} />
        </div>
      </div>
    );
  }

  // Protected Admin Routes
  if (pathname === '/admin/login') {
    if (isAdmin) {
      return <AdminDashboardPage onLogout={handleLogout} />;
    }
    return (
      <AdminLoginPage
        onAuthenticated={() => navigate('/admin/dashboard')}
        onBackHome={() => navigate('/')}
      />
    );
  }

  if (pathname === '/admin/dashboard' || pathname === '/admin') {
    if (!isAdmin) {
      return (
        <AdminLoginPage
          onAuthenticated={() => navigate('/admin/dashboard', true)}
          onBackHome={() => navigate('/')}
        />
      );
    }
    return <AdminDashboardPage onLogout={handleLogout} />;
  }

  // Farmer Auth Routes
  if (pathname === '/login' || pathname === '/register') {
    if (isFarmer) {
      return user?.onboardingCompleted ? (
        <FarmerDashboardPage
          profile={profile}
          loading={loadingProfile}
          error={profileError}
          onReloadProfile={reloadProfile}
          onSelectCategory={(categoryId) => navigate(`/dashboard/${categoryId}`)}
          onNavigateProfile={() => navigate('/profile')}
          onEditOnboarding={() => navigate('/onboarding/edit')}
          onLogout={handleLogout}
        />
      ) : (
        <OnboardingPage
          onCompleted={handleOnboardingCompleted}
          onLogout={handleLogout}
        />
      );
    }

    return (
      <FarmerAuthPage
        initialMode={pathname === '/register' ? 'register' : 'login'}
        onAuthenticated={handleFarmerAuthenticated}
        onBackHome={() => navigate('/')}
      />
    );
  }

  // Protected Farmer Routes
  if (pathname === '/onboarding' || pathname === '/onboarding/edit') {
    if (!isFarmer) {
      return (
        <FarmerAuthPage
          initialMode="login"
          onAuthenticated={handleFarmerAuthenticated}
          onBackHome={() => navigate('/')}
        />
      );
    }
    return (
      <OnboardingPage
        existingProfile={pathname === '/onboarding/edit' ? profile : null}
        loadingProfile={pathname === '/onboarding/edit' ? loadingProfile : false}
        onCompleted={handleOnboardingCompleted}
        onCancel={user?.onboardingCompleted ? () => navigate('/dashboard') : undefined}
        onLogout={handleLogout}
      />
    );
  }

  if (pathname === '/profile') {
    if (!isFarmer) {
      return (
        <FarmerAuthPage
          initialMode="login"
          onAuthenticated={handleFarmerAuthenticated}
          onBackHome={() => navigate('/')}
        />
      );
    }
    if (!user?.onboardingCompleted) {
      return (
        <OnboardingPage
          onCompleted={handleOnboardingCompleted}
          onLogout={handleLogout}
        />
      );
    }
    return (
      <FarmerProfilePage
        profile={profile}
        loading={loadingProfile}
        error={profileError}
        onReload={reloadProfile}
        onBackDashboard={() => navigate('/dashboard')}
        onEditOnboarding={() => navigate('/onboarding/edit')}
        onLogout={handleLogout}
      />
    );
  }

  if (pathname.startsWith('/dashboard')) {
    if (!isFarmer) {
      return (
        <FarmerAuthPage
          initialMode="login"
          onAuthenticated={handleFarmerAuthenticated}
          onBackHome={() => navigate('/')}
        />
      );
    }
    if (!user?.onboardingCompleted) {
      return (
        <OnboardingPage
          onCompleted={handleOnboardingCompleted}
          onLogout={handleLogout}
        />
      );
    }

    const segments = pathname.replace(/^\/dashboard\/?/, '').split('/').filter(Boolean);
    if (segments.length === 1) {
      const cat = FEATURE_CATEGORIES.find((c) => c.id === segments[0]);
      if (cat) {
        return (
          <FeatureCategoryPage
            categoryId={cat.id as FeatureCategoryId}
            onBackDashboard={() => navigate('/dashboard')}
            onSelectSubFeature={(subId) => navigate(`/dashboard/${cat.id}/${subId}`)}
            onNavigateProfile={() => navigate('/profile')}
            onLogout={handleLogout}
          />
        );
      }
    }

    if (segments.length >= 2) {
      const cat = FEATURE_CATEGORIES.find((c) => c.id === segments[0]);
      const sub = cat?.subFeatures.find((s) => s.id === segments[1]);
      if (cat && sub) {
        return (
          <SubFeatureWorkflowPage
            categoryId={cat.id as FeatureCategoryId}
            subFeatureId={sub.id}
            profile={profile}
            onBackDashboard={() => navigate('/dashboard')}
            onBackCategory={() => navigate(`/dashboard/${cat.id}`)}
            onSelectSubFeature={(nextSubId) => navigate(`/dashboard/${cat.id}/${nextSubId}`)}
            onNavigateProfile={() => navigate('/profile')}
            onEditOnboarding={() => navigate('/onboarding/edit')}
            onLogout={handleLogout}
          />
        );
      }
    }

    return (
      <FarmerDashboardPage
        profile={profile}
        loading={loadingProfile}
        error={profileError}
        onReloadProfile={reloadProfile}
        onSelectCategory={(categoryId) => navigate(`/dashboard/${categoryId}`)}
        onNavigateProfile={() => navigate('/profile')}
        onEditOnboarding={() => navigate('/onboarding/edit')}
        onLogout={handleLogout}
      />
    );
  }

  // Public Landing Page
  return (
    <PublicLayout
      onNavigateHome={() => navigate('/')}
      onNavigateLogin={() => navigate('/login')}
      onNavigateDashboard={() =>
        navigate(user?.onboardingCompleted ? '/dashboard' : '/onboarding')
      }
      onNavigateAdminLogin={() => navigate('/admin/login')}
    >
      <LandingPage
        onStartSetup={() => navigate('/register')}
        onSignIn={() => navigate('/login')}
        onOpenDashboard={() =>
          navigate(user?.onboardingCompleted ? '/dashboard' : '/onboarding')
        }
      />
    </PublicLayout>
  );
}

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <KrishiSetuRouter />
      </AuthProvider>
    </I18nextProvider>
  );
}
