export type AlertVerificationStatus =
  | 'CONFIRMED_OUTBREAK'
  | 'REPORTED_CASE'
  | 'SEASONAL_RULE_ADVISORY';

export interface PestDiseaseAlertItem {
  id: string;
  alertCode: string;
  titleEn: string;
  titleKn: string;
  cropCode: string;
  cropNameEn: string;
  cropNameKn: string;
  state: string;
  district: string | null;
  verificationStatus: AlertVerificationStatus;
  severity: 'LOW' | 'MODERATE' | 'HIGH';
  observedDate: string;
  validUntil: string | null;
  sourceName: string;
  sourceUrl: string | null;
  summaryEn: string;
  summaryKn: string;
  precautionsEn: string[];
  precautionsKn: string[];
  active: boolean;
}

export interface PestDiseaseAlertCreatePayload {
  alertCode: string;
  titleEn: string;
  titleKn: string;
  cropCode: string;
  cropNameEn: string;
  cropNameKn: string;
  state: string;
  district?: string | null;
  verificationStatus: AlertVerificationStatus;
  severity: 'LOW' | 'MODERATE' | 'HIGH';
  observedDate: string;
  validUntil?: string | null;
  sourceName: string;
  sourceUrl?: string | null;
  summaryEn: string;
  summaryKn: string;
  precautionsEn?: string[];
  precautionsKn?: string[];
}

export interface PlantProtectionGuideItem {
  id: string;
  guideCode: string;
  cropCode: string;
  cropNameEn: string;
  cropNameKn: string;
  issueNameEn: string;
  issueNameKn: string;
  issueType: string;
  scientificName: string | null;
  favorableConditionsEn: string;
  favorableConditionsKn: string;
  symptomsEn: string[];
  symptomsKn: string[];
  preventivePracticesEn: string[];
  preventivePracticesKn: string[];
  responsibleManagementEn: string[];
  responsibleManagementKn: string[];
  safetyNotesEn: string;
  safetyNotesKn: string;
  dataReliability: 'CURATED_REFERENCE' | 'SAMPLE_REGIONAL_REFERENCE';
  sourceReference: string;
}

export interface PlantProtectionGuideUpsertPayload {
  guideCode: string;
  cropCode: string;
  cropNameEn?: string;
  cropNameKn?: string;
  issueNameEn: string;
  issueNameKn: string;
  issueType: 'FUNGAL_DISEASE' | 'BACTERIAL_DISEASE' | 'INSECT_PEST';
  scientificName?: string;
  favorableConditionsEn?: string;
  favorableConditionsKn?: string;
  symptomsEn?: string[];
  symptomsKn?: string[];
  preventivePracticesEn?: string[];
  preventivePracticesKn?: string[];
  responsibleManagementEn?: string[];
  responsibleManagementKn?: string[];
  safetyNotesEn?: string;
  safetyNotesKn?: string;
  dataReliability?: 'CURATED_REFERENCE' | 'SAMPLE_REGIONAL_REFERENCE';
  sourceReference?: string;
}

export interface ScannerStatusInfo {
  modelConnected: boolean;
  mode: 'MODEL_ACTIVE' | 'MODEL_UNAVAILABLE';
  configuredModelId: string;
  confidenceThreshold: number;
  supportedCrops: string[];
  statusMessageEn: string;
  statusMessageKn: string;
}

export type ScanStatus =
  | 'PREDICTION_READY'
  | 'UNCERTAIN_LOW_CONFIDENCE'
  | 'UNCERTAIN_POOR_QUALITY'
  | 'UNSUPPORTED_CROP'
  | 'MODEL_UNAVAILABLE';

export interface PlantDiseaseScanItem {
  id: string;
  scanStatus: ScanStatus;
  cropCode: string | null;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  modelId: string | null;
  predictedLabel: string | null;
  confidence: number | null;
  reasonEn: string | null;
  reasonKn: string | null;
  topCandidates: Array<{ label: string; confidence: number }>;
  preventiveGuidanceEn?: string[];
  preventiveGuidanceKn?: string[];
  safetyReminderEn: string;
  safetyReminderKn: string;
  farmerNotes?: string | null;
  createdAt: string;
}
