/**
 * Notifications API Client
 */
import { httpClient } from './httpClient.js';

export const notificationsApi = {
  getAll: (params) => httpClient.get('/notifications', params),
  getUnreadCount: () => httpClient.get('/notifications/unread-count'),
  markAsRead: (id) => httpClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () => httpClient.patch('/notifications/read-all')
};
