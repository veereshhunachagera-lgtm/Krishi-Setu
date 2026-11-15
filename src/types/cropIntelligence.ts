export interface GrowingGuidance {
  landPreparation: string;
  sowingAndSpacing: string;
  irrigationSchedule: string;
  nutrientPractice: string;
}

export interface CommonPest {
  pestNameEn: string;
  pestNameKn: string;
  symptomsEn: string;
  symptomsKn: string;
  managementEn: string;
  managementKn: string;
}

export interface CropKnowledgeItem {
  id: string;
  cropCode: string;
  nameEn: string;
  nameKn: string;
  scientificName: string | null;
  cropCategory: string;
  suitableSoils: string[];
  seasons: string[];
  waterRequirement: 'LOW' | 'MEDIUM' | 'HIGH';
  waterNotesEn: string;
  waterNotesKn: string;
  minPh: number | null;
  maxPh: number | null;
  nitrogenDemand: string | null;
  phosphorusDemand: string | null;
  potassiumDemand: string | null;
  nitrogenFixing: boolean;
  durationMinDays: number;
  durationMaxDays: number;
  tempMinC: number | null;
  tempMaxC: number | null;
  rainfallMinMm: number | null;
  rainfallMaxMm: number | null;
  climateNoteEn: string | null;
  climateNoteKn: string | null;
  supportedStates: string[];
  supportedDistricts: string[];
  advantagesEn: string[];
  advantagesKn: string[];
  risksEn: string[];
  risksKn: string[];
  rotationalBenefitsEn: string | null;
  rotationalBenefitsKn: string | null;
  growingGuidanceEn: GrowingGuidance;
  growingGuidanceKn: GrowingGuidance;
  commonPests: CommonPest[];
  dataReliability: 'CURATED_REFERENCE' | 'SAMPLE_REGIONAL_REFERENCE';
  sourceReference: string | null;
}

export type SuitabilityBand = 'STRONG_FIT' | 'MODERATE_FIT' | 'CONDITIONAL_FIT';

export interface RecommendedCropItem {
  crop: CropKnowledgeItem;
  suitabilityBand: SuitabilityBand;
  matchReasonsEn: string[];
  matchReasonsKn: string[];
  cautionsEn: string[];
  cautionsKn: string[];
  rotationRecommended: boolean;
}

export interface CropRecommendationResponse {
  profileContext: {
    hasSoilReport: boolean;
    state: string | null;
    district: string | null;
    soilType: string | null;
    irrigationSource: string | null;
    growingSeason: string | null;
    currentOrPreviousCrop: string | null;
    landSizeAcres: number | null;
  };
  missingInformationEn: string[];
  missingInformationKn: string[];
  limitationsEn: string[];
  limitationsKn: string[];
  recommendations: RecommendedCropItem[];
}

export interface AlternativeComparisonResponse {
  comparedCrops: RecommendedCropItem[];
  comparisonNotesEn: string[];
  comparisonNotesKn: string[];
  limitationsEn: string[];
  limitationsKn: string[];
}

export interface SoilNutrientStatus {
  parameterKey: 'nitrogen' | 'phosphorus' | 'potassium' | 'ph';
  measuredValue: number | null;
  unknown: boolean;
  unit: string;
  statusBand: 'LOW' | 'MEDIUM' | 'HIGH' | 'ACIDIC' | 'NEUTRAL' | 'ALKALINE' | 'UNKNOWN';
  lowThreshold: number;
  highThreshold: number;
  summaryEn: string;
  summaryKn: string;
}

export interface SoilAnalysisResponse {
  hasSoilReport: boolean;
  soilType: string | null;
  parameters: SoilNutrientStatus[];
  baselinePracticesEn: string[];
  baselinePracticesKn: string[];
  missingInformationEn: string[];
  missingInformationKn: string[];
}

export interface SavedCropPlan {
  id: string;
  primaryCropCode: string;
  primaryCropNameEn: string;
  primaryCropNameKn: string;
  alternativeCropCodes: string[];
  plannedSeason: string | null;
  farmerNotes: string | null;
  createdAt: string;
}

export interface SavedCropPlanPayload {
  primaryCropCode: string;
  alternativeCropCodes: string[];
  plannedSeason?: string | null;
  farmerNotes?: string | null;
}
