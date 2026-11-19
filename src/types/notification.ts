import type { FarmerProfile } from './farmer';

export interface NotificationItem {
  id: string;
  titleKey: string;
  messageKey: string;
  category: string;
  read: boolean;
  createdAt: string;
}

export interface AdminOverview {
  totalFarmers: number;
  onboardedFarmers: number;
  withSoilReportCount: number;
  withoutSoilReportCount: number;
  languageBreakdown: Record<string, number>;
  farmers: FarmerProfile[];
}

export interface AdminFarmerAccount {
  id: string;
  fullName: string;
  maskedEmail: string;
  preferredLanguage: 'en' | 'kn';
  onboardingCompleted: boolean;
  active: boolean;
  hasSoilReport: boolean | null;
  state: string | null;
  district: string | null;
  landSize: number | null;
  landUnit: string | null;
  growingSeason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CountBucket {
  key: string;
  count: number;
}

export interface DistrictFarmerCount {
  district: string;
  state: string;
  count: number;
}

export interface VerifiedGeoProviderPoint {
  id: string;
  nameEn: string;
  nameKn: string;
  serviceType: string;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  sourceReference: string;
}

export interface AdminAnalyticsResponse {
  generatedAt: string;
  farmers: {
    total: number;
    active: number;
    disabled: number;
    onboarded: number;
    pendingOnboarding: number;
    withSoilReport: number;
    fieldOnly: number;
    languageBreakdown: Record<string, number>;
    soilTypes: CountBucket[];
    irrigationSources: CountBucket[];
  };
  knowledge: {
    totalCrops: number;
    curatedCrops: number;
    sampleCrops: number;
    cropWaterBreakdown: CountBucket[];
    cropCategoryBreakdown: CountBucket[];
    savedCropPlans: number;
  };
  plantHealth: {
    totalAlerts: number;
    activeAlerts: number;
    alertsByVerification: Record<string, number>;
    totalGuides: number;
    totalDiseaseScans: number;
  };
  market: {
    totalMandiRecords: number;
    distinctCommodities: number;
    latestArrivalDate: string | null;
  };
  services: {
    totalProviders: number;
    verifiedDirectoryProviders: number;
    demonstrationSampleProviders: number;
    totalEquipmentListings: number;
    totalBookings: number;
    bookingsByStatus: Record<string, number>;
  };
  aiAssistant: {
    totalMessages: number;
    uniqueFarmerUsers: number;
  };
  regional: {
    farmersByDistrict: DistrictFarmerCount[];
    verifiedGeoProviders: VerifiedGeoProviderPoint[];
    totalGeoProvidersWithCoords: number;
    unverifiedGeoExcludedCount: number;
  };
}

export interface IntegrationStatusItem {
  id: string;
  name: string;
  configured: boolean;
  endpointOrModel: string;
  storedRecordsCount: number;
  lastRecordTimestamp: string | null;
  notesEn: string;
  notesKn: string;
}

export interface IntegrationsOverviewResponse {
  checkedAt: string;
  integrations: IntegrationStatusItem[];
}

export interface IntegrationProbeItem {
  id: string;
  status: 'REACHABLE' | 'UNREACHABLE' | 'UNCONFIGURED' | 'CONFIGURED';
  latencyMs: number | null;
  detailEn: string;
  detailKn: string;
}

export interface IntegrationsProbeResponse {
  probedAt: string;
  results: IntegrationProbeItem[];
}
