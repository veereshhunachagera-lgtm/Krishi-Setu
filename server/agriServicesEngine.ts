import crypto from 'node:crypto';

export type VerificationTier = 'VERIFIED_DIRECTORY' | 'DEMONSTRATION_SAMPLE';

export type ServiceProviderType =
  | 'SOIL_LAB_KVK'
  | 'COLD_STORAGE'
  | 'MANDI_APMC'
  | 'CUSTOM_HIRING_CENTRE'
  | 'INPUT_SEED_CENTRE'
  | 'EXTENSION_BANK';

export interface AgriServiceProviderRecord {
  id: string;
  providerCode: string;
  serviceType: ServiceProviderType;
  nameEn: string;
  nameKn: string;
  state: string;
  district: string;
  addressEn: string;
  addressKn: string;
  contactPhone: string | null;
  contactEmail: string | null;
  websiteUrl: string | null;
  servicesOfferedEn: string[];
  servicesOfferedKn: string[];
  capacityNoteEn: string | null;
  capacityNoteKn: string | null;
  latitude: number | null;
  longitude: number | null;
  coordinatesVerified: boolean;
  verificationStatus: VerificationTier;
  sourceReference: string;
  active: boolean;
}

export type EquipmentCategory = 'TRACTOR' | 'HARVESTER' | 'OTHER';

export interface EquipmentListingRecord {
  id: string;
  listingCode: string;
  category: EquipmentCategory;
  equipmentNameEn: string;
  equipmentNameKn: string;
  modelOrSpecEn: string;
  modelOrSpecKn: string;
  providerNameEn: string;
  providerNameKn: string;
  state: string;
  district: string;
  contactPhone: string | null;
  rateInr: number | null;
  rateUnit: 'HOUR' | 'ACRE' | 'DAY' | null;
  rateVerified: boolean;
  availabilityStatus: 'AVAILABLE' | 'SEASONAL_DEMAND' | 'UNVERIFIED';
  verificationStatus: VerificationTier;
  sourceReference: string;
  active: boolean;
}

export type BookingRequestStatus =
  | 'REQUESTED'
  | 'REVIEWING'
  | 'FORWARDED_TO_PROVIDER'
  | 'COMPLETED'
  | 'CANCELLED';

export interface EquipmentBookingRecord {
  id: string;
  userId: string;
  farmerName: string;
  equipmentId: string;
  equipmentNameEn: string;
  equipmentNameKn: string;
  providerNameEn: string;
  district: string;
  state: string;
  requestedDate: string;
  durationValue: number;
  durationUnit: 'HOURS' | 'ACRES' | 'DAYS';
  contactPhone: string;
  notes: string | null;
  status: BookingRequestStatus;
  confirmationNote: string;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SoilTestingChecklistItem {
  step: number;
  titleEn: string;
  titleKn: string;
  detailEn: string;
  detailKn: string;
}

export const SOIL_TESTING_CHECKLIST: SoilTestingChecklistItem[] = [
  {
    step: 1,
    titleEn: 'Representative Composite Sampling',
    titleKn: 'ಪ್ರಾತಿನಿಧಿಕ ಮಣ್ಣಿನ ಮಾದರಿ ಸಂಗ್ರಹಣೆ',
    detailEn:
      'Collect 6 to 8 V-shaped sub-samples at 15 cm (6 inch) depth in a zig-zag pattern across a uniform field. Avoid bunds, channels, and recently fertilized or compost-heap spots.',
    detailKn:
      'ಸಮಾನವಾದ ಹೊಲದಲ್ಲಿ ಜಿಗ್-ಜಾಗ್ ಮಾದರಿಯಲ್ಲಿ 15 ಸೆಂ.ಮೀ (6 ಇಂಚು) ಆಳದಿಂದ 6 ರಿಂದ 8 ಮಣ್ಣಿನ ಮಾದರಿಗಳನ್ನು ಸಂಗ್ರಹಿಸಿ. ಬದುಗಳು, ಕಾಲುವೆಗಳು ಮತ್ತು ಗೊಬ್ಬರದ ರಾಶಿಯ ಬಳಿ ಮಾದರಿ ತೆಗೆಯಬೇಡಿ.',
  },
  {
    step: 2,
    titleEn: 'Shade-Dry, Mix & Pack ~500 g',
    titleKn: 'ನೆರಳಿನಲ್ಲಿ ಒಣಗಿಸಿ 500 ಗ್ರಾಂ ಪ್ಯಾಕ್ ಮಾಡಿ',
    detailEn:
      'Air-dry the soil in shade (never direct sunlight or oven), crush clods lightly with wood, quarter and mix thoroughly, and pack ~500 g in a clean cloth or polythene bag.',
    detailKn:
      'ಮಣ್ಣನ್ನು ನೆರಳಿನಲ್ಲಿ ಒಣಗಿಸಿ, ಮರದ ತುಂಡಿನಿಂದ ಹೆಂಟೆಗಳನ್ನು ಪುಡಿಮಾಡಿ, ಚೆನ್ನಾಗಿ ಮಿಶ್ರಣ ಮಾಡಿ ಸುಮಾರು 500 ಗ್ರಾಂ ಮಣ್ಣನ್ನು ಶುದ್ಧ ಚೀಲದಲ್ಲಿ ಕಟ್ಟಿ.',
  },
  {
    step: 3,
    titleEn: 'Required Plot & Farmer Details',
    titleKn: 'ಅಗತ್ಯವಿರುವ ಜಮೀನು ಮತ್ತು ರೈತರ ವಿವರಗಳು',
    detailEn:
      'Carry your Survey / RTC (Pahani) number, Aadhaar & active mobile number (for Soil Health Card portal SMS), total field acres, irrigation type, previous crop, and next planned crop.',
    detailKn:
      'ಸರ್ವೆ / ಆರ್‌ಟಿಸಿ (ಪಹಣಿ) ಸಂಖ್ಯೆ, ಆಧಾರ್ ಮತ್ತು ಮೊಬೈಲ್ ಸಂಖ್ಯೆ, ಎಕರೆ ವಿಸ್ತೀರ್ಣ, ನೀರಾವರಿ ಮೂಲ, ಹಿಂದಿನ ಬೆಳೆ ಮತ್ತು ಮುಂದೆ ಬೆಳೆಯಲಿರುವ ಬೆಳೆಯ ವಿವರಗಳನ್ನು ತೆಗೆದುಕೊಂಡು ಹೋಗಿ.',
  },
  {
    step: 4,
    titleEn: 'Testing Lead Time & Profile Update',
    titleKn: 'ಪರೀಕ್ಷಾ ಸಮಯ ಮತ್ತು ಪ್ರೊಫೈಲ್ ನವೀಕರಣ',
    detailEn:
      'Most district Soil Testing Labs and KVKs issue NPK, pH, EC, and organic carbon reports in 7–14 working days. Enter those values in KrishiSetu to unlock full nutrient recommendations.',
    detailKn:
      'ಜಿಲ್ಲಾ ಮಣ್ಣು ಪರೀಕ್ಷಾ ಕೇಂದ್ರಗಳು ಮತ್ತು ಕೆವಿಕೆಗಳು ಸಾಮಾನ್ಯವಾಗಿ 7–14 ಕೆಲಸದ ದಿನಗಳಲ್ಲಿ ವರದಿ ನೀಡುತ್ತವೆ. ವರದಿ ಬಂದ ನಂತರ ಕೃಷಿಸೇತುವಿನಲ್ಲಿ N, P, K ಮತ್ತು pH ಮೌಲ್ಯಗಳನ್ನು ನಮೂದಿಸಿ.',
  },
];

export function loadSeedServiceProviders(): AgriServiceProviderRecord[] {
  return [
    // --- Verified Public KVK & Soil Testing Lab Directory Entries ---
    {
      id: 'svc-kvk-mandya',
      providerCode: 'kvk-mandya-vcfarm',
      serviceType: 'SOIL_LAB_KVK',
      nameEn: 'ICAR-Krishi Vigyan Kendra, Mandya (V.C. Farm)',
      nameKn: 'ಐಸಿಎಆರ್-ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ, ಮಂಡ್ಯ (ವಿ.ಸಿ. ಫಾರ್ಮ್)',
      state: 'Karnataka',
      district: 'Mandya',
      addressEn: 'V.C. Farm Campus, Mandya District, Karnataka 571405 (UAS Bengaluru Jurisdiction)',
      addressKn: 'ವಿ.ಸಿ. ಫಾರ್ಮ್ ಆವರಣ, ಮಂಡ್ಯ ಜಿಲ್ಲೆ, ಕರ್ನಾಟಕ 571405 (ಕೃಷಿ ವಿಶ್ವವಿದ್ಯಾಲಯ ಬೆಂಗಳೂರು)',
      contactPhone: null,
      contactEmail: null,
      websiteUrl: 'https://kvk.icar.gov.in/',
      servicesOfferedEn: ['Soil Health Card NPK & pH Testing', 'Crop Advisory', 'Seed & Bio-input Demonstrations'],
      servicesOfferedKn: ['ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಕಾರ್ಡ್ NPK ಮತ್ತು pH ಪರೀಕ್ಷೆ', 'ಬೆಳೆ ಸಲಹೆ', 'ಬೀಜ ಮತ್ತು ಜೈವಿಕ ಗೊಬ್ಬರ ಪ್ರಾತ್ಯಕ್ಷಿಕೆ'],
      capacityNoteEn: 'Public ICAR/SAU extension & soil testing facility; verify current lab hours before visiting.',
      capacityNoteKn: 'ಸಾರ್ವಜನಿಕ ಐಸಿಎಆರ್/ಕೃಷಿ ವಿವಿ ವಿಸ್ತರಣೆ ಮತ್ತು ಮಣ್ಣು ಪರೀಕ್ಷಾ ಕೇಂದ್ರ; ಭೇಟಿ ನೀಡುವ ಮೊದಲು ಸಮಯವನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.',
      latitude: 12.5678,
      longitude: 76.8261,
      coordinatesVerified: true,
      verificationStatus: 'VERIFIED_DIRECTORY',
      sourceReference: 'ICAR KVK Portal & University of Agricultural Sciences, Bengaluru',
      active: true,
    },
    {
      id: 'svc-kvk-bengaluru-rural',
      providerCode: 'kvk-bengaluru-rural',
      serviceType: 'SOIL_LAB_KVK',
      nameEn: 'ICAR-Krishi Vigyan Kendra, Bengaluru Rural (Hadonahalli)',
      nameKn: 'ಐಸಿಎಆರ್-ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ, ಬೆಂಗಳೂರು ಗ್ರಾಮಾಂತರ (ಹಾಡೋನಹಳ್ಳಿ)',
      state: 'Karnataka',
      district: 'Bengaluru Rural',
      addressEn: 'Hadonahalli, Doddaballapura Taluk, Bengaluru Rural, Karnataka 561205',
      addressKn: 'ಹಾಡೋನಹಳ್ಳಿ, ದೊಡ್ಡಬಳ್ಳಾಪುರ ತಾಲೂಕು, ಬೆಂಗಳೂರು ಗ್ರಾಮಾಂತರ, ಕರ್ನಾಟಕ 561205',
      contactPhone: null,
      contactEmail: null,
      websiteUrl: 'https://kvk.icar.gov.in/',
      servicesOfferedEn: ['Soil & Water Testing', 'Ragi & Pulses Extension', 'Horticulture Training'],
      servicesOfferedKn: ['ಮಣ್ಣು ಮತ್ತು ನೀರು ಪರೀಕ್ಷೆ', 'ರಾಗಿ ಮತ್ತು ದ್ವಿದಳ ಧಾನ್ಯ ಸಲಹೆ', 'ತೋಟಗಾರಿಕೆ ತರಬೇತಿ'],
      capacityNoteEn: 'Operated under UAS Bengaluru; soil sample reception on working days.',
      capacityNoteKn: 'ಬೆಂಗಳೂರು ಕೃಷಿ ವಿಶ್ವವಿದ್ಯಾಲಯದ ಅಡಿಯಲ್ಲಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ.',
      latitude: 13.3469,
      longitude: 77.5082,
      coordinatesVerified: true,
      verificationStatus: 'VERIFIED_DIRECTORY',
      sourceReference: 'ICAR KVK Portal & UAS Bengaluru',
      active: true,
    },
    {
      id: 'svc-kvk-mysuru',
      providerCode: 'kvk-mysuru-suttur',
      serviceType: 'SOIL_LAB_KVK',
      nameEn: 'ICAR-JSS Krishi Vigyan Kendra, Mysuru (Suttur)',
      nameKn: 'ಐಸಿಎಆರ್-ಜೆಎಸ್‌ಎಸ್ ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ, ಮೈಸೂರು (ಸುತ್ತೂರು)',
      state: 'Karnataka',
      district: 'Mysuru',
      addressEn: 'Suttur, Nanjangud Taluk, Mysuru District, Karnataka 571129',
      addressKn: 'ಸುತ್ತೂರು, ನಂಜನಗೂಡು ತಾಲೂಕು, ಮೈಸೂರು ಜಿಲ್ಲೆ, ಕರ್ನಾಟಕ 571129',
      contactPhone: null,
      contactEmail: null,
      websiteUrl: 'https://kvk.icar.gov.in/',
      servicesOfferedEn: ['Soil Testing Lab', 'Plant Health Clinic', 'Custom Hiring & Implements Guidance'],
      servicesOfferedKn: ['ಮಣ್ಣು ಪರೀಕ್ಷಾ ಪ್ರಯೋಗಾಲಯ', 'ಸಸ್ಯ ಆರೋಗ್ಯ ಚಿಕಿತ್ಸಾಲಯ', 'ಕೃಷಿ ಯಂತ್ರೋಪಕರಣ ಮಾರ್ಗದರ್ಶನ'],
      capacityNoteEn: 'ICAR-affiliated KVK serving Mysuru region farmers.',
      capacityNoteKn: 'ಮೈಸೂರು ಭಾಗದ ರೈತರಿಗೆ ಸೇವೆ ಸಲ್ಲಿಸುವ ಐಸಿಎಆರ್-ಸಂಯೋಜಿತ ಕೆವಿಕೆ.',
      latitude: 12.1558,
      longitude: 76.7834,
      coordinatesVerified: true,
      verificationStatus: 'VERIFIED_DIRECTORY',
      sourceReference: 'ICAR KVK Official Directory',
      active: true,
    },
    {
      id: 'svc-kvk-dharwad',
      providerCode: 'kvk-dharwad-uas',
      serviceType: 'SOIL_LAB_KVK',
      nameEn: 'ICAR-Krishi Vigyan Kendra, Dharwad (Saidapur Farm)',
      nameKn: 'ಐಸಿಎಆರ್-ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ, ಧಾರವಾಡ (ಸೈದಾಪುರ ಫಾರ್ಮ್)',
      state: 'Karnataka',
      district: 'Dharwad',
      addressEn: 'Saidapur Farm, UAS Dharwad Campus, Dharwad, Karnataka 580005',
      addressKn: 'ಸೈದಾಪುರ ಫಾರ್ಮ್, ಕೃಷಿ ವಿವಿ ಆವರಣ, ಧಾರವಾಡ, ಕರ್ನಾಟಕ 580005',
      contactPhone: null,
      contactEmail: null,
      websiteUrl: 'https://kvk.icar.gov.in/',
      servicesOfferedEn: ['Black Soil & Micronutrient Analysis', 'Cotton & Pulse IPM Advisory', 'Seed Support'],
      servicesOfferedKn: ['ಕಪ್ಪು ಮಣ್ಣು ಮತ್ತು ಸೂಕ್ಷ್ಮ ಪೋಷಕಾಂಶ ಪರೀಕ್ಷೆ', 'ಹತ್ತಿ ಮತ್ತು ಬೇಳೆಕಾಳು ಸಲಹೆ', 'ಬೀಜ ನೆರವು'],
      capacityNoteEn: 'UAS Dharwad jurisdiction soil and agronomy testing hub.',
      capacityNoteKn: 'ಧಾರವಾಡ ಕೃಷಿ ವಿಶ್ವವಿದ್ಯಾಲಯದ ಮಣ್ಣು ಪರೀಕ್ಷಾ ಕೇಂದ್ರ.',
      latitude: 15.4892,
      longitude: 74.9838,
      coordinatesVerified: true,
      verificationStatus: 'VERIFIED_DIRECTORY',
      sourceReference: 'ICAR KVK Portal & UAS Dharwad',
      active: true,
    },
    {
      id: 'svc-kvk-raichur',
      providerCode: 'kvk-raichur-uas',
      serviceType: 'SOIL_LAB_KVK',
      nameEn: 'ICAR-Krishi Vigyan Kendra, Raichur',
      nameKn: 'ಐಸಿಎಆರ್-ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ, ರಾಯಚೂರು',
      state: 'Karnataka',
      district: 'Raichur',
      addressEn: 'UAS Raichur Main Campus, Lingsugur Road, Raichur, Karnataka 584104',
      addressKn: 'ಕೃಷಿ ವಿಜ್ಞಾನ ವಿಶ್ವವಿದ್ಯಾಲಯ ಆವರಣ, ಲಿಂಗಸುಗೂರು ರಸ್ತೆ, ರಾಯಚೂರು, ಕರ್ನಾಟಕ 584104',
      contactPhone: null,
      contactEmail: null,
      websiteUrl: 'https://kvk.icar.gov.in/',
      servicesOfferedEn: ['Salinity & pH Soil Testing', 'Paddy & Tur IPM', 'Water Quality Check'],
      servicesOfferedKn: ['ಲವಣಾಂಶ ಮತ್ತು pH ಮಣ್ಣು ಪರೀಕ್ಷೆ', 'ಭತ್ತ ಮತ್ತು ತೊಗರಿ ಸಲಹೆ', 'ನೀರಿನ ಗುಣಮಟ್ಟ ಪರೀಕ್ಷೆ'],
      capacityNoteEn: 'UAS Raichur regional soil & irrigation testing center.',
      capacityNoteKn: 'ರಾಯಚೂರು ಕೃಷಿ ವಿವಿ ಮಣ್ಣು ಮತ್ತು ನೀರು ಪರೀಕ್ಷಾ ಕೇಂದ್ರ.',
      latitude: 16.2043,
      longitude: 77.3304,
      coordinatesVerified: true,
      verificationStatus: 'VERIFIED_DIRECTORY',
      sourceReference: 'ICAR KVK Portal & UAS Raichur',
      active: true,
    },
    {
      id: 'svc-kvk-hassan',
      providerCode: 'kvk-hassan-kandali',
      serviceType: 'SOIL_LAB_KVK',
      nameEn: 'ICAR-Krishi Vigyan Kendra, Hassan (Kandali)',
      nameKn: 'ಐಸಿಎಆರ್-ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ, ಹಾಸನ (ಕಂದಲಿ)',
      state: 'Karnataka',
      district: 'Hassan',
      addressEn: 'Kandali Village, Hassan District, Karnataka 573217',
      addressKn: 'ಕಂದಲಿ ಗ್ರಾಮ, ಹಾಸನ ಜಿಲ್ಲೆ, ಕರ್ನಾಟಕ 573217',
      contactPhone: null,
      contactEmail: null,
      websiteUrl: 'https://kvk.icar.gov.in/',
      servicesOfferedEn: ['Soil Health Card Testing', 'Potato & Maize Disease Diagnostics', 'Plant Protection Training'],
      servicesOfferedKn: ['ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಕಾರ್ಡ್ ಪರೀಕ್ಷೆ', 'ಆಲೂಗಡ್ಡೆ ಮತ್ತು ಮೆಕ್ಕೆಜೋಳ ರೋಗ ಸಲಹೆ', 'ಸಸ್ಯ ಸಂರಕ್ಷಣೆ ತರಬೇತಿ'],
      capacityNoteEn: 'Public KVK under UAS Bengaluru.',
      capacityNoteKn: 'ಬೆಂಗಳೂರು ಕೃಷಿ ವಿವಿ ಅಡಿಯ ಸಾರ್ವಜನಿಕ ಕೆವಿಕೆ.',
      latitude: 13.0031,
      longitude: 76.0247,
      coordinatesVerified: true,
      verificationStatus: 'VERIFIED_DIRECTORY',
      sourceReference: 'ICAR KVK Official Directory',
      active: true,
    },
    {
      id: 'svc-kvk-ludhiana',
      providerCode: 'kvk-ludhiana-samrala',
      serviceType: 'SOIL_LAB_KVK',
      nameEn: 'ICAR-Krishi Vigyan Kendra, Ludhiana (Samrala)',
      nameKn: 'ಐಸಿಎಆರ್-ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ, ಲೂಧಿಯಾನಾ (ಸಮ್ರಾಲಾ)',
      state: 'Punjab',
      district: 'Ludhiana',
      addressEn: 'Samrala, Ludhiana District, Punjab 141114 (PAU Jurisdiction)',
      addressKn: 'ಸಮ್ರಾಲಾ, ಲೂಧಿಯಾನಾ ಜಿಲ್ಲೆ, ಪಂಜಾಬ್ 141114 (PAU)',
      contactPhone: null,
      contactEmail: null,
      websiteUrl: 'https://kvk.icar.gov.in/',
      servicesOfferedEn: ['Soil & Water Testing', 'Wheat & Paddy Agronomy', 'Residue Management'],
      servicesOfferedKn: ['ಮಣ್ಣು ಮತ್ತು ನೀರು ಪರೀಕ್ಷೆ', 'ಗೋಧಿ ಮತ್ತು ಭತ್ತ ಬೇಸಾಯ ಸಲಹೆ', 'ಬೆಳೆ ತ್ಯಾಜ್ಯ ನಿರ್ವಹಣೆ'],
      capacityNoteEn: 'Punjab Agricultural University regional KVK.',
      capacityNoteKn: 'ಪಂಜಾಬ್ ಕೃಷಿ ವಿಶ್ವವಿದ್ಯಾಲಯದ ಪ್ರಾದೇಶಿಕ ಕೆವಿಕೆ.',
      latitude: 30.8359,
      longitude: 76.1912,
      coordinatesVerified: true,
      verificationStatus: 'VERIFIED_DIRECTORY',
      sourceReference: 'ICAR KVK Official Directory & PAU',
      active: true,
    },
    {
      id: 'svc-kvk-baramati',
      providerCode: 'kvk-pune-baramati',
      serviceType: 'SOIL_LAB_KVK',
      nameEn: 'ICAR-Krishi Vigyan Kendra, Pune (Baramati)',
      nameKn: 'ಐಸಿಎಆರ್-ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ, ಪುಣೆ (ಬಾರಾಮತಿ)',
      state: 'Maharashtra',
      district: 'Pune',
      addressEn: 'Shardanagar, Malegaon Bk., Baramati, Pune District, Maharashtra 413115',
      addressKn: 'ಶಾರದಾನಗರ, ಬಾರಾಮತಿ, ಪುಣೆ ಜಿಲ್ಲೆ, ಮಹಾರಾಷ್ಟ್ರ 413115',
      contactPhone: null,
      contactEmail: null,
      websiteUrl: 'https://kvk.icar.gov.in/',
      servicesOfferedEn: ['Soil & Tissue Analysis', 'Micro-irrigation Demonstration', 'Horticulture Support'],
      servicesOfferedKn: ['ಮಣ್ಣು ಮತ್ತು ಸಸ್ಯ ವಿಶ್ಲೇಷಣೆ', 'ಹನಿ ನೀರಾವರಿ ಪ್ರಾತ್ಯಕ್ಷಿಕೆ', 'ತೋಟಗಾರಿಕೆ ನೆರವು'],
      capacityNoteEn: 'Verified ICAR-affiliated KVK center.',
      capacityNoteKn: 'ಐಸಿಎಆರ್-ಸಂಯೋಜಿತ ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ.',
      latitude: 18.1496,
      longitude: 74.5136,
      coordinatesVerified: true,
      verificationStatus: 'VERIFIED_DIRECTORY',
      sourceReference: 'ICAR KVK Official Directory',
      active: true,
    },
    // --- Cold Storage, Mandis, CHCs & RSKs (Verified Public Hubs + Clearly Marked Demo Entries) ---
    {
      id: 'svc-apmc-mandya',
      providerCode: 'apmc-mandya-yard',
      serviceType: 'MANDI_APMC',
      nameEn: 'Mandya APMC Market Yard',
      nameKn: 'ಮಂಡ್ಯ ಎಪಿಎಂಸಿ ಮಾರುಕಟ್ಟೆ ಪ್ರಾಂಗಣ',
      state: 'Karnataka',
      district: 'Mandya',
      addressEn: 'APMC Market Road, Mandya, Karnataka 571401',
      addressKn: 'ಎಪಿಎಂಸಿ ಮಾರುಕಟ್ಟೆ ರಸ್ತೆ, ಮಂಡ್ಯ, ಕರ್ನಾಟಕ 571401',
      contactPhone: null,
      contactEmail: null,
      websiteUrl: 'https://enam.gov.in/',
      servicesOfferedEn: ['Regulated Grain & Jaggery Auction', 'Electronic Weighing', 'Agmarknet Reporting'],
      servicesOfferedKn: ['ನಿಯಂತ್ರಿತ ಧಾನ್ಯ ಮತ್ತು ಬೆಲ್ಲ ಹರಾಜು', 'ವಿದ್ಯುನ್ಮಾನ ತೂಕ', 'ಮಾರುಕಟ್ಟೆ ದರ ವರದಿ'],
      capacityNoteEn: 'Public Agricultural Produce Market Committee yard; auction timings vary by commodity.',
      capacityNoteKn: 'ಸಾರ್ವಜನಿಕ ಕೃಷಿ ಉತ್ಪನ್ನ ಮಾರುಕಟ್ಟೆ ಸಮಿತಿ ಪ್ರಾಂಗಣ.',
      latitude: 12.5236,
      longitude: 76.8952,
      coordinatesVerified: true,
      verificationStatus: 'VERIFIED_DIRECTORY',
      sourceReference: 'Karnataka State Agricultural Marketing Board / eNAM Directory',
      active: true,
    },
    {
      id: 'svc-apmc-yeshwanthpur',
      providerCode: 'apmc-bengaluru-yeshwanthpur',
      serviceType: 'MANDI_APMC',
      nameEn: 'Bengaluru APMC Yard (Yeshwanthpur)',
      nameKn: 'ಬೆಂಗಳೂರು ಎಪಿಎಂಸಿ ಪ್ರಾಂಗಣ (ಯಶವಂತಪುರ)',
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      addressEn: 'Tumkur Road, Yeshwanthpur, Bengaluru, Karnataka 560022',
      addressKn: 'ತುಮಕೂರು ರಸ್ತೆ, ಯಶವಂತಪುರ, ಬೆಂಗಳೂರು, ಕರ್ನಾಟಕ 560022',
      contactPhone: null,
      contactEmail: null,
      websiteUrl: 'https://enam.gov.in/',
      servicesOfferedEn: ['Wholesale Grains, Pulses & Onion Market', 'Grading & Assaying', 'Storage Sheds'],
      servicesOfferedKn: ['ಸಗಟು ಧಾನ್ಯ, ಬೇಳೆಕಾಳು ಮತ್ತು ಈರುಳ್ಳಿ ಮಾರುಕಟ್ಟೆ', 'ಶ್ರೇಣೀಕರಣ ಮತ್ತು ದಾಸ್ತಾನು'],
      capacityNoteEn: 'Major regional APMC terminal yard.',
      capacityNoteKn: 'ಪ್ರಮುಖ ಪ್ರಾದೇಶಿಕ ಎಪಿಎಂಸಿ ಮಾರುಕಟ್ಟೆ ಪ್ರಾಂಗಣ.',
      latitude: 13.0256,
      longitude: 77.5471,
      coordinatesVerified: true,
      verificationStatus: 'VERIFIED_DIRECTORY',
      sourceReference: 'Karnataka State Agricultural Marketing Board / eNAM',
      active: true,
    },
    {
      id: 'svc-apmc-hubballi',
      providerCode: 'apmc-dharwad-hubballi',
      serviceType: 'MANDI_APMC',
      nameEn: 'Hubballi APMC (Amargol)',
      nameKn: 'ಹುಬ್ಬಳ್ಳಿ ಎಪಿಎಂಸಿ (ಅಮರಗೋಳ)',
      state: 'Karnataka',
      district: 'Dharwad',
      addressEn: 'Amargol APMC Complex, PB Road, Hubballi, Dharwad, Karnataka 580025',
      addressKn: 'ಅಮರಗೋಳ ಎಪಿಎಂಸಿ ಸಂಕೀರ್ಣ, ಪಿ.ಬಿ. ರಸ್ತೆ, ಹುಬ್ಬಳ್ಳಿ, ಧಾರವಾಡ 580025',
      contactPhone: null,
      contactEmail: null,
      websiteUrl: 'https://enam.gov.in/',
      servicesOfferedEn: ['Pulses, Cotton & Oilseeds Trading', 'eNAM Digital Lots', 'Cleaning & Weighing'],
      servicesOfferedKn: ['ಬೇಳೆಕಾಳು, ಹತ್ತಿ ಮತ್ತು ಎಣ್ಣೆಕಾಳು ವ್ಯಾಪಾರ', 'ಇ-ನಾಮ್ ಡಿಜಿಟಲ್ ಹರಾಜು'],
      capacityNoteEn: 'Verified APMC market yard serving North Karnataka districts.',
      capacityNoteKn: 'ಉತ್ತರ ಕರ್ನಾಟಕ ಜಿಲ್ಲೆಗಳಿಗೆ ಸೇವೆ ಸಲ್ಲಿಸುವ ಪರಿಶೀಲಿತ ಎಪಿಎಂಸಿ ಪ್ರಾಂಗಣ.',
      latitude: 15.3982,
      longitude: 75.0861,
      coordinatesVerified: true,
      verificationStatus: 'VERIFIED_DIRECTORY',
      sourceReference: 'Karnataka State Agricultural Marketing Board',
      active: true,
    },
    {
      id: 'svc-cold-mandya-demo',
      providerCode: 'demo-cold-mandya',
      serviceType: 'COLD_STORAGE',
      nameEn: 'Mandya District Cold Storage Hub (Sample Entry)',
      nameKn: 'ಮಂಡ್ಯ ಜಿಲ್ಲಾ ಶೀತಲ ಗೃಹ ಕೇಂದ್ರ (ಮಾದರಿ ದಾಖಲೆ)',
      state: 'Karnataka',
      district: 'Mandya',
      addressEn: 'Industrial Estate Area, Maddur-Mandya Corridor (Demonstration Marker)',
      addressKn: 'ಕೈಗಾರಿಕಾ ಪ್ರದೇಶ, ಮದ್ದೂರು-ಮಂಡ್ಯ ರಸ್ತೆ (ಪ್ರಾತ್ಯಕ್ಷಿಕೆ ಮಾದರಿ)',
      contactPhone: null,
      contactEmail: null,
      websiteUrl: null,
      servicesOfferedEn: ['Multi-commodity Cooling Chambers', 'Pre-cooling Crate Staging'],
      servicesOfferedKn: ['ಬಹು-ಬೆಳೆ ಶೀತಲ ಸಂಗ್ರಹಣೆ', 'ಕಾಯಿಪಲ್ಲೆ ಪೂರ್ವ-ಶೀತಲೀಕರಣ'],
      capacityNoteEn: 'Sample demonstration record only. Confirm active storage slots, tariff, and FSSAI/NHB accreditation locally or via Admin directory updates.',
      capacityNoteKn: 'ಇದು ಪ್ರಾತ್ಯಕ್ಷಿಕೆ ಮಾದರಿ ದಾಖಲೆ ಮಾತ್ರ. ಸ್ಥಳಾವಕಾಶ ಮತ್ತು ದರವನ್ನು ಸ್ಥಳೀಯವಾಗಿ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.',
      latitude: 12.5484,
      longitude: 76.9722,
      coordinatesVerified: false,
      verificationStatus: 'DEMONSTRATION_SAMPLE',
      sourceReference: 'KrishiSetu Demonstration Directory (Admin verification required)',
      active: true,
    },
    {
      id: 'svc-cold-kolar-demo',
      providerCode: 'demo-cold-kolar',
      serviceType: 'COLD_STORAGE',
      nameEn: 'Kolar Tomato & Vegetable Cold Store (Sample Entry)',
      nameKn: 'ಕೋಲಾರ ಟೊಮೆಟೊ ಮತ್ತು ತರಕಾರಿ ಶೀತಲ ಗೃಹ (ಮಾದರಿ ದಾಖಲೆ)',
      state: 'Karnataka',
      district: 'Kolar',
      addressEn: 'Near APMC Ring Road, Kolar (Demonstration Marker)',
      addressKn: 'ಎಪಿಎಂಸಿ ರಿಂಗ್ ರಸ್ತೆ ಹತ್ತಿರ, ಕೋಲಾರ (ಪ್ರಾತ್ಯಕ್ಷಿಕೆ ಮಾದರಿ)',
      contactPhone: null,
      contactEmail: null,
      websiteUrl: null,
      servicesOfferedEn: ['Horticulture Cold Rooms', 'Sorting & Grading Bay'],
      servicesOfferedKn: ['ತೋಟಗಾರಿಕೆ ಶೀತಲ ಕೊಠಡಿಗಳು', 'ವಿಂಗಡಣೆ ಮತ್ತು ಶ್ರೇಣೀಕರಣ'],
      capacityNoteEn: 'Sample demonstration entry until district cooperative or NHB-registered cold storage operators are verified by Admin.',
      capacityNoteKn: 'ನಿರ್ವಾಹಕರು ಪರಿಶೀಲಿಸಿದ ನೈಜ ದಾಖಲೆಗಳನ್ನು ಸೇರಿಸುವವರೆಗೆ ಇದು ಮಾದರಿ ಪ್ರಾತ್ಯಕ್ಷಿಕೆ ದಾಖಲೆಯಾಗಿದೆ.',
      latitude: 13.1362,
      longitude: 78.1292,
      coordinatesVerified: false,
      verificationStatus: 'DEMONSTRATION_SAMPLE',
      sourceReference: 'KrishiSetu Demonstration Directory',
      active: true,
    },
    {
      id: 'svc-rsk-maddur-demo',
      providerCode: 'rsk-maddur-desk',
      serviceType: 'INPUT_SEED_CENTRE',
      nameEn: 'Raitha Samparka Kendra (RSK) — Maddur Hobli Desk',
      nameKn: 'ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ (RSK) — ಮದ್ದೂರು ಹೋಬಳಿ',
      state: 'Karnataka',
      district: 'Mandya',
      addressEn: 'Maddur Taluk Agriculture Office Compound, Mandya District, Karnataka',
      addressKn: 'ಮದ್ದೂರು ತಾಲೂಕು ಕೃಷಿ ಕಚೇರಿ ಆವರಣ, ಮಂಡ್ಯ ಜಿಲ್ಲೆ, ಕರ್ನಾಟಕ',
      contactPhone: null,
      contactEmail: null,
      websiteUrl: 'https://raitamitra.karnataka.gov.in/',
      servicesOfferedEn: ['Subsidized Certified Seeds', 'Soil Health Card Application', 'Pest Diagnostic Referral'],
      servicesOfferedKn: ['ಸಬ್ಸಿಡಿ ಪ್ರಮಾಣಿತ ಬೀಜಗಳು', 'ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಕಾರ್ಡ್ ಅರ್ಜಿ', 'ಕೀಟ/ರೋಗ ತಪಾಸಣೆ ನೆರವು'],
      capacityNoteEn: 'Public Karnataka Department of Agriculture hobli-level service center.',
      capacityNoteKn: 'ಕರ್ನಾಟಕ ಕೃಷಿ ಇಲಾಖೆಯ ಹೋಬಳಿ ಮಟ್ಟದ ಸಾರ್ವಜನಿಕ ಸೇವಾ ಕೇಂದ್ರ.',
      latitude: 12.5844,
      longitude: 77.0439,
      coordinatesVerified: true,
      verificationStatus: 'VERIFIED_DIRECTORY',
      sourceReference: 'Department of Agriculture, Government of Karnataka (Raita Mitra)',
      active: true,
    },
    {
      id: 'svc-chc-mysuru-demo',
      providerCode: 'demo-chc-mysuru',
      serviceType: 'CUSTOM_HIRING_CENTRE',
      nameEn: 'Nanjangud Taluk Custom Hiring Centre (Sample Entry)',
      nameKn: 'ನಂಜನಗೂಡು ತಾಲೂಕು ಕೃಷಿ ಯಂತ್ರಧಾರೆ ಕೇಂದ್ರ (ಮಾದರಿ ದಾಖಲೆ)',
      state: 'Karnataka',
      district: 'Mysuru',
      addressEn: 'Hobli CHC Yard, Nanjangud Taluk, Mysuru (Demonstration Marker)',
      addressKn: 'ಹೋಬಳಿ ಕೃಷಿ ಯಂತ್ರಧಾರೆ ಕೇಂದ್ರ, ನಂಜನಗೂಡು, ಮೈಸೂರು (ಪ್ರಾತ್ಯಕ್ಷಿಕೆ ಮಾದರಿ)',
      contactPhone: null,
      contactEmail: null,
      websiteUrl: null,
      servicesOfferedEn: ['Tractor & Rotavator Hiring', 'Paddy Transplanter Scheduling'],
      servicesOfferedKn: ['ಟ್ರ್ಯಾಕ್ಟರ್ ಮತ್ತು ರೋಟೋವೇಟರ್ ಬಾಡಿಗೆ', 'ಭತ್ತ ನಾಟಿ ಯಂತ್ರ'],
      capacityNoteEn: 'Sample listing illustrating Krishi Yantradhare CHC layout. Verify local taluk rates directly.',
      capacityNoteKn: 'ಸ್ಥಳೀಯ ಕೃಷಿ ಯಂತ್ರಧಾರೆ ಕೇಂದ್ರದ ದರವನ್ನು ನೇರವಾಗಿ ಪರಿಶೀಲಿಸಿ.',
      latitude: 12.1195,
      longitude: 76.6821,
      coordinatesVerified: false,
      verificationStatus: 'DEMONSTRATION_SAMPLE',
      sourceReference: 'KrishiSetu Demonstration Directory',
      active: true,
    },
  ];
}

export function loadSeedEquipmentListings(): EquipmentListingRecord[] {
  return [
    {
      id: 'eq-tractor-mandya-demo',
      listingCode: 'chc-tractor-45hp-mandya',
      category: 'TRACTOR',
      equipmentNameEn: '45–50 HP Agricultural Tractor with 7-Tyne Cultivator',
      equipmentNameKn: '45–50 ಎಚ್‌ಪಿ ಕೃಷಿ ಟ್ರ್ಯಾಕ್ಟರ್ (ಕಲ್ಟಿವೇಟರ್ ಸಹಿತ)',
      modelOrSpecEn: '4WD / 2WD utility tractor suited for red & loam soils, land preparation, and haulage.',
      modelOrSpecKn: 'ಕೆಂಪು ಮತ್ತು ಮರಳು ಮಿಶ್ರಿತ ಮಣ್ಣಿನಲ್ಲಿ ಉಳುಮೆ ಮತ್ತು ಸಾಗಣೆಗೆ ಸೂಕ್ತವಾದ ಟ್ರ್ಯಾಕ್ಟರ್.',
      providerNameEn: 'Maddur Hobli Farmers CHC (Demonstration Listing)',
      providerNameKn: 'ಮದ್ದೂರು ಹೋಬಳಿ ರೈತ ಯಂತ್ರಧಾರೆ (ಪ್ರಾತ್ಯಕ್ಷಿಕೆ ಪಟ್ಟಿ)',
      state: 'Karnataka',
      district: 'Mandya',
      contactPhone: null,
      rateInr: null,
      rateUnit: 'HOUR',
      rateVerified: false,
      availabilityStatus: 'UNVERIFIED',
      verificationStatus: 'DEMONSTRATION_SAMPLE',
      sourceReference: 'Demonstration listing — Admin can verify local CHC hourly rate',
      active: true,
    },
    {
      id: 'eq-harvester-raichur-demo',
      listingCode: 'chc-combine-harvester-raichur',
      category: 'HARVESTER',
      equipmentNameEn: 'Track-Mounted Paddy Combine Harvester',
      equipmentNameKn: 'ಟ್ರ್ಯಾಕ್ ಆಧಾರಿತ ಭತ್ತದ ಕೊಯ್ಲು ಯಂತ್ರ (ಹಾರ್ವೆಸ್ಟರ್)',
      modelOrSpecEn: 'Self-propelled track harvester suited for wet/irrigated paddy blocks during Kharif & Rabi harvests.',
      modelOrSpecKn: 'ಖಾರಿಫ್ ಮತ್ತು ರಬಿ ಭತ್ತದ ಗದ್ದೆಗಳಲ್ಲಿ ಕೊಯ್ಲಿಗೆ ಸೂಕ್ತವಾದ ಯಂತ್ರ.',
      providerNameEn: 'Tungabhadra Command CHC Hub (Demonstration Listing)',
      providerNameKn: 'ತುಂಗಭದ್ರಾ ಅಚ್ಚುಕಟ್ಟು ಯಂತ್ರಧಾರೆ (ಪ್ರಾತ್ಯಕ್ಷಿಕೆ ಪಟ್ಟಿ)',
      state: 'Karnataka',
      district: 'Raichur',
      contactPhone: null,
      rateInr: null,
      rateUnit: 'HOUR',
      rateVerified: false,
      availabilityStatus: 'SEASONAL_DEMAND',
      verificationStatus: 'DEMONSTRATION_SAMPLE',
      sourceReference: 'Demonstration listing — contact local CHC for harvest slot & rate',
      active: true,
    },
    {
      id: 'eq-rotavator-dharwad-demo',
      listingCode: 'chc-rotavator-dharwad',
      category: 'OTHER',
      equipmentNameEn: 'Tractor-Mounted Rotavator & Seed-Cum-Fertilizer Drill',
      equipmentNameKn: 'ರೋಟೋವೇಟರ್ ಮತ್ತು ಬೀಜ-ಗೊಬ್ಬರ ಬಿತ್ತನೆ ಯಂತ್ರ',
      modelOrSpecEn: 'Fine seedbed preparation and line sowing for soybean, tur, and groundnut.',
      modelOrSpecKn: 'ಸೋಯಾಬೀನ್, ತೊಗರಿ ಮತ್ತು ಶೇಂಗಾ ಬೆಳೆಗಳಿಗೆ ಸಾಲು ಬಿತ್ತನೆ ಮತ್ತು ಮಣ್ಣು ಸಿದ್ಧತೆ ಯಂತ್ರ.',
      providerNameEn: 'Dharwad District CHC Cooperative (Demonstration Listing)',
      providerNameKn: 'ಧಾರವಾಡ ಜಿಲ್ಲಾ ಯಂತ್ರಧಾರೆ ಸಹಕಾರ ಕೇಂದ್ರ (ಪ್ರಾತ್ಯಕ್ಷಿಕೆ ಪಟ್ಟಿ)',
      state: 'Karnataka',
      district: 'Dharwad',
      contactPhone: null,
      rateInr: null,
      rateUnit: 'ACRE',
      rateVerified: false,
      availabilityStatus: 'UNVERIFIED',
      verificationStatus: 'DEMONSTRATION_SAMPLE',
      sourceReference: 'Demonstration listing — awaiting Admin verification of current seasonal tariff',
      active: true,
    },
    {
      id: 'eq-sprayer-hassan-demo',
      listingCode: 'chc-power-sprayer-hassan',
      category: 'OTHER',
      equipmentNameEn: 'Tractor Boom / Portable Orchard Power Sprayer',
      equipmentNameKn: 'ಟ್ರ್ಯಾಕ್ಟರ್ ಬೂಮ್ / ಪವರ್ ಸ್ಪ್ರೇಯರ್ ಯಂತ್ರ',
      modelOrSpecEn: 'Uniform foliar spray coverage for field crops and vegetable rows.',
      modelOrSpecKn: 'ಹೊಲದ ಬೆಳೆಗಳು ಮತ್ತು ತರಕಾರಿ ಸಾಲುಗಳಿಗೆ ಸಮಾನವಾಗಿ ಸಿಂಪಡಿಸುವ ಯಂತ್ರ.',
      providerNameEn: 'Hassan FPO Custom Hiring Desk (Demonstration Listing)',
      providerNameKn: 'ಹಾಸನ ಎಫ್‌ಪಿಒ ಯಂತ್ರ ಬಾಡಿಗೆ ಕೇಂದ್ರ (ಪ್ರಾತ್ಯಕ್ಷಿಕೆ ಪಟ್ಟಿ)',
      state: 'Karnataka',
      district: 'Hassan',
      contactPhone: null,
      rateInr: null,
      rateUnit: 'DAY',
      rateVerified: false,
      availabilityStatus: 'UNVERIFIED',
      verificationStatus: 'DEMONSTRATION_SAMPLE',
      sourceReference: 'Demonstration listing — verify tariff & chemical safety protocols directly',
      active: true,
    },
  ];
}

export function filterProviders(
  list: AgriServiceProviderRecord[],
  query: {
    serviceTypes?: ServiceProviderType[];
    state?: string;
    district?: string;
    q?: string;
  },
) {
  const stateLower = query.state?.trim().toLowerCase() || '';
  const districtLower = query.district?.trim().toLowerCase() || '';
  const qLower = query.q?.trim().toLowerCase() || '';
  const allowedTypes = query.serviceTypes?.length ? new Set(query.serviceTypes) : null;

  return list
    .filter((item) => item.active)
    .filter((item) => {
      if (allowedTypes && !allowedTypes.has(item.serviceType)) return false;
      if (stateLower && !item.state.toLowerCase().includes(stateLower)) return false;
      if (districtLower && !item.district.toLowerCase().includes(districtLower)) return false;
      if (qLower) {
        const hay = [
          item.nameEn,
          item.nameKn,
          item.district,
          item.state,
          item.addressEn,
          ...item.servicesOfferedEn,
          ...item.servicesOfferedKn,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(qLower)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Verified directories appear first cleanly
      if (a.verificationStatus !== b.verificationStatus) {
        return a.verificationStatus === 'VERIFIED_DIRECTORY' ? -1 : 1;
      }
      return a.nameEn.localeCompare(b.nameEn);
    });
}

export function filterEquipmentListings(
  list: EquipmentListingRecord[],
  query: {
    category?: string;
    state?: string;
    district?: string;
    q?: string;
  },
) {
  const cat = query.category?.trim().toUpperCase() || '';
  const stateLower = query.state?.trim().toLowerCase() || '';
  const districtLower = query.district?.trim().toLowerCase() || '';
  const qLower = query.q?.trim().toLowerCase() || '';

  return list
    .filter((item) => item.active)
    .filter((item) => {
      if (cat && cat !== 'ALL' && item.category !== cat) return false;
      if (stateLower && !item.state.toLowerCase().includes(stateLower)) return false;
      if (districtLower && !item.district.toLowerCase().includes(districtLower)) return false;
      if (qLower) {
        const hay = [
          item.equipmentNameEn,
          item.equipmentNameKn,
          item.modelOrSpecEn,
          item.providerNameEn,
          item.district,
          item.state,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(qLower)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.verificationStatus !== b.verificationStatus) {
        return a.verificationStatus === 'VERIFIED_DIRECTORY' ? -1 : 1;
      }
      return a.equipmentNameEn.localeCompare(b.equipmentNameEn);
    });
}

export function buildBookingRequestRecord(params: {
  userId: string;
  farmerName: string;
  listing: EquipmentListingRecord;
  requestedDate: string;
  durationValue: number;
  durationUnit: 'HOURS' | 'ACRES' | 'DAYS';
  contactPhone: string;
  notes: string | null;
}): EquipmentBookingRecord {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    userId: params.userId,
    farmerName: params.farmerName,
    equipmentId: params.listing.id,
    equipmentNameEn: params.listing.equipmentNameEn,
    equipmentNameKn: params.listing.equipmentNameKn,
    providerNameEn: params.listing.providerNameEn,
    district: params.listing.district,
    state: params.listing.state,
    requestedDate: params.requestedDate,
    durationValue: params.durationValue,
    durationUnit: params.durationUnit,
    contactPhone: params.contactPhone,
    notes: params.notes,
    status: 'REQUESTED',
    confirmationNote:
      'Logged as a booking request only — not a confirmed reservation. Wait for provider or CHC confirmation by phone.',
    adminNote: null,
    createdAt: now,
    updatedAt: now,
  };
}
