import { Database, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { inputBaseClass } from '../../components/FormField';
import { EmptyState, ErrorBanner, LoadingSkeleton } from '../../components/StatePanels';
import { cropIntelligenceService } from '../../services/cropIntelligenceService';
import type { CropKnowledgeItem } from '../../types/cropIntelligence';
import { cn } from '../../utils/cn';

export function AdminCropDatasetPanel() {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [crops, setCrops] = useState<CropKnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cropCode, setCropCode] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameKn, setNameKn] = useState('');
  const [cropCategory, setCropCategory] = useState('PULSE');
  const [waterRequirement, setWaterRequirement] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [soilTypes, setSoilTypes] = useState<string[]>(['RED', 'BLACK']);
  const [seasons, setSeasons] = useState<string[]>(['KHARIF']);
  const [durationMinDays, setDurationMinDays] = useState('75');
  const [durationMaxDays, setDurationMaxDays] = useState('95');
  const [dataReliability, setDataReliability] = useState<
    'CURATED_REFERENCE' | 'SAMPLE_REGIONAL_REFERENCE'
  >('SAMPLE_REGIONAL_REFERENCE');

  const loadCrops = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await cropIntelligenceService.adminListCrops();
      setCrops(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadCrops();
  }, [loadCrops]);

  const handleSyncSeed = async () => {
    setSyncing(true);
    setStatusMessage(null);
    setError(null);
    try {
      const res = await cropIntelligenceService.adminSyncSeed();
      await loadCrops();
      setStatusMessage(t('admin.crops.syncSuccess', { count: res.importedCount }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await cropIntelligenceService.adminDeleteCrop(id);
      setCrops((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    }
  };

  const toggleItem = (list: string[], value: string, setter: (next: string[]) => void) => {
    if (list.includes(value)) {
      if (list.length <= 1) return;
      setter(list.filter((v) => v !== value));
    } else {
      setter([...list, value]);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setStatusMessage(null);
    try {
      const created = await cropIntelligenceService.adminCreateCrop({
        cropCode,
        nameEn,
        nameKn,
        cropCategory,
        suitableSoils: soilTypes,
        seasons,
        waterRequirement,
        durationMinDays: Number(durationMinDays),
        durationMaxDays: Number(durationMaxDays),
        dataReliability,
        supportedStates: ['Karnataka'],
        advantagesEn: ['Added via KrishiSetu Admin dataset panel'],
        advantagesKn: ['ಕೃಷಿಸೇತು ನಿರ್ವಾಹಕ ಪ್ಯಾನೆಲ್ ಮೂಲಕ ಸೇರಿಸಲಾಗಿದೆ'],
        risksEn: ['Verify district suitability with local agricultural office'],
        risksKn: ['ಸ್ಥಳೀಯ ಕೃಷಿ ಕಚೇರಿಯಲ್ಲಿ ಜಿಲ್ಲಾ ಸೂಕ್ತತೆ ಪರಿಶೀಲಿಸಿ'],
      });
      setCrops((prev) => [...prev, created].sort((a, b) => a.nameEn.localeCompare(b.nameEn)));
      setCropCode('');
      setNameEn('');
      setNameKn('');
      setShowAddForm(false);
      setStatusMessage(t('admin.crops.createSuccess'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = crops.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      c.cropCode.toLowerCase().includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.nameKn.toLowerCase().includes(q) ||
      c.cropCategory.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {error && (
        <ErrorBanner message={error} onRetry={loadCrops} retryLabel={t('common.retry')} />
      )}

      {statusMessage && (
        <div className="rounded-lg border border-[#B8D4C5] bg-[#E7F1EC] px-4 py-3 text-xs font-medium text-[#1B4332]">
          {statusMessage}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[#17221B]">
          <Database className="h-4 w-4 text-[#1B4332]" aria-hidden="true" />
          <h2 className="font-display text-base font-semibold">
            {t('admin.crops.heading')} ({crops.length})
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" loading={syncing} onClick={handleSyncSeed}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            {t('admin.crops.syncSeedBtn')}
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowAddForm((prev) => !prev)}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            {showAddForm ? t('common.cancel') : t('admin.crops.addCropBtn')}
          </Button>
        </div>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-4"
        >
          <h3 className="font-display text-sm font-semibold text-[#17221B]">
            {t('admin.crops.newCropTitle')}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="space-y-1 block">
              <span className="text-xs font-medium text-[#4A5A50]">
                {t('admin.crops.cropCodeLabel')}
              </span>
              <input
                required
                value={cropCode}
                onChange={(e) => setCropCode(e.target.value)}
                placeholder="e.g., horse-gram"
                className={inputBaseClass}
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-xs font-medium text-[#4A5A50]">
                {t('admin.crops.nameEnLabel')}
              </span>
              <input
                required
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g., Horse Gram"
                className={inputBaseClass}
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-xs font-medium text-[#4A5A50]">
                {t('admin.crops.nameKnLabel')}
              </span>
              <input
                required
                value={nameKn}
                onChange={(e) => setNameKn(e.target.value)}
                placeholder="ಉದಾ: ಹುರುಳಿ"
                className={inputBaseClass}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <label className="space-y-1 block">
              <span className="text-xs font-medium text-[#4A5A50]">
                {t('admin.crops.categoryLabel')}
              </span>
              <select
                value={cropCategory}
                onChange={(e) => setCropCategory(e.target.value)}
                className={inputBaseClass}
              >
                <option value="MILLET">{t('cropIntelligence.categories.MILLET')}</option>
                <option value="PULSE">{t('cropIntelligence.categories.PULSE')}</option>
                <option value="OILSEED">{t('cropIntelligence.categories.OILSEED')}</option>
                <option value="CEREAL">{t('cropIntelligence.categories.CEREAL')}</option>
                <option value="CASH_CROP">{t('cropIntelligence.categories.CASH_CROP')}</option>
                <option value="VEGETABLE">{t('cropIntelligence.categories.VEGETABLE')}</option>
              </select>
            </label>

            <label className="space-y-1 block">
              <span className="text-xs font-medium text-[#4A5A50]">
                {t('cropIntelligence.waterLabel')}
              </span>
              <select
                value={waterRequirement}
                onChange={(e) =>
                  setWaterRequirement(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')
                }
                className={inputBaseClass}
              >
                <option value="LOW">{t('cropIntelligence.waterLevels.LOW')}</option>
                <option value="MEDIUM">{t('cropIntelligence.waterLevels.MEDIUM')}</option>
                <option value="HIGH">{t('cropIntelligence.waterLevels.HIGH')}</option>
              </select>
            </label>

            <label className="space-y-1 block">
              <span className="text-xs font-medium text-[#4A5A50]">
                {t('admin.crops.minDaysLabel')}
              </span>
              <input
                type="number"
                min={30}
                max={600}
                required
                value={durationMinDays}
                onChange={(e) => setDurationMinDays(e.target.value)}
                className={inputBaseClass}
              />
            </label>

            <label className="space-y-1 block">
              <span className="text-xs font-medium text-[#4A5A50]">
                {t('admin.crops.maxDaysLabel')}
              </span>
              <input
                type="number"
                min={30}
                max={600}
                required
                value={durationMaxDays}
                onChange={(e) => setDurationMaxDays(e.target.value)}
                className={inputBaseClass}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <p className="font-medium text-[#4A5A50]">{t('onboarding.soilTypeLabel')}</p>
              <div className="flex flex-wrap gap-1.5">
                {['RED', 'BLACK', 'ALLUVIAL', 'LATERITE', 'SANDY_LOAM'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleItem(soilTypes, s, setSoilTypes)}
                    className={`rounded-md border px-2.5 py-1 cursor-pointer ${
                      soilTypes.includes(s)
                        ? 'border-[#1B4332] bg-[#1B4332] text-white'
                        : 'border-[#E5E1D8] bg-[#FAF8F4] text-[#4A5A50]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="font-medium text-[#4A5A50]">{t('onboarding.seasonLabel')}</p>
              <div className="flex flex-wrap gap-1.5">
                {['KHARIF', 'RABI', 'ZAID', 'PERENNIAL'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleItem(seasons, s, setSeasons)}
                    className={`rounded-md border px-2.5 py-1 cursor-pointer ${
                      seasons.includes(s)
                        ? 'border-[#1B4332] bg-[#1B4332] text-white'
                        : 'border-[#E5E1D8] bg-[#FAF8F4] text-[#4A5A50]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <label className="space-y-1 block">
              <span className="font-medium text-[#4A5A50]">
                {t('admin.crops.reliabilityLabel')}
              </span>
              <select
                value={dataReliability}
                onChange={(e) =>
                  setDataReliability(
                    e.target.value as 'CURATED_REFERENCE' | 'SAMPLE_REGIONAL_REFERENCE',
                  )
                }
                className={inputBaseClass}
              >
                <option value="CURATED_REFERENCE">{t('cropIntelligence.curatedDataLabel')}</option>
                <option value="SAMPLE_REGIONAL_REFERENCE">
                  {t('cropIntelligence.sampleDataLabel')}
                </option>
              </select>
            </label>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="md" loading={submitting}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      )}

      <section className="rounded-xl border border-[#E5E1D8] bg-white overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E1D8] px-6 py-4">
          <h3 className="font-display text-sm font-semibold text-[#17221B]">
            {t('admin.crops.tableTitle')}
          </h3>
          <div className="relative w-full sm:w-80">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#748379]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('cropIntelligence.knowledgeBank.searchPlaceholder')}
              className={cn(inputBaseClass, 'pl-9 min-h-[38px] py-1.5')}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={4} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title={t('cropIntelligence.knowledgeBank.emptyTitle')}
              description={t('cropIntelligence.knowledgeBank.emptyDesc')}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#E5E1D8] bg-[#FAF8F4] text-xs font-semibold text-[#4A5A50]">
                <tr>
                  <th className="px-6 py-3">{t('admin.crops.colCrop')}</th>
                  <th className="px-6 py-3">{t('admin.crops.colSoils')}</th>
                  <th className="px-6 py-3">{t('admin.crops.colSeasons')}</th>
                  <th className="px-6 py-3">{t('admin.crops.colWater')}</th>
                  <th className="px-6 py-3 text-right">{t('admin.crops.colDuration')}</th>
                  <th className="px-6 py-3 text-right">{t('admin.crops.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E1D8] text-xs">
                {filtered.map((crop) => (
                  <tr key={crop.id} className="hover:bg-[#FAF8F4]/70">
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-[#17221B]">
                        {isKn ? crop.nameKn : crop.nameEn}
                      </p>
                      <p className="font-mono text-[11px] text-[#748379]">
                        {crop.cropCode} ·{' '}
                        {crop.dataReliability === 'SAMPLE_REGIONAL_REFERENCE'
                          ? t('cropIntelligence.sampleDataLabel')
                          : t('cropIntelligence.curatedDataLabel')}
                      </p>
                    </td>
                    <td className="px-6 py-3.5 text-[#4A5A50]">
                      {crop.suitableSoils.join(', ')}
                    </td>
                    <td className="px-6 py-3.5 text-[#4A5A50]">{crop.seasons.join(', ')}</td>
                    <td className="px-6 py-3.5 text-[#17221B]">
                      {t(`cropIntelligence.waterLevels.${crop.waterRequirement}`)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono tabular-nums text-[#17221B]">
                      {crop.durationMinDays}–{crop.durationMaxDays}d
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(crop.id)}
                        aria-label={t('admin.crops.deleteCrop')}
                        className="p-1.5 text-[#748379] hover:text-[#B42318] rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
