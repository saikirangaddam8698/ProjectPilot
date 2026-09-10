<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useUiStore } from '@/stores/ui.store';
import { NAVIGATION_GROUPS } from '@/utils/navigation';
import { useAuthStore } from '@/stores/auth.store';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppLogo from '@/components/ui/AppLogo.vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';

const route = useRoute();
const uiStore = useUiStore();
const authStore = useAuthStore();

const isCollapsed = computed(() => uiStore.isSidebarCollapsed);

function canAccessNavItem(item) {
  if (item.path === '/settings') {
    return authStore.isAdmin;
  }
  if (item.path === '/knowledge') {
    return authStore.isAdmin || authStore.isProjectManager;
  }
  return true;
}

const filteredNavGroups = computed(() => {
  return NAVIGATION_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canAccessNavItem(item))
  })).filter((group) => group.items.length > 0);
});

function isRouteActive(path) {
  if (path === '/dashboard' && (route.path === '/' || route.path === '/dashboard')) {
    return true;
  }
  return route.path.startsWith(path);
}
</script>

<template>
  <aside
    class="sidebar"
    :class="{ 'is-collapsed': isCollapsed }"
    aria-label="Primary Navigation"
  >
    <!-- Brand / Header -->
    <div class="sidebar-brand">
      <router-link to="/dashboard" class="brand-link" :title="isCollapsed ? 'ProjectPilot' : undefined">
        <AppLogo size="sm" :show-text="!isCollapsed" />
      </router-link>
    </div>

    <!-- Navigation List -->
    <nav class="sidebar-nav">
      <div
        v-for="group in filteredNavGroups"
        :key="group.id"
        class="nav-group"
      >
        <div v-show="!isCollapsed" class="group-label">
          {{ group.label }}
        </div>

        <ul class="nav-list">
          <li v-for="item in group.items" :key="item.path" class="nav-item">
            <router-link
              :to="item.path"
              class="nav-link"
              :class="{ 'is-active': isRouteActive(item.path) }"
              :title="isCollapsed ? item.name : undefined"
              @click="uiStore.closeMobileNav"
            >
              <span class="nav-icon">
                <AppIcon :name="item.icon" :size="17" />
              </span>

              <span v-show="!isCollapsed" class="nav-label">
                {{ item.name }}
              </span>

              <span v-if="item.badge && !isCollapsed" class="nav-badge-wrapper">
                <BaseBadge :variant="item.badgeVariant || 'primary'" size="sm">
                  {{ item.badge }}
                </BaseBadge>
              </span>
            </router-link>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Sidebar Footer / Collapse Trigger (Desktop) -->
    <div class="sidebar-footer">
      <button
        type="button"
        class="collapse-btn"
        :title="isCollapsed ? 'Expand sidebar (Ctrl+[)' : 'Collapse sidebar (Ctrl+[)'"
        :aria-label="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="uiStore.toggleSidebar"
      >
        <AppIcon :name="isCollapsed ? 'chevron-right' : 'chevron-left'" :size="16" />
        <span v-show="!isCollapsed" class="collapse-text">Collapse</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-width-expanded);
  height: 100%;
  max-height: 100vh;
  background-color: var(--glass-bg-nav);
  backdrop-filter: var(--glass-blur-lg);
  -webkit-backdrop-filter: var(--glass-blur-lg);
  border-right: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow-nav);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-base), background-color var(--transition-base);
  user-select: none;
  flex-shrink: 0;
  box-sizing: border-box;
  overflow: hidden;
}

.sidebar.is-collapsed {
  width: var(--sidebar-width-collapsed);
}

/* Brand */
.sidebar-brand {
  height: var(--header-height);
  padding: 0 var(--space-4);
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--glass-border-subtle);
  flex-shrink: 0;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  color: var(--text-primary);
  text-decoration: none;
}

.brand-icon-wrapper {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--glass-bg-elevated);
  border: 1px solid var(--glass-border-glow);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.brand-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  white-space: nowrap;
  overflow: hidden;
}

.brand-name {
  font-weight: var(--font-weight-semibold);
  font-size: var(--text-base);
  letter-spacing: -0.01em;
  color: var(--text-primary);
}

.brand-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 1px 5px;
  border-radius: var(--radius-xs);
  background-color: var(--badge-neutral-bg);
  color: var(--text-muted);
  border: 1px solid var(--border-subtle);
}

/* Nav */
.sidebar-nav {
  flex: 1;
  padding: var(--space-3) var(--space-2);
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-height: 0;
}

.nav-group {
  display: flex;
  flex-direction: column;
}

.group-label {
  padding: var(--space-1) var(--space-3);
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.nav-link {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  border: 1px solid transparent;
  transition: all var(--motion-fast, 140ms cubic-bezier(0.16, 1, 0.3, 1));
  gap: var(--space-3);
  position: relative;
}

.is-collapsed .nav-link {
  justify-content: center;
  padding: 0;
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: color var(--transition-fast), transform var(--transition-fast);
  flex-shrink: 0;
}

.nav-link:hover {
  background-color: var(--glass-bg-subtle);
  color: var(--text-primary);
  border-color: var(--glass-border-subtle);
}

.nav-link:hover .nav-icon {
  color: var(--text-primary);
  transform: scale(1.06);
}

/* Active route - Liquid Glass capsule */
.nav-link.is-active {
  background: var(--glass-active-bg);
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
  border-color: var(--glass-border-active);
  box-shadow: var(--glass-active-glow), inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.nav-link.is-active .nav-icon {
  color: var(--color-primary-400);
  filter: drop-shadow(0 0 6px rgba(99, 102, 241, 0.45));
}

.nav-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.nav-badge-wrapper {
  margin-left: auto;
}

/* Footer / Collapse */
.sidebar-footer {
  padding: var(--space-2);
  border-top: 1px solid var(--glass-border-subtle);
  flex-shrink: 0;
}

.collapse-btn {
  display: flex;
  align-items: center;
  width: 100%;
  height: 32px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-size: var(--text-sm);
  gap: var(--space-3);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.is-collapsed .collapse-btn {
  justify-content: center;
  padding: 0;
}

.collapse-btn:hover {
  background-color: var(--bg-surface-hover);
  color: var(--text-primary);
}

.collapse-text {
  font-size: var(--text-xs);
}
</style>
