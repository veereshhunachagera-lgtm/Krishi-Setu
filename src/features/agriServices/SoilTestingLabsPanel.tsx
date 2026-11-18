import { ExternalLink, FlaskConical, MapPin, Phone, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { FormField, inputBaseClass } from '../../components/FormField';
import { EmptyState, ErrorBanner, LoadingSkeleton } from '../../components/StatePanels';
import { agriServicesService } from '../../services/agriServicesService';
import type { SoilLabsResponse } from '../../types/agriServices';
import type { FarmerProfile } from '../../types/farmer';

interface SoilTestingLabsPanelProps {
  profile: FarmerProfile | null;
}

export function SoilTestingLabsPanel({ profile }: SoilTestingLabsPanelProps) {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [stateFilter, setStateFilter] = useState(profile?.state || '');
  const [districtFilter, setDistrictFilter] = useState('');
  const [queryText, setQueryText] = useState('');
  const [data, setData] = useState<SoilLabsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLabs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await agriServicesService.getSoilLabs({
        state: stateFilter || undefined,
        district: districtFilter || undefined,
        q: queryText || undefined,
      });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [stateFilter, districtFilter, queryText, t]);

  useEffect(() => {
    loadLabs();
  }, [loadLabs]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#E5E1D8] bg-white p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E1D8] pb-4">
          <div className="space-y-1">
            <h2 className="font-display text-lg font-semibold text-[#17221B]">
              {t('agriServices.soilLabs.directoryTitle')}
            </h2>
            <p className="text-xs text-[#4A5A50]">
              {t('agriServices.soilLabs.directorySubtitle')}
            </p>
          </div>
          {profile?.district && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setStateFilter(profile.state || '');
                setDistrictFilter(profile.district || '');
              }}
            >
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {t('agriServices.common.useMyDistrict', { district: profile.district })}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField htmlFor="lab-state" label={t('agriServices.common.stateFilter')}>
            <select
              id="lab-state"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className={inputBaseClass}
            >
              <option value="">{t('agriServices.common.allStates')}</option>
              {(data?.availableStates || []).map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </FormField>

          <FormField htmlFor="lab-district" label={t('agriServices.common.districtFilter')}>
            <select
              id="lab-district"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className={inputBaseClass}
            >
              <option value="">{t('agriServices.common.allDistricts')}</option>
              {(data?.availableDistricts || []).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </FormField>

          <FormField htmlFor="lab-search" label={t('agriServices.common.searchLabel')}>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#748379]"
                aria-hidden="true"
              />
              <input
                id="lab-search"
                type="search"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder={t('agriServices.soilLabs.searchPlaceholder')}
                className={`${inputBaseClass} pl-9`}
              />
            </div>
          </FormField>
        </div>

        {error && <ErrorBanner message={error} onRetry={loadLabs} retryLabel={t('common.retry')} />}

        {loading ? (
          <LoadingSkeleton rows={3} />
        ) : !data || data.providers.length === 0 ? (
          <EmptyState
            title={t('agriServices.soilLabs.emptyTitle')}
            description={t('agriServices.soilLabs.emptyDescription')}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setStateFilter('');
                  setDistrictFilter('');
                  setQueryText('');
                }}
              >
                {t('agriServices.common.resetFilters')}
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-[#E5E1D8]">
            {data.providers.map((lab) => {
              const name = isKn ? lab.nameKn : lab.nameEn;
              const address = isKn ? lab.addressKn : lab.addressEn;
              const services = isKn ? lab.servicesOfferedKn : lab.servicesOfferedEn;
              const note = isKn ? lab.capacityNoteKn : lab.capacityNoteEn;
              const isVerified = lab.verificationStatus === 'VERIFIED_DIRECTORY';

              return (
                <article key={lab.id} className="py-5 first:pt-1 last:pb-1 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#4A5A50]">
                    <span className={isVerified ? 'font-semibold text-[#1B4332]' : 'font-semibold text-[#8C5A2B]'}>
                      {isVerified
                        ? t('agriServices.verification.verifiedDirectory')
                        : t('agriServices.verification.demonstrationSample')}
                    </span>
                    <span>
                      {lab.district}, {lab.state}
                    </span>
                  </div>

                  <h3 className="font-display text-base font-semibold text-[#17221B]">{name}</h3>
                  <p className="text-sm text-[#4A5A50]">{address}</p>

                  {services.length > 0 && (
                    <p className="text-xs text-[#17221B]">
                      <span className="font-medium text-[#748379]">
                        {t('agriServices.soilLabs.servicesLabel')}:{' '}
                      </span>
                      {services.join(' · ')}
                    </p>
                  )}

                  {note && <p className="text-xs text-[#748379] leading-relaxed">{note}</p>}

                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                    {lab.contactPhone ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[#17221B] tabular-nums">
                        <Phone className="h-3.5 w-3.5 text-[#2D6A4F]" aria-hidden="true" />
                        {lab.contactPhone}
                      </span>
                    ) : (
                      <span className="text-[#748379]">
                        {t('agriServices.common.contactNotListed')}
                      </span>
                    )}

                    {lab.websiteUrl && (
                      <a
                        href={lab.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-[#1B4332] hover:underline"
                      >
                        <span>{t('agriServices.common.officialPortal')}</span>
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    )}

                    <span className="text-[#748379]">
                      {t('agriServices.common.sourceLabel')}: {lab.sourceReference}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {data && data.checklist.length > 0 && (
        <section className="rounded-xl border border-[#E5E1D8] bg-white p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#1B4332]">
            <FlaskConical className="h-5 w-5" aria-hidden="true" />
            <h2 className="font-display text-base font-semibold text-[#17221B]">
              {t('agriServices.soilLabs.checklistTitle')}
            </h2>
          </div>
          <p className="text-sm text-[#4A5A50]">{t('agriServices.soilLabs.checklistSubtitle')}</p>

          <ol className="divide-y divide-[#E5E1D8]">
            {data.checklist.map((item) => (
              <li key={item.step} className="py-3.5 first:pt-1 last:pb-1 flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#E7F1EC] font-mono text-xs font-semibold text-[#1B4332] tabular-nums">
                  0{item.step}
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#17221B]">
                    {isKn ? item.titleKn : item.titleEn}
                  </p>
                  <p className="text-sm text-[#4A5A50] leading-relaxed">
                    {isKn ? item.detailKn : item.detailEn}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
