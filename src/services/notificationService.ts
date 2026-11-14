import { apiRequest } from './apiClient';
import type { NotificationItem } from '../types/notification';

export const notificationService = {
  list(): Promise<NotificationItem[]> {
    return apiRequest<NotificationItem[]>('/api/v1/notifications');
  },

  markRead(id: string): Promise<NotificationItem> {
    return apiRequest<NotificationItem>(`/api/v1/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  markAllRead(): Promise<void> {
    return apiRequest<void>('/api/v1/notifications/read-all', {
      method: 'PATCH',
    });
  },
};
