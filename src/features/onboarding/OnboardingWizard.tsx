import { ArrowLeft, CheckCircle2, FileSpreadsheet, MapPin, Sprout } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { FormField, inputBaseClass } from '../../components/FormField';
import { ErrorBanner } from '../../components/StatePanels';
import { INDIAN_STATES, KARNATAKA_DISTRICTS } from '../../data/dashboardCatalog';
import { ApiClientError } from '../../services/apiClient';
import { farmerService } from '../../services/farmerService';
import type {
  FarmerProfile,
  FarmerProfilePayload,
  GrowingSeason,
  IrrigationSource,
  LandUnit,
  SoilReportInput,
  SoilType,
} from '../../types/farmer';
import { cn } from '../../utils/cn';
import {
  getLandConversionSummary,
  sanitizeDecimalInput,
} from '../../utils/formatters';
import { validateSoilReportInput } from '../../utils/validation';

import soilCardImg from '../../assets/images/onboarding_soil_card_1794682474551.jpg';
import fieldSurveyImg from '../../assets/images/onboarding_field_survey_1794682474590.jpg';

interface OnboardingWizardProps {
  defaultFarmerName: string;
  initialProfile?: FarmerProfile | null;
  onCompleted: (profile: FarmerProfile) => void;
  onCancel?: () => void;
}

type WizardStep = 'CHOICE' | 'SOIL_REPORT' | 'FIELD_DETAILS';

export function OnboardingWizard({
  defaultFarmerName,
  initialProfile,
  onCompleted,
  onCancel,
}: OnboardingWizardProps) {
  const { t } = useTranslation();

  const [step, setStep] = useState<WizardStep>(() => {
    if (!initialProfile) return 'CHOICE';
    return initialProfile.hasSoilReport ? 'SOIL_REPORT' : 'FIELD_DETAILS';
  });

  // Shared & Step C field state (preserved across language switches!)
  const [farmerName, setFarmerName] = useState(
    initialProfile?.farmerName || defaultFarmerName || '',
  );
  const [stateName, setStateName] = useState(initialProfile?.state || 'Karnataka');
  const [district, setDistrict] = useState(initialProfile?.district || '');
  const [village, setVillage] = useState(initialProfile?.village || '');
  const [landSize, setLandSize] = useState(
    initialProfile?.landSize !== null && initialProfile?.landSize !== undefined
      ? String(initialProfile.landSize)
      : '',
  );
  const [landUnit, setLandUnit] = useState<LandUnit>(initialProfile?.landUnit || 'ACRES');
  const [soilType, setSoilType] = useState<SoilType | ''>(initialProfile?.soilType || '');
  const [irrigationSource, setIrrigationSource] = useState<IrrigationSource | ''>(
    initialProfile?.irrigationSource || '',
  );
  const [currentOrPreviousCrop, setCurrentOrPreviousCrop] = useState(
    initialProfile?.currentOrPreviousCrop || '',
  );
  const [growingSeason, setGrowingSeason] = useState<GrowingSeason | ''>(
    initialProfile?.growingSeason || '',
  );

  // Step B soil report state
  const [soilInput, setSoilInput] = useState<SoilReportInput>({
    nitrogenKgPerHa:
      initialProfile?.soilReport?.nitrogenKgPerHa !== null &&
      initialProfile?.soilReport?.nitrogenKgPerHa !== undefined
        ? String(initialProfile.soilReport.nitrogenKgPerHa)
        : '',
    phosphorusKgPerHa:
      initialProfile?.soilReport?.phosphorusKgPerHa !== null &&
      initialProfile?.soilReport?.phosphorusKgPerHa !== undefined
        ? String(initialProfile.soilReport.phosphorusKgPerHa)
        : '',
    potassiumKgPerHa:
      initialProfile?.soilReport?.potassiumKgPerHa !== null &&
      initialProfile?.soilReport?.potassiumKgPerHa !== undefined
        ? String(initialProfile.soilReport.potassiumKgPerHa)
        : '',
    phLevel:
      initialProfile?.soilReport?.phLevel !== null &&
      initialProfile?.soilReport?.phLevel !== undefined
        ? String(initialProfile.soilReport.phLevel)
        : '',
    nitrogenUnknown: Boolean(initialProfile?.soilReport?.nitrogenUnknown),
    phosphorusUnknown: Boolean(initialProfile?.soilReport?.phosphorusUnknown),
    potassiumUnknown: Boolean(initialProfile?.soilReport?.potassiumUnknown),
    phUnknown: Boolean(initialProfile?.soilReport?.phUnknown),
    labName: initialProfile?.soilReport?.labName || '',
    sampleDate: initialProfile?.soilReport?.sampleDate || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSelectChoice = (hasReport: boolean) => {
    setErrors({});
    setSubmitError(null);
    setStep(hasReport ? 'SOIL_REPORT' : 'FIELD_DETAILS');
  };

  const handleSubmitSoilReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validation = validateSoilReportInput(soilInput);
    const nextErrors: Record<string, string> = { ...validation.errors };

    if (landSize.trim() !== '') {
      const parsedLand = Number(landSize);
      if (Number.isNaN(parsedLand) || parsedLand <= 0 || parsedLand > 50000) {
        nextErrors.landSize = 'validation.landSizeInvalid';
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      const payload: FarmerProfilePayload = {
        hasSoilReport: true,
        farmerName: farmerName.trim() || defaultFarmerName,
        state: stateName || undefined,
        district: district.trim() || undefined,
        village: village.trim() || undefined,
        landSize: landSize.trim() ? Number(landSize) : null,
        landUnit: landSize.trim() ? landUnit : null,
        currentOrPreviousCrop: currentOrPreviousCrop.trim() || undefined,
        growingSeason: growingSeason || undefined,
        soilReport: {
          nitrogenUnknown: soilInput.nitrogenUnknown,
          phosphorusUnknown: soilInput.phosphorusUnknown,
          potassiumUnknown: soilInput.potassiumUnknown,
          phUnknown: soilInput.phUnknown,
          nitrogenKgPerHa:
            soilInput.nitrogenUnknown || soilInput.nitrogenKgPerHa.trim() === ''
              ? null
              : Number(soilInput.nitrogenKgPerHa),
          phosphorusKgPerHa:
            soilInput.phosphorusUnknown || soilInput.phosphorusKgPerHa.trim() === ''
              ? null
              : Number(soilInput.phosphorusKgPerHa),
          potassiumKgPerHa:
            soilInput.potassiumUnknown || soilInput.potassiumKgPerHa.trim() === ''
              ? null
              : Number(soilInput.potassiumKgPerHa),
          phLevel:
            soilInput.phUnknown || soilInput.phLevel.trim() === ''
              ? null
              : Number(soilInput.phLevel),
          labName: soilInput.labName.trim() || null,
          sampleDate: soilInput.sampleDate.trim() || null,
        },
      };

      const saved = await farmerService.saveProfile(payload);
      onCompleted(saved);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setSubmitError(err.message);
      } else {
        setSubmitError(t('errors.generic'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitFieldDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const nextErrors: Record<string, string> = {};
    if (farmerName.trim().length < 2) nextErrors.farmerName = 'validation.fullNameRequired';
    if (!stateName.trim()) nextErrors.state = 'validation.stateRequired';
    if (!district.trim()) nextErrors.district = 'validation.districtRequired';
    if (!village.trim()) nextErrors.village = 'validation.villageRequired';
    const parsedLand = Number(landSize);
    if (!landSize.trim() || Number.isNaN(parsedLand) || parsedLand <= 0 || parsedLand > 50000) {
      nextErrors.landSize = 'validation.landSizeInvalid';
    }
    if (!soilType) nextErrors.soilType = 'validation.soilTypeRequired';
    if (!irrigationSource) nextErrors.irrigationSource = 'validation.irrigationRequired';
    if (!currentOrPreviousCrop.trim()) nextErrors.currentOrPreviousCrop = 'validation.cropRequired';
    if (!growingSeason) nextErrors.growingSeason = 'validation.seasonRequired';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      const payload: FarmerProfilePayload = {
        hasSoilReport: false,
        farmerName: farmerName.trim(),
        state: stateName.trim(),
        district: district.trim(),
        village: village.trim(),
        landSize: Number(landSize),
        landUnit,
        soilType: soilType as SoilType,
        irrigationSource: irrigationSource as IrrigationSource,
        currentOrPreviousCrop: currentOrPreviousCrop.trim(),
        growingSeason: growingSeason as GrowingSeason,
        soilReport: null,
      };
      const saved = await farmerService.saveProfile(payload);
      onCompleted(saved);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setSubmitError(err.message);
      } else {
        setSubmitError(t('errors.generic'));
      }
    } finally {
      setSaving(false);
    }
  };

  const stepNumber = step === 'CHOICE' ? 1 : 2;
  const conversionSummary = getLandConversionSummary(landSize, landUnit, t);

  const renderLandAreaControl = (inputId: string, required = false) => (
    <FormField
      label={t('onboarding.landSizeLabel')}
      htmlFor={inputId}
      required={required}
      error={errors.landSize ? t(errors.landSize) : undefined}
    >
      <div className="space-y-1.5">
        <div className="flex items-stretch gap-2">
          <input
            id={inputId}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={landSize}
            onChange={(e) => setLandSize(sanitizeDecimalInput(e.target.value))}
            placeholder={t('onboarding.landSizePlaceholder')}
            className="min-w-0 flex-1 rounded-lg border border-[#E5E1D8] bg-white px-3.5 py-2.5 text-sm font-medium text-[#17221B] placeholder:text-[#748379] tabular-nums transition-colors focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/15 min-h-[44px]"
          />
          <select
            aria-label={t('onboarding.landUnitLabel')}
            value={landUnit}
            onChange={(e) => setLandUnit(e.target.value as LandUnit)}
            className="w-28 sm:w-32 shrink-0 rounded-lg border border-[#E5E1D8] bg-white px-2.5 py-2.5 text-sm text-[#17221B] transition-colors focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/15 min-h-[44px]"
          >
            <option value="ACRES">{t('common.acres')}</option>
            <option value="HECTARES">{t('common.hectares')}</option>
            <option value="GUNTAS">{t('common.guntas')}</option>
          </select>
        </div>
        <p className="text-xs text-[#4A5A50] tabular-nums">
          {conversionSummary ? `= ${conversionSummary}` : t('onboarding.landSizeHint')}
        </p>
      </div>
    </FormField>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-4 border-b border-[#E5E1D8] pb-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#2D6A4F] tabular-nums">
              {t('onboarding.stepIndicator', { current: stepNumber, total: 2 })}
            </p>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#17221B]">
              {t('onboarding.pageTitle')}
            </h1>
            <p className="mt-1.5 text-sm text-[#4A5A50] max-w-2xl">
              {t('onboarding.pageSubtitle')}
            </p>
          </div>
          {onCancel && (
            <Button variant="secondary" size="sm" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          )}
        </div>

        {/* Clean 2-Step Progress Strip */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div
            className={cn(
              'rounded-lg border px-3.5 py-2.5 text-xs font-semibold transition-colors',
              stepNumber === 1
                ? 'border-[#1B4332] bg-[#E7F1EC] text-[#1B4332]'
                : 'border-[#E5E1D8] bg-white text-[#1B4332]',
            )}
          >
            {t('onboarding.progressStep1')}
          </div>
          <div
            className={cn(
              'rounded-lg border px-3.5 py-2.5 text-xs font-semibold transition-colors',
              stepNumber === 2
                ? 'border-[#1B4332] bg-[#E7F1EC] text-[#1B4332]'
                : 'border-[#E5E1D8] bg-[#FAF8F4] text-[#748379]',
            )}
          >
            {t('onboarding.progressStep2')}
          </div>
        </div>
      </div>

      {submitError && <ErrorBanner message={submitError} />}

      {step === 'CHOICE' && (
        <section className="space-y-6">
          <div className="space-y-1.5">
            <h2 className="font-display text-xl font-semibold text-[#17221B]">
              {t('onboarding.stepATitle')}
            </h2>
            <p className="text-sm text-[#4A5A50]">{t('onboarding.stepASubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              type="button"
              onClick={() => handleSelectChoice(true)}
              className="group flex flex-col overflow-hidden rounded-xl border border-[#E5E1D8] bg-white text-left transition-all hover:border-[#1B4332] hover:shadow-md cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F2EFE8]">
                <img
                  src={soilCardImg}
                  alt={t('onboarding.choiceYesTitle')}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <div className="flex flex-1 flex-col justify-between p-5 sm:p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[#1B4332]">
                    <FileSpreadsheet className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {t('common.yes')}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-[#17221B]">
                    {t('onboarding.choiceYesTitle')}
                  </h3>
                  <p className="text-sm text-[#4A5A50] leading-relaxed">
                    {t('onboarding.choiceYesDesc')}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1B4332] group-hover:underline underline-offset-4">
                  {t('common.continue')}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectChoice(false)}
              className="group flex flex-col overflow-hidden rounded-xl border border-[#E5E1D8] bg-white text-left transition-all hover:border-[#1B4332] hover:shadow-md cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F2EFE8]">
                <img
                  src={fieldSurveyImg}
                  alt={t('onboarding.choiceNoTitle')}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <div className="flex flex-1 flex-col justify-between p-5 sm:p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[#8C5A2B]">
                    <MapPin className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {t('common.no')}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-[#17221B]">
                    {t('onboarding.choiceNoTitle')}
                  </h3>
                  <p className="text-sm text-[#4A5A50] leading-relaxed">
                    {t('onboarding.choiceNoDesc')}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1B4332] group-hover:underline underline-offset-4">
                  {t('common.continue')}
                </span>
              </div>
            </button>
          </div>
        </section>
      )}

      {step === 'SOIL_REPORT' && (
        <form onSubmit={handleSubmitSoilReport} className="space-y-6" noValidate>
          <div className="rounded-xl border border-[#E5E1D8] bg-white p-5 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E1D8] pb-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-[#17221B]">
                  {t('onboarding.stepBTitle')}
                </h2>
                <p className="mt-1 text-sm text-[#4A5A50]">{t('onboarding.stepBSubtitle')}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep('CHOICE')}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {t('onboarding.changeChoice')}
              </Button>
            </div>

            {errors.soilSummary && <ErrorBanner message={t(errors.soilSummary)} />}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Nitrogen */}
              <div className="rounded-lg border border-[#E5E1D8] bg-[#FAF8F4] p-4 space-y-3">
                <FormField
                  label={`${t('onboarding.nitrogenLabel')} (${t('common.kgPerHa')})`}
                  htmlFor="soil-n"
                  hint={t('onboarding.nitrogenHint')}
                  error={errors.nitrogenKgPerHa ? t(errors.nitrogenKgPerHa) : undefined}
                >
                  <input
                    id="soil-n"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    disabled={soilInput.nitrogenUnknown}
                    value={soilInput.nitrogenUnknown ? '' : soilInput.nitrogenKgPerHa}
                    onChange={(e) =>
                      setSoilInput((prev) => ({
                        ...prev,
                        nitrogenKgPerHa: sanitizeDecimalInput(e.target.value),
                      }))
                    }
                    placeholder={soilInput.nitrogenUnknown ? t('common.unknown') : '240'}
                    className={cn(inputBaseClass, 'tabular-nums')}
                  />
                </FormField>
                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#4A5A50] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soilInput.nitrogenUnknown}
                    onChange={(e) =>
                      setSoilInput((prev) => ({
                        ...prev,
                        nitrogenUnknown: e.target.checked,
                        nitrogenKgPerHa: e.target.checked ? '' : prev.nitrogenKgPerHa,
                      }))
                    }
                    className="h-4 w-4 rounded border-[#E5E1D8] accent-[#1B4332]"
                  />
                  <span>{t('onboarding.markUnknown')}</span>
                </label>
              </div>

              {/* Phosphorus */}
              <div className="rounded-lg border border-[#E5E1D8] bg-[#FAF8F4] p-4 space-y-3">
                <FormField
                  label={`${t('onboarding.phosphorusLabel')} (${t('common.kgPerHa')})`}
                  htmlFor="soil-p"
                  hint={t('onboarding.phosphorusHint')}
                  error={errors.phosphorusKgPerHa ? t(errors.phosphorusKgPerHa) : undefined}
                >
                  <input
                    id="soil-p"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    disabled={soilInput.phosphorusUnknown}
                    value={soilInput.phosphorusUnknown ? '' : soilInput.phosphorusKgPerHa}
                    onChange={(e) =>
                      setSoilInput((prev) => ({
                        ...prev,
                        phosphorusKgPerHa: sanitizeDecimalInput(e.target.value),
                      }))
                    }
                    placeholder={soilInput.phosphorusUnknown ? t('common.unknown') : '28.5'}
                    className={cn(inputBaseClass, 'tabular-nums')}
                  />
                </FormField>
                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#4A5A50] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soilInput.phosphorusUnknown}
                    onChange={(e) =>
                      setSoilInput((prev) => ({
                        ...prev,
                        phosphorusUnknown: e.target.checked,
                        phosphorusKgPerHa: e.target.checked ? '' : prev.phosphorusKgPerHa,
                      }))
                    }
                    className="h-4 w-4 rounded border-[#E5E1D8] accent-[#1B4332]"
                  />
                  <span>{t('onboarding.markUnknown')}</span>
                </label>
              </div>

              {/* Potassium */}
              <div className="rounded-lg border border-[#E5E1D8] bg-[#FAF8F4] p-4 space-y-3">
                <FormField
                  label={`${t('onboarding.potassiumLabel')} (${t('common.kgPerHa')})`}
                  htmlFor="soil-k"
                  hint={t('onboarding.potassiumHint')}
                  error={errors.potassiumKgPerHa ? t(errors.potassiumKgPerHa) : undefined}
                >
                  <input
                    id="soil-k"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    disabled={soilInput.potassiumUnknown}
                    value={soilInput.potassiumUnknown ? '' : soilInput.potassiumKgPerHa}
                    onChange={(e) =>
                      setSoilInput((prev) => ({
                        ...prev,
                        potassiumKgPerHa: sanitizeDecimalInput(e.target.value),
                      }))
                    }
                    placeholder={soilInput.potassiumUnknown ? t('common.unknown') : '190'}
                    className={cn(inputBaseClass, 'tabular-nums')}
                  />
                </FormField>
                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#4A5A50] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soilInput.potassiumUnknown}
                    onChange={(e) =>
                      setSoilInput((prev) => ({
                        ...prev,
                        potassiumUnknown: e.target.checked,
                        potassiumKgPerHa: e.target.checked ? '' : prev.potassiumKgPerHa,
                      }))
                    }
                    className="h-4 w-4 rounded border-[#E5E1D8] accent-[#1B4332]"
                  />
                  <span>{t('onboarding.markUnknown')}</span>
                </label>
              </div>

              {/* Soil pH */}
              <div className="rounded-lg border border-[#E5E1D8] bg-[#FAF8F4] p-4 space-y-3">
                <FormField
                  label={t('onboarding.phLabel')}
                  htmlFor="soil-ph"
                  hint={t('onboarding.phHint')}
                  error={errors.phLevel ? t(errors.phLevel) : undefined}
                >
                  <input
                    id="soil-ph"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    disabled={soilInput.phUnknown}
                    value={soilInput.phUnknown ? '' : soilInput.phLevel}
                    onChange={(e) =>
                      setSoilInput((prev) => ({
                        ...prev,
                        phLevel: sanitizeDecimalInput(e.target.value),
                      }))
                    }
                    placeholder={soilInput.phUnknown ? t('common.unknown') : '6.4'}
                    className={cn(inputBaseClass, 'tabular-nums')}
                  />
                </FormField>
                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#4A5A50] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soilInput.phUnknown}
                    onChange={(e) =>
                      setSoilInput((prev) => ({
                        ...prev,
                        phUnknown: e.target.checked,
                        phLevel: e.target.checked ? '' : prev.phLevel,
                      }))
                    }
                    className="h-4 w-4 rounded border-[#E5E1D8] accent-[#1B4332]"
                  />
                  <span>{t('onboarding.markUnknown')}</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <FormField
                label={t('onboarding.labNameLabel')}
                htmlFor="lab-name"
                hint={t('common.optional')}
              >
                <input
                  id="lab-name"
                  type="text"
                  value={soilInput.labName}
                  onChange={(e) =>
                    setSoilInput((prev) => ({ ...prev, labName: e.target.value }))
                  }
                  placeholder={t('onboarding.labNamePlaceholder')}
                  className={inputBaseClass}
                />
              </FormField>

              <FormField
                label={t('onboarding.sampleDateLabel')}
                htmlFor="sample-date"
                hint={t('common.optional')}
              >
                <input
                  id="sample-date"
                  type="date"
                  value={soilInput.sampleDate}
                  onChange={(e) =>
                    setSoilInput((prev) => ({ ...prev, sampleDate: e.target.value }))
                  }
                  className={cn(inputBaseClass, 'tabular-nums')}
                />
              </FormField>
            </div>
          </div>

          {/* Optional context section for Soil Report farmers */}
          <div className="rounded-xl border border-[#E5E1D8] bg-white p-5 sm:p-7 space-y-5">
            <div>
              <h3 className="font-display text-base font-semibold text-[#17221B]">
                {t('onboarding.stepBContextTitle')}
              </h3>
              <p className="mt-1 text-xs text-[#4A5A50]">
                {t('onboarding.stepBContextSubtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label={t('onboarding.stateLabel')} htmlFor="opt-state">
                <select
                  id="opt-state"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className={inputBaseClass}
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label={t('onboarding.districtLabel')} htmlFor="opt-district">
                <input
                  id="opt-district"
                  type="text"
                  list="karnataka-districts"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder={t('onboarding.districtPlaceholder')}
                  className={inputBaseClass}
                />
              </FormField>

              <FormField label={t('onboarding.cropLabel')} htmlFor="opt-crop">
                <input
                  id="opt-crop"
                  type="text"
                  value={currentOrPreviousCrop}
                  onChange={(e) => setCurrentOrPreviousCrop(e.target.value)}
                  placeholder={t('onboarding.cropPlaceholder')}
                  className={inputBaseClass}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              {renderLandAreaControl('opt-land-size', false)}

              <FormField label={t('onboarding.seasonLabel')} htmlFor="opt-season">
                <select
                  id="opt-season"
                  value={growingSeason}
                  onChange={(e) => setGrowingSeason(e.target.value as GrowingSeason | '')}
                  className={inputBaseClass}
                >
                  <option value="">{t('onboarding.selectOption')}</option>
                  <option value="KHARIF">{t('onboarding.seasons.KHARIF')}</option>
                  <option value="RABI">{t('onboarding.seasons.RABI')}</option>
                  <option value="ZAID">{t('onboarding.seasons.ZAID')}</option>
                  <option value="PERENNIAL">{t('onboarding.seasons.PERENNIAL')}</option>
                </select>
              </FormField>
            </div>
          </div>

          <datalist id="karnataka-districts">
            {KARNATAKA_DISTRICTS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <Button type="submit" size="lg" disabled={saving}>
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {saving ? t('common.saving') : t('onboarding.saveAndContinue')}
            </Button>
          </div>
        </form>
      )}

      {step === 'FIELD_DETAILS' && (
        <form onSubmit={handleSubmitFieldDetails} className="space-y-6" noValidate>
          <div className="rounded-xl border border-[#E5E1D8] bg-white p-5 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E1D8] pb-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-[#17221B]">
                  {t('onboarding.stepCTitle')}
                </h2>
                <p className="mt-1 text-sm text-[#4A5A50]">{t('onboarding.stepCSubtitle')}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep('CHOICE')}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {t('onboarding.changeChoice')}
              </Button>
            </div>

            {Object.keys(errors).length > 0 && (
              <ErrorBanner message={t('validation.fixHighlighted')} />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField
                label={t('onboarding.farmerNameLabel')}
                htmlFor="field-name"
                required
                error={errors.farmerName ? t(errors.farmerName) : undefined}
              >
                <input
                  id="field-name"
                  type="text"
                  value={farmerName}
                  onChange={(e) => setFarmerName(e.target.value)}
                  placeholder={t('onboarding.farmerNamePlaceholder')}
                  className={inputBaseClass}
                />
              </FormField>

              <FormField
                label={t('onboarding.stateLabel')}
                htmlFor="field-state"
                required
                error={errors.state ? t(errors.state) : undefined}
              >
                <select
                  id="field-state"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className={inputBaseClass}
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label={t('onboarding.districtLabel')}
                htmlFor="field-district"
                required
                error={errors.district ? t(errors.district) : undefined}
              >
                <input
                  id="field-district"
                  type="text"
                  list="karnataka-districts"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder={t('onboarding.districtPlaceholder')}
                  className={inputBaseClass}
                />
              </FormField>

              <FormField
                label={t('onboarding.villageLabel')}
                htmlFor="field-village"
                required
                error={errors.village ? t(errors.village) : undefined}
              >
                <input
                  id="field-village"
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder={t('onboarding.villagePlaceholder')}
                  className={inputBaseClass}
                />
              </FormField>

              {renderLandAreaControl('field-land-size', true)}

              <FormField
                label={t('onboarding.soilTypeLabel')}
                htmlFor="field-soil-type"
                required
                error={errors.soilType ? t(errors.soilType) : undefined}
              >
                <select
                  id="field-soil-type"
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value as SoilType | '')}
                  className={inputBaseClass}
                >
                  <option value="">{t('onboarding.selectOption')}</option>
                  <option value="BLACK">{t('onboarding.soilTypes.BLACK')}</option>
                  <option value="RED">{t('onboarding.soilTypes.RED')}</option>
                  <option value="ALLUVIAL">{t('onboarding.soilTypes.ALLUVIAL')}</option>
                  <option value="LATERITE">{t('onboarding.soilTypes.LATERITE')}</option>
                  <option value="SANDY_LOAM">{t('onboarding.soilTypes.SANDY_LOAM')}</option>
                  <option value="UNKNOWN">{t('onboarding.soilTypes.UNKNOWN')}</option>
                </select>
              </FormField>

              <FormField
                label={t('onboarding.irrigationLabel')}
                htmlFor="field-irrigation"
                required
                error={errors.irrigationSource ? t(errors.irrigationSource) : undefined}
              >
                <select
                  id="field-irrigation"
                  value={irrigationSource}
                  onChange={(e) =>
                    setIrrigationSource(e.target.value as IrrigationSource | '')
                  }
                  className={inputBaseClass}
                >
                  <option value="">{t('onboarding.selectOption')}</option>
                  <option value="RAINFED">{t('onboarding.irrigationSources.RAINFED')}</option>
                  <option value="BOREWELL">{t('onboarding.irrigationSources.BOREWELL')}</option>
                  <option value="CANAL">{t('onboarding.irrigationSources.CANAL')}</option>
                  <option value="DRIP_SPRINKLER">
                    {t('onboarding.irrigationSources.DRIP_SPRINKLER')}
                  </option>
                  <option value="OPEN_WELL">{t('onboarding.irrigationSources.OPEN_WELL')}</option>
                  <option value="TANK_POND">{t('onboarding.irrigationSources.TANK_POND')}</option>
                  <option value="UNKNOWN">{t('onboarding.irrigationSources.UNKNOWN')}</option>
                </select>
              </FormField>

              <FormField
                label={t('onboarding.cropLabel')}
                htmlFor="field-crop"
                required
                error={errors.currentOrPreviousCrop ? t(errors.currentOrPreviousCrop) : undefined}
              >
                <input
                  id="field-crop"
                  type="text"
                  value={currentOrPreviousCrop}
                  onChange={(e) => setCurrentOrPreviousCrop(e.target.value)}
                  placeholder={t('onboarding.cropPlaceholder')}
                  className={inputBaseClass}
                />
              </FormField>

              <FormField
                label={t('onboarding.seasonLabel')}
                htmlFor="field-season"
                required
                error={errors.growingSeason ? t(errors.growingSeason) : undefined}
              >
                <select
                  id="field-season"
                  value={growingSeason}
                  onChange={(e) => setGrowingSeason(e.target.value as GrowingSeason | '')}
                  className={inputBaseClass}
                >
                  <option value="">{t('onboarding.selectOption')}</option>
                  <option value="KHARIF">{t('onboarding.seasons.KHARIF')}</option>
                  <option value="RABI">{t('onboarding.seasons.RABI')}</option>
                  <option value="ZAID">{t('onboarding.seasons.ZAID')}</option>
                  <option value="PERENNIAL">{t('onboarding.seasons.PERENNIAL')}</option>
                  <option value="UNKNOWN">{t('onboarding.seasons.UNKNOWN')}</option>
                </select>
              </FormField>
            </div>
          </div>

          <datalist id="karnataka-districts">
            {KARNATAKA_DISTRICTS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <Button type="submit" size="lg" disabled={saving}>
              <Sprout className="h-4 w-4" aria-hidden="true" />
              {saving ? t('common.saving') : t('onboarding.saveAndContinue')}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
