<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTheme } from '@/composables/useTheme';
import { useUiStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import AppIcon from '@/components/ui/AppIcon.vue';

const route = useRoute();
const router = useRouter();
const { isDark, toggleTheme } = useTheme();
const uiStore = useUiStore();
const authStore = useAuthStore();

const isProfileMenuOpen = ref(false);
const profileMenuRef = ref(null);

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

const user = computed(() => authStore.user);
const member = computed(() => authStore.currentMember);

const userName = computed(() => member.value?.name || user.value?.email?.split('@')[0] || 'User');
const userEmail = computed(() => user.value?.email || 'user@projectpilot.dev');
const userRole = computed(() => user.value?.role || 'DEVELOPER');
const userAvatar = computed(() => member.value?.avatar || userName.value.slice(0, 2).toUpperCase());
const userRoleTitle = computed(() => member.value?.role || userRole.value);

function toggleProfileMenu() {
  isProfileMenuOpen.value = !isProfileMenuOpen.value;
}

function closeProfileMenu() {
  isProfileMenuOpen.value = false;
}

async function handleLogout() {
  closeProfileMenu();
  await authStore.logout();
  router.push('/login');
}

function handleDocumentClick(e) {
  if (profileMenuRef.value && !profileMenuRef.value.contains(e.target)) {
    closeProfileMenu();
  }
}

function handleKeyDown(e) {
  if (e.key === 'Escape' && isProfileMenuOpen.value) {
    closeProfileMenu();
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick);
  document.removeEventListener('keydown', handleKeyDown);
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

      <!-- Notification Trigger -->
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

      <!-- Authenticated User Profile Menu -->
      <div ref="profileMenuRef" class="profile-dropdown-wrapper">
        <button
          type="button"
          class="user-profile-menu"
          :aria-expanded="isProfileMenuOpen"
          aria-haspopup="true"
          @click="toggleProfileMenu"
        >
          <div class="avatar-container">
            <div class="avatar-circle">{{ userAvatar }}</div>
            <span class="avatar-status-dot" aria-hidden="true"></span>
          </div>
          <div class="user-meta-hidden-sm">
            <span class="user-name">{{ userName }}</span>
            <span class="user-role">{{ userRoleTitle }}</span>
          </div>
          <AppIcon name="chevron-down" :size="14" class="chevron-icon" />
        </button>

        <!-- Dropdown Menu -->
        <div v-if="isProfileMenuOpen" class="profile-dropdown-card">
          <div class="dropdown-header">
            <div class="dropdown-avatar">{{ userAvatar }}</div>
            <div class="dropdown-user-details">
              <span class="dropdown-user-name">{{ userName }}</span>
              <span class="dropdown-user-email">{{ userEmail }}</span>
              <span class="dropdown-role-badge" :class="userRole.toLowerCase()">
                {{ userRole.replace('_', ' ') }}
              </span>
            </div>
          </div>

          <div class="dropdown-divider"></div>

          <div class="dropdown-section">
            <div class="dropdown-item-info">
              <span class="info-label">Assigned Projects</span>
              <span class="info-value">{{ user?.projectKeys?.join(', ') || 'All Workspace' }}</span>
            </div>
          </div>

          <div class="dropdown-divider"></div>

          <button
            type="button"
            class="dropdown-action-btn logout"
            @click="handleLogout"
          >
            <AppIcon name="log-out" :size="15" />
            <span>Sign Out</span>
          </button>
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

/* Profile Dropdown */
.profile-dropdown-wrapper {
  position: relative;
}

.user-profile-menu {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 3px 6px;
  border-radius: var(--radius-md);
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  transition: all var(--transition-fast);
}

.user-profile-menu:hover,
.user-profile-menu[aria-expanded="true"] {
  background-color: var(--bg-surface-hover);
  border-color: var(--border-subtle);
}

.avatar-container {
  position: relative;
  width: 28px;
  height: 28px;
}

.avatar-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500));
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
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--color-success-500);
  border: 1.5px solid var(--bg-surface);
}

.user-meta-hidden-sm {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  text-align: left;
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

.chevron-icon {
  color: var(--text-muted);
}

/* Dropdown Menu Card */
.profile-dropdown-card {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 240px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-3);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-1);
}

.dropdown-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500));
  color: #ffffff;
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dropdown-user-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}

.dropdown-user-name {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-user-email {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-role-badge {
  display: inline-block;
  font-size: 9px;
  font-weight: var(--font-weight-medium);
  padding: 1px 5px;
  border-radius: var(--radius-xs);
  text-transform: uppercase;
  width: fit-content;
  margin-top: 2px;
}

.dropdown-role-badge.admin {
  background-color: rgba(99, 102, 241, 0.15);
  color: var(--color-primary-400);
}

.dropdown-role-badge.developer {
  background-color: rgba(16, 185, 129, 0.15);
  color: var(--color-success-500);
}

.dropdown-role-badge.project_manager {
  background-color: rgba(245, 158, 11, 0.15);
  color: var(--color-warning-500);
}

.dropdown-role-badge.viewer {
  background-color: rgba(107, 114, 128, 0.15);
  color: var(--text-muted);
}

.dropdown-divider {
  height: 1px;
  background-color: var(--border-subtle);
  margin: var(--space-1) 0;
}

.dropdown-section {
  padding: var(--space-1);
}

.dropdown-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: 10px;
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: var(--font-weight-medium);
}

.info-value {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.dropdown-action-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
}

.dropdown-action-btn:hover {
  background-color: var(--bg-surface-hover);
  color: var(--text-primary);
}

.dropdown-action-btn.logout:hover {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--color-danger-500);
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
