<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useUiStore } from '@/stores/ui.store';
import { NAVIGATION_GROUPS } from '@/utils/navigation';
import AppIcon from '@/components/ui/AppIcon.vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';

const route = useRoute();
const uiStore = useUiStore();

const isCollapsed = computed(() => uiStore.isSidebarCollapsed);

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
        <div class="brand-icon-wrapper">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="brand-svg">
            <polygon points="12 2 19 21 12 17 5 21 12 2" fill="url(#brand-grad)" stroke="#6366F1" stroke-width="1.5" stroke-linejoin="round"/>
            <defs>
              <linearGradient id="brand-grad" x1="5" y1="2" x2="19" y2="21" gradientUnits="userSpaceOnUse">
                <stop stop-color="#818CF8" />
                <stop offset="1" stop-color="#4F46E5" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div v-show="!isCollapsed" class="brand-info">
          <span class="brand-name">ProjectPilot</span>
          <span class="brand-badge">v0.1</span>
        </div>
      </router-link>
    </div>

    <!-- Navigation List -->
    <nav class="sidebar-nav">
      <div
        v-for="group in NAVIGATION_GROUPS"
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
  height: 100vh;
  background-color: var(--bg-surface);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-base);
  user-select: none;
  flex-shrink: 0;
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
  border-bottom: 1px solid var(--border-subtle);
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
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
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
  gap: 2px;
}

.nav-link {
  display: flex;
  align-items: center;
  height: 34px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  transition: background-color var(--transition-fast), color var(--transition-fast);
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
  transition: color var(--transition-fast);
  flex-shrink: 0;
}

.nav-link:hover {
  background-color: var(--bg-surface-hover);
  color: var(--text-primary);
}

.nav-link:hover .nav-icon {
  color: var(--text-primary);
}

/* Active route */
.nav-link.is-active {
  background-color: var(--bg-surface-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-sm);
}

.nav-link.is-active .nav-icon {
  color: var(--color-primary-500);
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
  border-top: 1px solid var(--border-subtle);
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
