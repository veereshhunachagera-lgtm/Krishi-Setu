import { Calendar, CheckCircle2, Phone, Search, Tractor, XCircle } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { FormField, inputBaseClass } from '../../components/FormField';
import { EmptyState, ErrorBanner, LoadingSkeleton } from '../../components/StatePanels';
import { agriServicesService } from '../../services/agriServicesService';
import type {
  EquipmentBookingRequest,
  EquipmentCatalogResponse,
  EquipmentListing,
} from '../../types/agriServices';
import type { FarmerProfile } from '../../types/farmer';

interface EquipmentRentalPanelProps {
  profile: FarmerProfile | null;
}

export function EquipmentRentalPanel({ profile }: EquipmentRentalPanelProps) {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [category, setCategory] = useState<string>('ALL');
  const [stateFilter, setStateFilter] = useState(profile?.state || '');
  const [districtFilter, setDistrictFilter] = useState('');
  const [queryText, setQueryText] = useState('');

  const [catalog, setCatalog] = useState<EquipmentCatalogResponse | null>(null);
  const [bookings, setBookings] = useState<EquipmentBookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentListing | null>(null);
  const [requestedDate, setRequestedDate] = useState(() => {
    const d = new Date(Date.now() + 86400000);
    return d.toISOString().slice(0, 10);
  });
  const [durationValue, setDurationValue] = useState('4');
  const [durationUnit, setDurationUnit] = useState<'HOURS' | 'ACRES' | 'DAYS'>('HOURS');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [eqRes, bookingsRes] = await Promise.all([
        agriServicesService.getEquipment({
          category: category !== 'ALL' ? category : undefined,
          state: stateFilter || undefined,
          district: districtFilter || undefined,
          q: queryText || undefined,
        }),
        agriServicesService.getMyBookings(),
      ]);
      setCatalog(eqRes);
      setBookings(bookingsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [category, stateFilter, districtFilter, queryText, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipment) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      const created = await agriServicesService.createBookingRequest({
        equipmentId: selectedEquipment.id,
        requestedDate,
        durationValue: Number(durationValue),
        durationUnit,
        contactPhone,
        notes: notes.trim() || undefined,
      });
      setBookings((prev) => [created, ...prev]);
      setSubmitSuccess(t('agriServices.equipment.bookingSavedNotice'));
      setSelectedEquipment(null);
      setNotes('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async (id: string) => {
    try {
      const updated = await agriServicesService.cancelMyBooking(id);
      setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Equipment Catalog & Filters */}
      <section className="rounded-xl border border-[#E5E1D8] bg-white p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E1D8] pb-4">
          <div className="space-y-1">
            <h2 className="font-display text-lg font-semibold text-[#17221B]">
              {t('agriServices.equipment.catalogTitle')}
            </h2>
            <p className="text-xs text-[#4A5A50]">
              {t('agriServices.equipment.catalogSubtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#EDEAE2] p-1 self-start">
            {(['ALL', 'TRACTOR', 'HARVESTER', 'OTHER'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  category === cat
                    ? 'bg-white text-[#17221B] shadow-xs'
                    : 'text-[#4A5A50] hover:text-[#17221B]'
                }`}
              >
                {t(`agriServices.equipment.categories.${cat}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField htmlFor="eq-state" label={t('agriServices.common.stateFilter')}>
            <select
              id="eq-state"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className={inputBaseClass}
            >
              <option value="">{t('agriServices.common.allStates')}</option>
              {(catalog?.availableStates || []).map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </FormField>

          <FormField htmlFor="eq-district" label={t('agriServices.common.districtFilter')}>
            <select
              id="eq-district"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className={inputBaseClass}
            >
              <option value="">{t('agriServices.common.allDistricts')}</option>
              {(catalog?.availableDistricts || []).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </FormField>

          <FormField htmlFor="eq-search" label={t('agriServices.common.searchLabel')}>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#748379]"
                aria-hidden="true"
              />
              <input
                id="eq-search"
                type="search"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder={t('agriServices.equipment.searchPlaceholder')}
                className={`${inputBaseClass} pl-9`}
              />
            </div>
          </FormField>
        </div>

        {submitSuccess && (
          <div className="rounded-lg border border-[#BCE3CC] bg-[#E7F1EC] px-4 py-3 text-sm text-[#1B4332] flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{submitSuccess}</span>
          </div>
        )}

        {error && <ErrorBanner message={error} onRetry={loadData} retryLabel={t('common.retry')} />}

        {loading ? (
          <LoadingSkeleton rows={3} />
        ) : !catalog || catalog.listings.length === 0 ? (
          <EmptyState
            title={t('agriServices.equipment.emptyTitle')}
            description={t('agriServices.equipment.emptyDescription')}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCategory('ALL');
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
            {catalog.listings.map((item) => {
              const name = isKn ? item.equipmentNameKn : item.equipmentNameEn;
              const spec = isKn ? item.modelOrSpecKn : item.modelOrSpecEn;
              const provider = isKn ? item.providerNameKn : item.providerNameEn;
              const isVerified = item.verificationStatus === 'VERIFIED_DIRECTORY';
              const isSelected = selectedEquipment?.id === item.id;

              return (
                <article key={item.id} className="py-5 first:pt-1 last:pb-1 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#4A5A50]">
                    <span className={isVerified ? 'font-semibold text-[#1B4332]' : 'font-semibold text-[#8C5A2B]'}>
                      {isVerified
                        ? t('agriServices.verification.verifiedDirectory')
                        : t('agriServices.verification.demonstrationSample')}
                    </span>
                    <span>
                      {t(`agriServices.equipment.categories.${item.category}`)} · {item.district},{' '}
                      {item.state}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <h3 className="font-display text-base font-semibold text-[#17221B]">{name}</h3>
                      <p className="text-sm text-[#4A5A50]">{spec}</p>
                      <p className="text-xs text-[#748379]">
                        {provider} · {item.sourceReference}
                      </p>
                    </div>

                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-[#748379]">
                          {t('agriServices.equipment.rentalRateLabel')}
                        </p>
                        {item.rateVerified && item.rateInr !== null ? (
                          <p className="font-mono text-sm font-semibold text-[#1B4332] tabular-nums">
                            ₹{item.rateInr} / {t(`agriServices.equipment.units.${item.rateUnit || 'HOUR'}`)}
                          </p>
                        ) : (
                          <p className="text-xs font-medium text-[#8C5A2B]">
                            {t('agriServices.equipment.rateNotVerified')}
                          </p>
                        )}
                        <p className="text-xs text-[#4A5A50] mt-0.5">
                          {t(`agriServices.equipment.availability.${item.availabilityStatus}`)}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant={isSelected ? 'primary' : 'secondary'}
                        onClick={() => {
                          setSelectedEquipment(item);
                          setSubmitError(null);
                        }}
                      >
                        <Tractor className="h-3.5 w-3.5" aria-hidden="true" />
                        {t('agriServices.equipment.requestButton')}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Booking Request Form */}
      {selectedEquipment && (
        <section className="rounded-xl border border-[#1B4332] bg-white p-6 space-y-5">
          <div className="flex items-start justify-between gap-4 border-b border-[#E5E1D8] pb-4">
            <div className="space-y-1">
              <h2 className="font-display text-lg font-semibold text-[#17221B]">
                {t('agriServices.equipment.formTitle')}
              </h2>
              <p className="text-sm text-[#4A5A50]">
                {isKn ? selectedEquipment.equipmentNameKn : selectedEquipment.equipmentNameEn} —{' '}
                {selectedEquipment.district}, {selectedEquipment.state}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedEquipment(null)}
              className="text-xs font-medium text-[#748379] hover:text-[#17221B] cursor-pointer"
            >
              {t('common.cancel')}
            </button>
          </div>

          <p className="text-xs text-[#8C5A2B] bg-[#F5ECE3]/60 rounded-lg px-3.5 py-2.5">
            {t('agriServices.equipment.requestDisclaimer')}
          </p>

          {submitError && <ErrorBanner message={submitError} />}

          <form onSubmit={handleCreateBooking} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField htmlFor="bk-date" label={t('agriServices.equipment.requestedDateLabel')}>
                <input
                  id="bk-date"
                  type="date"
                  required
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                  className={inputBaseClass}
                />
              </FormField>

              <FormField htmlFor="bk-phone" label={t('agriServices.equipment.phoneLabel')}>
                <input
                  id="bk-phone"
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="9876543210"
                  className={inputBaseClass}
                />
              </FormField>

              <FormField htmlFor="bk-dur" label={t('agriServices.equipment.durationLabel')}>
                <input
                  id="bk-dur"
                  type="number"
                  min={0.5}
                  max={500}
                  step="0.5"
                  required
                  value={durationValue}
                  onChange={(e) => setDurationValue(e.target.value)}
                  className={inputBaseClass}
                />
              </FormField>

              <FormField htmlFor="bk-unit" label={t('agriServices.equipment.durationUnitLabel')}>
                <select
                  id="bk-unit"
                  value={durationUnit}
                  onChange={(e) =>
                    setDurationUnit(e.target.value as 'HOURS' | 'ACRES' | 'DAYS')
                  }
                  className={inputBaseClass}
                >
                  <option value="HOURS">{t('agriServices.equipment.units.HOUR')}</option>
                  <option value="ACRES">{t('agriServices.equipment.units.ACRE')}</option>
                  <option value="DAYS">{t('agriServices.equipment.units.DAY')}</option>
                </select>
              </FormField>
            </div>

            <FormField htmlFor="bk-notes" label={t('agriServices.equipment.notesLabel')}>
              <textarea
                id="bk-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('agriServices.equipment.notesPlaceholder')}
                className={inputBaseClass}
              />
            </FormField>

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSelectedEquipment(null)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" size="sm" loading={submitting}>
                {t('agriServices.equipment.submitRequest')}
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* Persisted Farmer Booking Requests */}
      <section className="rounded-xl border border-[#E5E1D8] bg-white p-6 space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-[#E5E1D8] pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#1B4332]" aria-hidden="true" />
            <h2 className="font-display text-base font-semibold text-[#17221B]">
              {t('agriServices.equipment.myBookingsTitle')}
            </h2>
          </div>
          <span className="font-mono text-xs text-[#748379] tabular-nums">
            {bookings.length}
          </span>
        </div>

        {bookings.length === 0 ? (
          <p className="text-sm text-[#748379]">{t('agriServices.equipment.noBookingsYet')}</p>
        ) : (
          <div className="divide-y divide-[#E5E1D8]">
            {bookings.map((bk) => (
              <div
                key={bk.id}
                className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#17221B]">
                    {isKn ? bk.equipmentNameKn : bk.equipmentNameEn}
                  </p>
                  <p className="text-xs text-[#4A5A50] tabular-nums">
                    {bk.requestedDate} · {bk.durationValue}{' '}
                    {t(`agriServices.equipment.units.${bk.durationUnit === 'HOURS' ? 'HOUR' : bk.durationUnit === 'ACRES' ? 'ACRE' : 'DAY'}`)} ·{' '}
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Phone className="h-3 w-3" aria-hidden="true" />
                      {bk.contactPhone}
                    </span>
                  </p>
                  <p className="text-xs text-[#748379]">
                    {bk.providerNameEn} ({bk.district})
                  </p>
                  {bk.adminNote && (
                    <p className="text-xs text-[#1B4332]">
                      {t('agriServices.equipment.adminNoteLabel')}: {bk.adminNote}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-xs font-semibold ${
                      bk.status === 'CANCELLED'
                        ? 'text-[#991B1B]'
                        : bk.status === 'COMPLETED'
                          ? 'text-[#1B4332]'
                          : 'text-[#8C5A2B]'
                    }`}
                  >
                    {t(`agriServices.equipment.bookingStatus.${bk.status}`)}
                  </span>

                  {(bk.status === 'REQUESTED' || bk.status === 'REVIEWING') && (
                    <button
                      type="button"
                      onClick={() => handleCancelBooking(bk.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-[#E5E1D8] px-2.5 py-1 text-xs font-medium text-[#991B1B] hover:bg-[#FEF2F2] cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('common.cancel')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
