import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { NotificationItem } from '../types/notification';
import { cn } from '../utils/cn';
import { Button } from './Button';
import { EmptyState, LoadingSkeleton } from './StatePanels';

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
  items: NotificationItem[];
  loading: boolean;
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
}

export function NotificationDrawer({
  open,
  onClose,
  items,
  loading,
  onMarkRead,
  onMarkAllRead,
}: NotificationDrawerProps) {
  const { t } = useTranslation();

  if (!open) return null;

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={t('notifications.title')}>
      <div className="fixed inset-0 bg-[#0F291E]/30 backdrop-blur-[1px]" onClick={onClose} />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-[#E5E1D8] bg-[#FAF8F4] shadow-xl">
        <div className="flex items-center justify-between gap-4 border-b border-[#E5E1D8] bg-white px-5 py-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Bell className="h-5 w-5 text-[#1B4332] shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <h2 className="font-display text-base font-semibold text-[#17221B] truncate">
                {t('notifications.title')}
              </h2>
              {unreadCount > 0 && (
                <p className="text-xs text-[#4A5A50] tabular-nums">
                  {t('notifications.unreadCount', { count: unreadCount })}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onMarkAllRead}>
                <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {t('notifications.markAllRead')}
              </Button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#4A5A50] hover:bg-[#F2EFE8] hover:text-[#17221B] cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <LoadingSkeleton rows={3} />
          ) : items.length === 0 ? (
            <EmptyState
              title={t('notifications.emptyTitle')}
              description={t('notifications.emptyBody')}
            />
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'rounded-xl border p-4 transition-colors',
                  item.read
                    ? 'border-[#E5E1D8] bg-white/70'
                    : 'border-[#2D6A4F]/35 bg-white shadow-xs',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[#17221B]">{t(item.titleKey)}</p>
                    <p className="text-sm text-[#4A5A50] leading-relaxed">{t(item.messageKey)}</p>
                    <p className="pt-1 text-xs text-[#748379] tabular-nums">
                      {item.category} · {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {!item.read && (
                    <button
                      type="button"
                      onClick={() => onMarkRead(item.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-[#E5E1D8] bg-[#FAF8F4] px-2.5 py-1 text-xs font-medium text-[#1B4332] hover:bg-[#E7F1EC] whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Check className="h-3 w-3" aria-hidden="true" />
                      {t('notifications.markRead')}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
