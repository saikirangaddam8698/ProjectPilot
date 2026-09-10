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
import TicketDetailModal from '@/components/tickets/TicketDetailModal.vue';
import FloatingAIButton from '@/components/ai/FloatingAIButton.vue';
import AIQuickChat from '@/components/ai/AIQuickChat.vue';
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
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    uiStore.toggleSearchModal();
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

  return NAVIGATION_GROUPS.map((group) => {
    const items = group.items.filter((item) => {
      if (item.path === '/settings' && !authStore.isAdmin) return false;
      if (item.path === '/knowledge' && !authStore.isAdmin && !authStore.isProjectManager) return false;
      if (!q) return true;
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

// =========================================================================
// Global Universal Liquid Glass Tooltip System
// Intercepts [title] and [data-tooltip] to replace ugly OS black boxes
// =========================================================================
const tooltipVisible = ref(false);
const tooltipText = ref('');
const tooltipPos = ref({ top: 0, left: 0, placement: 'bottom' });
let currentTooltipTarget = null;
let tooltipTimer = null;

function handleGlobalMouseOver(e) {
  const target = e.target?.closest ? e.target.closest('[data-tooltip], [title], [data-title]') : null;
  if (!target) return;

  const rawText = target.getAttribute('data-tooltip') || target.getAttribute('title') || target.getAttribute('data-title');
  if (!rawText || !rawText.trim()) return;

  // Stash title to data-title and remove title attribute to prevent native browser black rectangle
  if (target.hasAttribute('title')) {
    target.setAttribute('data-title', target.getAttribute('title'));
    target.removeAttribute('title');
  }

  currentTooltipTarget = target;
  clearTimeout(tooltipTimer);
  tooltipTimer = setTimeout(() => {
    if (currentTooltipTarget !== target) return;
    const rect = target.getBoundingClientRect();
    const text = target.getAttribute('data-tooltip') || target.getAttribute('data-title');
    if (!text) return;
    tooltipText.value = text;

    let top = rect.bottom + 6;
    let placement = 'bottom';
    if (top + 60 > window.innerHeight) {
      top = Math.max(8, rect.top - 50);
      placement = 'top';
    }
    let left = rect.left + rect.width / 2;
    const maxHalfWidth = 155;
    left = Math.max(maxHalfWidth + 12, Math.min(window.innerWidth - maxHalfWidth - 12, left));

    tooltipPos.value = { top, left, placement };
    tooltipVisible.value = true;
  }, 160);
}

function handleGlobalMouseOut(e) {
  const target = e.target?.closest ? e.target.closest('[data-tooltip], [data-title]') : null;
  if (target && target === currentTooltipTarget) {
    clearTimeout(tooltipTimer);
    tooltipVisible.value = false;
    currentTooltipTarget = null;
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown);
  document.addEventListener('mouseover', handleGlobalMouseOver, true);
  document.addEventListener('mouseout', handleGlobalMouseOut, true);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
  document.removeEventListener('mouseover', handleGlobalMouseOver, true);
  document.removeEventListener('mouseout', handleGlobalMouseOut, true);
  clearTimeout(tooltipTimer);
});
</script>

<template>
  <div class="app-layout-container">
    <!-- Atmospheric Ambient Background Lighting (Liquid Glass Depth) -->
    <div class="app-ambient-bg" aria-hidden="true">
      <div class="ambient-glow glow-cyan"></div>
      <div class="ambient-glow glow-indigo"></div>
      <div class="ambient-glow glow-purple"></div>
    </div>

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

    <!-- Global Jira-Style Ticket Detail Modal -->
    <TicketDetailModal />

    <!-- Global Floating AI Quick Chat Widget -->
    <FloatingAIButton />
    <AIQuickChat />

    <!-- Universal ProjectPilot Liquid Glass Tooltip Bubble -->
    <Transition name="glass-tooltip-fade">
      <div
        v-if="tooltipVisible && tooltipText"
        class="liquid-glass-tooltip"
        :class="`placement-${tooltipPos.placement}`"
        :style="{ top: `${tooltipPos.top}px`, left: `${tooltipPos.left}px` }"
        role="tooltip"
        aria-hidden="true"
      >
        <span class="tooltip-bubble-text">{{ tooltipText }}</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.app-layout-container {
  position: relative;
  display: flex;
  height: 100vh;
  width: 100%;
  max-width: 100%;
  background-color: var(--bg-app);
  overflow: hidden;
  box-sizing: border-box;
}

/* Atmospheric Ambient Background Glow (Liquid Glass Depth) */
.app-ambient-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.ambient-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
}

.glow-cyan {
  top: 5%;
  right: 15%;
  width: 500px;
  height: 450px;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.07) 0%, transparent 70%);
}

.glow-indigo {
  top: 35%;
  right: 25%;
  width: 600px;
  height: 550px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.09) 0%, transparent 70%);
}

.glow-purple {
  bottom: 5%;
  left: 10%;
  width: 550px;
  height: 480px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%);
}

:root[data-theme='light'] .glow-cyan {
  background: radial-gradient(circle, rgba(56, 189, 248, 0.04) 0%, transparent 70%);
}

:root[data-theme='light'] .glow-indigo {
  background: radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%);
}

:root[data-theme='light'] .glow-purple {
  background: radial-gradient(circle, rgba(139, 92, 246, 0.03) 0%, transparent 70%);
}

.desktop-sidebar-wrapper {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 100vh;
  max-height: 100vh;
  z-index: var(--z-sidebar, 40);
  background-color: transparent;
  overflow: hidden;
}

.app-main-column {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  z-index: 1;
}

.page-content-wrapper {
  flex: 1;
  padding: var(--space-6);
  background-color: transparent;
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
  min-width: 0;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
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
  letter-spacing: 0.06em;
  font-weight: var(--font-weight-semibold);
  color: var(--text-muted);
  padding: var(--space-1) var(--space-2);
}

.command-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 8px 12px;
  border-radius: var(--radius-lg, 10px);
  cursor: pointer;
  border: 1px solid transparent;
  background-color: transparent;
  transition: all var(--motion-fast, 140ms cubic-bezier(0.16, 1, 0.3, 1));
}

.command-item:hover {
  background-color: var(--glass-active-bg, rgba(99, 102, 241, 0.12));
  border-color: var(--glass-border-glow);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
  transform: translateX(2px);
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
  border-radius: 7px;
  background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500));
  color: #FFFFFF;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.35);
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
  padding: 1px 5px;
  background-color: var(--glass-bg-subtle);
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
  padding: 2px 6px;
  background-color: var(--glass-bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xs);
  color: var(--text-muted);
}

.no-command-results {
  text-align: center;
  padding: var(--space-6);
  font-size: var(--text-sm);
}

/* ==========================================================================
   Universal Liquid Glass Tooltip Bubble
   ========================================================================== */
.liquid-glass-tooltip {
  position: fixed;
  z-index: var(--z-tooltip, 100);
  transform: translateX(-50%);
  pointer-events: none;
  background: var(--glass-bg-elevated, rgba(18, 24, 38, 0.92));
  backdrop-filter: var(--glass-blur-md, blur(16px));
  -webkit-backdrop-filter: var(--glass-blur-md, blur(16px));
  border: 1px solid var(--glass-border-glow, rgba(147, 197, 253, 0.22));
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.45), 0 0 12px rgba(99, 102, 241, 0.2);
  color: var(--text-primary, #f3f4f6);
  font-family: var(--font-sans);
  font-size: 11.5px;
  font-weight: 500;
  line-height: 1.45;
  letter-spacing: -0.01em;
  padding: 6px 12px;
  border-radius: var(--radius-md, 8px);
  max-width: 290px;
  white-space: normal;
  word-break: break-word;
  user-select: none;
  text-align: left;
}

.glass-tooltip-fade-enter-active,
.glass-tooltip-fade-leave-active {
  transition: opacity 140ms cubic-bezier(0.16, 1, 0.3, 1),
              transform 140ms cubic-bezier(0.16, 1, 0.3, 1);
}

.glass-tooltip-fade-enter-from,
.glass-tooltip-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(3px) scale(0.96);
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
