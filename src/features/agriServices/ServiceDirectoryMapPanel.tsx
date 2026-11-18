import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ExternalLink, MapPin, Phone, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { FormField, inputBaseClass } from '../../components/FormField';
import { EmptyState, ErrorBanner, LoadingSkeleton } from '../../components/StatePanels';
import { agriServicesService } from '../../services/agriServicesService';
import type { AgriServiceProvider, DirectoryResponse } from '../../types/agriServices';
import type { FarmerProfile } from '../../types/farmer';

interface ServiceDirectoryMapPanelProps {
  profile: FarmerProfile | null;
}

export function ServiceDirectoryMapPanel({ profile }: ServiceDirectoryMapPanelProps) {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [serviceType, setServiceType] = useState('ALL');
  const [stateFilter, setStateFilter] = useState(profile?.state || '');
  const [districtFilter, setDistrictFilter] = useState('');
  const [queryText, setQueryText] = useState('');

  const [data, setData] = useState<DirectoryResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const loadDirectory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await agriServicesService.getDirectory({
        serviceType: serviceType !== 'ALL' ? serviceType : undefined,
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
  }, [serviceType, stateFilter, districtFilter, queryText, t]);

  useEffect(() => {
    loadDirectory();
  }, [loadDirectory]);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [12.9716, 77.5946],
      zoom: 7,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // Sync markers onto Leaflet layer whenever filtered providers or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer || !data) return;

    layer.clearLayers();
    const mappedPoints: L.LatLngExpression[] = [];

    for (const p of data.providers) {
      if (p.latitude === null || p.longitude === null) continue;
      const isVerified =
        p.verificationStatus === 'VERIFIED_DIRECTORY' && p.coordinatesVerified;
      const isSelected = p.id === selectedId;
      const fill = isVerified ? '#1B4332' : '#8C5A2B';
      const ring = isSelected ? 'box-shadow:0 0 0 4px rgba(27,67,50,0.28);' : '';

      const icon = L.divIcon({
        className: 'krishisetu-osm-pin',
        html: `<div style="width:16px;height:16px;border-radius:9999px;background:${fill};border:2px solid #fff;${ring}"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const marker = L.marker([p.latitude, p.longitude], { icon });
      const title = isKn ? p.nameKn : p.nameEn;
      const badge = isVerified
        ? t('agriServices.verification.verifiedDirectory')
        : t('agriServices.verification.demonstrationSample');

      marker.bindPopup(
        `<div style="font-family:sans-serif;max-width:220px;">
          <div style="font-size:11px;font-weight:600;color:${fill};margin-bottom:2px;">${badge}</div>
          <div style="font-size:13px;font-weight:700;color:#17221B;">${title}</div>
          <div style="font-size:12px;color:#4A5A50;margin-top:2px;">${p.district}, ${p.state}</div>
        </div>`,
      );
      marker.on('click', () => setSelectedId(p.id));
      marker.addTo(layer);
      mappedPoints.push([p.latitude, p.longitude]);
    }

    if (mappedPoints.length === 1) {
      map.setView(mappedPoints[0], 12);
    } else if (mappedPoints.length > 1) {
      map.fitBounds(L.latLngBounds(mappedPoints), { padding: [36, 36], maxZoom: 11 });
    }
  }, [data, selectedId, isKn, t]);

  const handleFocusOnMap = (provider: AgriServiceProvider) => {
    setSelectedId(provider.id);
    if (mapInstanceRef.current && provider.latitude !== null && provider.longitude !== null) {
      mapInstanceRef.current.setView([provider.latitude, provider.longitude], 13);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#E5E1D8] bg-white p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E1D8] pb-4">
          <div className="space-y-1">
            <h2 className="font-display text-lg font-semibold text-[#17221B]">
              {t('agriServices.directory.title')}
            </h2>
            <p className="text-xs text-[#4A5A50]">{t('agriServices.directory.subtitle')}</p>
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

        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#EDEAE2] p-1 w-fit">
          {(
            [
              'ALL',
              'COLD_STORAGE',
              'MANDI_APMC',
              'CUSTOM_HIRING_CENTRE',
              'INPUT_SEED_CENTRE',
            ] as const
          ).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setServiceType(type)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                serviceType === type
                  ? 'bg-white text-[#17221B] shadow-xs'
                  : 'text-[#4A5A50] hover:text-[#17221B]'
              }`}
            >
              {t(`agriServices.directory.types.${type}`)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField htmlFor="dir-state" label={t('agriServices.common.stateFilter')}>
            <select
              id="dir-state"
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

          <FormField htmlFor="dir-district" label={t('agriServices.common.districtFilter')}>
            <select
              id="dir-district"
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

          <FormField htmlFor="dir-search" label={t('agriServices.common.searchLabel')}>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#748379]"
                aria-hidden="true"
              />
              <input
                id="dir-search"
                type="search"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder={t('agriServices.directory.searchPlaceholder')}
                className={`${inputBaseClass} pl-9`}
              />
            </div>
          </FormField>
        </div>

        {/* Leaflet + OpenStreetMap Map Canvas */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#4A5A50]">
            <span>{t('agriServices.directory.mapLegend')}</span>
            <span>OpenStreetMap · Leaflet</span>
          </div>
          <div
            ref={mapContainerRef}
            className="h-72 sm:h-80 w-full rounded-xl border border-[#E5E1D8] overflow-hidden bg-[#F2EFE8] z-10"
            aria-label={t('agriServices.directory.title')}
          />
          <p className="text-xs text-[#748379]">{t('agriServices.directory.mapHonestyNote')}</p>
        </div>

        {error && <ErrorBanner message={error} onRetry={loadDirectory} retryLabel={t('common.retry')} />}

        {loading ? (
          <LoadingSkeleton rows={3} />
        ) : !data || data.providers.length === 0 ? (
          <EmptyState
            title={t('agriServices.directory.emptyTitle')}
            description={t('agriServices.directory.emptyDescription')}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setServiceType('ALL');
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
            {data.providers.map((p) => {
              const name = isKn ? p.nameKn : p.nameEn;
              const address = isKn ? p.addressKn : p.addressEn;
              const note = isKn ? p.capacityNoteKn : p.capacityNoteEn;
              const isVerified = p.verificationStatus === 'VERIFIED_DIRECTORY';
              const isSelected = p.id === selectedId;

              return (
                <article
                  key={p.id}
                  className={`py-5 first:pt-1 last:pb-1 space-y-2 transition-colors ${
                    isSelected ? 'bg-[#FAF8F4] -mx-3 px-3 rounded-lg' : ''
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#4A5A50]">
                    <span className={isVerified ? 'font-semibold text-[#1B4332]' : 'font-semibold text-[#8C5A2B]'}>
                      {isVerified
                        ? t('agriServices.verification.verifiedDirectory')
                        : t('agriServices.verification.demonstrationSample')}
                    </span>
                    <span>
                      {t(`agriServices.directory.types.${p.serviceType}`)} · {p.district}, {p.state}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="font-display text-base font-semibold text-[#17221B]">{name}</h3>
                      <p className="text-sm text-[#4A5A50]">{address}</p>
                      {note && <p className="text-xs text-[#748379]">{note}</p>}
                    </div>

                    {p.latitude !== null && p.longitude !== null && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleFocusOnMap(p)}
                      >
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        {t('agriServices.directory.locateOnMap')}
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                    {p.contactPhone ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[#17221B] tabular-nums">
                        <Phone className="h-3.5 w-3.5 text-[#2D6A4F]" aria-hidden="true" />
                        {p.contactPhone}
                      </span>
                    ) : (
                      <span className="text-[#748379]">
                        {t('agriServices.common.contactNotListed')}
                      </span>
                    )}

                    {p.websiteUrl && (
                      <a
                        href={p.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-[#1B4332] hover:underline"
                      >
                        <span>{t('agriServices.common.officialPortal')}</span>
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    )}

                    <span className="text-[#748379]">
                      {t('agriServices.common.sourceLabel')}: {p.sourceReference}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
