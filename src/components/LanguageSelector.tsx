import { Languages } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../i18n';
import { useAuth } from '../hooks/useAuth';
import type { SupportedLanguage } from '../types/auth';
import { cn } from '../utils/cn';

interface LanguageSelectorProps {
  compact?: boolean;
  className?: string;
}

export function LanguageSelector({ compact = false, className }: LanguageSelectorProps) {
  const { language, switchLanguage } = useAuth();

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border border-[#E5E1D8] bg-white p-0.5 shrink-0',
        className,
      )}
      role="group"
      aria-label="Language selector"
    >
      {!compact && (
        <span className="hidden sm:inline-flex items-center pl-2 pr-1 text-[#748379]">
          <Languages className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      )}
      {SUPPORTED_LANGUAGES.map((opt) => {
        const active = language === opt.code;
        return (
          <button
            key={opt.code}
            type="button"
            onClick={() => switchLanguage(opt.code as SupportedLanguage)}
            aria-pressed={active}
            className={cn(
              'px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]',
              active
                ? 'bg-[#1B4332] text-white'
                : 'text-[#4A5A50] hover:text-[#17221B] hover:bg-[#FAF8F4]',
            )}
          >
            {opt.nativeLabel}
          </button>
        );
      })}
    </div>
  );
}
