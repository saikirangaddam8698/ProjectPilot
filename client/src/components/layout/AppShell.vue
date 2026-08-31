<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useUiStore } from '@/stores/ui.store';
import { useProjectStore } from '@/stores/project.store';
import { useTicketStore } from '@/stores/ticket.store';
import AppSidebar from './AppSidebar.vue';
import AppHeader from './AppHeader.vue';
import BaseDrawer from '@/components/ui/BaseDrawer.vue';
import BaseModal from '@/components/ui/BaseModal.vue';
import BaseInput from '@/components/ui/BaseInput.vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { NAVIGATION_GROUPS } from '@/utils/navigation';
import { useRouter } from 'vue-router';

const uiStore = useUiStore();
const projectStore = useProjectStore();
const ticketStore = useTicketStore();
const router = useRouter();

const searchInput = ref('');

function handleGlobalKeydown(e) {
  // Command + K or Ctrl + K for search palette
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    if (uiStore.isSearchModalOpen) {
      uiStore.closeSearchModal();
    } else {
      searchInput.value = '';
      uiStore.openSearchModal();
    }
  }

  // Ctrl + [ to toggle sidebar collapse
  if ((e.metaKey || e.ctrlKey) && e.key === '[') {
    e.preventDefault();
    uiStore.toggleSidebar();
  }
}

function handleNavigate(path) {
  uiStore.closeSearchModal();
  searchInput.value = '';
  router.push(path);
}

function handleOpenTicket(ticketKey) {
  uiStore.closeSearchModal();
  searchInput.value = '';
  ticketStore.openTicketDetail(ticketKey);
}

// Filtered items in Command Palette
const filteredNavItems = computed(() => {
  const q = searchInput.value.toLowerCase().trim();
  if (!q) return NAVIGATION_GROUPS;

  return NAVIGATION_GROUPS.map((group) => {
    const items = group.items.filter((item) => {
      return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    });
    return { ...group, items };
  }).filter((group) => group.items.length > 0);
});

const filteredProjects = computed(() => {
  const q = searchInput.value.toLowerCase().trim();
  if (!q) return projectStore.allProjects;
  return projectStore.allProjects.filter((p) => {
    return p.name.toLowerCase().includes(q) || p.key.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
  });
});

const filteredTickets = computed(() => {
  const q = searchInput.value.toLowerCase().trim();
  if (!q) return [];
  return ticketStore.allTickets.filter((t) => {
    return t.key.toLowerCase().includes(q) || t.title.toLowerCase().includes(q);
  }).slice(0, 5);
});

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
});
</script>

<template>
  <div class="app-layout-container">
    <!-- Desktop Sidebar (Hidden on mobile) -->
    <div class="desktop-sidebar-wrapper">
      <AppSidebar />
    </div>

    <!-- Mobile Navigation Drawer -->
    <BaseDrawer
      :modelValue="uiStore.isMobileNavOpen"
      @update:modelValue="uiStore.closeMobileNav"
      side="left"
      width="280px"
      title="ProjectPilot Navigation"
    >
      <div class="mobile-nav-content">
        <AppSidebar />
      </div>
    </BaseDrawer>

    <!-- Main Application Column -->
    <div class="app-main-column">
      <!-- Top Sticky Header -->
      <AppHeader />

      <!-- Page Content Area -->
      <main class="page-content-wrapper" id="main-content">
        <slot></slot>
      </main>
    </div>

    <!-- Global Command Palette Modal -->
    <BaseModal
      :modelValue="uiStore.isSearchModalOpen"
      @update:modelValue="uiStore.closeSearchModal"
      size="md"
      title="Quick Navigation & Command Palette"
      description="Jump to any view, workspace, or project"
    >
      <div class="command-palette-body">
        <BaseInput
          v-model="searchInput"
          placeholder="Search pages or projects (e.g. PILOT, Sprints, AI)..."
          size="md"
          autocomplete="off"
        >
          <template #prefix>
            <AppIcon name="search" :size="16" />
          </template>
        </BaseInput>

        <div class="command-results-list">
          <!-- Projects Section -->
          <div v-if="filteredProjects.length > 0" class="command-section">
            <div class="command-section-label">Project Workspaces</div>
            <div
              v-for="proj in filteredProjects"
              :key="proj.id"
              class="command-item"
              @click="handleNavigate(`/projects/${proj.key}/overview`)"
            >
              <span class="command-item-icon project-badge-icon">
                {{ proj.key.slice(0, 3) }}
              </span>
              <div class="command-item-text">
                <div class="title-with-key">
                  <span class="command-item-title">{{ proj.name }}</span>
                  <span class="proj-key-pill mono">{{ proj.key }}</span>
                </div>
                <span class="command-item-desc">{{ proj.description }}</span>
              </div>
              <span class="command-item-meta">
                <BaseBadge :variant="proj.status === 'active' ? 'success' : 'neutral'" size="sm">
                  {{ proj.status }}
                </BaseBadge>
                <kbd class="command-kbd">↵</kbd>
              </span>
            </div>
          </div>

          <!-- Matching Tickets Section -->
          <div v-if="filteredTickets.length > 0" class="command-section">
            <div class="command-section-label">Matching Tickets</div>
            <div
              v-for="t in filteredTickets"
              :key="t.key"
              class="command-item"
              @click="handleOpenTicket(t.key)"
            >
              <span class="command-item-icon">
                <AppIcon name="tickets" :size="16" />
              </span>
              <div class="command-item-text">
                <div class="title-with-key">
                  <span class="proj-key-pill mono">{{ t.key }}</span>
                  <span class="command-item-title">{{ t.title }}</span>
                </div>
                <span class="command-item-desc">{{ t.status }} • {{ t.priority }} priority • {{ t.assignee?.name }}</span>
              </div>
              <span class="command-item-meta">
                <BaseBadge :variant="t.priority === 'Urgent' ? 'danger' : 'neutral'" size="sm">
                  {{ t.type }}
                </BaseBadge>
                <kbd class="command-kbd">↵</kbd>
              </span>
            </div>
          </div>

          <!-- Views & Navigation Section -->
          <div v-if="filteredNavItems.length > 0" class="command-section">
            <div class="command-section-label">Quick Jump</div>
            <div
              v-for="group in filteredNavItems"
              :key="group.id"
              class="command-group"
            >
              <div
                v-for="item in group.items"
                :key="item.path"
                class="command-item"
                @click="handleNavigate(item.path)"
              >
                <span class="command-item-icon">
                  <AppIcon :name="item.icon" :size="16" />
                </span>
                <div class="command-item-text">
                  <span class="command-item-title">{{ item.name }}</span>
                  <span class="command-item-desc">{{ item.description }}</span>
                </div>
                <span class="command-item-meta">
                  <BaseBadge v-if="item.badge" :variant="item.badgeVariant || 'primary'" size="sm">
                    {{ item.badge }}
                  </BaseBadge>
                  <kbd class="command-kbd">↵</kbd>
                </span>
              </div>
            </div>
          </div>

          <div v-if="filteredProjects.length === 0 && filteredNavItems.length === 0" class="no-command-results text-muted">
            No matching routes or projects found for "{{ searchInput }}".
          </div>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<style scoped>
.app-layout-container {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  background-color: var(--bg-app);
  overflow-x: hidden;
}

.desktop-sidebar-wrapper {
  display: block;
}

.app-main-column {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 100vh;
}

.page-content-wrapper {
  flex: 1;
  padding: var(--space-6);
  background-color: var(--bg-app);
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
}

/* Mobile Nav inside Drawer */
.mobile-nav-content :deep(.sidebar) {
  width: 100%;
  height: 100%;
  border-right: none;
}

.mobile-nav-content :deep(.sidebar-footer) {
  display: none;
}

/* Command Palette */
.command-palette-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.command-results-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-height: 360px;
  overflow-y: auto;
  margin-top: var(--space-2);
}

.command-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.command-section-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: var(--font-weight-semibold);
  color: var(--text-muted);
  padding: var(--space-1) var(--space-2);
}

.command-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.command-item:hover {
  background-color: var(--bg-surface-hover);
}

.command-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary-400);
  flex-shrink: 0;
}

.project-badge-icon {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-xs);
  background-color: var(--color-primary-600);
  color: #FFFFFF;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: var(--font-weight-bold);
}

.command-item-text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.title-with-key {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.command-item-title {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.proj-key-pill {
  font-size: 10px;
  padding: 1px 4px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xs);
  color: var(--text-muted);
}

.command-item-desc {
  font-size: var(--text-xs);
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.command-item-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.command-kbd {
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 1px 5px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xs);
  color: var(--text-muted);
}

.no-command-results {
  text-align: center;
  padding: var(--space-6);
  font-size: var(--text-sm);
}

/* Responsive */
@media (max-width: 768px) {
  .desktop-sidebar-wrapper {
    display: none;
  }

  .page-content-wrapper {
    padding: var(--space-4);
  }
}
</style>
