<script setup>
import { computed } from 'vue';
import { useTicketStore } from '@/stores/ticket.store';
import { useSprintStore } from '@/stores/sprint.store';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import ProjectMembersList from '@/components/projects/ProjectMembersList.vue';
import TicketDetailDrawer from '@/components/tickets/TicketDetailDrawer.vue';
import CreateTicketModal from '@/components/tickets/CreateTicketModal.vue';

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
});

const ticketStore = useTicketStore();
const sprintStore = useSprintStore();

// Dynamically compute project stats from ticket store
const projectStats = computed(() => {
  return ticketStore.getProjectStats(props.project.key);
});

const activeSprint = computed(() => {
  return sprintStore.getActiveSprint(props.project.key);
});

const sprintStats = computed(() => {
  if (!activeSprint.value) return null;
  return sprintStore.getSprintStats(activeSprint.value.id);
});

// All project tickets from store
const projectTickets = computed(() => {
  return ticketStore.getTicketsByProject(props.project.key);
});

// High priority upcoming tickets
const priorityTickets = computed(() => {
  return projectTickets.value
    .filter((t) => t.status !== 'Done')
    .sort((a, b) => {
      const priorityOrder = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
      return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
    })
    .slice(0, 4);
});

// Progress percentage computed from completed story points or completed tickets
const computedProgress = computed(() => {
  if (sprintStats.value && sprintStats.value.committedPoints > 0) {
    return sprintStats.value.progress;
  }
  if (projectStats.value.totalPoints > 0) {
    return Math.round((projectStats.value.completedPoints / projectStats.value.totalPoints) * 100);
  }
  if (projectStats.value.total > 0) {
    return Math.round((projectStats.value.done / projectStats.value.total) * 100);
  }
  return 0;
});

function openTicket(ticketKey) {
  ticketStore.openTicketDetail(ticketKey);
}

function openCreateModal() {
  ticketStore.openCreateModal(props.project.key);
}
</script>

<template>
  <div class="overview-container">
    <!-- Top Health & Status Metrics -->
    <div class="metrics-grid">
      <!-- Overall Progress -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-label">Workspace Progress</span>
          <BaseBadge :variant="project.status === 'active' ? 'success' : 'neutral'" size="sm">
            {{ project.status === 'active' ? 'In Execution' : 'Backlog Planning' }}
          </BaseBadge>
        </div>
        <div class="metric-value-row">
          <span class="metric-number">{{ computedProgress }}%</span>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" :style="{ width: `${computedProgress}%` }"></div>
          </div>
        </div>
        <span class="metric-subtext text-muted">
          {{ projectStats.total }} tickets tracked ({{ projectStats.completedPoints }} / {{ projectStats.totalPoints }} pts)
        </span>
      </div>

      <!-- Active Sprint -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-label">Active Sprint</span>
          <BaseBadge v-if="activeSprint" variant="primary" size="sm">{{ activeSprint.name.split('—')[0].trim() }}</BaseBadge>
          <BaseBadge v-else variant="neutral" size="sm">No Active Sprint</BaseBadge>
        </div>
        <div class="metric-value-row">
          <span v-if="activeSprint" class="metric-number">
            {{ sprintStats?.inProgressTickets + sprintStats?.inReviewTickets }} <span class="metric-unit">active</span>
          </span>
          <span v-else class="metric-number">—</span>
        </div>
        <span v-if="activeSprint" class="metric-subtext text-muted">
          {{ sprintStats?.daysRemaining }} days remaining in current sprint
        </span>
        <span v-else class="metric-subtext text-muted">
          Grooming product backlog
        </span>
      </div>

      <!-- Open Issues -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-label">Open Tickets</span>
          <BaseBadge variant="neutral" size="sm">{{ projectStats.open }} Remaining</BaseBadge>
        </div>
        <div class="metric-value-row">
          <span class="metric-number">{{ projectStats.open }}</span>
        </div>
        <span class="metric-subtext text-muted">
          {{ projectStats.done }} completed / {{ projectStats.total }} total
        </span>
      </div>

      <!-- Blockers & Risks -->
      <div class="metric-card" :class="{ 'has-blockers': projectStats.blocked > 0 }">
        <div class="metric-header">
          <span class="metric-label">Blockers & Risks</span>
          <BaseBadge :variant="projectStats.blocked > 0 ? 'danger' : 'success'" size="sm" dot>
            {{ projectStats.blocked > 0 ? `${projectStats.blocked} Urgent` : 'Clear' }}
          </BaseBadge>
        </div>
        <div class="metric-value-row">
          <span class="metric-number" :class="{ 'text-danger': projectStats.blocked > 0 }">
            {{ projectStats.blocked }}
          </span>
        </div>
        <span class="metric-subtext text-muted">
          {{ projectStats.blocked > 0 ? 'Requires immediate architectural triage' : 'No active impediments' }}
        </span>
      </div>
    </div>

    <!-- Active Sprint Highlight Box -->
    <div v-if="activeSprint" class="sprint-highlight-card">
      <div class="sprint-card-header">
        <div class="sprint-badge-title">
          <div class="sprint-icon-circle">
            <AppIcon name="sprints" :size="16" />
          </div>
          <div>
            <h3 class="sprint-title">{{ activeSprint.name }}</h3>
            <span class="sprint-dates text-muted">Ends in {{ sprintStats?.daysRemaining }} days • {{ computedProgress }}% completed</span>
          </div>
        </div>

        <div class="sprint-btn-group">
          <BaseButton variant="outline" size="sm" :to="`/projects/${project.key}/analytics`">
            <template #prefix><AppIcon name="analytics" :size="13" /></template>
            Analytics
          </BaseButton>
          <BaseButton variant="outline" size="sm" :to="`/projects/${project.key}/board`">
            Kanban Board →
          </BaseButton>
          <BaseButton variant="primary" size="sm" @click="openCreateModal">
            <template #prefix><AppIcon name="plus" :size="13" /></template>
            Add Ticket
          </BaseButton>
        </div>
      </div>

      <div class="sprint-goal-container">
        <strong>Sprint Goal:</strong> {{ activeSprint.goal }}
      </div>

      <div class="sprint-progress-section">
        <div class="progress-labels">
          <span>Sprint Story Point Velocity</span>
          <span class="mono">{{ sprintStats?.completedPoints }} / {{ sprintStats?.committedPoints }} pts ({{ computedProgress }}%)</span>
        </div>
        <div class="sprint-progress-bar">
          <div class="sprint-progress-fill" :style="{ width: `${computedProgress}%` }"></div>
        </div>
      </div>
    </div>

    <!-- Two-Column Layout: Work Queue & AI Insights + Activity -->
    <div class="overview-grid">
      <!-- Left Column: Upcoming Work & Team -->
      <div class="overview-column-main">
        <!-- Upcoming Priority Work -->
        <div class="content-panel">
          <div class="panel-header">
            <h3 class="panel-title">Priority Work Queue</h3>
            <BaseButton variant="ghost" size="xs" :to="`/projects/${project.key}/tickets`">
              View All {{ projectStats.total }} Tickets →
            </BaseButton>
          </div>

          <div v-if="priorityTickets.length > 0" class="ticket-list">
            <div
              v-for="ticket in priorityTickets"
              :key="ticket.key"
              class="ticket-row"
              @click="openTicket(ticket.key)"
            >
              <BaseBadge :variant="ticket.type === 'Bug' ? 'danger' : ticket.type === 'Story' ? 'primary' : 'neutral'" size="sm">
                {{ ticket.type }}
              </BaseBadge>
              <span class="ticket-key mono">{{ ticket.key }}</span>
              <span class="ticket-title truncate">{{ ticket.title }}</span>
              <BaseBadge :variant="ticket.priority === 'Urgent' ? 'danger' : 'warning'" size="sm">
                {{ ticket.priority }}
              </BaseBadge>
              <span class="ticket-points mono text-muted">{{ ticket.storyPoints }} pts</span>
              <span class="ticket-assignee text-muted truncate">{{ ticket.assignee?.name }}</span>
            </div>
          </div>
          <div v-else class="empty-substate text-muted">
            All tickets in this project are completed or backlog is clear.
          </div>
        </div>

        <!-- Team Members Section -->
        <div class="content-panel">
          <ProjectMembersList :project="project" />
        </div>
      </div>

      <!-- Right Column: AI Insights & Activity Stream -->
      <div class="overview-column-side">
        <!-- AI Project Intelligence Snapshot Card -->
        <div class="content-panel ai-insight-card">
          <div class="panel-header ai-header">
            <div class="ai-title-wrap">
              <AppIcon name="ai" :size="16" />
              <h3 class="panel-title">AI Project Intelligence</h3>
            </div>
            <BaseBadge variant="purple" size="sm">Gemini Preview</BaseBadge>
          </div>

          <div class="ai-body">
            <p class="ai-text">
              "Project <strong>{{ project.key }}</strong> has <strong>{{ projectStats.open }} open tickets</strong> ({{ projectStats.inProgress }} in progress, {{ projectStats.inReview }} in review).
              <template v-if="projectStats.blocked > 0">
                Warning: <strong>{{ projectStats.blocked }} high-priority blocker(s)</strong> detected in current sprint.
              </template>
              <template v-else>
                Sprint delivery trajectory is healthy with no critical impediments.
              </template>
            </p>
            <div class="ai-footer-note">
              <span class="ai-note-label">Phase 4 Feature:</span>
              <span class="text-muted">Will execute Gemini read-only tool calling to analyze commit velocity and PR reviews.</span>
            </div>
          </div>
        </div>

        <!-- Recent Project Activity -->
        <div class="content-panel">
          <div class="panel-header">
            <h3 class="panel-title">Recent Activity</h3>
          </div>

          <div class="activity-timeline">
            <div
              v-for="act in project.recentActivity"
              :key="act.id"
              class="activity-event"
            >
              <div class="activity-bullet"></div>
              <div class="activity-text">
                <span class="act-user font-medium">{{ act.user }}</span>
                <span class="act-action text-secondary"> {{ act.action }} </span>
                <span class="act-target mono">{{ act.target }}</span>
                <span v-if="act.to" class="act-to"> → <em>{{ act.to }}</em></span>
                <span class="act-time text-muted">{{ act.timestamp }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Ticket Detail Drawer -->
    <TicketDetailDrawer />

    <!-- Create Ticket Modal -->
    <CreateTicketModal
      :modelValue="ticketStore.isCreateModalOpen"
      :projectKey="project.key"
    />
  </div>
</template>

<style scoped>
.overview-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
  min-width: 0;
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
  width: 100%;
  min-width: 0;
}

.metric-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
  box-sizing: border-box;
  transition: border-color var(--transition-fast);
}

.metric-card:hover {
  border-color: var(--border-default);
}

.metric-card.has-blockers {
  border-color: rgba(239, 68, 68, 0.3);
}

.metric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.metric-label {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-value-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.metric-number {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.text-danger {
  color: var(--color-danger-500);
}

.metric-unit {
  font-size: var(--text-base);
  font-weight: var(--font-weight-normal);
  color: var(--text-muted);
}

.progress-bar-track {
  flex: 1;
  height: 6px;
  background-color: var(--border-default);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background-color: var(--color-primary-500);
  border-radius: var(--radius-full);
  transition: width var(--transition-base);
}

.metric-subtext {
  font-size: var(--text-xs);
}

/* Sprint Highlight Card */
.sprint-highlight-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.sprint-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.sprint-badge-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.sprint-btn-group {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.sprint-icon-circle {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
  background-color: var(--badge-primary-bg);
  border: 1px solid var(--badge-primary-border);
  color: var(--color-primary-400);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sprint-title {
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.sprint-dates {
  font-size: var(--text-xs);
  display: block;
}

.sprint-goal-container {
  padding: var(--space-3) var(--space-4);
  background-color: var(--bg-surface-elevated);
  border-left: 3px solid var(--color-primary-500);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.sprint-progress-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.progress-labels {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--text-xs);
  color: var(--text-secondary);
  gap: var(--space-2);
}

.sprint-progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--border-default);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.sprint-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366F1, #818CF8);
  border-radius: var(--radius-full);
}

/* Two Column Layout */
.overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
  gap: var(--space-5);
  width: 100%;
  min-width: 0;
}

.overview-column-main,
.overview-column-side {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  min-width: 0;
  width: 100%;
}

.content-panel {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.panel-title {
  font-size: var(--text-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.ticket-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
  width: 100%;
}

.ticket-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  cursor: pointer;
  min-width: 0;
  box-sizing: border-box;
  transition: background-color var(--transition-fast), border-color var(--transition-fast);
}

.ticket-row:hover {
  background-color: var(--bg-surface-hover);
  border-color: var(--border-default);
}

.ticket-key {
  font-size: var(--text-xs);
  color: var(--text-muted);
  width: 75px;
  flex-shrink: 0;
}

.ticket-title {
  flex: 1;
  color: var(--text-primary);
  min-width: 0;
}

.ticket-points {
  font-size: var(--text-xs);
  flex-shrink: 0;
}

.ticket-assignee {
  font-size: var(--text-xs);
  width: 90px;
  text-align: right;
  flex-shrink: 0;
}

.empty-substate {
  padding: var(--space-4);
  text-align: center;
  font-size: var(--text-sm);
}

/* AI Insight Card */
.ai-insight-card {
  border-color: rgba(139, 92, 246, 0.3);
  background: linear-gradient(180deg, var(--bg-surface) 0%, rgba(99, 102, 241, 0.03) 100%);
  min-width: 0;
}

.ai-header {
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: var(--space-3);
}

.ai-title-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-primary-400);
}

.ai-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.ai-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
}

.ai-footer-note {
  display: flex;
  flex-direction: column;
  font-size: 11px;
  background-color: var(--bg-surface-elevated);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-default);
}

.ai-note-label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary-400);
}

/* Timeline */
.activity-timeline {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
}

.activity-event {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  font-size: var(--text-xs);
  min-width: 0;
}

.activity-bullet {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-primary-500);
  margin-top: 4px;
  flex-shrink: 0;
}

.activity-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  word-break: break-word;
}

.act-user {
  color: var(--text-primary);
}

.act-target {
  color: var(--text-primary);
}

.act-time {
  font-size: 10px;
}

@media (max-width: 1100px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }
}
</style>
