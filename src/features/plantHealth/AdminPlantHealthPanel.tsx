import { BookOpen, Plus, RefreshCw, ShieldAlert, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { inputBaseClass } from '../../components/FormField';
import { EmptyState, ErrorBanner, LoadingSkeleton } from '../../components/StatePanels';
import { plantHealthService } from '../../services/plantHealthService';
import type {
  AlertVerificationStatus,
  PestDiseaseAlertItem,
  PlantProtectionGuideItem,
} from '../../types/plantHealth';

export function AdminPlantHealthPanel() {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [subTab, setSubTab] = useState<'alerts' | 'guides'>('alerts');
  const [alerts, setAlerts] = useState<PestDiseaseAlertItem[]>([]);
  const [guides, setGuides] = useState<PlantProtectionGuideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Alert form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alertCode, setAlertCode] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleKn, setTitleKn] = useState('');
  const [cropCode, setCropCode] = useState('paddy');
  const [stateName, setStateName] = useState('Karnataka');
  const [district, setDistrict] = useState('Mandya');
  const [verificationStatus, setVerificationStatus] =
    useState<AlertVerificationStatus>('REPORTED_CASE');
  const [severity, setSeverity] = useState<'LOW' | 'MODERATE' | 'HIGH'>('MODERATE');
  const [observedDate, setObservedDate] = useState(new Date().toISOString().slice(0, 10));
  const [sourceName, setSourceName] = useState('');
  const [summaryEn, setSummaryEn] = useState('');
  const [summaryKn, setSummaryKn] = useState('');

  // Guide form state
  const [showGuideForm, setShowGuideForm] = useState(false);
  const [guideSubmitting, setGuideSubmitting] = useState(false);
  const [guideCode, setGuideCode] = useState('');
  const [guideCropCode, setGuideCropCode] = useState('paddy');
  const [guideCropNameEn, setGuideCropNameEn] = useState('Paddy (Rice)');
  const [guideCropNameKn, setGuideCropNameKn] = useState('ಭತ್ತ');
  const [issueNameEn, setIssueNameEn] = useState('');
  const [issueNameKn, setIssueNameKn] = useState('');
  const [issueType, setIssueType] = useState<
    'FUNGAL_DISEASE' | 'BACTERIAL_DISEASE' | 'INSECT_PEST'
  >('FUNGAL_DISEASE');
  const [scientificName, setScientificName] = useState('');
  const [favorableEn, setFavorableEn] = useState('');
  const [favorableKn, setFavorableKn] = useState('');
  const [symptomsEnText, setSymptomsEnText] = useState('');
  const [preventiveEnText, setPreventiveEnText] = useState('');
  const [managementEnText, setManagementEnText] = useState('');
  const [safetyNotesEn, setSafetyNotesEn] = useState('');
  const [guideSource, setGuideSource] = useState('ICAR / UAS Bengaluru Package of Practices');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [alertList, guideList] = await Promise.all([
        plantHealthService.adminListAlerts(),
        plantHealthService.adminListGuides(),
      ]);
      setAlerts(alertList);
      setGuides(guideList);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSyncSeed = async () => {
    setSyncing(true);
    setError(null);
    setStatusMessage(null);
    try {
      const res = await plantHealthService.adminSyncSeed();
      await loadAll();
      setStatusMessage(
        t('admin.plantHealth.syncSuccess', {
          alerts: res.alertsImported,
          guides: res.guidesImported,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    setError(null);
    try {
      await plantHealthService.adminDeleteAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    }
  };

  const handleCreateAlert = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setStatusMessage(null);
    try {
      const created = await plantHealthService.adminCreateAlert({
        alertCode,
        titleEn,
        titleKn,
        cropCode,
        cropNameEn: cropCode,
        cropNameKn: cropCode,
        state: stateName,
        district: district.trim() || null,
        verificationStatus,
        severity,
        observedDate,
        sourceName,
        summaryEn,
        summaryKn,
      });
      setAlerts((prev) => [created, ...prev.filter((a) => a.id !== created.id)]);
      setAlertCode('');
      setTitleEn('');
      setTitleKn('');
      setSourceName('');
      setSummaryEn('');
      setSummaryKn('');
      setShowAddForm(false);
      setStatusMessage(t('admin.plantHealth.createSuccess'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const splitLines = (text: string): string[] =>
    text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

  const handleCreateGuide = async (e: FormEvent) => {
    e.preventDefault();
    setGuideSubmitting(true);
    setError(null);
    setStatusMessage(null);
    try {
      const created = await plantHealthService.adminCreateGuide({
        guideCode,
        cropCode: guideCropCode,
        cropNameEn: guideCropNameEn.trim() || guideCropCode,
        cropNameKn: guideCropNameKn.trim() || guideCropNameEn.trim() || guideCropCode,
        issueNameEn,
        issueNameKn,
        issueType,
        scientificName: scientificName.trim() || undefined,
        favorableConditionsEn: favorableEn.trim(),
        favorableConditionsKn: favorableKn.trim() || favorableEn.trim(),
        symptomsEn: splitLines(symptomsEnText),
        preventivePracticesEn: splitLines(preventiveEnText),
        responsibleManagementEn: splitLines(managementEnText),
        safetyNotesEn: safetyNotesEn.trim() || undefined,
        sourceReference: guideSource.trim() || 'Admin Protection Directory',
      });
      setGuides((prev) => [created, ...prev.filter((g) => g.id !== created.id)]);
      setGuideCode('');
      setIssueNameEn('');
      setIssueNameKn('');
      setScientificName('');
      setFavorableEn('');
      setFavorableKn('');
      setSymptomsEnText('');
      setPreventiveEnText('');
      setManagementEnText('');
      setSafetyNotesEn('');
      setShowGuideForm(false);
      setStatusMessage(t('admin.plantHealth.guideCreateSuccess'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setGuideSubmitting(false);
    }
  };

  const handleDeleteGuide = async (id: string) => {
    setError(null);
    try {
      await plantHealthService.adminDeleteGuide(id);
      setGuides((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    }
  };

  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} onRetry={loadAll} retryLabel={t('common.retry')} />}

      {statusMessage && (
        <div className="rounded-lg border border-[#B8D4C5] bg-[#E7F1EC] px-4 py-3 text-xs font-medium text-[#1B4332]">
          {statusMessage}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg bg-[#EDEAE2] p-1 w-fit">
          <button
            type="button"
            onClick={() => setSubTab('alerts')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              subTab === 'alerts'
                ? 'bg-white text-[#17221B] shadow-xs'
                : 'text-[#4A5A50] hover:text-[#17221B]'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
            {t('admin.plantHealth.heading')} ({alerts.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('guides')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              subTab === 'guides'
                ? 'bg-white text-[#17221B] shadow-xs'
                : 'text-[#4A5A50] hover:text-[#17221B]'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            {t('admin.plantHealth.guidesHeading')} ({guides.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" loading={syncing} onClick={handleSyncSeed}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            {t('admin.plantHealth.syncSeedBtn')}
          </Button>
          {subTab === 'alerts' ? (
            <Button variant="primary" size="sm" onClick={() => setShowAddForm((p) => !p)}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {showAddForm ? t('common.cancel') : t('admin.plantHealth.addAlertBtn')}
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => setShowGuideForm((p) => !p)}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {showGuideForm ? t('common.cancel') : t('admin.plantHealth.addGuideBtn')}
            </Button>
          )}
        </div>
      </div>

      {subTab === 'alerts' && (
        <>
          {showAddForm && (
            <form
              onSubmit={handleCreateAlert}
              className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-4"
            >
              <h3 className="font-display text-sm font-semibold text-[#17221B]">
                {t('admin.plantHealth.newAlertTitle')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-[#4A5A50]">
                    {t('admin.plantHealth.alertCodeLabel')}
                  </span>
                  <input
                    required
                    value={alertCode}
                    onChange={(e) => setAlertCode(e.target.value)}
                    placeholder="ka-mandya-blast-2026"
                    className={inputBaseClass}
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-[#4A5A50]">
                    {t('plantHealth.alerts.cropFilterLabel')}
                  </span>
                  <input
                    required
                    value={cropCode}
                    onChange={(e) => setCropCode(e.target.value)}
                    placeholder="paddy"
                    className={inputBaseClass}
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-[#4A5A50]">
                    {t('plantHealth.alerts.statusFilterLabel')}
                  </span>
                  <select
                    value={verificationStatus}
                    onChange={(e) =>
                      setVerificationStatus(e.target.value as AlertVerificationStatus)
                    }
                    className={inputBaseClass}
                  >
                    <option value="REPORTED_CASE">
                      {t('plantHealth.alerts.statuses.REPORTED_CASE')}
                    </option>
                    <option value="CONFIRMED_OUTBREAK">
                      {t('plantHealth.alerts.statuses.CONFIRMED_OUTBREAK')}
                    </option>
                    <option value="SEASONAL_RULE_ADVISORY">
                      {t('plantHealth.alerts.statuses.SEASONAL_RULE_ADVISORY')}
                    </option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-[#4A5A50]">
                    {t('admin.plantHealth.titleEnLabel')}
                  </span>
                  <input
                    required
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    className={inputBaseClass}
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-[#4A5A50]">
                    {t('admin.plantHealth.titleKnLabel')}
                  </span>
                  <input
                    required
                    value={titleKn}
                    onChange={(e) => setTitleKn(e.target.value)}
                    className={inputBaseClass}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-[#4A5A50]">
                    {t('onboarding.stateLabel')}
                  </span>
                  <input
                    required
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className={inputBaseClass}
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-[#4A5A50]">
                    {t('onboarding.districtLabel')}
                  </span>
                  <input
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className={inputBaseClass}
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-[#4A5A50]">
                    {t('plantHealth.alerts.severityLabel')}
                  </span>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as 'LOW' | 'MODERATE' | 'HIGH')}
                    className={inputBaseClass}
                  >
                    <option value="LOW">{t('plantHealth.alerts.severities.LOW')}</option>
                    <option value="MODERATE">
                      {t('plantHealth.alerts.severities.MODERATE')}
                    </option>
                    <option value="HIGH">{t('plantHealth.alerts.severities.HIGH')}</option>
                  </select>
                </label>
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-[#4A5A50]">
                    {t('admin.plantHealth.observedDateLabel')}
                  </span>
                  <input
                    type="date"
                    required
                    value={observedDate}
                    onChange={(e) => setObservedDate(e.target.value)}
                    className={inputBaseClass}
                  />
                </label>
              </div>

              <label className="space-y-1 block">
                <span className="text-xs font-medium text-[#4A5A50]">
                  {t('plantHealth.alerts.sourceLabel')}
                </span>
                <input
                  required
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="ICAR / District KVK Bulletin"
                  className={inputBaseClass}
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-[#4A5A50]">
                    {t('admin.plantHealth.summaryEnLabel')}
                  </span>
                  <textarea
                    rows={3}
                    required
                    value={summaryEn}
                    onChange={(e) => setSummaryEn(e.target.value)}
                    className={inputBaseClass}
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-[#4A5A50]">
                    {t('admin.plantHealth.summaryKnLabel')}
                  </span>
                  <textarea
                    rows={3}
                    required
                    value={summaryKn}
                    onChange={(e) => setSummaryKn(e.target.value)}
                    className={inputBaseClass}
                  />
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
            {loading ? (
              <div className="p-6">
                <LoadingSkeleton rows={4} />
              </div>
            ) : alerts.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title={t('plantHealth.alerts.emptyTitle')}
                  description={t('plantHealth.alerts.emptyDesc')}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#E5E1D8] bg-[#FAF8F4] text-xs font-semibold text-[#4A5A50]">
                    <tr>
                      <th className="px-6 py-3">{t('admin.plantHealth.colAlert')}</th>
                      <th className="px-6 py-3">{t('admin.plantHealth.colRegion')}</th>
                      <th className="px-6 py-3">{t('admin.plantHealth.colVerification')}</th>
                      <th className="px-6 py-3 text-right">{t('admin.plantHealth.colDate')}</th>
                      <th className="px-6 py-3 text-right">{t('admin.crops.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E1D8] text-xs">
                    {alerts.map((alert) => (
                      <tr key={alert.id} className="hover:bg-[#FAF8F4]/70">
                        <td className="px-6 py-3.5">
                          <p className="font-semibold text-[#17221B]">
                            {isKn ? alert.titleKn : alert.titleEn}
                          </p>
                          <p className="text-[#748379]">
                            {isKn ? alert.cropNameKn : alert.cropNameEn} · {alert.sourceName}
                          </p>
                        </td>
                        <td className="px-6 py-3.5 text-[#4A5A50]">
                          {[alert.district, alert.state].filter(Boolean).join(', ')}
                        </td>
                        <td className="px-6 py-3.5 text-[#17221B]">
                          {t(`plantHealth.alerts.statuses.${alert.verificationStatus}`)}
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono tabular-nums text-[#4A5A50]">
                          {alert.observedDate}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteAlert(alert.id)}
                            aria-label={t('admin.plantHealth.deleteAlert')}
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
        </>
      )}

      {subTab === 'guides' && (
        <>
          {showGuideForm && (
            <form
              onSubmit={handleCreateGuide}
              className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-4"
            >
              <h3 className="font-display text-sm font-semibold text-[#17221B]">
                {t('admin.plantHealth.newGuideTitle')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-[#4A5A50]">
                    {t('admin.plantHealth.guideCodeLabel')}
                  </span>
                  <input
                    required
                    value={guideCode}
                    onChange={(e) => setGuideCode(e.target.value)}
                    placeholder="paddy-sheath-blight"
                    className={inputBaseClass}
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-[#4A5A50]">
                    {t('plantHealth.alerts.cropFilterLabel')}
                  </span>
                  <input
                    required
                    value={guideCropCode}
                    onChange={(e) => setGuideCropCode(e.target.value)}
                    placeholder="paddy"
                    className={inputBaseClass}
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-[#4A5A50]">
                    {t('plantHealth.guidance.issueTypeLabel')}
                  </span>
                  <select
                    value={issueType}
                    onChange={(e) =>
                      setIssueType(
                        e.target.value as 'FUNGAL_DISEASE' | 'BACTERIAL_DISEASE' | 'INSECT_PEST',
                      )
                    }
                    className={inputBaseClass}
                  >
                    <option value="FUNGAL_DISEASE">
                      {t('plantHealth.guidance.types.FUNGAL_DISEASE')}
                    </option>
                    <option value="BACTERIAL_DISEASE">
                      {t('plantHealth.guidance.types.BACTERIAL_DISEASE')}
                    </option>
                    <option value="INSECT_PEST">
                      {t('plantHealth.guidance.types.INSECT_PEST')}
                    </option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-[#4A5A50]">
                    {t('admin.crops.nameEnLabel')}
                  </span>
                  <input
                    required
                    value={guideCropNameEn}
                    onChange={(e) => setGuideCropNameEn(e.target.value)}
                    className={inputBaseClass}
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-[#4A5A50]">
                    {t('admin.crops.nameKnLabel')}
                  </span>
                  <input
                    required
                    value={guideCropNameKn}
                    onChange={(e) => setGuideCropNameKn(e.target.value)}
                    className={inputBaseClass}
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-[#4A5A50]">
                    {t('admin.plantHealth.issueNameEnLabel')}
                  </span>
                  <input
                    required
                    value={issueNameEn}
                    onChange={(e) => setIssueNameEn(e.target.value)}
                    className={inputBaseClass}
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-[#4A5A50]">
                    {t('admin.plantHealth.issueNameKnLabel')}
                  </span>
                  <input
                    required
                    value={issueNameKn}
                    onChange={(e) => setIssueNameKn(e.target.value)}
                    className={inputBaseClass}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-[#4A5A50]">
                    {t('admin.plantHealth.scientificNameLabel')}
                  </span>
                  <input
                    value={scientificName}
                    onChange={(e) => setScientificName(e.target.value)}
                    placeholder="e.g., Rhizoctonia solani"
                    className={inputBaseClass}
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-[#4A5A50]">
                    {t('admin.services.sourceLabel')}
                  </span>
                  <input
                    required
                    value={guideSource}
                    onChange={(e) => setGuideSource(e.target.value)}
                    className={inputBaseClass}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-[#4A5A50]">
                    {t('admin.plantHealth.favorableEnLabel')}
                  </span>
                  <input
                    value={favorableEn}
                    onChange={(e) => setFavorableEn(e.target.value)}
                    className={inputBaseClass}
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-[#4A5A50]">
                    {t('admin.plantHealth.favorableKnLabel')}
                  </span>
                  <input
                    value={favorableKn}
                    onChange={(e) => setFavorableKn(e.target.value)}
                    className={inputBaseClass}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-[#4A5A50]">
                    {t('admin.plantHealth.symptomsLineLabel')}
                  </span>
                  <textarea
                    rows={3}
                    value={symptomsEnText}
                    onChange={(e) => setSymptomsEnText(e.target.value)}
                    placeholder="One symptom per line"
                    className={inputBaseClass}
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-[#4A5A50]">
                    {t('admin.plantHealth.preventiveLineLabel')}
                  </span>
                  <textarea
                    rows={3}
                    value={preventiveEnText}
                    onChange={(e) => setPreventiveEnText(e.target.value)}
                    placeholder="One practice per line"
                    className={inputBaseClass}
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-[#4A5A50]">
                    {t('admin.plantHealth.managementLineLabel')}
                  </span>
                  <textarea
                    rows={3}
                    value={managementEnText}
                    onChange={(e) => setManagementEnText(e.target.value)}
                    placeholder="One responsible IPM step per line"
                    className={inputBaseClass}
                  />
                </label>
              </div>

              <label className="space-y-1 block">
                <span className="text-xs font-medium text-[#4A5A50]">
                  {t('plantHealth.guidance.safetyNoteLabel')}
                </span>
                <input
                  value={safetyNotesEn}
                  onChange={(e) => setSafetyNotesEn(e.target.value)}
                  placeholder="Verify exact label instructions with local KVK / RSK."
                  className={inputBaseClass}
                />
              </label>

              <div className="flex justify-end">
                <Button type="submit" variant="primary" size="md" loading={guideSubmitting}>
                  {t('common.save')}
                </Button>
              </div>
            </form>
          )}

          <section className="rounded-xl border border-[#E5E1D8] bg-white overflow-hidden">
            {loading ? (
              <div className="p-6">
                <LoadingSkeleton rows={4} />
              </div>
            ) : guides.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title={t('plantHealth.guidance.emptyTitle')}
                  description={t('plantHealth.guidance.emptyDesc')}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#E5E1D8] bg-[#FAF8F4] text-xs font-semibold text-[#4A5A50]">
                    <tr>
                      <th className="px-6 py-3">{t('admin.plantHealth.colGuideIssue')}</th>
                      <th className="px-6 py-3">{t('admin.crops.colCrop')}</th>
                      <th className="px-6 py-3">{t('plantHealth.guidance.issueTypeLabel')}</th>
                      <th className="px-6 py-3">{t('admin.services.sourceLabel')}</th>
                      <th className="px-6 py-3 text-right">{t('admin.crops.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E1D8] text-xs">
                    {guides.map((guide) => (
                      <tr key={guide.id} className="hover:bg-[#FAF8F4]/70">
                        <td className="px-6 py-3.5">
                          <p className="font-semibold text-[#17221B]">
                            {isKn ? guide.issueNameKn : guide.issueNameEn}
                          </p>
                          <p className="text-[#748379]">
                            {guide.scientificName || guide.guideCode}
                          </p>
                        </td>
                        <td className="px-6 py-3.5 text-[#4A5A50]">
                          {isKn ? guide.cropNameKn : guide.cropNameEn}
                        </td>
                        <td className="px-6 py-3.5 text-[#17221B]">
                          {t(`plantHealth.guidance.types.${guide.issueType}`)}
                        </td>
                        <td className="px-6 py-3.5 text-[#4A5A50] max-w-xs truncate">
                          {guide.sourceReference}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteGuide(guide.id)}
                            aria-label={t('admin.plantHealth.deleteGuide')}
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
        </>
      )}
    </div>
  );
}
