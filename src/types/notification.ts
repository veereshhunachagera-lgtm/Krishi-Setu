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
