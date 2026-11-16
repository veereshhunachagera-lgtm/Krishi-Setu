import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface PestDiseaseAlertRecord {
  id: string;
  alertCode: string;
  titleEn: string;
  titleKn: string;
  cropCode: string;
  cropNameEn: string;
  cropNameKn: string;
  state: string;
  district: string | null;
  verificationStatus: 'CONFIRMED_OUTBREAK' | 'REPORTED_CASE' | 'SEASONAL_RULE_ADVISORY';
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

export interface PlantProtectionGuideRecord {
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

export interface CandidatePrediction {
  label: string;
  confidence: number;
}

export type ScanStatus =
  | 'PREDICTION_READY'
  | 'UNCERTAIN_LOW_CONFIDENCE'
  | 'UNCERTAIN_POOR_QUALITY'
  | 'UNSUPPORTED_CROP'
  | 'MODEL_UNAVAILABLE';

export interface PlantDiseaseScanRecord {
  id: string;
  userId: string;
  cropCode: string | null;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  scanStatus: ScanStatus;
  modelId: string | null;
  predictedLabel: string | null;
  confidence: number | null;
  reasonEn: string | null;
  reasonKn: string | null;
  topCandidates: CandidatePrediction[];
  preventiveGuidanceEn?: string[];
  preventiveGuidanceKn?: string[];
  safetyReminderEn: string;
  safetyReminderKn: string;
  farmerNotes: string | null;
  createdAt: string;
}

export interface ScannerStatusResponse {
  modelConnected: boolean;
  mode: 'MODEL_ACTIVE' | 'MODEL_UNAVAILABLE';
  configuredModelId: string;
  confidenceThreshold: number;
  supportedCrops: string[];
  statusMessageEn: string;
  statusMessageKn: string;
}

export const PLANTVILLAGE_SUPPORTED_CROPS = [
  'apple',
  'bell-pepper',
  'blueberry',
  'cherry',
  'corn',
  'grape',
  'maize',
  'orange',
  'peach',
  'potato',
  'raspberry',
  'soybean',
  'squash',
  'strawberry',
  'tomato',
];

const DEFAULT_MODEL_ID = 'linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification';

const ALERTS_SEED_PATH = path.resolve(
  process.cwd(),
  'backend/src/main/resources/data/plant_health_alerts_seed.json',
);

const GUIDES_SEED_PATH = path.resolve(
  process.cwd(),
  'backend/src/main/resources/data/plant_protection_guidance_seed.json',
);

export function loadSeedAlerts(): PestDiseaseAlertRecord[] {
  if (!fs.existsSync(ALERTS_SEED_PATH)) return [];
  const raw = fs.readFileSync(ALERTS_SEED_PATH, 'utf8');
  const items = JSON.parse(raw) as Array<Omit<PestDiseaseAlertRecord, 'id'>>;
  return items.map((item) => ({
    ...item,
    id: crypto.randomUUID(),
  }));
}

export function loadSeedGuides(): PlantProtectionGuideRecord[] {
  if (!fs.existsSync(GUIDES_SEED_PATH)) return [];
  const raw = fs.readFileSync(GUIDES_SEED_PATH, 'utf8');
  const items = JSON.parse(raw) as Array<Omit<PlantProtectionGuideRecord, 'id'>>;
  return items.map((item) => ({
    ...item,
    id: crypto.randomUUID(),
  }));
}

export function hasValidImageSignature(buf: Buffer): boolean {
  if (!buf || buf.length < 12) return false;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true;
  // WebP: RIFF....WEBP
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return true;
  }
  return false;
}

export function filterActiveAlerts(
  alerts: PestDiseaseAlertRecord[],
  filters: {
    state?: string;
    district?: string;
    cropCode?: string;
    verificationStatus?: string;
  },
): PestDiseaseAlertRecord[] {
  const stateFilter = (filters.state || '').trim().toLowerCase();
  const districtFilter = (filters.district || '').trim().toLowerCase();
  const cropFilter = (filters.cropCode || '').trim().toLowerCase();
  const statusFilter = (filters.verificationStatus || '').trim().toUpperCase();

  return alerts
    .filter((a) => a.active)
    .filter((a) => !stateFilter || a.state.toLowerCase() === stateFilter)
    .filter(
      (a) =>
        !districtFilter ||
        (a.district ? a.district.toLowerCase() === districtFilter : false),
    )
    .filter((a) => !cropFilter || a.cropCode.toLowerCase() === cropFilter)
    .filter((a) => !statusFilter || a.verificationStatus.toUpperCase() === statusFilter)
    .sort((a, b) => b.observedDate.localeCompare(a.observedDate));
}

export function filterProtectionGuides(
  guides: PlantProtectionGuideRecord[],
  filters: {
    q?: string;
    cropCode?: string;
    issueType?: string;
  },
): PlantProtectionGuideRecord[] {
  const q = (filters.q || '').trim().toLowerCase();
  const cropFilter = (filters.cropCode || '').trim().toLowerCase();
  const typeFilter = (filters.issueType || '').trim().toUpperCase();

  return guides
    .filter((g) => !cropFilter || g.cropCode.toLowerCase() === cropFilter)
    .filter((g) => !typeFilter || g.issueType.toUpperCase() === typeFilter)
    .filter((g) => {
      if (!q) return true;
      return (
        g.cropNameEn.toLowerCase().includes(q) ||
        g.cropNameKn.toLowerCase().includes(q) ||
        g.issueNameEn.toLowerCase().includes(q) ||
        g.issueNameKn.toLowerCase().includes(q) ||
        (g.scientificName || '').toLowerCase().includes(q) ||
        g.symptomsEn.some((s) => s.toLowerCase().includes(q)) ||
        g.symptomsKn.some((s) => s.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => a.cropNameEn.localeCompare(b.cropNameEn));
}

function getInferenceBaseUrl(): string {
  return (process.env.PLANT_DISEASE_INFERENCE_URL || '').trim().replace(/\/+$/, '');
}

export async function getScannerStatus(): Promise<ScannerStatusResponse> {
  const baseUrl = getInferenceBaseUrl();
  if (!baseUrl) {
    return {
      modelConnected: false,
      mode: 'MODEL_UNAVAILABLE',
      configuredModelId: DEFAULT_MODEL_ID,
      confidenceThreshold: 0.6,
      supportedCrops: PLANTVILLAGE_SUPPORTED_CROPS,
      statusMessageEn:
        'Automated leaf disease scanning is currently unavailable because no external model service is connected. KrishiSetu does not simulate or fabricate diagnoses.',
      statusMessageKn:
        'ಬಾಹ್ಯ ರೋಗ ಪತ್ತೆ ಮಾದರಿ ಸೇವೆ ಸಂಪರ್ಕದಲ್ಲಿಲ್ಲದ ಕಾರಣ ಸ್ವಯಂಚಾಲಿತ ಸ್ಕ್ಯಾನಿಂಗ್ ಲಭ್ಯವಿಲ್ಲ. ಕೃಷಿಸೇತು ಸುಳ್ಳು ರೋಗ ನಿರ್ಣಯವನ್ನು ತೋರಿಸುವುದಿಲ್ಲ.',
    };
  }

  try {
    const res = await fetch(`${baseUrl}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const body = (await res.json()) as {
      status?: string;
      modelId?: string;
      confidenceThreshold?: number;
      supportedCrops?: string[];
    };
    if (String(body.status || '').toUpperCase() !== 'UP') {
      throw new Error('Model service status is not UP');
    }
    return {
      modelConnected: true,
      mode: 'MODEL_ACTIVE',
      configuredModelId: body.modelId || DEFAULT_MODEL_ID,
      confidenceThreshold:
        typeof body.confidenceThreshold === 'number' ? body.confidenceThreshold : 0.6,
      supportedCrops: Array.isArray(body.supportedCrops)
        ? body.supportedCrops
        : PLANTVILLAGE_SUPPORTED_CROPS,
      statusMessageEn:
        'Disease classification service is connected and ready for supported leaf images.',
      statusMessageKn:
        'ಬೆಂಬಲಿತ ಬೆಳೆಗಳ ಎಲೆ ಚಿತ್ರಗಳಿಗಾಗಿ ರೋಗ ವರ್ಗೀಕರಣ ಸೇವೆ ಸಿದ್ಧವಾಗಿದೆ.',
    };
  } catch {
    return {
      modelConnected: false,
      mode: 'MODEL_UNAVAILABLE',
      configuredModelId: DEFAULT_MODEL_ID,
      confidenceThreshold: 0.6,
      supportedCrops: PLANTVILLAGE_SUPPORTED_CROPS,
      statusMessageEn:
        'Configured plant disease inference service could not be reached. Scanning is paused without fabricated predictions.',
      statusMessageKn:
        'ಕಾನ್ಫಿಗರ್ ಮಾಡಿದ ರೋಗ ಪತ್ತೆ ಸೇವೆಯನ್ನು ತಲುಪಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಸುಳ್ಳು ಫಲಿತಾಂಶಗಳಿಲ್ಲದೆ ಸ್ಕ್ಯಾನಿಂಗ್ ಸ್ಥಗಿತಗೊಂಡಿದೆ.',
    };
  }
}

export function translateScanReasonKn(status: ScanStatus, englishReason: string | null): string | null {
  switch (status) {
    case 'MODEL_UNAVAILABLE':
      return 'ಬಾಹ್ಯ ರೋಗ ವರ್ಗೀಕರಣ ಮಾದರಿ ಸೇವೆ ಸಂಪರ್ಕದಲ್ಲಿಲ್ಲದ ಕಾರಣ ವಿಶ್ಲೇಷಣೆ ನಡೆಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.';
    case 'UNSUPPORTED_CROP':
      return 'ಆಯ್ಕೆಮಾಡಿದ ಬೆಳೆ ಪ್ರಸ್ತುತ ಸಂಪರ್ಕಿತ ಮಾದರಿಯ ತರಬೇತಿ ವ್ಯಾಪ್ತಿಯಲ್ಲಿಲ್ಲ.';
    case 'UNCERTAIN_POOR_QUALITY':
      return 'ಚಿತ್ರವು ಮಸುಕಾಗಿದೆ, ಕಡಿಮೆ ಬೆಳಕಿನಲ್ಲಿದೆ ಅಥವಾ ಕಡಿಮೆ ರೆಸಲ್ಯೂಶನ್ ಹೊಂದಿದೆ. ಸ್ಪಷ್ಟವಾದ ಎಲೆಯ ಹತ್ತಿರದ ಚಿತ್ರವನ್ನು ತೆಗೆಯಿರಿ.';
    case 'UNCERTAIN_LOW_CONFIDENCE':
      return 'ಮಾದರಿಯ ವಿಶ್ವಾಸಾರ್ಹತೆ ನಿಗದಿತ ಮಿತಿಗಿಂತ ಕಡಿಮೆಯಿದೆ. ದೃಢೀಕರಣಕ್ಕಾಗಿ ಕೃಷಿ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ.';
    default:
      return englishReason;
  }
}

export async function invokeDiseaseInference(params: {
  fileBuffer: Buffer;
  originalFileName: string;
  mimeType: string;
  cropCode: string | null;
}): Promise<{
  scanStatus: ScanStatus;
  modelId: string | null;
  predictedLabel: string | null;
  confidence: number | null;
  reasonEn: string | null;
  topCandidates: CandidatePrediction[];
}> {
  const baseUrl = getInferenceBaseUrl();
  if (!baseUrl) {
    return {
      scanStatus: 'MODEL_UNAVAILABLE',
      modelId: null,
      predictedLabel: null,
      confidence: null,
      reasonEn:
        'Crop disease inference service is not connected (PLANT_DISEASE_INFERENCE_URL is unset). Start the Python inference microservice to enable live classification.',
      topCandidates: [],
    };
  }

  try {
    const form = new FormData();
    const blob = new Blob([new Uint8Array(params.fileBuffer)], { type: params.mimeType });
    form.append('image', blob, params.originalFileName || 'leaf.jpg');
    if (params.cropCode) {
      form.append('cropCode', params.cropCode);
    }

    const headers: Record<string, string> = {};
    const apiKey = (process.env.PLANT_DISEASE_INFERENCE_API_KEY || '').trim();
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }

    const res = await fetch(`${baseUrl}/predict`, {
      method: 'POST',
      headers,
      body: form,
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return {
        scanStatus: 'MODEL_UNAVAILABLE',
        modelId: null,
        predictedLabel: null,
        confidence: null,
        reasonEn: `Inference service returned status ${res.status}.`,
        topCandidates: [],
      };
    }

    const payload = (await res.json()) as {
      status?: ScanStatus;
      modelId?: string;
      predictedLabel?: string | null;
      confidence?: number | null;
      reason?: string | null;
      topCandidates?: CandidatePrediction[];
    };

    return {
      scanStatus: payload.status || 'MODEL_UNAVAILABLE',
      modelId: payload.modelId || null,
      predictedLabel: payload.predictedLabel ?? null,
      confidence: typeof payload.confidence === 'number' ? payload.confidence : null,
      reasonEn: payload.reason ?? null,
      topCandidates: Array.isArray(payload.topCandidates) ? payload.topCandidates : [],
    };
  } catch {
    return {
      scanStatus: 'MODEL_UNAVAILABLE',
      modelId: null,
      predictedLabel: null,
      confidence: null,
      reasonEn:
        'Plant disease inference service could not be reached or timed out during image classification.',
      topCandidates: [],
    };
  }
}
