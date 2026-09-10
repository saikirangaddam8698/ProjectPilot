/**
 * Notification Store — Pinia store for in-app notifications and unread badges
 */
import { defineStore } from 'pinia';
import { notificationsApi } from '../services/api/notifications.api.js';

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    isMarking: false,
    filter: 'ALL', // 'ALL' | 'UNREAD'
    _pollTimer: null
  }),

  getters: {
    hasUnread: (state) => state.unreadCount > 0,
    filteredNotifications: (state) => {
      if (state.filter === 'UNREAD') {
        return state.notifications.filter((n) => !n.read);
      }
      return state.notifications;
    }
  },

  actions: {
    /**
     * Fetch user notifications and update unread count
     */
    async fetchNotifications() {
      this.isLoading = true;
      try {
        const res = await notificationsApi.getAll();
        const data = res?.data !== undefined ? res.data : res;
        this.notifications = Array.isArray(data?.notifications)
          ? data.notifications
          : Array.isArray(data)
            ? data
            : [];
        this.unreadCount = typeof data?.unreadCount === 'number'
          ? data.unreadCount
          : this.notifications.filter((n) => !n.read).length;
      } catch (err) {
        console.error('[NotificationStore.fetchNotifications] Error:', err);
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Fast background check for unread count badge
     */
    async fetchUnreadCount() {
      try {
        const res = await notificationsApi.getUnreadCount();
        const data = res?.data !== undefined ? res.data : res;
        if (typeof data?.count === 'number') {
          this.unreadCount = data.count;
        }
      } catch (err) {
        console.error('[NotificationStore.fetchUnreadCount] Error:', err);
      }
    },

    /**
     * Mark a single notification as read
     */
    async markAsRead(notificationId) {
      if (!notificationId) return;

      // Optimistic update
      const item = this.notifications.find((n) => n.id === notificationId);
      if (item && !item.read) {
        item.read = true;
        if (this.unreadCount > 0) this.unreadCount--;
      }

      try {
        await notificationsApi.markAsRead(notificationId);
      } catch (err) {
        console.error('[NotificationStore.markAsRead] Error:', err);
      }
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
      this.isMarking = true;
      // Optimistic update
      this.notifications.forEach((n) => {
        n.read = true;
      });
      this.unreadCount = 0;

      try {
        await notificationsApi.markAllAsRead();
      } catch (err) {
        console.error('[NotificationStore.markAllAsRead] Error:', err);
      } finally {
        this.isMarking = false;
      }
    },

    /**
     * Change active tab filter ('ALL' | 'UNREAD')
     */
    setFilter(newFilter) {
      if (['ALL', 'UNREAD'].includes(newFilter)) {
        this.filter = newFilter;
      }
    },

    /**
     * Fetch unread count on demand (recurring background polling disabled)
     */
    startPolling() {
      this.stopPolling();
      this.fetchUnreadCount();
    },

    /**
     * Stop background polling
     */
    stopPolling() {
      if (this._pollTimer) {
        clearInterval(this._pollTimer);
        this._pollTimer = null;
      }
    }
  }
});
