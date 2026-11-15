import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface GrowingGuidanceRecord {
  landPreparation: string;
  sowingAndSpacing: string;
  irrigationSchedule: string;
  nutrientPractice: string;
}

export interface CommonPestRecord {
  pestNameEn: string;
  pestNameKn: string;
  symptomsEn: string;
  symptomsKn: string;
  managementEn: string;
  managementKn: string;
}

export interface CropKnowledgeRecord {
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
  growingGuidanceEn: GrowingGuidanceRecord;
  growingGuidanceKn: GrowingGuidanceRecord;
  commonPests: CommonPestRecord[];
  dataReliability: 'CURATED_REFERENCE' | 'SAMPLE_REGIONAL_REFERENCE';
  sourceReference: string | null;
}

export interface SavedCropPlanRecord {
  id: string;
  userId: string;
  primaryCropCode: string;
  alternativeCropCodes: string[];
  plannedSeason: string | null;
  farmerNotes: string | null;
  createdAt: string;
}

export interface FarmerProfileInput {
  hasSoilReport: boolean;
  state: string | null;
  district: string | null;
  landSize: number | null;
  landUnit: string | null;
  soilType: string | null;
  irrigationSource: string | null;
  currentOrPreviousCrop: string | null;
  growingSeason: string | null;
  soilReport: {
    nitrogenKgPerHa: number | null;
    phosphorusKgPerHa: number | null;
    potassiumKgPerHa: number | null;
    phLevel: number | null;
    nitrogenUnknown: boolean;
    phosphorusUnknown: boolean;
    potassiumUnknown: boolean;
    phUnknown: boolean;
  } | null;
}

const SEED_PATH = path.resolve(
  process.cwd(),
  'backend/src/main/resources/data/crop_soil_knowledge_seed.json',
);

export function loadSeedCrops(): CropKnowledgeRecord[] {
  const raw = fs.readFileSync(SEED_PATH, 'utf8');
  const parsed = JSON.parse(raw) as Array<Omit<CropKnowledgeRecord, 'id'>>;
  return parsed.map((item) => ({
    ...item,
    id: crypto.randomUUID(),
    cropCode: item.cropCode.trim().toLowerCase(),
    cropCategory: item.cropCategory.trim().toUpperCase(),
    waterRequirement: item.waterRequirement.trim().toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH',
  }));
}

export function filterKnowledgeBank(
  crops: CropKnowledgeRecord[],
  filters: {
    q?: string;
    season?: string;
    soilType?: string;
    waterRequirement?: string;
    category?: string;
  },
): CropKnowledgeRecord[] {
  const q = (filters.q || '').trim().toLowerCase();
  const season = (filters.season || '').trim();
  const soilType = (filters.soilType || '').trim();
  const waterRequirement = (filters.waterRequirement || '').trim();
  const category = (filters.category || '').trim();

  return [...crops]
    .sort((a, b) => a.nameEn.localeCompare(b.nameEn))
    .filter((c) => {
      if (q) {
        const matched =
          c.nameEn.toLowerCase().includes(q) ||
          c.nameKn.toLowerCase().includes(q) ||
          (c.scientificName || '').toLowerCase().includes(q) ||
          c.cropCategory.toLowerCase().includes(q) ||
          c.supportedDistricts.some((d) => d.toLowerCase().includes(q));
        if (!matched) return false;
      }
      if (season && season.toUpperCase() !== 'ALL') {
        if (!c.seasons.some((s) => s.toUpperCase() === season.toUpperCase())) return false;
      }
      if (soilType && soilType.toUpperCase() !== 'ALL') {
        if (!c.suitableSoils.some((s) => s.toUpperCase() === soilType.toUpperCase())) return false;
      }
      if (waterRequirement && waterRequirement.toUpperCase() !== 'ALL') {
        if (c.waterRequirement.toUpperCase() !== waterRequirement.toUpperCase()) return false;
      }
      if (category && category.toUpperCase() !== 'ALL') {
        if (c.cropCategory.toUpperCase() !== category.toUpperCase()) return false;
      }
      return true;
    });
}

function toLandAcres(size: number | null, unit: string | null): number | null {
  if (size === null || size === undefined) return null;
  let val = Number(size);
  if (Number.isNaN(val)) return null;
  if (unit === 'HECTARES') val *= 2.471;
  else if (unit === 'GUNTAS') val /= 40.0;
  return Math.round(val * 100) / 100;
}

export function evaluateCropForFarmer(
  crop: CropKnowledgeRecord,
  profile: FarmerProfileInput,
  effectiveSeason: string | null,
  effectiveIrrigation: string | null,
  effectiveSoilType: string | null,
) {
  let score = 0;
  const matchReasonsEn: string[] = [];
  const matchReasonsKn: string[] = [];
  const cautionsEn: string[] = [];
  const cautionsKn: string[] = [];

  if (effectiveSeason && effectiveSeason !== 'UNKNOWN') {
    if (crop.seasons.some((s) => s.toUpperCase() === effectiveSeason.toUpperCase())) {
      score += 25;
      matchReasonsEn.push(`Fits your selected growing season (${effectiveSeason}).`);
      matchReasonsKn.push(`ನಿಮ್ಮ ಆಯ್ಕೆಯ ಬೆಳೆ ಋತುವಿಗೆ (${effectiveSeason}) ಸೂಕ್ತವಾಗಿದೆ.`);
    } else {
      score -= 20;
      cautionsEn.push(`Usually grown in ${crop.seasons.join('/')} rather than ${effectiveSeason}.`);
      cautionsKn.push(`ಸಾಮಾನ್ಯವಾಗಿ ${crop.seasons.join('/')} ಋತುವಿನಲ್ಲಿ ಬೆಳೆಯಲಾಗುತ್ತದೆ.`);
    }
  } else {
    score += 5;
  }

  if (effectiveSoilType && effectiveSoilType !== 'UNKNOWN') {
    if (crop.suitableSoils.some((s) => s.toUpperCase() === effectiveSoilType.toUpperCase())) {
      score += 25;
      matchReasonsEn.push(`Adapted to ${effectiveSoilType.replace(/_/g, ' ')} soil.`);
      matchReasonsKn.push(`ನಿಮ್ಮ ಜಮೀನಿನ ಮಣ್ಣಿನ ವಿಧಕ್ಕೆ (${effectiveSoilType}) ಹೊಂದಿಕೊಳ್ಳುತ್ತದೆ.`);
    } else {
      score -= 15;
      cautionsEn.push(
        `Prefers ${crop.suitableSoils.join(', ')} soils; check drainage and texture on your field.`,
      );
      cautionsKn.push(
        `ಈ ಬೆಳೆಗೆ ${crop.suitableSoils.join(', ')} ಮಣ್ಣು ಹೆಚ್ಚು ಸೂಕ್ತ; ಬಸಿಗಾಲುವೆ ಪರಿಶೀಲಿಸಿ.`,
      );
    }
  } else {
    score += 5;
  }

  const waterReq = crop.waterRequirement;
  if (effectiveIrrigation && effectiveIrrigation !== 'UNKNOWN') {
    const assured = ['CANAL', 'BOREWELL', 'DRIP_SPRINKLER'].includes(effectiveIrrigation.toUpperCase());
    if (effectiveIrrigation.toUpperCase() === 'RAINFED') {
      if (waterReq === 'LOW') {
        score += 25;
        matchReasonsEn.push('Low water requirement fits rainfed conditions well.');
        matchReasonsKn.push('ಕಡಿಮೆ ನೀರಿನ ಅವಶ್ಯಕತೆ ಮಳೆಯಾಶ್ರಿತ ಜಮೀನಿಗೆ ಉತ್ತಮವಾಗಿ ಹೊಂದುತ್ತದೆ.');
      } else if (waterReq === 'MEDIUM') {
        score += 10;
        cautionsEn.push('Moderate water demand — vulnerable if monsoon breaks exceed 2–3 weeks.');
        cautionsKn.push('ಮಧ್ಯಮ ನೀರಿನ ಅವಶ್ಯಕತೆ — ಮಳೆ ಕೈಕೊಟ್ಟರೆ ರಕ್ಷಣಾತ್ಮಕ ನೀರು ಬೇಕಾಗಬಹುದು.');
      } else {
        score -= 30;
        cautionsEn.push('High water requirement is risky on purely rainfed land.');
        cautionsKn.push('ಮಳೆಯಾಶ್ರಿತ ಜಮೀನಿಗೆ ಹೆಚ್ಚು ನೀರು ಬಯಸುವ ಈ ಬೆಳೆ ಅಪಾಯಕಾರಿ.');
      }
    } else if (assured) {
      if (waterReq === 'HIGH') {
        score += 20;
        matchReasonsEn.push(
          `Your ${effectiveIrrigation.replace(/_/g, ' ')} irrigation can support crop water needs.`,
        );
        matchReasonsKn.push('ನಿಮ್ಮ ನೀರಾವರಿ ಸೌಲಭ್ಯ ಈ ಬೆಳೆಯ ನೀರಿನ ಬೇಡಿಕೆಯನ್ನು ಪೂರೈಸಬಲ್ಲದು.');
      } else {
        score += 18;
        matchReasonsEn.push('Low-to-moderate water use helps conserve irrigation water.');
        matchReasonsKn.push('ಕಡಿಮೆ/ಮಧ್ಯಮ ನೀರಿನ ಬಳಕೆಯಿಂದ ನೀರಾವರಿ ಉಳಿತಾಯವಾಗುತ್ತದೆ.');
      }
    } else {
      if (waterReq === 'LOW' || waterReq === 'MEDIUM') {
        score += 15;
        matchReasonsEn.push('Compatible with tank or open-well irrigation availability.');
        matchReasonsKn.push('ಕೆರೆ ಅಥವಾ ತೆರೆದ ಬಾವಿ ನೀರಾವರಿಗೆ ಹೊಂದಿಕೊಳ್ಳುತ್ತದೆ.');
      } else {
        score -= 10;
        cautionsEn.push('Verify water availability across full season before planting a high-water crop.');
        cautionsKn.push('ಹೆಚ್ಚು ನೀರು ಬೇಕಾದ ಬೆಳೆಗೆ ಪೂರ್ಣ ಋತುವಿನ ನೀರಿನ ಲಭ್ಯತೆ ಖಚಿತಪಡಿಸಿ.');
      }
    }
  }

  if (profile.hasSoilReport && profile.soilReport) {
    const r = profile.soilReport;
    if (!r.phUnknown && r.phLevel !== null && crop.minPh !== null && crop.maxPh !== null) {
      if (r.phLevel >= crop.minPh && r.phLevel <= crop.maxPh) {
        score += 15;
        matchReasonsEn.push(
          `Recorded soil pH (${r.phLevel}) is within crop tolerance (${crop.minPh}–${crop.maxPh}).`,
        );
        matchReasonsKn.push(
          `ದಾಖಲಾದ ಮಣ್ಣಿನ pH (${r.phLevel}) ಬೆಳೆಯ ಸೂಕ್ತ ಮಿತಿಯೊಳಗೆ (${crop.minPh}–${crop.maxPh}) ಇದೆ.`,
        );
      } else {
        score -= 15;
        cautionsEn.push(
          `Recorded soil pH (${r.phLevel}) lies outside optimal ${crop.minPh}–${crop.maxPh} range.`,
        );
        cautionsKn.push(
          `ಮಣ್ಣಿನ pH (${r.phLevel}) ಸೂಕ್ತ ಮಿತಿಗಿಂತ (${crop.minPh}–${crop.maxPh}) ಹೊರಗಿದೆ.`,
        );
      }
    }
    if (!r.nitrogenUnknown && r.nitrogenKgPerHa !== null && r.nitrogenKgPerHa < 280 && crop.nitrogenFixing) {
      score += 12;
      matchReasonsEn.push(
        'Low soil nitrogen recorded — this nitrogen-fixing crop helps rebuild soil fertility.',
      );
      matchReasonsKn.push(
        'ಮಣ್ಣಿನಲ್ಲಿ ಸಾರಜನಕ ಕಡಿಮೆ ಇರುವುದರಿಂದ ಈ ಸಾರಜನಕ ಸ್ಥಿರೀಕರಿಸುವ ಬೆಳೆ ಫಲವತ್ತತೆ ಹೆಚ್ಚಿಸುತ್ತದೆ.',
      );
    }
  }

  if (profile.district && profile.district.trim()) {
    const dist = profile.district.trim().toLowerCase();
    if (crop.supportedDistricts.some((d) => d.toLowerCase() === dist)) {
      score += 12;
      matchReasonsEn.push(`Supported in ${profile.district} district crop reference.`);
      matchReasonsKn.push(`${profile.district} ಜಿಲ್ಲೆಯ ಕೃಷಿ ಮಾರ್ಗದರ್ಶಿ ಪಟ್ಟಿಯಲ್ಲಿ ಸೇರಿದೆ.`);
    }
  } else if (
    profile.state &&
    crop.supportedStates.some((s) => s.toLowerCase() === profile.state?.toLowerCase())
  ) {
    score += 5;
  }

  let rotationRecommended = false;
  const prevCrop = (profile.currentOrPreviousCrop || '').trim().toLowerCase();
  if (prevCrop) {
    const firstWord = crop.nameEn.toLowerCase().split(' ')[0];
    const isSame = prevCrop.includes(crop.cropCode.replace(/-/g, ' ')) || prevCrop.includes(firstWord);
    if (isSame) {
      score -= 15;
      cautionsEn.push(
        `Same as your recorded crop (${profile.currentOrPreviousCrop}) — consider rotating with a pulse or oilseed to break pest cycles.`,
      );
      cautionsKn.push(
        'ನಿಮ್ಮ ಹಿಂದಿನ ಬೆಳೆಯೇ ಆಗಿರುವುದರಿಂದ ಕೀಟ ಸರಪಳಿ ಮುರಿಯಲು ದ್ವಿದಳ ಅಥವಾ ಎಣ್ಣೆಕಾಳು ಬೆಳೆ ಪರಿವರ್ತನೆ ಪರಿಗಣಿಸಿ.',
      );
    } else if (crop.nitrogenFixing) {
      score += 10;
      rotationRecommended = true;
      matchReasonsEn.push(`Strong crop-rotation choice following ${profile.currentOrPreviousCrop}.`);
      matchReasonsKn.push(
        `${profile.currentOrPreviousCrop} ಬೆಳೆಯ ನಂತರ ಬೆಳೆ ಪರಿವರ್ತನೆಗೆ ಉತ್ತಮ ಆಯ್ಕೆ.`,
      );
    }
  }

  const suitabilityBand =
    score >= 55 ? 'STRONG_FIT' : score >= 25 ? 'MODERATE_FIT' : 'CONDITIONAL_FIT';

  if (matchReasonsEn.length === 0) {
    matchReasonsEn.push('Included as a reference crop option from the KrishiSetu dataset.');
    matchReasonsKn.push('ಕೃಷಿಸೇತು ದತ್ತಾಂಶದಿಂದ ಉಲ್ಲೇಖಿತ ಬೆಳೆ ಆಯ್ಕೆಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ.');
  }

  return {
    internalScore: score,
    item: {
      crop,
      suitabilityBand,
      matchReasonsEn,
      matchReasonsKn,
      cautionsEn,
      cautionsKn,
      rotationRecommended,
    },
  };
}

export function generateRecommendations(
  crops: CropKnowledgeRecord[],
  profile: FarmerProfileInput,
  overrides: { season?: string; irrigation?: string; soilType?: string },
) {
  const effectiveSeason = overrides.season?.trim() || profile.growingSeason;
  const effectiveIrrigation = overrides.irrigation?.trim() || profile.irrigationSource;
  const effectiveSoilType = overrides.soilType?.trim() || profile.soilType;

  const missingInformationEn: string[] = [];
  const missingInformationKn: string[] = [];

  if (!profile.hasSoilReport || !profile.soilReport) {
    missingInformationEn.push(
      'Soil Health Card lab readings (N, P, K, pH) are not saved — recommendations rely on field soil type and irrigation.',
    );
    missingInformationKn.push(
      'ಮಣ್ಣು ಆರೋಗ್ಯ ಕಾರ್ಡ್ ಪ್ರಯೋಗಾಲಯ ಮೌಲ್ಯಗಳು (N, P, K, pH) ಇಲ್ಲ — ಶಿಫಾರಸುಗಳು ಮಣ್ಣಿನ ವಿಧ ಮತ್ತು ನೀರಾವರಿ ಆಧಾರಿತವಾಗಿವೆ.',
    );
  } else {
    const r = profile.soilReport;
    if (r.phUnknown || r.phLevel === null) {
      missingInformationEn.push(
        'Soil pH is unknown — pH compatibility checks could not be verified for each crop.',
      );
      missingInformationKn.push(
        'ಮಣ್ಣಿನ pH ತಿಳಿದಿಲ್ಲ — ಬೆಳೆಗಳಿಗೆ pH ಹೊಂದಾಣಿಕೆ ಪರಿಶೀಲಿಸಲಾಗಲಿಲ್ಲ.',
      );
    }
    if (r.nitrogenUnknown || r.nitrogenKgPerHa === null) {
      missingInformationEn.push(
        'Nitrogen (N) value is unknown — nutrient demand ranking uses crop category baselines.',
      );
      missingInformationKn.push(
        'ಸಾರಜನಕ (N) ಮೌಲ್ಯ ತಿಳಿದಿಲ್ಲ — ಪೋಷಕಾಂಶ ಮಾರ್ಗದರ್ಶನ ಸಾಮಾನ್ಯ ಆಧಾರದಲ್ಲಿದೆ.',
      );
    }
  }

  if (!effectiveSoilType || effectiveSoilType === 'UNKNOWN') {
    missingInformationEn.push('Soil type is not specified — showing broader cross-soil matches.');
    missingInformationKn.push('ಮಣ್ಣಿನ ವಿಧ ನಮೂದಿಸಿಲ್ಲ — ವಿವಿಧ ಮಣ್ಣುಗಳಿಗೆ ಹೊಂದುವ ಬೆಳೆಗಳನ್ನು ತೋರಿಸಲಾಗಿದೆ.');
  }
  if (!effectiveSeason || effectiveSeason === 'UNKNOWN') {
    missingInformationEn.push('Growing season is not selected — crops across Kharif, Rabi, and Zaid are included.');
    missingInformationKn.push('ಬೆಳೆ ಋತು ಆಯ್ಕೆ ಮಾಡಿಲ್ಲ — ಎಲ್ಲಾ ಋತುಗಳ ಬೆಳೆಗಳನ್ನು ಸೇರಿಸಲಾಗಿದೆ.');
  }
  if (!effectiveIrrigation || effectiveIrrigation === 'UNKNOWN') {
    missingInformationEn.push(
      'Irrigation source is unknown — verify crop water requirements against your field water availability.',
    );
    missingInformationKn.push('ನೀರಾವರಿ ಮೂಲ ತಿಳಿದಿಲ್ಲ — ನಿಮ್ಮ ಜಮೀನಿನ ನೀರಿನ ಲಭ್ಯತೆಯನ್ನು ಪರಿಶೀಲಿಸಿ.');
  }
  if (!profile.district) {
    missingInformationEn.push('District is not recorded — regional district match could not be checked.');
    missingInformationKn.push('ಜಿಲ್ಲೆ ನಮೂದಿಸಿಲ್ಲ — ಜಿಲ್ಲಾ ಮಟ್ಟದ ಹೊಂದಾಣಿಕೆ ಪರಿಶೀಲಿಸಲಾಗಲಿಲ್ಲ.');
  }

  const scored = crops
    .map((crop) =>
      evaluateCropForFarmer(crop, profile, effectiveSeason, effectiveIrrigation, effectiveSoilType),
    )
    .sort((a, b) => b.internalScore - a.internalScore || a.item.crop.nameEn.localeCompare(b.item.crop.nameEn));

  return {
    profileContext: {
      hasSoilReport: profile.hasSoilReport,
      state: profile.state,
      district: profile.district,
      soilType: effectiveSoilType,
      irrigationSource: effectiveIrrigation,
      growingSeason: effectiveSeason,
      currentOrPreviousCrop: profile.currentOrPreviousCrop,
      landSizeAcres: toLandAcres(profile.landSize, profile.landUnit),
    },
    missingInformationEn,
    missingInformationKn,
    limitationsEn: [
      'Recommendations are rule-based matches from our curated dataset (with regional sample indicators where local district trials are unavailable).',
      'Live local weather rainfall, real-time pest outbreaks, expected yields, market prices, and profits are intentionally excluded to avoid fabricated figures.',
    ],
    limitationsKn: [
      'ಈ ಶಿಫಾರಸುಗಳು ನಮ್ಮ ಸಂಗ್ರಹಿತ ದತ್ತಾಂಶದ ನಿಯಮಗಳ ಮೇಲೆ ಆಧಾರಿತವಾಗಿವೆ (ಪ್ರಾದೇಶಿಕ ಪ್ರಯೋಗ ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲದ ಕಡೆ ಮಾದರಿ ಸೂಚನೆ ಇರುತ್ತದೆ).',
      'ನೇರ ಹವಾಮಾನ ಮಳೆ, ಇಳುವರಿ, ಮಾರುಕಟ್ಟೆ ದರ ಅಥವಾ ಲಾಭದ ಅಂಕಿಅಂಶಗಳನ್ನು ಊಹಿಸಿ ತೋರಿಸಲಾಗುವುದಿಲ್ಲ.',
    ],
    recommendations: scored.map((s) => s.item),
  };
}

export function compareAlternatives(
  crops: CropKnowledgeRecord[],
  cropCodes: string[],
  profile: FarmerProfileInput,
  overrides: { season?: string; irrigation?: string },
) {
  const effectiveSeason = overrides.season?.trim() || profile.growingSeason;
  const effectiveIrrigation = overrides.irrigation?.trim() || profile.irrigationSource;

  const comparedCrops = cropCodes.map((code) => {
    const crop = crops.find((c) => c.cropCode.toLowerCase() === code.trim().toLowerCase());
    if (!crop) {
      throw new Error(`NOT_FOUND:${code}`);
    }
    return evaluateCropForFarmer(
      crop,
      profile,
      effectiveSeason,
      effectiveIrrigation,
      profile.soilType,
    ).item;
  });

  const comparisonNotesEn: string[] = [];
  const comparisonNotesKn: string[] = [];

  const lowWater = comparedCrops.find((c) => c.crop.waterRequirement === 'LOW');
  if (lowWater) {
    comparisonNotesEn.push(
      `${lowWater.crop.nameEn} requires low water and reduces dry-spell risk compared to water-intensive options.`,
    );
    comparisonNotesKn.push(
      `${lowWater.crop.nameKn} ಕಡಿಮೆ ನೀರಿನಲ್ಲಿ ಬೆಳೆಯುತ್ತದೆ ಮತ್ತು ಒಣ ಹವೆಯ ಅಪಾಯ ಕಡಿಮೆ ಮಾಡುತ್ತದೆ.`,
    );
  }

  const fixer = comparedCrops.find((c) => c.crop.nitrogenFixing);
  if (fixer) {
    comparisonNotesEn.push(
      `${fixer.crop.nameEn} fixes atmospheric nitrogen and strengthens soil health for the next season.`,
    );
    comparisonNotesKn.push(
      `${fixer.crop.nameKn} ಮಣ್ಣಿನಲ್ಲಿ ಸಾರಜನಕ ಸ್ಥಿರೀಕರಿಸಿ ಮುಂದಿನ ಋತುವಿನ ಫಲವತ್ತತೆ ಹೆಚ್ಚಿಸುತ್ತದೆ.`,
    );
  }

  const shortest = [...comparedCrops].sort(
    (a, b) => a.crop.durationMinDays - b.crop.durationMinDays,
  )[0];
  if (shortest) {
    comparisonNotesEn.push(
      `${shortest.crop.nameEn} has the shortest field duration (${shortest.crop.durationMinDays}–${shortest.crop.durationMaxDays} days).`,
    );
    comparisonNotesKn.push(
      `${shortest.crop.nameKn} ಅತ್ಯಂತ ಕಡಿಮೆ ಅವಧಿಯ ಬೆಳೆಯಾಗಿದೆ (${shortest.crop.durationMinDays}–${shortest.crop.durationMaxDays} ದಿನಗಳು).`,
    );
  }

  return {
    comparedCrops,
    comparisonNotesEn,
    comparisonNotesKn,
    limitationsEn: [
      'Comparison covers factual water needs, duration, soil fit, advantages, and agronomic risks. Expected yields, market rates, and profit margins are intentionally not fabricated.',
    ],
    limitationsKn: [
      'ಈ ಹೋಲಿಕೆಯು ನೀರಿನ ಅವಶ್ಯಕತೆ, ಅವಧಿ, ಮಣ್ಣಿನ ಹೊಂದಾಣಿಕೆ, ಅನುಕೂಲಗಳು ಮತ್ತು ಅಪಾಯಗಳನ್ನು ಮಾತ್ರ ತೋರಿಸುತ್ತದೆ. ಊಹಾತ್ಮಕ ಇಳುವರಿ ಅಥವಾ ಲಾಭವನ್ನು ತೋರಿಸಲಾಗಿಲ್ಲ.',
    ],
  };
}

export function analyzeSoilHealth(profile: FarmerProfileInput) {
  const missingInformationEn: string[] = [];
  const missingInformationKn: string[] = [];
  const parameters: Array<{
    parameterKey: string;
    measuredValue: number | null;
    unknown: boolean;
    unit: string;
    statusBand: string;
    lowThreshold: number;
    highThreshold: number;
    summaryEn: string;
    summaryKn: string;
  }> = [];

  const evalNutrient = (
    parameterKey: string,
    val: number | null,
    unknown: boolean,
    unit: string,
    lowThreshold: number,
    highThreshold: number,
  ) => {
    const isUnknown = unknown || val === null;
    if (isUnknown) {
      return {
        parameterKey,
        measuredValue: null,
        unknown: true,
        unit,
        statusBand: 'UNKNOWN',
        lowThreshold,
        highThreshold,
        summaryEn: 'Not recorded on profile. Test at a soil lab before applying targeted chemical doses.',
        summaryKn: 'ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ದಾಖಲಾಗಿಲ್ಲ. ನಿಖರ ಗೊಬ್ಬರ ಪ್ರಮಾಣಕ್ಕೆ ಮುನ್ನ ಮಣ್ಣು ಪರೀಕ್ಷೆ ಮಾಡಿಸಿ.',
      };
    }
    if (val < lowThreshold) {
      return {
        parameterKey,
        measuredValue: val,
        unknown: false,
        unit,
        statusBand: 'LOW',
        lowThreshold,
        highThreshold,
        summaryEn: `Below standard medium fertility threshold (${lowThreshold} ${unit}). Combine organic compost with nitrogen-fixing rotation or split application.`,
        summaryKn: `ಸಾಮಾನ್ಯ ಮಧ್ಯಮ ಮಟ್ಟಕ್ಕಿಂತ (${lowThreshold}) ಕಡಿಮೆ ಇದೆ. ಸಾವಯವ ಗೊಬ್ಬರ, ದ್ವಿದಳ ಬೆಳೆ ಪರಿವರ್ತನೆ ಮತ್ತು ಹಂತವಾರು ಪೋಷಣೆ ಬಳಸಿ.`,
      };
    }
    if (val <= highThreshold) {
      return {
        parameterKey,
        measuredValue: val,
        unknown: false,
        unit,
        statusBand: 'MEDIUM',
        lowThreshold,
        highThreshold,
        summaryEn: `Within balanced medium range (${lowThreshold}–${highThreshold} ${unit}). Maintain with crop-stage split nutrition and organic matter.`,
        summaryKn: `ಸಮತೋಲಿತ ಮಧ್ಯಮ ಮಟ್ಟದಲ್ಲಿದೆ (${lowThreshold}–${highThreshold}). ನಿಯಮಿತ ಸಾವಯವ ಗೊಬ್ಬರದಿಂದ ಕಾಯ್ದುಕೊಳ್ಳಿ.`,
      };
    }
    return {
      parameterKey,
      measuredValue: val,
      unknown: false,
      unit,
      statusBand: 'HIGH',
      lowThreshold,
      highThreshold,
      summaryEn: `Above high threshold (${highThreshold} ${unit}). Avoid over-application to reduce cost and runoff.`,
      summaryKn: `ಹೆಚ್ಚಿನ ಮಟ್ಟದಲ್ಲಿದೆ (${highThreshold} ಕ್ಕಿಂತ ಹೆಚ್ಚು). ಹೆಚ್ಚುವರಿ ರಾಸಾಯನಿಕ ಗೊಬ್ಬರ ತಪ್ಪಿಸಿ ವೆಚ್ಚ ಉಳಿಸಿ.`,
    };
  };

  const r = profile.soilReport;
  if (!profile.hasSoilReport || !r) {
    missingInformationEn.push(
      'No Soil Health Card or lab test report is saved. Showing baseline practices for your recorded soil class instead of lab thresholds.',
    );
    missingInformationKn.push(
      'ಮಣ್ಣು ಆರೋಗ್ಯ ಕಾರ್ಡ್ ಅಥವಾ ಪ್ರಯೋಗಾಲಯದ ವರದಿ ಉಳಿಸಲಾಗಿಲ್ಲ. ಪ್ರಯೋಗಾಲಯದ ಮೌಲ್ಯಗಳ ಬದಲು ಮೂಲಭೂತ ಮಣ್ಣಿನ ಕ್ರಮಗಳನ್ನು ತೋರಿಸಲಾಗಿದೆ.',
    );
  } else {
    parameters.push(evalNutrient('nitrogen', r.nitrogenKgPerHa, r.nitrogenUnknown, 'kg/ha', 280, 560));
    parameters.push(evalNutrient('phosphorus', r.phosphorusKgPerHa, r.phosphorusUnknown, 'kg/ha', 10, 25));
    parameters.push(evalNutrient('potassium', r.potassiumKgPerHa, r.potassiumUnknown, 'kg/ha', 108, 280));

    const phUnknown = r.phUnknown || r.phLevel === null;
    if (phUnknown) {
      parameters.push({
        parameterKey: 'ph',
        measuredValue: null,
        unknown: true,
        unit: 'pH',
        statusBand: 'UNKNOWN',
        lowThreshold: 6.0,
        highThreshold: 7.5,
        summaryEn: 'Soil pH not recorded.',
        summaryKn: 'ಮಣ್ಣಿನ pH ದಾಖಲಾಗಿಲ್ಲ.',
      });
    } else if ((r.phLevel as number) < 6.0) {
      parameters.push({
        parameterKey: 'ph',
        measuredValue: r.phLevel,
        unknown: false,
        unit: 'pH',
        statusBand: 'ACIDIC',
        lowThreshold: 6.0,
        highThreshold: 7.5,
        summaryEn: 'Acidic soil (pH < 6.0). Consult local KVK on agricultural lime requirement if pH is below 5.5.',
        summaryKn: 'ಆಮ್ಲೀಯ ಮಣ್ಣು (pH < 6.0). pH 5.5 ಕ್ಕಿಂತ ಕಡಿಮೆ ಇದ್ದರೆ ಸುಣ್ಣದ ಪ್ರಮಾಣಕ್ಕೆ KVK ಸಲಹೆ ಪಡೆಯಿರಿ.',
      });
    } else if ((r.phLevel as number) <= 7.5) {
      parameters.push({
        parameterKey: 'ph',
        measuredValue: r.phLevel,
        unknown: false,
        unit: 'pH',
        statusBand: 'NEUTRAL',
        lowThreshold: 6.0,
        highThreshold: 7.5,
        summaryEn: 'Optimal neutral range (6.0–7.5) suited to most pulses, cereals, and oilseeds.',
        summaryKn: 'ಸಮತೋಲಿತ ತಟಸ್ಥ ಮಟ್ಟ (6.0–7.5) — ಬಹುತೇಕ ಬೆಳೆಗಳಿಗೆ ಸೂಕ್ತವಾಗಿದೆ.',
      });
    } else {
      parameters.push({
        parameterKey: 'ph',
        measuredValue: r.phLevel,
        unknown: false,
        unit: 'pH',
        statusBand: 'ALKALINE',
        lowThreshold: 6.0,
        highThreshold: 7.5,
        summaryEn: 'Alkaline soil (pH > 7.5). Incorporate organic manure and consult KVK regarding gypsum if sodicity exists.',
        summaryKn: 'ಕ್ಷಾರೀಯ ಮಣ್ಣು (pH > 7.5). ಸಾವಯವ ಗೊಬ್ಬರ ಹೆಚ್ಚಿಸಿ ಮತ್ತು ಅಗತ್ಯವಿದ್ದರೆ ಜಿಪ್ಸಮ್ ಬಳಕೆಗೆ KVK ಸಲಹೆ ಪಡೆಯಿರಿ.',
      });
    }

    if (r.nitrogenUnknown || r.nitrogenKgPerHa === null) {
      missingInformationEn.push('Nitrogen (N) reading is marked unknown or missing.');
      missingInformationKn.push('ಸಾರಜನಕ (N) ಮೌಲ್ಯವನ್ನು ತಿಳಿದಿಲ್ಲ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ ಅಥವಾ ನಮೂದಿಸಿಲ್ಲ.');
    }
    if (r.phosphorusUnknown || r.phosphorusKgPerHa === null) {
      missingInformationEn.push('Phosphorus (P) reading is marked unknown or missing.');
      missingInformationKn.push('ರಂಜಕ (P) ಮೌಲ್ಯವನ್ನು ತಿಳಿದಿಲ್ಲ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ ಅಥವಾ ನಮೂದಿಸಿಲ್ಲ.');
    }
    if (r.potassiumUnknown || r.potassiumKgPerHa === null) {
      missingInformationEn.push('Potassium (K) reading is marked unknown or missing.');
      missingInformationKn.push('ಪೊಟ್ಯಾಸಿಯಮ್ (K) ಮೌಲ್ಯವನ್ನು ತಿಳಿದಿಲ್ಲ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ ಅಥವಾ ನಮೂದಿಸಿಲ್ಲ.');
    }
    if (r.phUnknown || r.phLevel === null) {
      missingInformationEn.push('Soil pH value is marked unknown or missing.');
      missingInformationKn.push('ಮಣ್ಣಿನ pH ಮೌಲ್ಯವನ್ನು ತಿಳಿದಿಲ್ಲ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ ಅಥವಾ ನಮೂದಿಸಿಲ್ಲ.');
    }
  }

  missingInformationEn.push(
    'Micronutrients (Zinc, Boron, Sulphur) and Organic Carbon are not captured in onboarding and should be checked on your lab card.',
  );
  missingInformationKn.push(
    'ಸೂಕ್ಷ್ಮ ಪೋಷಕಾಂಶಗಳು (ಸತು, ಬೋರಾನ್, ಗಂಧಕ) ಮತ್ತು ಸಾವಯವ ಇಂಗಾಲದ ಮಾಹಿತಿಯನ್ನು ನಿಮ್ಮ ಪ್ರಯೋಗಾಲಯ ವರದಿಯಲ್ಲಿ ಪರಿಶೀಲಿಸಿ.',
  );

  return {
    hasSoilReport: profile.hasSoilReport,
    soilType: profile.soilType,
    parameters,
    baselinePracticesEn: [
      'Incorporate well-decomposed farmyard manure or compost before sowing to improve moisture retention and soil biology.',
      'Split nitrogen applications across active growth stages rather than applying all at sowing.',
      'Test soil every 2–3 years at your district Krishi Vigyan Kendra or Raitha Samparka Kendra.',
    ],
    baselinePracticesKn: [
      'ತೇವಾಂಶ ಮತ್ತು ಮಣ್ಣಿನ ಜೀವಸತ್ವ ಹೆಚ್ಚಿಸಲು ಬಿತ್ತನೆಗೆ ಮುನ್ನ ಚೆನ್ನಾಗಿ ಕೊಳೆತ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ ಸೇರಿಸಿ.',
      'ಸಾರಜನಕವನ್ನು ಒಂದೇ ಬಾರಿಗೆ ಹಾಕದೆ ಬೆಳೆಯ ಬೆಳವಣಿಗೆಯ ಹಂತಗಳಲ್ಲಿ ಹಂಚಿ ನೀಡಿ.',
      'ಪ್ರತಿ 2–3 ವರ್ಷಗಳಿಗೊಮ್ಮೆ ಜಿಲ್ಲಾ ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ ಅಥವಾ ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರದಲ್ಲಿ ಮಣ್ಣು ಪರೀಕ್ಷೆ ಮಾಡಿಸಿ.',
    ],
    missingInformationEn,
    missingInformationKn,
  };
}
