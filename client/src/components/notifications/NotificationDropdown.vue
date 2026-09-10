<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationStore } from '@/stores/notification.store.js';
import BaseLoader from '@/components/ui/BaseLoader.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const emit = defineEmits(['close']);

const router = useRouter();
const notificationStore = useNotificationStore();

const notifications = computed(() => notificationStore.filteredNotifications);
const unreadCount = computed(() => notificationStore.unreadCount);

function formatRelativeTime(iso) {
  if (!iso) return '';
  const now = new Date();
  const date = new Date(iso);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getTypeIcon(type) {
  switch (type) {
    case 'TICKET_ASSIGNED': return '🎯';
    case 'TICKET_REOPENED': return '🔄';
    case 'USER_MENTIONED': return '💬';
    case 'COMMENT_ADDED': return '📝';
    case 'SPRINT_STARTED': return '🚀';
    case 'SPRINT_COMPLETED': return '🏁';
    default: return '⚡';
  }
}

function getTypeClass(type) {
  switch (type) {
    case 'TICKET_ASSIGNED': return 'badge-assigned';
    case 'TICKET_REOPENED': return 'badge-reopened';
    case 'USER_MENTIONED': return 'badge-mentioned';
    case 'COMMENT_ADDED': return 'badge-comment';
    case 'SPRINT_STARTED': return 'badge-sprint';
    case 'SPRINT_COMPLETED': return 'badge-success';
    default: return 'badge-default';
  }
}

async function handleNotificationClick(n) {
  if (!n.read) {
    await notificationStore.markAsRead(n.id);
  }
  emit('close');

  if (n.link) {
    router.push(n.link);
  }
}

async function handleMarkAllAsRead() {
  await notificationStore.markAllAsRead();
}
</script>

<template>
  <div class="notification-dropdown-card" role="dialog" aria-label="Notifications Flyout">
    <!-- Dropdown Header -->
    <div class="dropdown-head">
      <div class="head-title-row">
        <h3 class="head-title">Notifications</h3>
        <span v-if="unreadCount > 0" class="unread-pill">
          {{ unreadCount }} new
        </span>
      </div>

      <button
        v-if="unreadCount > 0"
        type="button"
        class="mark-all-btn"
        :disabled="notificationStore.isMarking"
        @click="handleMarkAllAsRead"
      >
        <span v-if="notificationStore.isMarking">Marking...</span>
        <span v-else>Mark all as read</span>
      </button>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <button
        type="button"
        class="tab-btn"
        :class="{ active: notificationStore.filter === 'ALL' }"
        @click="notificationStore.setFilter('ALL')"
      >
        All <span class="tab-badge">{{ notificationStore.notifications.length }}</span>
      </button>
      <button
        type="button"
        class="tab-btn"
        :class="{ active: notificationStore.filter === 'UNREAD' }"
        @click="notificationStore.setFilter('UNREAD')"
      >
        Unread <span class="tab-badge">{{ unreadCount }}</span>
      </button>
    </div>

    <!-- Dropdown Body -->
    <div class="dropdown-body">
      <!-- Loading state -->
      <div v-if="notificationStore.isLoading" class="loading-state">
        <BaseLoader size="sm" message="Fetching alerts..." inline />
      </div>

      <!-- Empty state -->
      <div v-else-if="notifications.length === 0" class="empty-state">
        <div class="empty-icon">✨</div>
        <h4 class="empty-title">All caught up!</h4>
        <p class="empty-text text-muted">
          {{ notificationStore.filter === 'UNREAD' ? 'You have no unread notifications.' : 'No notifications to display right now.' }}
        </p>
      </div>

      <!-- Notification list items -->
      <ul v-else class="notifications-list">
        <li
          v-for="n in notifications"
          :key="n.id"
          class="notification-item"
          :class="{ 'is-unread': !n.read }"
          @click="handleNotificationClick(n)"
        >
          <!-- Type Icon Badge -->
          <div class="notif-icon-wrap" :class="getTypeClass(n.type)">
            <span>{{ getTypeIcon(n.type) }}</span>
          </div>

          <!-- Content Details -->
          <div class="notif-content">
            <div class="notif-title-row">
              <span class="notif-title" :class="{ 'font-semibold': !n.read }">
                {{ n.title }}
              </span>
              <span class="notif-time text-muted">{{ formatRelativeTime(n.createdAt) }}</span>
            </div>

            <p class="notif-message">
              {{ n.message }}
            </p>

            <div class="notif-footer-meta">
              <span class="notif-actor text-muted">
                {{ n.actor?.name || 'System' }}
              </span>
              <span v-if="n.link" class="view-link text-primary font-medium">
                View details →
              </span>
            </div>
          </div>

          <!-- Unread Indicator Dot -->
          <div v-if="!n.read" class="unread-dot" title="Unread notification"></div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.notification-dropdown-card {
  position: absolute;
  top: calc(100% + 8px);
  right: -50px;
  width: 380px;
  max-width: 92vw;
  background-color: #ffffff;
  border: 1px solid var(--border-default, #cbd5e1);
  border-radius: var(--radius-xl, 16px);
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.22), 0 4px 12px rgba(15, 23, 42, 0.08);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: dropdownPop 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

:root[data-theme='dark'] .notification-dropdown-card,
.dark .notification-dropdown-card {
  background-color: #141a29;
  border-color: #252e3d;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08);
}

@keyframes dropdownPop {
  0% {
    opacity: 0;
    transform: translateY(-8px) scale(0.97);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Header */
.dropdown-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px 16px;
  background-color: #ffffff;
  border-bottom: 1px solid var(--border-subtle, #e2e8f0);
}

:root[data-theme='dark'] .dropdown-head,
.dark .dropdown-head {
  background-color: #141a29;
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.head-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.head-title {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.01em;
}

.unread-pill {
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, var(--color-primary-500, #6366f1), #8b5cf6);
  padding: 1px 7px;
  border-radius: var(--radius-full, 9999px);
}

.mark-all-btn {
  background: transparent;
  border: none;
  color: var(--color-primary-600, #4f46e5);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: var(--radius-xs, 4px);
  transition: all 0.15s ease;
}

:root[data-theme='dark'] .mark-all-btn,
.dark .mark-all-btn {
  color: var(--color-primary-400, #818cf8);
}

.mark-all-btn:hover:not(:disabled) {
  color: var(--color-primary-500, #6366f1);
  text-decoration: underline;
}

.mark-all-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  padding: 6px 16px;
  gap: 8px;
  background-color: #f8fafc;
  border-bottom: 1px solid var(--border-subtle, #e2e8f0);
}

:root[data-theme='dark'] .filter-tabs,
.dark .filter-tabs {
  background-color: #0d121d;
  border-bottom-color: rgba(255, 255, 255, 0.06);
}

.tab-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  color: var(--text-primary);
  background: rgba(0, 0, 0, 0.05);
}

:root[data-theme='dark'] .tab-btn:hover,
.dark .tab-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.tab-btn.active {
  color: var(--color-primary-600, #4f46e5);
  background: #eef2ff;
  font-weight: 600;
}

:root[data-theme='dark'] .tab-btn.active,
.dark .tab-btn.active {
  color: var(--color-primary-300, #a5b4fc);
  background: rgba(99, 102, 241, 0.2);
}

.tab-badge {
  font-size: 10px;
  background: rgba(0, 0, 0, 0.07);
  padding: 0 5px;
  border-radius: 10px;
}

:root[data-theme='dark'] .tab-badge,
.dark .tab-badge {
  background: rgba(255, 255, 255, 0.12);
}

/* Body */
.dropdown-body {
  max-height: 400px;
  overflow-y: auto;
  overscroll-behavior: contain;
  background-color: #ffffff;
}

:root[data-theme='dark'] .dropdown-body,
.dark .dropdown-body {
  background-color: #141a29;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32px 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 36px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.empty-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.empty-text {
  font-size: 12px;
  margin: 0;
}

/* Notification List */
.notifications-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle, #f1f5f9);
  cursor: pointer;
  background-color: #ffffff;
  transition: background 0.15s ease;
  position: relative;
}

:root[data-theme='dark'] .notification-item,
.dark .notification-item {
  background-color: #141a29;
  border-bottom-color: rgba(255, 255, 255, 0.06);
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background-color: #f8fafc;
}

:root[data-theme='dark'] .notification-item:hover,
.dark .notification-item:hover {
  background-color: #1c2438;
}

.notification-item.is-unread {
  background-color: #f0f4ff;
}

.notification-item.is-unread:hover {
  background-color: #e0e7ff;
}

:root[data-theme='dark'] .notification-item.is-unread,
.dark .notification-item.is-unread {
  background-color: rgba(99, 102, 241, 0.14);
}

:root[data-theme='dark'] .notification-item.is-unread:hover,
.dark .notification-item.is-unread:hover {
  background-color: rgba(99, 102, 241, 0.22);
}

/* Icon Badges */
.notif-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md, 8px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 2px;
}

.badge-assigned {
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
}

.badge-reopened {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.35);
}

.badge-mentioned {
  background: rgba(14, 165, 233, 0.15);
  border: 1px solid rgba(14, 165, 233, 0.35);
}

.badge-comment {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.badge-sprint {
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.badge-success {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.badge-default {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

/* Content */
.notif-content {
  flex: 1;
  min-width: 0;
}

.notif-title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 3px;
}

.notif-title {
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.3;
}

.notif-time {
  font-size: 11px;
  flex-shrink: 0;
}

.notif-message {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
  margin: 0 0 6px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notif-footer-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
}

.view-link {
  font-size: 11px;
  color: var(--color-primary-400, #818cf8);
}

.view-link:hover {
  text-decoration: underline;
}

/* Unread dot */
.unread-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-primary-400, #818cf8);
  box-shadow: 0 0 8px rgba(129, 140, 248, 0.9);
  flex-shrink: 0;
  margin-top: 6px;
}
</style>
