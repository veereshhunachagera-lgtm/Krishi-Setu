import { AlertTriangle, Sprout } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { inputBaseClass } from '../../components/FormField';
import { LoadingSkeleton } from '../../components/StatePanels';
import { cropIntelligenceService } from '../../services/cropIntelligenceService';
import type { CropKnowledgeItem } from '../../types/cropIntelligence';
import type { FarmerProfile } from '../../types/farmer';
import { formatLandArea } from '../../utils/formatters';

interface FertilizerPlannerPanelProps {
  profile: FarmerProfile | null;
}

export function FertilizerPlannerPanel({ profile }: FertilizerPlannerPanelProps) {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [crops, setCrops] = useState<CropKnowledgeItem[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>('ragi');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cropIntelligenceService
      .searchCrops()
      .then((list) => {
        setCrops(list);
        const savedCrop = (profile?.currentOrPreviousCrop || '').toLowerCase();
        const match = list.find(
          (c) =>
            savedCrop.includes(c.cropCode.replace('-', ' ')) ||
            savedCrop.includes(c.nameEn.toLowerCase().split(' ')[0]),
        );
        if (match) setSelectedCode(match.cropCode);
        else if (list.length > 0) setSelectedCode(list[0].cropCode);
      })
      .finally(() => setLoading(false));
  }, [profile?.currentOrPreviousCrop]);

  if (loading) {
    return <LoadingSkeleton rows={3} />;
  }

  const selectedCrop = crops.find((c) => c.cropCode === selectedCode) || crops[0];

  const acres = (() => {
    if (!profile?.landSize) return null;
    const raw = Number(profile.landSize);
    if (profile.landUnit === 'HECTARES') return Math.round(raw * 2.471 * 100) / 100;
    if (profile.landUnit === 'GUNTAS') return Math.round((raw / 40) * 100) / 100;
    return raw;
  })();

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#E5E1D8] bg-[#FAF8F4] p-5 flex items-start gap-2.5 text-xs text-[#8C5A2B]">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
        <p>{t('cropIntelligence.fertilizer.disclaimer')}</p>
      </section>

      <section className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-[#4A5A50]">
              {t('cropIntelligence.fertilizer.selectCropLabel')}
            </span>
            <select
              value={selectedCode}
              onChange={(e) => setSelectedCode(e.target.value)}
              className={inputBaseClass}
            >
              {crops.map((c) => (
                <option key={c.cropCode} value={c.cropCode}>
                  {isKn ? c.nameKn : c.nameEn}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-lg border border-[#E5E1D8] bg-[#FAF8F4] px-4 py-2.5 text-xs">
            <span className="text-[#748379]">{t('common.landArea')}: </span>
            <span className="font-mono font-semibold text-[#17221B] tabular-nums">
              {profile?.landSize
                ? formatLandArea(profile.landSize, profile.landUnit, t)
                : t('common.notProvided')}
              {acres !== null && profile?.landUnit !== 'ACRES' ? ` (${acres} ${t('common.acres')})` : ''}
            </span>
          </div>
        </div>

        {selectedCrop && (
          <div className="border-t border-[#E5E1D8] pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="rounded-lg border border-[#E5E1D8] p-4">
                <p className="text-[#748379]">{t('onboarding.nitrogenLabel')}</p>
                <p className="mt-1 font-semibold text-[#17221B]">
                  {selectedCrop.nitrogenDemand || 'MEDIUM'}
                  {selectedCrop.nitrogenFixing
                    ? ` · ${t('cropIntelligence.fertilizer.nFixingNote')}`
                    : ''}
                </p>
              </div>
              <div className="rounded-lg border border-[#E5E1D8] p-4">
                <p className="text-[#748379]">{t('onboarding.phosphorusLabel')}</p>
                <p className="mt-1 font-semibold text-[#17221B]">
                  {selectedCrop.phosphorusDemand || 'MEDIUM'}
                </p>
              </div>
              <div className="rounded-lg border border-[#E5E1D8] p-4">
                <p className="text-[#748379]">{t('onboarding.potassiumLabel')}</p>
                <p className="mt-1 font-semibold text-[#17221B]">
                  {selectedCrop.potassiumDemand || 'MEDIUM'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#1B4332]">
                <Sprout className="h-4 w-4" aria-hidden="true" />
                <h3 className="font-display text-sm font-semibold">
                  {t('cropIntelligence.fertilizer.guidanceTitle')}
                </h3>
              </div>
              <p className="text-sm text-[#4A5A50] leading-relaxed">
                {isKn
                  ? selectedCrop.growingGuidanceKn.nutrientPractice
                  : selectedCrop.growingGuidanceEn.nutrientPractice}
              </p>
              <p className="text-xs text-[#4A5A50] leading-relaxed">
                {isKn
                  ? selectedCrop.growingGuidanceKn.landPreparation
                  : selectedCrop.growingGuidanceEn.landPreparation}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
