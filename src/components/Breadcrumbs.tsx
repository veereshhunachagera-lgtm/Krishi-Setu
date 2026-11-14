import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react';
import { cn } from '../utils/cn';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center flex-wrap gap-1.5 text-sm', className)}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <Fragment key={`${item.label}-${idx}`}>
            {idx > 0 && <ChevronRight className="h-4 w-4 text-[#748379] shrink-0" aria-hidden="true" />}
            {isLast || !item.onClick ? (
              <span
                className={cn(
                  'truncate max-w-[260px]',
                  isLast ? 'font-medium text-[#17221B]' : 'text-[#4A5A50]',
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={item.onClick}
                className="text-[#4A5A50] hover:text-[#1B4332] hover:underline underline-offset-4 transition-colors cursor-pointer truncate max-w-[220px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]"
              >
                {item.label}
              </button>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
