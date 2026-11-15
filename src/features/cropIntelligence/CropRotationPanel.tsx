import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { LoadingSkeleton } from '../../components/StatePanels';
import { cropIntelligenceService } from '../../services/cropIntelligenceService';
import type { CropKnowledgeItem } from '../../types/cropIntelligence';
import type { FarmerProfile } from '../../types/farmer';

interface CropRotationPanelProps {
  profile: FarmerProfile | null;
  onCompareCrops: (cropCodes: string[]) => void;
}

export function CropRotationPanel({ profile, onCompareCrops }: CropRotationPanelProps) {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [crops, setCrops] = useState<CropKnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cropIntelligenceService
      .searchCrops()
      .then((list) => setCrops(list))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSkeleton rows={3} />;
  }

  const prevCropLower = (profile?.currentOrPreviousCrop || '').toLowerCase();
  const nitrogenFixers = crops.filter(
    (c) => c.nitrogenFixing && !prevCropLower.includes(c.cropCode.replace('-', ' ')),
  );
  const rotationOther = crops.filter(
    (c) => !c.nitrogenFixing && !prevCropLower.includes(c.cropCode.replace('-', ' ')),
  );

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-2">
        <div className="flex items-center gap-2 text-[#1B4332]">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          <h2 className="font-display text-base font-semibold">
            {t('cropIntelligence.rotation.currentBaselineTitle')}
          </h2>
        </div>
        <p className="text-sm text-[#4A5A50]">
          {t('cropIntelligence.rotation.currentBaselineDesc', {
            crop: profile?.currentOrPreviousCrop || t('common.notProvided'),
          })}
        </p>
      </section>

      <section className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-semibold text-[#17221B]">
              {t('cropIntelligence.rotation.fixersTitle')}
            </h3>
            <p className="text-xs text-[#4A5A50]">
              {t('cropIntelligence.rotation.fixersSubtitle')}
            </p>
          </div>
          {nitrogenFixers.length >= 2 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                onCompareCrops(nitrogenFixers.slice(0, 3).map((c) => c.cropCode))
              }
            >
              {t('cropIntelligence.rotation.compareFixersBtn')}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nitrogenFixers.map((crop) => (
            <div key={crop.cropCode} className="rounded-lg border border-[#E5E1D8] p-4 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-sm text-[#17221B]">
                  {isKn ? crop.nameKn : crop.nameEn}
                </h4>
                <span className="font-mono text-xs text-[#748379] tabular-nums">
                  {crop.durationMinDays}–{crop.durationMaxDays} {t('cropIntelligence.daysUnit')}
                </span>
              </div>
              <p className="text-xs text-[#4A5A50]">
                {isKn ? crop.rotationalBenefitsKn : crop.rotationalBenefitsEn}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-4">
        <h3 className="font-display text-base font-semibold text-[#17221B]">
          {t('cropIntelligence.rotation.diversifyTitle')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rotationOther.slice(0, 4).map((crop) => (
            <div key={crop.cropCode} className="rounded-lg border border-[#E5E1D8] p-4 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-sm text-[#17221B]">
                  {isKn ? crop.nameKn : crop.nameEn}
                </h4>
                <span className="text-xs text-[#748379]">
                  {t(`cropIntelligence.waterLevels.${crop.waterRequirement}`)}
                </span>
              </div>
              <p className="text-xs text-[#4A5A50]">
                {isKn ? crop.rotationalBenefitsKn : crop.rotationalBenefitsEn}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
