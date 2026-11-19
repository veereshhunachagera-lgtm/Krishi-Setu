import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '../../components/Button';
import { EmptyState, ErrorBanner, LoadingSkeleton } from '../../components/StatePanels';
import { adminService } from '../../services/adminService';
import type { AdminAnalyticsResponse } from '../../types/notification';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function AdminAnalyticsPanel() {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const verifiedGeoCount = analytics?.regional.verifiedGeoProviders.length ?? 0;

  useEffect(() => {
    if (loading || verifiedGeoCount === 0) return;
    const container = mapContainerRef.current;
    if (!container || mapInstanceRef.current) return;

    const map = L.map(container, {
      center: [13.5, 76.5],
      zoom: 6,
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
  }, [loading, verifiedGeoCount]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer || !analytics) return;

    layer.clearLayers();
    const verifiedPoints = analytics.regional.verifiedGeoProviders;
    if (verifiedPoints.length === 0) return;

    const latLngs: L.LatLngExpression[] = [];
    for (const pt of verifiedPoints) {
      const icon = L.divIcon({
        className: 'krishisetu-verified-admin-pin',
        html: `<div style="width:14px;height:14px;border-radius:9999px;background:#1B4332;border:2px solid #ffffff;box-shadow:0 1px 3px rgba(0,0,0,0.35);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const marker = L.marker([pt.latitude, pt.longitude], { icon });
      const title = escapeHtml(isKn ? pt.nameKn : pt.nameEn);
      const badge = escapeHtml(t('agriServices.verification.verifiedDirectory'));
      const districtState = escapeHtml(`${pt.district}, ${pt.state}`);
      const sourceRef = escapeHtml(pt.sourceReference);
      marker.bindPopup(
        `<div style="font-family:sans-serif;max-width:220px;">
          <div style="font-size:11px;font-weight:600;color:#1B4332;">${badge}</div>
          <div style="font-size:13px;font-weight:700;color:#17221B;margin-top:2px;">${title}</div>
          <div style="font-size:12px;color:#4A5A50;margin-top:2px;">${districtState}</div>
          <div style="font-size:11px;color:#748379;margin-top:4px;">${sourceRef}</div>
        </div>`,
      );
      marker.addTo(layer);
      latLngs.push([pt.latitude, pt.longitude]);
    }

    if (latLngs.length === 1) {
      map.setView(latLngs[0], 11);
    } else if (latLngs.length > 1) {
      map.fitBounds(L.latLngBounds(latLngs), { padding: [32, 32], maxZoom: 11 });
    }
  }, [analytics, isKn, t]);

  if (loading) {
    return <LoadingSkeleton rows={5} />;
  }

  if (error) {
    return <ErrorBanner message={error} onRetry={loadAnalytics} retryLabel={t('common.retry')} />;
  }

  if (!analytics) {
    return null;
  }

  const onboardingChartData = [
    {
      label: t('admin.analytics.charts.totalFarmers'),
      count: analytics.farmers.total,
    },
    {
      label: t('admin.analytics.charts.onboarded'),
      count: analytics.farmers.onboarded,
    },
    {
      label: t('admin.analytics.charts.soilReport'),
      count: analytics.farmers.withSoilReport,
    },
    {
      label: t('admin.analytics.charts.fieldOnly'),
      count: analytics.farmers.fieldOnly,
    },
    {
      label: t('admin.analytics.charts.english'),
      count: analytics.farmers.languageBreakdown.en || 0,
    },
    {
      label: t('admin.analytics.charts.kannada'),
      count: analytics.farmers.languageBreakdown.kn || 0,
    },
  ];

  const operationsChartData = [
    {
      label: t('admin.analytics.charts.crops'),
      count: analytics.knowledge.totalCrops,
    },
    {
      label: t('admin.analytics.charts.alerts'),
      count: analytics.plantHealth.totalAlerts,
    },
    {
      label: t('admin.analytics.charts.guides'),
      count: analytics.plantHealth.totalGuides,
    },
    {
      label: t('admin.analytics.charts.providers'),
      count: analytics.services.totalProviders,
    },
    {
      label: t('admin.analytics.charts.equipment'),
      count: analytics.services.totalEquipmentListings,
    },
    {
      label: t('admin.analytics.charts.bookings'),
      count: analytics.services.totalBookings,
    },
  ];

  const districtChartData = analytics.regional.farmersByDistrict.map((d) => ({
    district: d.district,
    count: d.count,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#17221B]">
            {t('admin.analytics.heading')}
          </h2>
          <p className="text-xs text-[#4A5A50] mt-0.5">
            {t('admin.analytics.subtitle')} ·{' '}
            <span className="font-mono tabular-nums">
              {new Date(analytics.generatedAt).toLocaleString()}
            </span>
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={loadAnalytics}>
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          {t('admin.analytics.refreshBtn')}
        </Button>
      </div>

      {/* Real DB KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#E5E1D8] bg-white p-5">
          <p className="text-xs text-[#748379]">{t('admin.analytics.kpis.farmers')}</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#17221B] tabular-nums">
            {analytics.farmers.total}
          </p>
          <p className="mt-1 text-xs text-[#4A5A50] tabular-nums">
            {t('admin.analytics.kpis.activeDetail', {
              active: analytics.farmers.active,
              onboarded: analytics.farmers.onboarded,
            })}
          </p>
        </div>

        <div className="rounded-xl border border-[#E5E1D8] bg-white p-5">
          <p className="text-xs text-[#748379]">{t('admin.analytics.kpis.knowledge')}</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#1B4332] tabular-nums">
            {analytics.knowledge.totalCrops}
          </p>
          <p className="mt-1 text-xs text-[#4A5A50] tabular-nums">
            {t('admin.analytics.kpis.knowledgeDetail', {
              curated: analytics.knowledge.curatedCrops,
              plans: analytics.knowledge.savedCropPlans,
            })}
          </p>
        </div>

        <div className="rounded-xl border border-[#E5E1D8] bg-white p-5">
          <p className="text-xs text-[#748379]">{t('admin.analytics.kpis.plantHealth')}</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#2D6A4F] tabular-nums">
            {analytics.plantHealth.totalAlerts} / {analytics.plantHealth.totalGuides}
          </p>
          <p className="mt-1 text-xs text-[#4A5A50] tabular-nums">
            {t('admin.analytics.kpis.plantHealthDetail', {
              scans: analytics.plantHealth.totalDiseaseScans,
            })}
          </p>
        </div>

        <div className="rounded-xl border border-[#E5E1D8] bg-white p-5">
          <p className="text-xs text-[#748379]">{t('admin.analytics.kpis.marketServices')}</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#8C5A2B] tabular-nums">
            {analytics.market.totalMandiRecords} / {analytics.services.totalBookings}
          </p>
          <p className="mt-1 text-xs text-[#4A5A50] tabular-nums">
            {t('admin.analytics.kpis.marketServicesDetail', {
              providers: analytics.services.totalProviders,
              aiMessages: analytics.aiAssistant.totalMessages,
            })}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-4">
          <div>
            <h3 className="font-display text-base font-semibold text-[#17221B]">
              {t('admin.analytics.farmerChartTitle')}
            </h3>
            <p className="text-xs text-[#4A5A50] mt-0.5">
              {t('admin.analytics.farmerChartSubtitle')}
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={onboardingChartData} margin={{ top: 10, right: 16, left: -12, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E1D8" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#4A5A50', fontSize: 11 }}
                  interval={0}
                  angle={-14}
                  textAnchor="end"
                />
                <YAxis allowDecimals={false} tick={{ fill: '#4A5A50', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    borderColor: '#E5E1D8',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#1B4332" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-4">
          <div>
            <h3 className="font-display text-base font-semibold text-[#17221B]">
              {t('admin.analytics.datasetChartTitle')}
            </h3>
            <p className="text-xs text-[#4A5A50] mt-0.5">
              {t('admin.analytics.datasetChartSubtitle')}
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={operationsChartData} margin={{ top: 10, right: 16, left: -12, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E1D8" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#4A5A50', fontSize: 11 }}
                  interval={0}
                  angle={-14}
                  textAnchor="end"
                />
                <YAxis allowDecimals={false} tick={{ fill: '#4A5A50', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    borderColor: '#E5E1D8',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#2D6A4F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Regional Visualisation — Strictly Verified Geo Data Only */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-4">
          <div>
            <h3 className="font-display text-base font-semibold text-[#17221B]">
              {t('admin.analytics.regionalMapTitle')}
            </h3>
            <p className="text-xs text-[#4A5A50] mt-1">
              {t('admin.analytics.regionalMapSubtitle', {
                verifiedCount: analytics.regional.verifiedGeoProviders.length,
                excludedCount: analytics.regional.unverifiedGeoExcludedCount,
              })}
            </p>
          </div>

          {analytics.regional.verifiedGeoProviders.length === 0 ? (
            <EmptyState
              title={t('admin.analytics.noVerifiedGeoTitle')}
              description={t('admin.analytics.noVerifiedGeoDesc')}
            />
          ) : (
            <>
              <div
                ref={mapContainerRef}
                className="h-64 w-full rounded-lg border border-[#E5E1D8] overflow-hidden z-0"
                aria-label={t('admin.analytics.regionalMapTitle')}
              />
              <div className="text-xs text-[#4A5A50] space-y-1">
                {analytics.regional.verifiedGeoProviders.map((pt) => (
                  <p key={pt.id} className="truncate">
                    <span className="font-medium text-[#17221B]">
                      {isKn ? pt.nameKn : pt.nameEn}
                    </span>{' '}
                    · {pt.district}, {pt.state} ·{' '}
                    <span className="font-mono text-[#748379]">
                      {pt.latitude.toFixed(4)}, {pt.longitude.toFixed(4)}
                    </span>
                  </p>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="rounded-xl border border-[#E5E1D8] bg-white p-5 space-y-4">
          <div>
            <h3 className="font-display text-base font-semibold text-[#17221B]">
              {t('admin.analytics.districtCoverageTitle')}
            </h3>
            <p className="text-xs text-[#4A5A50] mt-1">
              {t('admin.analytics.districtCoverageSubtitle')}
            </p>
          </div>

          {districtChartData.length === 0 ? (
            <EmptyState
              title={t('admin.analytics.noDistrictTitle')}
              description={t('admin.analytics.noDistrictDesc')}
            />
          ) : (
            <div className="space-y-4">
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={districtChartData}
                    margin={{ top: 8, right: 16, left: -12, bottom: 16 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E1D8" vertical={false} />
                    <XAxis dataKey="district" tick={{ fill: '#4A5A50', fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#4A5A50', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        borderColor: '#E5E1D8',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" fill="#8C5A2B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E5E1D8] text-xs">
                <div>
                  <p className="font-semibold text-[#17221B] mb-1">
                    {t('admin.analytics.alertVerificationTitle')}
                  </p>
                  <p className="text-[#4A5A50] tabular-nums">
                    {t('plantHealth.alerts.statuses.CONFIRMED_OUTBREAK')}:{' '}
                    {analytics.plantHealth.alertsByVerification.CONFIRMED_OUTBREAK || 0}
                  </p>
                  <p className="text-[#4A5A50] tabular-nums">
                    {t('plantHealth.alerts.statuses.REPORTED_CASE')}:{' '}
                    {analytics.plantHealth.alertsByVerification.REPORTED_CASE || 0}
                  </p>
                  <p className="text-[#4A5A50] tabular-nums">
                    {t('plantHealth.alerts.statuses.SEASONAL_RULE_ADVISORY')}:{' '}
                    {analytics.plantHealth.alertsByVerification.SEASONAL_RULE_ADVISORY || 0}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-[#17221B] mb-1">
                    {t('admin.analytics.bookingBreakdownTitle')}
                  </p>
                  <p className="text-[#4A5A50] tabular-nums">
                    {t('agriServices.equipment.bookingStatus.REQUESTED')}:{' '}
                    {analytics.services.bookingsByStatus.REQUESTED || 0}
                  </p>
                  <p className="text-[#4A5A50] tabular-nums">
                    {t('agriServices.equipment.bookingStatus.FORWARDED_TO_PROVIDER')}:{' '}
                    {analytics.services.bookingsByStatus.FORWARDED_TO_PROVIDER || 0}
                  </p>
                  <p className="text-[#4A5A50] tabular-nums">
                    {t('agriServices.equipment.bookingStatus.COMPLETED')}:{' '}
                    {analytics.services.bookingsByStatus.COMPLETED || 0}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
