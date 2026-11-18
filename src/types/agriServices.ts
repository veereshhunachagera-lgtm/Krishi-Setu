export type VerificationTier = 'VERIFIED_DIRECTORY' | 'DEMONSTRATION_SAMPLE';

export type ServiceProviderType =
  | 'SOIL_LAB_KVK'
  | 'COLD_STORAGE'
  | 'MANDI_APMC'
  | 'CUSTOM_HIRING_CENTRE'
  | 'INPUT_SEED_CENTRE'
  | 'EXTENSION_BANK';

export interface AgriServiceProvider {
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

export interface SoilTestingChecklistItem {
  step: number;
  titleEn: string;
  titleKn: string;
  detailEn: string;
  detailKn: string;
}

export interface SoilLabsResponse {
  providers: AgriServiceProvider[];
  checklist: SoilTestingChecklistItem[];
  availableStates: string[];
  availableDistricts: string[];
}

export interface DirectoryResponse {
  providers: AgriServiceProvider[];
  availableStates: string[];
  availableDistricts: string[];
}

export type EquipmentCategory = 'TRACTOR' | 'HARVESTER' | 'OTHER';

export interface EquipmentListing {
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

export interface EquipmentCatalogResponse {
  listings: EquipmentListing[];
  availableStates: string[];
  availableDistricts: string[];
}

export type BookingRequestStatus =
  | 'REQUESTED'
  | 'REVIEWING'
  | 'FORWARDED_TO_PROVIDER'
  | 'COMPLETED'
  | 'CANCELLED';

export interface EquipmentBookingRequest {
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
