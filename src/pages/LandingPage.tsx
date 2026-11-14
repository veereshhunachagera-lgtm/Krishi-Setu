import { ArrowRight, Check, Globe2, Layers, ShieldCheck, Sprout } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import heroFarmlandImg from '../assets/images/hero_indian_farmland_1794682473696.jpg';
import { useAuth } from '../hooks/useAuth';

interface LandingPageProps {
  onStartSetup: () => void;
  onSignIn: () => void;
  onOpenDashboard: () => void;
}

export function LandingPage({
  onStartSetup,
  onSignIn,
  onOpenDashboard,
}: LandingPageProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const capabilityKeys = ['cropSoil', 'plantHealth', 'marketWeather', 'agriServices', 'aiAssistant'] as const;

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between space-y-8 py-2">
            <div className="space-y-5">
              <p className="text-xs font-semibold tracking-wide text-[#2D6A4F]">
                {t('landing.heroKicker')}
              </p>
              <h1
                className="font-display font-bold tracking-tight text-[#17221B] leading-[1.1]"
                style={{ fontSize: 'clamp(2.25rem, 3.8vw, 3.5rem)', textWrap: 'balance' }}
              >
                {t('landing.heroTitle')}
              </h1>
              <p className="text-base sm:text-lg text-[#4A5A50] leading-relaxed max-w-xl">
                {t('landing.heroSubtitle')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {user?.role === 'FARMER' ? (
                <Button size="lg" onClick={onOpenDashboard}>
                  <span>{t('nav.openDashboard')}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              ) : (
                <>
                  <Button size="lg" onClick={onStartSetup}>
                    <span>{t('landing.primaryCta')}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button variant="secondary" size="lg" onClick={onSignIn}>
                    {t('landing.secondaryCta')}
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-full min-h-[280px] sm:min-h-[360px] overflow-hidden rounded-2xl border border-[#E5E1D8] bg-[#E7F1EC]">
              <img
                src={heroFarmlandImg}
                alt={t('landing.heroImageAlt')}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover lg:h-full"
              />
            </div>
          </div>
        </div>

        {/* 4-column structured strip below hero split */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-b border-[#E5E1D8] py-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#17221B]">
              <Sprout className="h-4 w-4 text-[#1B4332] shrink-0" aria-hidden="true" />
              <span>{t('landing.proofStrip.soilInputs')}</span>
            </div>
            <p className="text-xs text-[#4A5A50] leading-relaxed">
              {t('landing.proofStrip.soilInputsDetail')}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#17221B]">
              <Globe2 className="h-4 w-4 text-[#1B4332] shrink-0" aria-hidden="true" />
              <span>{t('landing.proofStrip.bilingual')}</span>
            </div>
            <p className="text-xs text-[#4A5A50] leading-relaxed">
              {t('landing.proofStrip.bilingualDetail')}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#17221B]">
              <Layers className="h-4 w-4 text-[#1B4332] shrink-0" aria-hidden="true" />
              <span>{t('landing.proofStrip.modularApi')}</span>
            </div>
            <p className="text-xs text-[#4A5A50] leading-relaxed">
              {t('landing.proofStrip.modularApiDetail')}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#17221B]">
              <ShieldCheck className="h-4 w-4 text-[#1B4332] shrink-0" aria-hidden="true" />
              <span>{t('landing.proofStrip.roleSecurity')}</span>
            </div>
            <p className="text-xs text-[#4A5A50] leading-relaxed">
              {t('landing.proofStrip.roleSecurityDetail')}
            </p>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section id="capabilities" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="max-w-2xl space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#17221B]">
            {t('landing.capabilitiesSection.title')}
          </h2>
          <p className="text-sm sm:text-base text-[#4A5A50] leading-relaxed">
            {t('landing.capabilitiesSection.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
          {capabilityKeys.map((key, index) => {
            const spanClass = index < 2 ? 'md:col-span-3' : 'md:col-span-2';
            return (
              <div
                key={key}
                className={`${spanClass} rounded-xl border border-[#E5E1D8] bg-white p-6 space-y-3`}
              >
                <p className="font-mono text-xs font-semibold text-[#2D6A4F] tabular-nums">
                  {t(`landing.capabilitiesSection.items.${key}.index`)}
                </p>
                <h3 className="font-display text-lg font-semibold text-[#17221B]">
                  {t(`landing.capabilitiesSection.items.${key}.title`)}
                </h3>
                <p className="text-sm text-[#4A5A50] leading-relaxed">
                  {t(`landing.capabilitiesSection.items.${key}.description`)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Two Onboarding Paths Section */}
      <section id="onboarding-paths" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="max-w-2xl space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#17221B]">
            {t('landing.onboardingSection.title')}
          </h2>
          <p className="text-sm sm:text-base text-[#4A5A50] leading-relaxed">
            {t('landing.onboardingSection.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-[#E5E1D8] bg-white p-6 sm:p-8 space-y-4">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#1B4332]">
              <Check className="h-4 w-4" aria-hidden="true" />
              <span>{t('landing.onboardingSection.pathYesTitle')}</span>
            </div>
            <p className="text-sm text-[#4A5A50] leading-relaxed">
              {t('landing.onboardingSection.pathYesBody')}
            </p>
          </div>

          <div className="rounded-xl border border-[#E5E1D8] bg-white p-6 sm:p-8 space-y-4">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#8C5A2B]">
              <Check className="h-4 w-4" aria-hidden="true" />
              <span>{t('landing.onboardingSection.pathNoTitle')}</span>
            </div>
            <p className="text-sm text-[#4A5A50] leading-relaxed">
              {t('landing.onboardingSection.pathNoBody')}
            </p>
          </div>
        </div>
      </section>

      {/* Bilingual Commitment */}
      <section id="languages" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#E5E1D8] bg-[#1B4332] px-6 py-10 sm:px-10 sm:py-12 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2.5">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              {t('landing.languageSection.title')}
            </h2>
            <p className="text-sm sm:text-base text-white/85 leading-relaxed">
              {t('landing.languageSection.subtitle')}
            </p>
          </div>
          <div className="shrink-0">
            <Button
              variant="secondary"
              size="lg"
              onClick={user?.role === 'FARMER' ? onOpenDashboard : onStartSetup}
            >
              {user?.role === 'FARMER' ? t('nav.openDashboard') : t('landing.primaryCta')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
