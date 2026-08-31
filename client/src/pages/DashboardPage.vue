<script setup>
import { computed } from 'vue';
import { useProjectStore } from '@/stores/project.store';
import { useTicketStore } from '@/stores/ticket.store';
import { useSprintStore } from '@/stores/sprint.store';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import CreateTicketModal from '@/components/tickets/CreateTicketModal.vue';
import TicketDetailDrawer from '@/components/tickets/TicketDetailDrawer.vue';

const projectStore = useProjectStore();
const ticketStore = useTicketStore();
const sprintStore = useSprintStore();

const totalProjects = computed(() => projectStore.allProjects.length);
const activeProjects = computed(() => projectStore.allProjects.filter((p) => p.status === 'active'));
const pilotProject = computed(() => projectStore.getProjectByKey('PILOT') || projectStore.allProjects[0]);
const pilotActiveSprint = computed(() => sprintStore.getActiveSprint('PILOT'));
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

function openTicket(ticketKey) {
  ticketStore.openTicketDetail(ticketKey);
}

function openCreateTicketModal() {
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
        <BaseButton variant="primary" size="sm" @click="openCreateTicketModal">
          <template #prefix><AppIcon name="plus" :size="14" /></template>
          New Ticket
        </BaseButton>
      </div>
    </div>

    <!-- Quick Stats Grid -->
    <div class="stats-grid">
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
      <div v-if="pilotProject" class="content-panel">
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
            :key="ticket.key"
            class="ticket-row"
            @click="openTicket(ticket.key)"
          >
            <BaseBadge :variant="ticket.type === 'Bug' ? 'danger' : ticket.type === 'Story' ? 'primary' : 'neutral'" size="sm">
              {{ ticket.type }}
            </BaseBadge>
            <span class="ticket-key mono">{{ ticket.key }}</span>
            <span class="ticket-title truncate">{{ ticket.title }}</span>
            <BaseBadge :variant="ticket.status === 'Done' ? 'success' : ticket.status === 'In Progress' ? 'info' : 'neutral'" size="sm" dot>
              {{ ticket.status }}
            </BaseBadge>
            <span class="ticket-assignee text-muted truncate">{{ ticket.assignee?.name }}</span>
          </div>
        </div>
      </div>

      <!-- AI Project Assistant Insight -->
      <div class="content-panel ai-panel-highlight">
        <div class="panel-header">
          <div class="panel-title-group">
            <div class="ai-badge-row">
              <AppIcon name="ai" :size="16" />
              <h3 class="panel-title">AI Copilot Snapshot</h3>
            </div>
            <span class="panel-meta text-muted">Autonomous Sprint Intelligence</span>
          </div>
          <BaseBadge variant="purple" size="sm">Preview</BaseBadge>
        </div>

        <div class="ai-summary-box">
          <p class="ai-insight-text">
            "ProjectPilot Core is tracking <strong>{{ allTickets.length }} total tickets</strong> across active workspaces.
            <template v-if="totalBlockers > 0">
              There are <strong>{{ totalBlockers }} urgent blockers</strong> currently active in development.
            </template>
            <template v-else>
              Sprint delivery is on track.
            </template>
          </p>
          <div class="ai-actions">
            <BaseButton variant="secondary" size="xs" to="/ai">Ask AI Assistant</BaseButton>
            <BaseButton variant="ghost" size="xs" :to="`/projects/${pilotProject?.key}/overview`">View Project</BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Ticket Detail Drawer & Create Ticket Modal -->
    <TicketDetailDrawer />
    <CreateTicketModal
      :modelValue="ticketStore.isCreateModalOpen"
      :projectKey="'PILOT'"
    />
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.page-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-1);
}

.page-header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-4);
}

.stat-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  transition: border-color var(--transition-fast);
}

.stat-card:hover {
  border-color: var(--border-default);
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-label {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: var(--text-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.03em;
}

.text-danger {
  color: var(--color-danger-500);
}

.stat-unit {
  font-size: var(--text-base);
  font-weight: var(--font-weight-normal);
  color: var(--text-muted);
}

.stat-meta {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.stat-ai-card {
  border-color: rgba(99, 102, 241, 0.25);
  background: linear-gradient(180deg, var(--bg-surface) 0%, rgba(99, 102, 241, 0.03) 100%);
}

.ai-gradient-text {
  background: linear-gradient(135deg, #818CF8, #C084FC);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Panels Grid */
.panels-grid {
  display: grid;
  grid-template-columns: 2fr 1.2fr;
  gap: var(--space-6);
}

.content-panel {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border-subtle);
}

.panel-title {
  font-size: var(--text-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.panel-meta {
  font-size: var(--text-xs);
}

.sample-ticket-list {
  display: flex;
  flex-direction: column;
}

.ticket-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  border-bottom: 1px solid var(--border-subtle);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.ticket-row:last-child {
  border-bottom: none;
}

.ticket-row:hover {
  background-color: var(--bg-surface-hover);
}

.ticket-key {
  font-size: var(--text-xs);
  color: var(--text-muted);
  width: 70px;
  flex-shrink: 0;
}

.ticket-title {
  flex: 1;
  color: var(--text-primary);
}

.ticket-assignee {
  font-size: var(--text-xs);
}

/* AI Highlight Box */
.ai-panel-highlight {
  border-color: rgba(139, 92, 246, 0.3);
}

.ai-badge-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-primary-400);
}

.ai-summary-box {
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.ai-insight-text {
  font-size: var(--text-sm);
  line-height: var(--line-height-relaxed);
  color: var(--text-secondary);
}

.ai-insight-text code {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  background-color: var(--bg-surface-elevated);
  padding: 2px 4px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-default);
}

.ai-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

@media (max-width: 1024px) {
  .panels-grid {
    grid-template-columns: 1fr;
  }
}
</style>
