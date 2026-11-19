import { getAiAssistantStatus, type AiChatMessageRecord } from './aiAssistantEngine.ts';
import type { CropKnowledgeRecord, SavedCropPlanRecord } from './cropEngine.ts';
import type { MandiPriceRecord } from './marketWeatherEngine.ts';
import {
  getScannerStatus,
  type PestDiseaseAlertRecord,
  type PlantDiseaseScanRecord,
  type PlantProtectionGuideRecord,
} from './plantHealthEngine.ts';
import type {
  AgriServiceProviderRecord,
  EquipmentBookingRecord,
  EquipmentListingRecord,
} from './agriServicesEngine.ts';

export interface MinimalUser {
  id: string;
  fullName: string;
  email: string;
  role: 'FARMER' | 'ADMIN';
  preferredLanguage: 'en' | 'kn';
  onboardingCompleted: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MinimalProfile {
  userId: string;
  hasSoilReport: boolean;
  farmerName: string;
  state: string | null;
  district: string | null;
  landSize: number | null;
  landUnit: string | null;
  soilType: string | null;
  irrigationSource: string | null;
  growingSeason: string | null;
}

export interface AnalyticsDbSnapshot {
  users: MinimalUser[];
  profiles: MinimalProfile[];
  crops: CropKnowledgeRecord[];
  savedCropPlans: SavedCropPlanRecord[];
  pestAlerts: PestDiseaseAlertRecord[];
  protectionGuides: PlantProtectionGuideRecord[];
  diseaseScans: PlantDiseaseScanRecord[];
  mandiPriceRecords: MandiPriceRecord[];
  serviceProviders: AgriServiceProviderRecord[];
  equipmentListings: EquipmentListingRecord[];
  equipmentBookings: EquipmentBookingRecord[];
  aiChatMessages: AiChatMessageRecord[];
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@', 2);
  const prefix = local.length <= 2 ? local.slice(0, 1) : local.slice(0, 2);
  return `${prefix}***@${domain}`;
}

export function sanitizePlainText(input: unknown, maxLength = 300): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u001F\u007F<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

function toBuckets(counts: Map<string, number>) {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ key, count }));
}

export function computeAdminAnalytics(db: AnalyticsDbSnapshot) {
  const farmers = db.users.filter((u) => u.role === 'FARMER');
  const activeCount = farmers.filter((u) => u.active !== false).length;
  const onboardedCount = farmers.filter((u) => u.onboardingCompleted).length;
  const withSoilReport = db.profiles.filter((p) => p.hasSoilReport).length;
  const fieldOnly = db.profiles.length - withSoilReport;

  const languageBreakdown: Record<string, number> = { en: 0, kn: 0 };
  for (const f of farmers) {
    languageBreakdown[f.preferredLanguage] = (languageBreakdown[f.preferredLanguage] || 0) + 1;
  }

  const soilTypeMap = new Map<string, number>();
  const irrigationMap = new Map<string, number>();
  const districtMap = new Map<string, { district: string; state: string; count: number }>();

  for (const p of db.profiles) {
    if (p.soilType && p.soilType.trim()) {
      const k = p.soilType.trim().toUpperCase();
      soilTypeMap.set(k, (soilTypeMap.get(k) || 0) + 1);
    }
    if (p.irrigationSource && p.irrigationSource.trim()) {
      const k = p.irrigationSource.trim().toUpperCase();
      irrigationMap.set(k, (irrigationMap.get(k) || 0) + 1);
    }
    if (p.district && p.district.trim()) {
      const d = p.district.trim();
      const s = (p.state || '').trim();
      const key = `${d.toLowerCase()}|${s.toLowerCase()}`;
      const existing = districtMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        districtMap.set(key, { district: d, state: s, count: 1 });
      }
    }
  }

  const curatedCrops = db.crops.filter((c) => c.dataReliability === 'CURATED_REFERENCE').length;
  const waterMap = new Map<string, number>();
  const catMap = new Map<string, number>();
  for (const c of db.crops) {
    waterMap.set(c.waterRequirement, (waterMap.get(c.waterRequirement) || 0) + 1);
    catMap.set(c.cropCategory, (catMap.get(c.cropCategory) || 0) + 1);
  }

  const alertsByVerification: Record<string, number> = {
    CONFIRMED_OUTBREAK: 0,
    REPORTED_CASE: 0,
    SEASONAL_RULE_ADVISORY: 0,
  };
  let activeAlerts = 0;
  for (const a of db.pestAlerts) {
    if (a.active) activeAlerts += 1;
    alertsByVerification[a.verificationStatus] =
      (alertsByVerification[a.verificationStatus] || 0) + 1;
  }

  const distinctCommodities = new Set(
    db.mandiPriceRecords.map((m) => m.commodity.trim().toLowerCase()),
  ).size;
  const sortedMandi = [...db.mandiPriceRecords].sort((a, b) =>
    b.arrivalDate.localeCompare(a.arrivalDate),
  );
  const latestArrivalDate = sortedMandi.length > 0 ? sortedMandi[0].arrivalDate : null;

  const verifiedDirectoryProviders = db.serviceProviders.filter(
    (p) => p.verificationStatus === 'VERIFIED_DIRECTORY',
  ).length;
  const bookingsByStatus: Record<string, number> = {
    REQUESTED: 0,
    REVIEWING: 0,
    FORWARDED_TO_PROVIDER: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };
  for (const b of db.equipmentBookings) {
    bookingsByStatus[b.status] = (bookingsByStatus[b.status] || 0) + 1;
  }

  const uniqueFarmerUsers = new Set(db.aiChatMessages.map((m) => m.userId)).size;

  const verifiedGeoProviders: Array<{
    id: string;
    nameEn: string;
    nameKn: string;
    serviceType: string;
    state: string;
    district: string;
    latitude: number;
    longitude: number;
    sourceReference: string;
  }> = [];
  let totalGeoProvidersWithCoords = 0;
  let unverifiedGeoExcludedCount = 0;

  for (const p of db.serviceProviders) {
    if (!p.active) continue;
    const hasCoords = p.latitude !== null && p.longitude !== null;
    if (hasCoords) {
      totalGeoProvidersWithCoords += 1;
      if (p.verificationStatus === 'VERIFIED_DIRECTORY' && p.coordinatesVerified) {
        verifiedGeoProviders.push({
          id: p.id,
          nameEn: p.nameEn,
          nameKn: p.nameKn,
          serviceType: p.serviceType,
          state: p.state,
          district: p.district,
          latitude: p.latitude!,
          longitude: p.longitude!,
          sourceReference: p.sourceReference,
        });
      } else {
        unverifiedGeoExcludedCount += 1;
      }
    } else {
      unverifiedGeoExcludedCount += 1;
    }
  }

  const farmersByDistrict = Array.from(districtMap.values()).sort((a, b) => b.count - a.count);

  return {
    generatedAt: new Date().toISOString(),
    farmers: {
      total: farmers.length,
      active: activeCount,
      disabled: farmers.length - activeCount,
      onboarded: onboardedCount,
      pendingOnboarding: farmers.length - onboardedCount,
      withSoilReport,
      fieldOnly,
      languageBreakdown,
      soilTypes: toBuckets(soilTypeMap),
      irrigationSources: toBuckets(irrigationMap),
    },
    knowledge: {
      totalCrops: db.crops.length,
      curatedCrops,
      sampleCrops: db.crops.length - curatedCrops,
      cropWaterBreakdown: toBuckets(waterMap),
      cropCategoryBreakdown: toBuckets(catMap),
      savedCropPlans: db.savedCropPlans.length,
    },
    plantHealth: {
      totalAlerts: db.pestAlerts.length,
      activeAlerts,
      alertsByVerification,
      totalGuides: db.protectionGuides.length,
      totalDiseaseScans: db.diseaseScans.length,
    },
    market: {
      totalMandiRecords: db.mandiPriceRecords.length,
      distinctCommodities,
      latestArrivalDate,
    },
    services: {
      totalProviders: db.serviceProviders.length,
      verifiedDirectoryProviders,
      demonstrationSampleProviders: db.serviceProviders.length - verifiedDirectoryProviders,
      totalEquipmentListings: db.equipmentListings.length,
      totalBookings: db.equipmentBookings.length,
      bookingsByStatus,
    },
    aiAssistant: {
      totalMessages: db.aiChatMessages.length,
      uniqueFarmerUsers,
    },
    regional: {
      farmersByDistrict,
      verifiedGeoProviders,
      totalGeoProvidersWithCoords,
      unverifiedGeoExcludedCount,
    },
  };
}

export function getIntegrationsOverview(db: AnalyticsDbSnapshot) {
  const dataGovConfigured = Boolean((process.env.DATA_GOV_IN_API_KEY || '').trim());
  const dataGovResourceId =
    (process.env.DATA_GOV_IN_MANDI_RESOURCE_ID || '').trim() ||
    '9ef84268-d588-465a-a308-a864a43d0070';
  const scannerUrl = (process.env.PLANT_DISEASE_INFERENCE_URL || '').trim();
  const aiStatus = getAiAssistantStatus();

  const sortedMandi = [...db.mandiPriceRecords].sort((a, b) =>
    b.fetchedAt.localeCompare(a.fetchedAt),
  );
  const sortedScans = [...db.diseaseScans].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const sortedAi = [...db.aiChatMessages].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  return {
    checkedAt: new Date().toISOString(),
    integrations: [
      {
        id: 'data_gov_in',
        name: 'data.gov.in Agmarknet Mandi API',
        configured: dataGovConfigured,
        endpointOrModel: dataGovResourceId,
        storedRecordsCount: db.mandiPriceRecords.length,
        lastRecordTimestamp: sortedMandi.length > 0 ? sortedMandi[0].fetchedAt : null,
        notesEn: dataGovConfigured
          ? 'DATA_GOV_IN_API_KEY is configured server-side. Live daily arrivals can be synced on demand.'
          : 'DATA_GOV_IN_API_KEY is not configured in backend environment variables.',
        notesKn: dataGovConfigured
          ? 'ಸರ್ವರ್‌ನಲ್ಲಿ DATA_GOV_IN_API_KEY ಹೊಂದಿಸಲಾಗಿದೆ. ನೇರ ದೈನಂದಿನ ಮಂಡಿ ದರಗಳನ್ನು ಸಿಂಕ್ ಮಾಡಬಹುದು.'
          : 'ಬ್ಯಾಕ್‌ಎಂಡ್ ಪರಿಸರದಲ್ಲಿ DATA_GOV_IN_API_KEY ಹೊಂದಿಸಲಾಗಿಲ್ಲ.',
      },
      {
        id: 'open_meteo',
        name: 'Open-Meteo Forecast & Geocoding',
        configured: true,
        endpointOrModel:
          (process.env.OPEN_METEO_FORECAST_URL || '').trim() ||
          'https://api.open-meteo.com/v1/forecast',
        storedRecordsCount: 0,
        lastRecordTimestamp: null,
        notesEn:
          'Public Open-Meteo endpoints configured (no API key required for non-commercial tier, CC BY 4.0 attribution).',
        notesKn:
          'Open-Meteo ಸಾರ್ವಜನಿಕ ಹವಾಮಾನ ಮತ್ತು ಸ್ಥಳ ಹುಡುಕಾಟ ಎಂಡ್‌ಪಾಯಿಂಟ್‌ಗಳು ಸಕ್ರಿಯವಾಗಿವೆ.',
      },
      {
        id: 'plant_disease_model',
        name: 'Crop Leaf Disease Inference Service',
        configured: Boolean(scannerUrl),
        endpointOrModel: scannerUrl ? 'Configured external FastAPI inference endpoint' : 'Unconfigured',
        storedRecordsCount: db.diseaseScans.length,
        lastRecordTimestamp: sortedScans.length > 0 ? sortedScans[0].createdAt : null,
        notesEn: scannerUrl
          ? 'Inference service URL is set; leaf uploads are forwarded server-side.'
          : 'PLANT_DISEASE_INFERENCE_URL is not configured. Scanner shows an honest unavailable state.',
        notesKn: scannerUrl
          ? 'ರೋಗ ವರ್ಗೀಕರಣ ಸೇವೆಯ URL ಹೊಂದಿಸಲಾಗಿದೆ.'
          : 'PLANT_DISEASE_INFERENCE_URL ಹೊಂದಿಸಲಾಗಿಲ್ಲ. ಸ್ಕ್ಯಾನರ್ ಲಭ್ಯವಿಲ್ಲದ ಸ್ಥಿತಿಯನ್ನು ತೋರಿಸುತ್ತದೆ.',
      },
      {
        id: 'gemini_ai',
        name: 'Google Gemini AI Farmer Assistant',
        configured: aiStatus.configured,
        endpointOrModel: aiStatus.model,
        storedRecordsCount: db.aiChatMessages.length,
        lastRecordTimestamp: sortedAi.length > 0 ? sortedAi[0].createdAt : null,
        notesEn: aiStatus.configured
          ? 'GEMINI_API_KEY is set server-side for bilingual English & Kannada grounded farming answers.'
          : 'GEMINI_API_KEY is not configured in backend environment variables.',
        notesKn: aiStatus.configured
          ? 'ಸರ್ವರ್‌ನಲ್ಲಿ GEMINI_API_KEY ಹೊಂದಿಸಲಾಗಿದೆ (ಇಂಗ್ಲಿಷ್ ಮತ್ತು ಕನ್ನಡ ಸಹಾಯಕ).'
          : 'ಬ್ಯಾಕ್‌ಎಂಡ್ ಪರಿಸರದಲ್ಲಿ GEMINI_API_KEY ಹೊಂದಿಸಲಾಗಿಲ್ಲ.',
      },
    ],
  };
}

export async function probeIntegrationsLive() {
  const results: Array<{
    id: string;
    status: 'REACHABLE' | 'UNREACHABLE' | 'UNCONFIGURED' | 'CONFIGURED';
    latencyMs: number | null;
    detailEn: string;
    detailKn: string;
  }> = [];

  // 1. Open-Meteo geocoding live probe
  const startMeteo = Date.now();
  try {
    const geocodingBase =
      (process.env.OPEN_METEO_GEOCODING_URL || '').trim() ||
      'https://geocoding-api.open-meteo.com/v1/search';
    const url = new URL(geocodingBase);
    url.searchParams.set('name', 'Bengaluru');
    url.searchParams.set('count', '1');
    url.searchParams.set('format', 'json');
    const resp = await fetch(url.toString(), { signal: AbortSignal.timeout(6000) });
    const latency = Date.now() - startMeteo;
    if (!resp.ok) {
      results.push({
        id: 'open_meteo',
        status: 'UNREACHABLE',
        latencyMs: latency,
        detailEn: `Open-Meteo returned HTTP ${resp.status}.`,
        detailKn: `Open-Meteo HTTP ${resp.status} ದೋಷ ನೀಡಿದೆ.`,
      });
    } else {
      const json = (await resp.json()) as { results?: unknown[] };
      const count = Array.isArray(json.results) ? json.results.length : 0;
      results.push({
        id: 'open_meteo',
        status: 'REACHABLE',
        latencyMs: latency,
        detailEn: `Open-Meteo geocoding reachable (${count} match verified).`,
        detailKn: `Open-Meteo ಸ್ಥಳ ಸೇವೆ ಸಂಪರ್ಕದಲ್ಲಿದೆ (${count} ಫಲಿತಾಂಶ ದೃಢಪಟ್ಟಿದೆ).`,
      });
    }
  } catch (err) {
    results.push({
      id: 'open_meteo',
      status: 'UNREACHABLE',
      latencyMs: Date.now() - startMeteo,
      detailEn: err instanceof Error ? err.message : 'Open-Meteo request failed.',
      detailKn: 'Open-Meteo ಸಂಪರ್ಕ ವಿಫಲವಾಗಿದೆ.',
    });
  }

  // 2. data.gov.in live probe (only if key exists)
  const dataGovKey = (process.env.DATA_GOV_IN_API_KEY || '').trim();
  if (!dataGovKey) {
    results.push({
      id: 'data_gov_in',
      status: 'UNCONFIGURED',
      latencyMs: null,
      detailEn: 'DATA_GOV_IN_API_KEY is not set in backend environment.',
      detailKn: 'ಬ್ಯಾಕ್‌ಎಂಡ್ ಪರಿಸರದಲ್ಲಿ DATA_GOV_IN_API_KEY ಹೊಂದಿಸಲಾಗಿಲ್ಲ.',
    });
  } else {
    const startGov = Date.now();
    try {
      const resourceId =
        (process.env.DATA_GOV_IN_MANDI_RESOURCE_ID || '').trim() ||
        '9ef84268-d588-465a-a308-a864a43d0070';
      const url = new URL(`https://api.data.gov.in/resource/${resourceId}`);
      url.searchParams.set('api-key', dataGovKey);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '1');
      const resp = await fetch(url.toString(), { signal: AbortSignal.timeout(7000) });
      const latency = Date.now() - startGov;
      if (!resp.ok) {
        results.push({
          id: 'data_gov_in',
          status: 'UNREACHABLE',
          latencyMs: latency,
          detailEn: `data.gov.in responded with HTTP ${resp.status}.`,
          detailKn: `data.gov.in HTTP ${resp.status} ಸ್ಥಿತಿ ನೀಡಿದೆ.`,
        });
      } else {
        const json = (await resp.json()) as { total?: number };
        results.push({
          id: 'data_gov_in',
          status: 'REACHABLE',
          latencyMs: latency,
          detailEn: `data.gov.in API reachable (total reported: ${json.total ?? 'unknown'}).`,
          detailKn: `data.gov.in API ಸಂಪರ್ಕದಲ್ಲಿದೆ (ಒಟ್ಟು ದಾಖಲೆಗಳು: ${json.total ?? 'ತಿಳಿದಿಲ್ಲ'}).`,
        });
      }
    } catch (err) {
      results.push({
        id: 'data_gov_in',
        status: 'UNREACHABLE',
        latencyMs: Date.now() - startGov,
        detailEn: err instanceof Error ? err.message : 'data.gov.in probe failed.',
        detailKn: 'data.gov.in ಸಂಪರ್ಕ ವಿಫಲವಾಗಿದೆ.',
      });
    }
  }

  // 3. Plant Disease Scanner probe
  const scannerUrl = (process.env.PLANT_DISEASE_INFERENCE_URL || '').trim();
  if (!scannerUrl) {
    results.push({
      id: 'plant_disease_model',
      status: 'UNCONFIGURED',
      latencyMs: null,
      detailEn: 'PLANT_DISEASE_INFERENCE_URL is not configured.',
      detailKn: 'PLANT_DISEASE_INFERENCE_URL ಹೊಂದಿಸಲಾಗಿಲ್ಲ.',
    });
  } else {
    const startScan = Date.now();
    const health = await getScannerStatus();
    results.push({
      id: 'plant_disease_model',
      status: health.modelConnected ? 'REACHABLE' : 'UNREACHABLE',
      latencyMs: Date.now() - startScan,
      detailEn: health.modelConnected
        ? `Connected model: ${health.configuredModelId}`
        : health.statusMessageEn,
      detailKn: health.modelConnected
        ? `ಸಂಪರ್ಕಿತ ಮಾದರಿ: ${health.configuredModelId}`
        : health.statusMessageKn,
    });
  }

  // 4. Gemini AI status
  const aiStatus = getAiAssistantStatus();
  results.push({
    id: 'gemini_ai',
    status: aiStatus.configured ? 'CONFIGURED' : 'UNCONFIGURED',
    latencyMs: null,
    detailEn: aiStatus.configured
      ? `Server-side GEMINI_API_KEY configured for ${aiStatus.model} (live quota checked when farmers chat).`
      : 'GEMINI_API_KEY is not configured in backend environment.',
    detailKn: aiStatus.configured
      ? `${aiStatus.model} ಮಾದರಿಗೆ ಸರ್ವರ್‌ನಲ್ಲಿ GEMINI_API_KEY ಸಕ್ರಿಯವಾಗಿದೆ.`
      : 'ಬ್ಯಾಕ್‌ಎಂಡ್ ಪರಿಸರದಲ್ಲಿ GEMINI_API_KEY ಹೊಂದಿಸಲಾಗಿಲ್ಲ.',
  });

  return {
    probedAt: new Date().toISOString(),
    results,
  };
}
