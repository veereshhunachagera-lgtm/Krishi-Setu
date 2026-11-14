import React from 'react';
import { cn } from '../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]',
        variant === 'primary' &&
          'bg-[#1B4332] text-white hover:bg-[#143627] active:bg-[#0F291E]',
        variant === 'secondary' &&
          'bg-white text-[#17221B] border border-[#E5E1D8] hover:bg-[#F2EFE8]',
        variant === 'ghost' &&
          'bg-transparent text-[#4A5A50] hover:text-[#17221B] hover:bg-[#F2EFE8]',
        variant === 'danger' &&
          'bg-[#DC2626] text-white hover:bg-[#B91C1C]',
        size === 'sm' && 'px-3 py-1.5 text-xs min-h-[36px]',
        size === 'md' && 'px-4 py-2 text-sm min-h-[42px]',
        size === 'lg' && 'px-5 py-2.5 text-sm min-h-[46px]',
        className,
      )}
    >
      {children}
    </button>
  );
}
