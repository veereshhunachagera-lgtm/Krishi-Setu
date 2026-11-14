import type { SoilReportInput } from '../types/farmer';

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export interface SoilValidationResult {
  errors: Record<string, string>;
  hasAnyKnownOrUnknown: boolean;
}

export function validateSoilReportInput(input: SoilReportInput): SoilValidationResult {
  const errors: Record<string, string> = {};

  if (!input.nitrogenUnknown && input.nitrogenKgPerHa.trim() !== '') {
    const val = Number(input.nitrogenKgPerHa);
    if (Number.isNaN(val) || val < 0 || val > 1000) {
      errors.nitrogenKgPerHa = 'validation.nitrogenRange';
    }
  }

  if (!input.phosphorusUnknown && input.phosphorusKgPerHa.trim() !== '') {
    const val = Number(input.phosphorusKgPerHa);
    if (Number.isNaN(val) || val < 0 || val > 400) {
      errors.phosphorusKgPerHa = 'validation.phosphorusRange';
    }
  }

  if (!input.potassiumUnknown && input.potassiumKgPerHa.trim() !== '') {
    const val = Number(input.potassiumKgPerHa);
    if (Number.isNaN(val) || val < 0 || val > 1200) {
      errors.potassiumKgPerHa = 'validation.potassiumRange';
    }
  }

  if (!input.phUnknown && input.phLevel.trim() !== '') {
    const val = Number(input.phLevel);
    if (Number.isNaN(val) || val < 3.5 || val > 10.0) {
      errors.phLevel = 'validation.phRange';
    }
  }

  const anyEntered =
    (!input.nitrogenUnknown && input.nitrogenKgPerHa.trim() !== '') ||
    (!input.phosphorusUnknown && input.phosphorusKgPerHa.trim() !== '') ||
    (!input.potassiumUnknown && input.potassiumKgPerHa.trim() !== '') ||
    (!input.phUnknown && input.phLevel.trim() !== '');

  const allMarkedUnknown =
    input.nitrogenUnknown &&
    input.phosphorusUnknown &&
    input.potassiumUnknown &&
    input.phUnknown;

  if (!anyEntered && !allMarkedUnknown) {
    errors.soilSummary = 'validation.soilAtLeastOne';
  }

  return {
    errors,
    hasAnyKnownOrUnknown: anyEntered || allMarkedUnknown,
  };
}
