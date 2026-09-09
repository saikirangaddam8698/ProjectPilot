<script setup>
import { computed } from 'vue';
import { useProjectStore } from '@/stores/project.store';
import { useTicketStore } from '@/stores/ticket.store';
import { useSprintStore } from '@/stores/sprint.store';
import { useAuthStore } from '@/stores/auth.store';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import ServiceUnavailableBanner from '@/components/ui/ServiceUnavailableBanner.vue';
import KpiSkeleton from '@/components/skeletons/KpiSkeleton.vue';
import TicketListSkeleton from '@/components/skeletons/TicketListSkeleton.vue';
import CreateTicketModal from '@/components/tickets/CreateTicketModal.vue';
import TicketDetailDrawer from '@/components/tickets/TicketDetailDrawer.vue';

const projectStore = useProjectStore();
const ticketStore = useTicketStore();
const sprintStore = useSprintStore();
const authStore = useAuthStore();

const isDashboardLoading = computed(() => {
  return projectStore.isLoading || ticketStore.isLoading || sprintStore.isLoading;
});

const hasServiceError = computed(() => {
  return !!(projectStore.error || ticketStore.error || sprintStore.error);
});

const serviceErrorMessage = computed(() => {
  return (
    projectStore.error ||
    ticketStore.error ||
    sprintStore.error ||
    'Database service unavailable. Please check your PostgreSQL connection.'
  );
});

const totalProjects = computed(() => projectStore.allProjects.length);
const activeProjects = computed(() => projectStore.allProjects.filter((p) => p.status === 'active'));
const pilotProject = computed(() => projectStore.activeProject || projectStore.allProjects[0] || null);
const pilotActiveSprint = computed(() => {
  if (!pilotProject.value) return null;
  return sprintStore.getActiveSprint(pilotProject.value.key);
});
const pilotSprintStats = computed(() => {
  if (!pilotActiveSprint.value) return null;
  return sprintStore.getSprintStats(pilotActiveSprint.value.id);
});

const allTickets = computed(() => ticketStore.allTickets);

const totalPointsCommitted = computed(() => {
  return allTickets.value.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
});

const totalPointsCompleted = computed(() => {
  return allTickets.value.filter((t) => t.status === 'Done').reduce((acc, t) => acc + (t.storyPoints || 0), 0);
});

const totalBlockers = computed(() => {
  return allTickets.value.filter((t) => t.priority === 'Urgent' && t.status !== 'Done').length;
});

const pilotTickets = computed(() => {
  return ticketStore.getTicketsByProject('PILOT').slice(0, 5);
});

function handleRetry() {
  projectStore.fetchProjects();
  ticketStore.fetchTickets();
  sprintStore.fetchSprints();
}

function openTicket(ticketKey) {
  ticketStore.openTicketDetail(ticketKey);
}

function openCreateTicketModal() {
  if (authStore.isViewer) return;
  ticketStore.openCreateModal('PILOT');
}
</script>

<template>
  <div class="page-container">
    <!-- Page Header Area -->
    <div class="page-header">
      <div class="page-header-text">
        <h2 class="page-title">Executive Dashboard</h2>
        <p class="page-subtitle">Cross-project sprint velocity, blockers, and AI intelligence insights.</p>
      </div>
      <div class="page-header-actions">
        <BaseButton variant="outline" size="sm" to="/projects">
          <template #prefix><AppIcon name="projects" :size="14" /></template>
          View Projects ({{ totalProjects }})
        </BaseButton>
        <div :title="authStore.isViewer ? 'You do not have permission to create tickets (Requires DEVELOPER or higher role)' : ''">
          <BaseButton
            variant="primary"
            size="sm"
            :disabled="authStore.isViewer"
            @click="openCreateTicketModal"
          >
            <template #prefix><AppIcon name="plus" :size="14" /></template>
            New Ticket
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Service / Database Error Banner -->
    <ServiceUnavailableBanner
      v-if="hasServiceError && !isDashboardLoading"
      :message="serviceErrorMessage"
      @retry="handleRetry"
    />

    <!-- Quick Stats Grid (Skeleton vs Loaded Data) -->
    <KpiSkeleton v-if="isDashboardLoading" :count="4" />
    <div v-else class="stats-grid">
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Active Workspaces</span>
          <BaseBadge variant="primary" size="sm">{{ activeProjects.length }} Active</BaseBadge>
        </div>
        <div class="stat-value">{{ totalProjects }}</div>
        <div class="stat-meta">
          <span class="stat-subtext text-muted">Across {{ totalProjects }} managed repositories</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Committed Story Points</span>
          <BaseBadge variant="info" size="sm">On Track</BaseBadge>
        </div>
        <div class="stat-value">{{ totalPointsCommitted }} <span class="stat-unit">pts</span></div>
        <div class="stat-meta">
          <span class="stat-progress-text">{{ totalPointsCompleted }} pts completed across all tickets</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Open Blockers</span>
          <BaseBadge :variant="totalBlockers > 0 ? 'danger' : 'success'" size="sm" dot>
            {{ totalBlockers > 0 ? `${totalBlockers} Urgent` : 'Clear' }}
          </BaseBadge>
        </div>
        <div class="stat-value" :class="{ 'text-danger': totalBlockers > 0 }">{{ totalBlockers }}</div>
        <div class="stat-meta">
          <span class="stat-subtext text-muted">
            {{ totalBlockers > 0 ? 'High-priority blocker items' : 'No active impediments' }}
          </span>
        </div>
      </div>

      <div class="stat-card stat-ai-card">
        <div class="stat-header">
          <span class="stat-label">AI Project Health</span>
          <BaseBadge variant="purple" size="sm">Gemini 1.5</BaseBadge>
        </div>
        <div class="stat-value ai-gradient-text">94%</div>
        <div class="stat-meta">
          <span class="stat-subtext text-muted">Cross-workspace velocity index</span>
        </div>
      </div>
    </div>

    <!-- Main Content Panels -->
    <div class="panels-grid">
      <!-- Active Sprint Snapshot from PILOT Project -->
      <div v-if="isDashboardLoading" class="content-panel">
        <div class="panel-header">
          <h3 class="panel-title">Loading Workspace Sprints...</h3>
        </div>
        <TicketListSkeleton :rows="5" />
      </div>

      <div v-else-if="pilotProject" class="content-panel">
        <div class="panel-header">
          <div class="panel-title-group">
            <h3 class="panel-title">{{ pilotProject.name }} ({{ pilotProject.key }})</h3>
            <span class="panel-meta text-muted">
              {{ pilotActiveSprint ? `${pilotActiveSprint.name} • ${pilotSprintStats?.daysRemaining} days left` : 'Backlog Mode' }}
            </span>
          </div>
          <BaseButton variant="ghost" size="xs" :to="`/projects/${pilotProject.key}/board`">
            Open Kanban Board →
          </BaseButton>
        </div>

        <div v-if="pilotTickets.length > 0" class="sample-ticket-list">
          <div
            v-for="ticket in pilotTickets"
            :key="ticket.id"
            class="sample-ticket-row"
            @click="openTicket(ticket.key)"
          >
            <div class="ticket-row-main">
              <span class="ticket-key mono">{{ ticket.key }}</span>
              <span class="ticket-title font-medium">{{ ticket.title }}</span>
            </div>
            <div class="ticket-row-meta">
              <BaseBadge
                :variant="
                  ticket.priority === 'Urgent'
                    ? 'danger'
                    : ticket.priority === 'High'
                    ? 'warning'
                    : 'neutral'
                "
                size="sm"
              >
                {{ ticket.priority }}
              </BaseBadge>
              <span class="ticket-status-pill">{{ ticket.status }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state-panel">
          <p class="text-muted">No tickets found in this workspace.</p>
        </div>
      </div>

      <!-- Quick Action / Intelligence Card -->
      <div class="content-panel intelligence-panel">
        <div class="panel-header">
          <h3 class="panel-title">AI Engine Intelligence</h3>
          <BaseBadge variant="purple" size="sm">Active</BaseBadge>
        </div>

        <div class="ai-insight-box">
          <div class="ai-insight-icon">
            <AppIcon name="zap" :size="18" />
          </div>
          <div class="ai-insight-content">
            <h4 class="ai-insight-title">Sprint Velocity Acceleration</h4>
            <p class="ai-insight-text">
              PILOT Sprint 1 is on pace for <strong>100% completion</strong>. No unassigned high-priority tickets detected.
            </p>
          </div>
        </div>

        <div class="quick-nav-links">
          <h4 class="quick-nav-title">Quick Workspace Access</h4>
          <div class="quick-nav-grid">
            <router-link to="/projects/PILOT/board" class="quick-link-card">
              <AppIcon name="board" :size="18" />
              <span>PILOT Board</span>
            </router-link>
            <router-link to="/projects/INFRA/board" class="quick-link-card">
              <AppIcon name="cpu" :size="18" />
              <span>INFRA Board</span>
            </router-link>
            <router-link to="/projects/MOBILE/board" class="quick-link-card">
              <AppIcon name="phone" :size="18" />
              <span>MOBILE Board</span>
            </router-link>
            <router-link to="/team" class="quick-link-card">
              <AppIcon name="users" :size="18" />
              <span>Team Roster</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals and Drawers -->
    <CreateTicketModal />
    <TicketDetailDrawer />
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-6);
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.page-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.02em;
  margin: 0 0 var(--space-1) 0;
}

.page-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}

.page-header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}

.stat-card {
  background-color: var(--glass-bg-card);
  backdrop-filter: var(--glass-blur-sm);
  -webkit-backdrop-filter: var(--glass-blur-sm);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  box-shadow: var(--shadow-sm);
  transition: transform var(--motion-fast, 140ms cubic-bezier(0.16, 1, 0.3, 1)),
              border-color var(--motion-fast, 140ms cubic-bezier(0.16, 1, 0.3, 1)),
              box-shadow var(--motion-fast, 140ms cubic-bezier(0.16, 1, 0.3, 1));
}

.stat-card:hover {
  border-color: var(--glass-border-glow);
  box-shadow: var(--shadow-md), 0 0 16px rgba(99, 102, 241, 0.1);
  transform: translateY(-2px);
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-label {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.stat-value {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.stat-unit {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-normal);
  color: var(--text-muted);
}

.stat-subtext,
.stat-progress-text {
  font-size: var(--text-xs);
}

.ai-gradient-text {
  background: linear-gradient(135deg, var(--color-primary-400), #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Panels Grid */
.panels-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-6);
}

.content-panel {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
}

.panel-title {
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.panel-meta {
  font-size: var(--text-xs);
}

.sample-ticket-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.sample-ticket-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.sample-ticket-row:hover {
  background-color: var(--bg-surface-hover);
  border-color: var(--border-strong);
  transform: translateX(2px);
}

.ticket-row-main {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.ticket-key {
  font-size: var(--text-xs);
  color: var(--color-primary-400);
  font-weight: var(--font-weight-medium);
}

.ticket-title {
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.ticket-row-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.ticket-status-pill {
  font-size: var(--text-xs);
  color: var(--text-muted);
  background-color: var(--bg-surface);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

.empty-state-panel {
  padding: var(--space-8);
  text-align: center;
}

/* AI Insight Box */
.ai-insight-box {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  background-color: rgba(168, 85, 247, 0.08);
  backdrop-filter: var(--glass-blur-sm);
  -webkit-backdrop-filter: var(--glass-blur-sm);
  border: 1px solid rgba(168, 85, 247, 0.25);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(168, 85, 247, 0.08);
}

.ai-insight-icon {
  color: #a855f7;
  flex-shrink: 0;
}

.ai-insight-title {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-1) 0;
}

.ai-insight-text {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

/* Quick Nav Grid */
.quick-nav-title {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: var(--space-4) 0 var(--space-3) 0;
}

.quick-nav-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2);
}

.quick-link-card {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  transition: all var(--motion-fast, 140ms cubic-bezier(0.16, 1, 0.3, 1));
}

.quick-link-card:hover {
  background-color: var(--glass-bg-subtle);
  border-color: var(--glass-border-subtle);
  color: var(--text-primary);
  transform: translateY(-1px);
}

.quick-link-card:hover {
  color: var(--color-primary-400);
  background-color: var(--bg-surface-hover);
  border-color: var(--border-strong);
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .panels-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
