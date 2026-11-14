export type LandUnit = 'ACRES' | 'HECTARES' | 'GUNTAS';

export type SoilType =
  | 'BLACK'
  | 'RED'
  | 'ALLUVIAL'
  | 'LATERITE'
  | 'SANDY_LOAM'
  | 'UNKNOWN';

export type IrrigationSource =
  | 'RAINFED'
  | 'BOREWELL'
  | 'CANAL'
  | 'DRIP_SPRINKLER'
  | 'OPEN_WELL'
  | 'TANK_POND'
  | 'UNKNOWN';

export type GrowingSeason = 'KHARIF' | 'RABI' | 'ZAID' | 'PERENNIAL' | 'UNKNOWN';

export interface SoilReportInput {
  nitrogenKgPerHa: string;
  phosphorusKgPerHa: string;
  potassiumKgPerHa: string;
  phLevel: string;
  nitrogenUnknown: boolean;
  phosphorusUnknown: boolean;
  potassiumUnknown: boolean;
  phUnknown: boolean;
  labName: string;
  sampleDate: string;
}

export interface SoilReportDto {
  nitrogenKgPerHa: number | null;
  phosphorusKgPerHa: number | null;
  potassiumKgPerHa: number | null;
  phLevel: number | null;
  nitrogenUnknown: boolean;
  phosphorusUnknown: boolean;
  potassiumUnknown: boolean;
  phUnknown: boolean;
  labName: string | null;
  sampleDate: string | null;
}

export interface FarmerProfile {
  id: string;
  userId: string;
  hasSoilReport: boolean;
  farmerName: string;
  email: string;
  state: string | null;
  district: string | null;
  village: string | null;
  landSize: number | null;
  landUnit: LandUnit | null;
  soilType: SoilType | null;
  irrigationSource: IrrigationSource | null;
  currentOrPreviousCrop: string | null;
  growingSeason: GrowingSeason | null;
  soilReport: SoilReportDto | null;
  updatedAt: string;
}

export interface FarmerProfilePayload {
  hasSoilReport: boolean;
  farmerName?: string;
  state?: string;
  district?: string;
  village?: string;
  landSize?: number | null;
  landUnit?: LandUnit | null;
  soilType?: SoilType | null;
  irrigationSource?: IrrigationSource | null;
  currentOrPreviousCrop?: string;
  growingSeason?: GrowingSeason | null;
  soilReport?: SoilReportDto | null;
}
