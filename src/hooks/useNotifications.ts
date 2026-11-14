import { useCallback, useEffect, useState } from 'react';
import { notificationService } from '../services/notificationService';
import type { NotificationItem } from '../types/notification';

export function useNotifications(enabled: boolean) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const data = await notificationService.list();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'errors.generic');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  const markRead = useCallback(async (id: string) => {
    const updated = await notificationService.markRead(id);
    setItems((prev) => prev.map((n) => (n.id === id ? updated : n)));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationService.markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = items.filter((n) => !n.read).length;

  return {
    items,
    unreadCount,
    loading,
    error,
    reload,
    markRead,
    markAllRead,
  };
}
