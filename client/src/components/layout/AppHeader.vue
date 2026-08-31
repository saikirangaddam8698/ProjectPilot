<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTheme } from '@/composables/useTheme';
import { useUiStore } from '@/stores/ui.store';
import AppIcon from '@/components/ui/AppIcon.vue';

const route = useRoute();
const { theme, isDark, toggleTheme } = useTheme();
const uiStore = useUiStore();

const pageTitle = computed(() => {
  return route.meta?.title || 'Dashboard';
});

const isProjectRoute = computed(() => {
  return !!route.params?.projectKey;
});

const projectKey = computed(() => {
  return route.params?.projectKey;
});

const projectSection = computed(() => {
  return route.meta?.section || (route.name === 'ProjectOverview' ? 'Overview' : '');
});

const isMac = computed(() => {
  return typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
});
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <!-- Mobile menu trigger -->
      <button
        type="button"
        class="mobile-menu-btn"
        aria-label="Open navigation menu"
        @click="uiStore.toggleMobileNav"
      >
        <AppIcon name="menu" :size="20" />
      </button>

      <!-- Dynamic Breadcrumbs -->
      <nav class="breadcrumb-container" aria-label="Breadcrumb">
        <router-link to="/dashboard" class="breadcrumb-root">ProjectPilot</router-link>
        <span class="breadcrumb-separator">/</span>

        <!-- If on a project nested route -->
        <template v-if="isProjectRoute">
          <router-link to="/projects" class="breadcrumb-item">Projects</router-link>
          <span class="breadcrumb-separator">/</span>
          <router-link :to="`/projects/${projectKey}/overview`" class="breadcrumb-item mono font-medium">
            {{ projectKey }}
          </router-link>
          <span v-if="projectSection" class="breadcrumb-separator">/</span>
          <h1 v-if="projectSection" class="page-heading">{{ projectSection }}</h1>
        </template>

        <!-- Standard top-level route -->
        <template v-else>
          <h1 class="page-heading">{{ pageTitle }}</h1>
        </template>
      </nav>
    </div>

    <!-- Right Header Utilities -->
    <div class="header-right">
      <!-- Quick Search Trigger -->
      <button
        type="button"
        class="search-trigger"
        @click="uiStore.openSearchModal"
        aria-label="Search workspace or press Command K"
      >
        <AppIcon name="search" :size="15" />
        <span class="search-placeholder">Search projects, views, or keys...</span>
        <kbd class="search-kbd">{{ isMac ? '⌘K' : 'Ctrl K' }}</kbd>
      </button>

      <!-- Theme Switcher -->
      <button
        type="button"
        class="icon-action-btn"
        :title="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
        :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
        @click="toggleTheme"
      >
        <AppIcon :name="isDark ? 'sun' : 'moon'" :size="17" />
      </button>

      <!-- Notification Trigger Placeholder -->
      <button
        type="button"
        class="icon-action-btn notification-btn"
        title="Notifications"
        aria-label="Notifications"
      >
        <AppIcon name="bell" :size="17" />
        <span class="notification-dot" aria-hidden="true"></span>
      </button>

      <div class="header-divider" aria-hidden="true"></div>

      <!-- User Profile Placeholder -->
      <div class="user-profile-menu">
        <div class="avatar-container" title="Alex Morgan (Lead Architect)">
          <div class="avatar-circle">AM</div>
          <span class="avatar-status-dot" aria-hidden="true"></span>
        </div>
        <div class="user-meta-hidden-sm">
          <span class="user-name">Alex Morgan</span>
          <span class="user-role">Architect</span>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  height: var(--header-height);
  background-color: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);
  position: sticky;
  top: 0;
  z-index: var(--z-header);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.mobile-menu-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
}

.mobile-menu-btn:hover {
  background-color: var(--bg-surface-hover);
  color: var(--text-primary);
}

.breadcrumb-container {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.breadcrumb-root,
.breadcrumb-item {
  font-size: var(--text-sm);
  color: var(--text-muted);
  font-weight: var(--font-weight-medium);
  transition: color var(--transition-fast);
}

.breadcrumb-root:hover,
.breadcrumb-item:hover {
  color: var(--text-primary);
}

.breadcrumb-separator {
  color: var(--border-strong);
  font-size: var(--text-xs);
}

.page-heading {
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

/* Header Right */
.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.search-trigger {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 var(--space-3);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-size: var(--text-sm);
  gap: var(--space-2);
  width: 250px;
  transition: border-color var(--transition-fast), background-color var(--transition-fast);
}

.search-trigger:hover {
  border-color: var(--border-strong);
  color: var(--text-secondary);
  background-color: var(--bg-surface-hover);
}

.search-placeholder {
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: var(--text-xs);
}

.search-kbd {
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 1px 5px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xs);
  color: var(--text-muted);
}

.icon-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  position: relative;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.icon-action-btn:hover {
  background-color: var(--bg-surface-hover);
  color: var(--text-primary);
}

.notification-dot {
  position: absolute;
  top: 7px;
  right: 7px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--color-primary-500);
}

.header-divider {
  width: 1px;
  height: 20px;
  background-color: var(--border-subtle);
  margin: 0 var(--space-1);
}

/* Profile */
.user-profile-menu {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 2px 4px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.user-profile-menu:hover {
  background-color: var(--bg-surface-hover);
}

.avatar-container {
  position: relative;
  width: 30px;
  height: 30px;
}

.avatar-circle {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  color: #FFFFFF;
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.05em;
  border: 1px solid var(--border-default);
}

.avatar-status-dot {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-success-500);
  border: 1.5px solid var(--bg-surface);
}

.user-meta-hidden-sm {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.user-name {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.user-role {
  font-size: 10px;
  color: var(--text-muted);
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .search-trigger {
    width: 200px;
  }
}

@media (max-width: 768px) {
  .app-header {
    padding: 0 var(--space-4);
  }

  .mobile-menu-btn {
    display: flex;
  }

  .search-trigger {
    display: none;
  }

  .user-meta-hidden-sm {
    display: none;
  }

  .breadcrumb-root,
  .breadcrumb-separator:first-of-type {
    display: none;
  }
}
</style>
