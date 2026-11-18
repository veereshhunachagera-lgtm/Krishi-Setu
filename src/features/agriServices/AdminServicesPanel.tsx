import { Plus, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { FormField, inputBaseClass } from '../../components/FormField';
import { EmptyState, ErrorBanner, LoadingSkeleton } from '../../components/StatePanels';
import { agriServicesService } from '../../services/agriServicesService';
import type {
  AgriServiceProvider,
  BookingRequestStatus,
  EquipmentBookingRequest,
  EquipmentListing,
  ServiceProviderType,
  VerificationTier,
} from '../../types/agriServices';

export function AdminServicesPanel() {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [subTab, setSubTab] = useState<'providers' | 'equipment' | 'bookings'>('providers');
  const [providers, setProviders] = useState<AgriServiceProvider[]>([]);
  const [equipment, setEquipment] = useState<EquipmentListing[]>([]);
  const [bookings, setBookings] = useState<EquipmentBookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Provider form state
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [pType, setPType] = useState<ServiceProviderType>('COLD_STORAGE');
  const [pNameEn, setPNameEn] = useState('');
  const [pNameKn, setPNameKn] = useState('');
  const [pState, setPState] = useState('Karnataka');
  const [pDistrict, setPDistrict] = useState('Mandya');
  const [pAddressEn, setPAddressEn] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pLat, setPLat] = useState('');
  const [pLon, setPLon] = useState('');
  const [pCoordsVerified, setPCoordsVerified] = useState(false);
  const [pTier, setPTier] = useState<VerificationTier>('DEMONSTRATION_SAMPLE');
  const [pSource, setPSource] = useState('');
  const [pSaving, setPSaving] = useState(false);

  // Equipment form state
  const [showEqForm, setShowEqForm] = useState(false);
  const [eqCategory, setEqCategory] = useState<'TRACTOR' | 'HARVESTER' | 'OTHER'>('TRACTOR');
  const [eqNameEn, setEqNameEn] = useState('');
  const [eqNameKn, setEqNameKn] = useState('');
  const [eqSpecEn, setEqSpecEn] = useState('');
  const [eqProviderEn, setEqProviderEn] = useState('');
  const [eqState, setEqState] = useState('Karnataka');
  const [eqDistrict, setEqDistrict] = useState('Mandya');
  const [eqPhone, setEqPhone] = useState('');
  const [eqRate, setEqRate] = useState('');
  const [eqUnit, setEqUnit] = useState<'HOUR' | 'ACRE' | 'DAY'>('HOUR');
  const [eqRateVerified, setEqRateVerified] = useState(false);
  const [eqAvail, setEqAvail] = useState<'AVAILABLE' | 'SEASONAL_DEMAND' | 'UNVERIFIED'>('UNVERIFIED');
  const [eqTier, setEqTier] = useState<VerificationTier>('DEMONSTRATION_SAMPLE');
  const [eqSource, setEqSource] = useState('');
  const [eqSaving, setEqSaving] = useState(false);

  // Booking updates
  const [bookingNotes, setBookingNotes] = useState<Record<string, string>>({});
  const [bookingUpdatingId, setBookingUpdatingId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [provList, eqList, bkList] = await Promise.all([
        agriServicesService.listProvidersAdmin(),
        agriServicesService.listEquipmentAdmin(),
        agriServicesService.listBookingsAdmin(),
      ]);
      setProviders(provList);
      setEquipment(eqList);
      setBookings(bkList);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setPSaving(true);
    setError(null);
    setStatusMessage(null);
    try {
      const created = await agriServicesService.createProviderAdmin({
        serviceType: pType,
        nameEn: pNameEn.trim(),
        nameKn: pNameKn.trim() || pNameEn.trim(),
        state: pState.trim(),
        district: pDistrict.trim(),
        addressEn: pAddressEn.trim(),
        contactPhone: pPhone.trim() || undefined,
        latitude: pLat.trim() ? Number(pLat) : undefined,
        longitude: pLon.trim() ? Number(pLon) : undefined,
        coordinatesVerified: pCoordsVerified,
        verificationStatus: pTier,
        sourceReference: pSource.trim() || 'Admin Directory Entry',
      });
      setProviders((prev) => [created, ...prev]);
      setStatusMessage(t('admin.services.providerSaved'));
      setPNameEn('');
      setPNameKn('');
      setPAddressEn('');
      setPPhone('');
      setPLat('');
      setPLon('');
      setPSource('');
      setShowProviderForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setPSaving(false);
    }
  };

  const handleDeleteProvider = async (id: string) => {
    try {
      await agriServicesService.deleteProviderAdmin(id);
      setProviders((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    }
  };

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setEqSaving(true);
    setError(null);
    setStatusMessage(null);
    try {
      const created = await agriServicesService.createEquipmentAdmin({
        category: eqCategory,
        equipmentNameEn: eqNameEn.trim(),
        equipmentNameKn: eqNameKn.trim() || eqNameEn.trim(),
        modelOrSpecEn: eqSpecEn.trim() || undefined,
        providerNameEn: eqProviderEn.trim(),
        state: eqState.trim(),
        district: eqDistrict.trim(),
        contactPhone: eqPhone.trim() || undefined,
        rateInr: eqRate.trim() ? Number(eqRate) : undefined,
        rateUnit: eqUnit,
        rateVerified: eqRateVerified,
        availabilityStatus: eqAvail,
        verificationStatus: eqTier,
        sourceReference: eqSource.trim() || 'Admin CHC Listing',
      });
      setEquipment((prev) => [created, ...prev]);
      setStatusMessage(t('admin.services.equipmentSaved'));
      setEqNameEn('');
      setEqNameKn('');
      setEqSpecEn('');
      setEqProviderEn('');
      setEqPhone('');
      setEqRate('');
      setEqSource('');
      setShowEqForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setEqSaving(false);
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    try {
      await agriServicesService.deleteEquipmentAdmin(id);
      setEquipment((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    }
  };

  const handleUpdateBookingStatus = async (
    id: string,
    status: BookingRequestStatus,
    currentNote: string | null,
  ) => {
    setBookingUpdatingId(id);
    setError(null);
    setStatusMessage(null);
    try {
      const noteToSave = bookingNotes[id] !== undefined ? bookingNotes[id] : currentNote || '';
      const updated = await agriServicesService.updateBookingStatusAdmin(id, {
        status,
        adminNote: noteToSave.trim() || undefined,
      });
      setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
      setStatusMessage(t('admin.services.bookingUpdated'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setBookingUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#17221B]">
            {t('admin.services.heading')}
          </h2>
          <p className="text-xs text-[#4A5A50] mt-0.5">{t('admin.services.subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#EDEAE2] p-1 self-start">
          {(
            [
              { id: 'providers', label: t('admin.services.subTabs.providers') },
              { id: 'equipment', label: t('admin.services.subTabs.equipment') },
              { id: 'bookings', label: t('admin.services.subTabs.bookings') },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSubTab(item.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                subTab === item.id
                  ? 'bg-white text-[#17221B] shadow-xs'
                  : 'text-[#4A5A50] hover:text-[#17221B]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-xl border border-[#2D6A4F]/30 bg-[#E7F1EC] px-4 py-3 text-sm text-[#1B4332]">
          {statusMessage}
        </div>
      )}

      {error && <ErrorBanner message={error} onRetry={loadAll} retryLabel={t('common.retry')} />}

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : subTab === 'providers' ? (
        <div className="space-y-5">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowProviderForm((prev) => !prev)}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {t('admin.services.addProviderBtn')}
            </Button>
          </div>

          {showProviderForm && (
            <form
              onSubmit={handleCreateProvider}
              className="rounded-xl border border-[#E5E1D8] bg-white p-6 space-y-4"
            >
              <h3 className="font-display text-base font-semibold text-[#17221B]">
                {t('admin.services.providerFormTitle')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <FormField htmlFor="adm-p-type" label={t('admin.services.serviceTypeLabel')} required>
                  <select
                    id="adm-p-type"
                    value={pType}
                    onChange={(e) => setPType(e.target.value as ServiceProviderType)}
                    className={inputBaseClass}
                  >
                    <option value="SOIL_LAB_KVK">SOIL_LAB_KVK</option>
                    <option value="COLD_STORAGE">COLD_STORAGE</option>
                    <option value="MANDI_APMC">MANDI_APMC</option>
                    <option value="CUSTOM_HIRING_CENTRE">CUSTOM_HIRING_CENTRE</option>
                    <option value="INPUT_SEED_CENTRE">INPUT_SEED_CENTRE</option>
                    <option value="EXTENSION_BANK">EXTENSION_BANK</option>
                  </select>
                </FormField>

                <FormField htmlFor="adm-p-name-en" label={t('admin.services.nameEnLabel')} required>
                  <input
                    id="adm-p-name-en"
                    type="text"
                    required
                    value={pNameEn}
                    onChange={(e) => setPNameEn(e.target.value)}
                    className={inputBaseClass}
                  />
                </FormField>

                <FormField htmlFor="adm-p-name-kn" label={t('admin.services.nameKnLabel')}>
                  <input
                    id="adm-p-name-kn"
                    type="text"
                    value={pNameKn}
                    onChange={(e) => setPNameKn(e.target.value)}
                    className={inputBaseClass}
                  />
                </FormField>

                <FormField htmlFor="adm-p-state" label={t('onboarding.stateLabel')} required>
                  <input
                    id="adm-p-state"
                    type="text"
                    required
                    value={pState}
                    onChange={(e) => setPState(e.target.value)}
                    className={inputBaseClass}
                  />
                </FormField>

                <FormField htmlFor="adm-p-district" label={t('onboarding.districtLabel')} required>
                  <input
                    id="adm-p-district"
                    type="text"
                    required
                    value={pDistrict}
                    onChange={(e) => setPDistrict(e.target.value)}
                    className={inputBaseClass}
                  />
                </FormField>

                <FormField htmlFor="adm-p-phone" label={t('admin.services.phoneLabel')}>
                  <input
                    id="adm-p-phone"
                    type="text"
                    value={pPhone}
                    onChange={(e) => setPPhone(e.target.value)}
                    className={inputBaseClass}
                  />
                </FormField>

                <FormField
                  htmlFor="adm-p-address"
                  label={t('admin.services.addressLabel')}
                  required
                  className="sm:col-span-2"
                >
                  <input
                    id="adm-p-address"
                    type="text"
                    required
                    value={pAddressEn}
                    onChange={(e) => setPAddressEn(e.target.value)}
                    className={inputBaseClass}
                  />
                </FormField>

                <FormField htmlFor="adm-p-tier" label={t('admin.services.verificationTierLabel')}>
                  <select
                    id="adm-p-tier"
                    value={pTier}
                    onChange={(e) => setPTier(e.target.value as VerificationTier)}
                    className={inputBaseClass}
                  >
                    <option value="VERIFIED_DIRECTORY">
                      {t('agriServices.verification.verifiedDirectory')}
                    </option>
                    <option value="DEMONSTRATION_SAMPLE">
                      {t('agriServices.verification.demonstrationSample')}
                    </option>
                  </select>
                </FormField>

                <FormField htmlFor="adm-p-lat" label={t('admin.services.latitudeLabel')}>
                  <input
                    id="adm-p-lat"
                    type="number"
                    step="0.0001"
                    value={pLat}
                    onChange={(e) => setPLat(e.target.value)}
                    className={inputBaseClass}
                  />
                </FormField>

                <FormField htmlFor="adm-p-lon" label={t('admin.services.longitudeLabel')}>
                  <input
                    id="adm-p-lon"
                    type="number"
                    step="0.0001"
                    value={pLon}
                    onChange={(e) => setPLon(e.target.value)}
                    className={inputBaseClass}
                  />
                </FormField>

                <FormField htmlFor="adm-p-source" label={t('admin.services.sourceLabel')}>
                  <input
                    id="adm-p-source"
                    type="text"
                    value={pSource}
                    onChange={(e) => setPSource(e.target.value)}
                    placeholder="e.g., ICAR KVK Portal"
                    className={inputBaseClass}
                  />
                </FormField>
              </div>

              <label className="inline-flex items-center gap-2 text-xs text-[#17221B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={pCoordsVerified}
                  onChange={(e) => setPCoordsVerified(e.target.checked)}
                  className="h-4 w-4 accent-[#1B4332]"
                />
                <span>{t('admin.services.coordsVerifiedLabel')}</span>
              </label>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowProviderForm(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" size="sm" loading={pSaving}>
                  {t('common.save')}
                </Button>
              </div>
            </form>
          )}

          {providers.length === 0 ? (
            <EmptyState title={t('admin.services.emptyProviders')} description={t('admin.services.subtitle')} />
          ) : (
            <section className="rounded-xl border border-[#E5E1D8] bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#E5E1D8] bg-[#FAF8F4] text-xs font-semibold text-[#4A5A50]">
                    <tr>
                      <th className="px-5 py-3">{t('admin.services.cols.provider')}</th>
                      <th className="px-5 py-3">{t('admin.services.cols.type')}</th>
                      <th className="px-5 py-3">{t('admin.columns.location')}</th>
                      <th className="px-5 py-3">{t('admin.services.cols.verification')}</th>
                      <th className="px-5 py-3 text-right">{t('admin.crops.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E1D8]">
                    {providers.map((p) => (
                      <tr key={p.id} className="hover:bg-[#FAF8F4]/70">
                        <td className="px-5 py-3">
                          <p className="font-medium text-[#17221B]">{isKn ? p.nameKn : p.nameEn}</p>
                          <p className="text-xs text-[#748379]">{p.sourceReference}</p>
                        </td>
                        <td className="px-5 py-3 text-xs text-[#4A5A50]">{p.serviceType}</td>
                        <td className="px-5 py-3 text-[#4A5A50]">
                          {p.district}, {p.state}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`text-xs font-semibold ${
                              p.verificationStatus === 'VERIFIED_DIRECTORY'
                                ? 'text-[#1B4332]'
                                : 'text-[#8C5A2B]'
                            }`}
                          >
                            {p.verificationStatus === 'VERIFIED_DIRECTORY'
                              ? t('agriServices.verification.verifiedDirectory')
                              : t('agriServices.verification.demonstrationSample')}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteProvider(p.id)}
                            aria-label={t('common.delete')}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#748379] hover:text-[#991B1B] hover:bg-[#FEF2F2] cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      ) : subTab === 'equipment' ? (
        <div className="space-y-5">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowEqForm((prev) => !prev)}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {t('admin.services.addEquipmentBtn')}
            </Button>
          </div>

          {showEqForm && (
            <form
              onSubmit={handleCreateEquipment}
              className="rounded-xl border border-[#E5E1D8] bg-white p-6 space-y-4"
            >
              <h3 className="font-display text-base font-semibold text-[#17221B]">
                {t('admin.services.equipmentFormTitle')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <FormField htmlFor="adm-eq-cat" label={t('admin.crops.categoryLabel')} required>
                  <select
                    id="adm-eq-cat"
                    value={eqCategory}
                    onChange={(e) => setEqCategory(e.target.value as 'TRACTOR' | 'HARVESTER' | 'OTHER')}
                    className={inputBaseClass}
                  >
                    <option value="TRACTOR">TRACTOR</option>
                    <option value="HARVESTER">HARVESTER</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </FormField>

                <FormField htmlFor="adm-eq-name-en" label={t('admin.services.equipmentNameEnLabel')} required>
                  <input
                    id="adm-eq-name-en"
                    type="text"
                    required
                    value={eqNameEn}
                    onChange={(e) => setEqNameEn(e.target.value)}
                    className={inputBaseClass}
                  />
                </FormField>

                <FormField htmlFor="adm-eq-name-kn" label={t('admin.services.equipmentNameKnLabel')}>
                  <input
                    id="adm-eq-name-kn"
                    type="text"
                    value={eqNameKn}
                    onChange={(e) => setEqNameKn(e.target.value)}
                    className={inputBaseClass}
                  />
                </FormField>

                <FormField htmlFor="adm-eq-spec" label={t('admin.services.specLabel')}>
                  <input
                    id="adm-eq-spec"
                    type="text"
                    value={eqSpecEn}
                    onChange={(e) => setEqSpecEn(e.target.value)}
                    className={inputBaseClass}
                  />
                </FormField>

                <FormField htmlFor="adm-eq-provider" label={t('admin.services.providerNameLabel')} required>
                  <input
                    id="adm-eq-provider"
                    type="text"
                    required
                    value={eqProviderEn}
                    onChange={(e) => setEqProviderEn(e.target.value)}
                    className={inputBaseClass}
                  />
                </FormField>

                <FormField htmlFor="adm-eq-state" label={t('onboarding.stateLabel')} required>
                  <input
                    id="adm-eq-state"
                    type="text"
                    required
                    value={eqState}
                    onChange={(e) => setEqState(e.target.value)}
                    className={inputBaseClass}
                  />
                </FormField>

                <FormField htmlFor="adm-eq-district" label={t('onboarding.districtLabel')} required>
                  <input
                    id="adm-eq-district"
                    type="text"
                    required
                    value={eqDistrict}
                    onChange={(e) => setEqDistrict(e.target.value)}
                    className={inputBaseClass}
                  />
                </FormField>

                <FormField htmlFor="adm-eq-rate" label={t('admin.services.rateInrLabel')}>
                  <input
                    id="adm-eq-rate"
                    type="number"
                    min={0}
                    value={eqRate}
                    onChange={(e) => setEqRate(e.target.value)}
                    className={inputBaseClass}
                  />
                </FormField>

                <FormField htmlFor="adm-eq-unit" label={t('admin.services.rateUnitLabel')}>
                  <select
                    id="adm-eq-unit"
                    value={eqUnit}
                    onChange={(e) => setEqUnit(e.target.value as 'HOUR' | 'ACRE' | 'DAY')}
                    className={inputBaseClass}
                  >
                    <option value="HOUR">HOUR</option>
                    <option value="ACRE">ACRE</option>
                    <option value="DAY">DAY</option>
                  </select>
                </FormField>

                <FormField htmlFor="adm-eq-avail" label={t('admin.services.availabilityLabel')}>
                  <select
                    id="adm-eq-avail"
                    value={eqAvail}
                    onChange={(e) =>
                      setEqAvail(e.target.value as 'AVAILABLE' | 'SEASONAL_DEMAND' | 'UNVERIFIED')
                    }
                    className={inputBaseClass}
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="SEASONAL_DEMAND">SEASONAL_DEMAND</option>
                    <option value="UNVERIFIED">UNVERIFIED</option>
                  </select>
                </FormField>

                <FormField htmlFor="adm-eq-tier" label={t('admin.services.verificationTierLabel')}>
                  <select
                    id="adm-eq-tier"
                    value={eqTier}
                    onChange={(e) => setEqTier(e.target.value as VerificationTier)}
                    className={inputBaseClass}
                  >
                    <option value="VERIFIED_DIRECTORY">
                      {t('agriServices.verification.verifiedDirectory')}
                    </option>
                    <option value="DEMONSTRATION_SAMPLE">
                      {t('agriServices.verification.demonstrationSample')}
                    </option>
                  </select>
                </FormField>

                <FormField htmlFor="adm-eq-phone" label={t('admin.services.phoneLabel')}>
                  <input
                    id="adm-eq-phone"
                    type="text"
                    value={eqPhone}
                    onChange={(e) => setEqPhone(e.target.value)}
                    className={inputBaseClass}
                  />
                </FormField>

                <FormField htmlFor="adm-eq-source" label={t('admin.services.sourceLabel')}>
                  <input
                    id="adm-eq-source"
                    type="text"
                    value={eqSource}
                    onChange={(e) => setEqSource(e.target.value)}
                    className={inputBaseClass}
                  />
                </FormField>
              </div>

              <label className="inline-flex items-center gap-2 text-xs text-[#17221B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={eqRateVerified}
                  onChange={(e) => setEqRateVerified(e.target.checked)}
                  className="h-4 w-4 accent-[#1B4332]"
                />
                <span>{t('admin.services.rateVerifiedLabel')}</span>
              </label>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowEqForm(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" size="sm" loading={eqSaving}>
                  {t('common.save')}
                </Button>
              </div>
            </form>
          )}

          {equipment.length === 0 ? (
            <EmptyState title={t('admin.services.emptyEquipment')} description={t('admin.services.subtitle')} />
          ) : (
            <section className="rounded-xl border border-[#E5E1D8] bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#E5E1D8] bg-[#FAF8F4] text-xs font-semibold text-[#4A5A50]">
                    <tr>
                      <th className="px-5 py-3">{t('admin.services.cols.equipment')}</th>
                      <th className="px-5 py-3">{t('admin.services.cols.type')}</th>
                      <th className="px-5 py-3">{t('admin.columns.location')}</th>
                      <th className="px-5 py-3">{t('admin.services.cols.rate')}</th>
                      <th className="px-5 py-3 text-right">{t('admin.crops.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E1D8]">
                    {equipment.map((eq) => (
                      <tr key={eq.id} className="hover:bg-[#FAF8F4]/70">
                        <td className="px-5 py-3">
                          <p className="font-medium text-[#17221B]">
                            {isKn ? eq.equipmentNameKn : eq.equipmentNameEn}
                          </p>
                          <p className="text-xs text-[#748379]">
                            {isKn ? eq.providerNameKn : eq.providerNameEn}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-xs text-[#4A5A50]">{eq.category}</td>
                        <td className="px-5 py-3 text-[#4A5A50]">
                          {eq.district}, {eq.state}
                        </td>
                        <td className="px-5 py-3 text-xs tabular-nums">
                          {eq.rateVerified && eq.rateInr !== null ? (
                            <span className="font-mono font-semibold text-[#1B4332]">
                              ₹{eq.rateInr}/{eq.rateUnit}
                            </span>
                          ) : (
                            <span className="text-[#8C5A2B]">
                              {t('agriServices.equipment.rateNotVerified')}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteEquipment(eq.id)}
                            aria-label={t('common.delete')}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#748379] hover:text-[#991B1B] hover:bg-[#FEF2F2] cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState title={t('admin.services.emptyBookings')} description={t('admin.services.subtitle')} />
      ) : (
        <section className="rounded-xl border border-[#E5E1D8] bg-white divide-y divide-[#E5E1D8]">
          {bookings.map((bk) => (
            <div key={bk.id} className="p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#17221B]">
                    {isKn ? bk.equipmentNameKn : bk.equipmentNameEn} · {bk.farmerName}
                  </p>
                  <p className="text-xs text-[#4A5A50] tabular-nums">
                    {bk.requestedDate} · {bk.durationValue} {bk.durationUnit} · {bk.contactPhone} ·{' '}
                    {bk.district}, {bk.state}
                  </p>
                  {bk.notes && <p className="text-xs text-[#748379]">{bk.notes}</p>}
                </div>

                <span className="text-xs font-semibold text-[#8C5A2B]">
                  {t(`agriServices.equipment.bookingStatus.${bk.status}`)}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <input
                  type="text"
                  value={bookingNotes[bk.id] !== undefined ? bookingNotes[bk.id] : bk.adminNote || ''}
                  onChange={(e) =>
                    setBookingNotes((prev) => ({ ...prev, [bk.id]: e.target.value }))
                  }
                  placeholder={t('admin.services.adminNotePlaceholder')}
                  className={`${inputBaseClass} min-h-[38px] py-1.5 text-xs flex-1`}
                />
                <div className="flex items-center gap-2">
                  <select
                    aria-label={t('admin.services.statusSelectLabel')}
                    value={bk.status}
                    disabled={bookingUpdatingId === bk.id}
                    onChange={(e) =>
                      handleUpdateBookingStatus(
                        bk.id,
                        e.target.value as BookingRequestStatus,
                        bk.adminNote,
                      )
                    }
                    className={`${inputBaseClass} min-h-[38px] py-1.5 text-xs w-52`}
                  >
                    <option value="REQUESTED">REQUESTED</option>
                    <option value="REVIEWING">REVIEWING</option>
                    <option value="FORWARDED_TO_PROVIDER">FORWARDED_TO_PROVIDER</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
