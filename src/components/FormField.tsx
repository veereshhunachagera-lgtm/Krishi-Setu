import React from 'react';
import { cn } from '../utils/cn';

interface FormFieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="block text-sm font-medium text-[#17221B]">
          {label}
          {required && <span className="ml-1 text-[#B45309]" aria-hidden="true">*</span>}
        </label>
        {hint && <span className="text-xs text-[#748379]">{hint}</span>}
      </div>
      {children}
      {error && (
        <p role="alert" className="text-xs font-medium text-[#B91C1C]">
          {error}
        </p>
      )}
    </div>
  );
}

export const inputBaseClass =
  'w-full rounded-lg border border-[#E5E1D8] bg-white px-3.5 py-2.5 text-sm text-[#17221B] placeholder:text-[#748379] transition-colors focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/15 disabled:bg-[#F2EFE8] disabled:text-[#748379] min-h-[44px]';
