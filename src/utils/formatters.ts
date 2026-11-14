import type { TFunction } from 'i18next';
import type { LandUnit } from '../types/farmer';

export function sanitizeDecimalInput(raw: string): string {
  // Allow digits and at most one decimal point so farmers can type numbers freely
  const cleaned = raw.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length <= 1) return cleaned;
  return `${parts[0]}.${parts.slice(1).join('')}`;
}

export function formatLandUnit(unit: LandUnit | string | null | undefined, t: TFunction): string {
  if (!unit) return '';
  switch (unit) {
    case 'ACRES':
      return t('common.acres');
    case 'HECTARES':
      return t('common.hectares');
    case 'GUNTAS':
      return t('common.guntas');
    default:
      return unit;
  }
}

export function formatLandArea(
  size: number | null | undefined,
  unit: LandUnit | string | null | undefined,
  t: TFunction,
): string {
  if (size === null || size === undefined) return t('common.notProvided');
  const unitLabel = formatLandUnit(unit || 'ACRES', t);
  return `${size} ${unitLabel}`.trim();
}

export function getLandConversionSummary(
  rawSize: string,
  unit: LandUnit,
  t: TFunction,
): string | null {
  const value = Number(rawSize);
  if (!rawSize.trim() || Number.isNaN(value) || value <= 0) return null;

  let acres = value;
  if (unit === 'HECTARES') {
    acres = value * 2.47105;
  } else if (unit === 'GUNTAS') {
    acres = value / 40;
  }

  const guntas = acres * 40;
  const hectares = acres / 2.47105;

  if (unit === 'ACRES') {
    return `${Math.round(guntas * 10) / 10} ${t('common.guntas')} · ${hectares.toFixed(2)} ${t('common.hectares')}`;
  }
  if (unit === 'GUNTAS') {
    return `${acres.toFixed(2)} ${t('common.acres')} · ${hectares.toFixed(2)} ${t('common.hectares')}`;
  }
  return `${acres.toFixed(2)} ${t('common.acres')} · ${Math.round(guntas * 10) / 10} ${t('common.guntas')}`;
}
