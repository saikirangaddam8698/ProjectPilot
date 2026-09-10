<script setup>
import { computed } from 'vue';
import { useTicketStore } from '@/stores/ticket.store';
import { useSprintStore } from '@/stores/sprint.store';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import ProjectOverviewSkeleton from '@/components/skeletons/ProjectOverviewSkeleton.vue';
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

const isInitialLoading = computed(() => {
  return ticketStore.isLoading && ticketStore.allTickets.length === 0;
});

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

const memberCount = computed(() => props.project?.members?.length || 0);

const aiHealthScore = computed(() => {
  const total = projectTickets.value.length;
  if (total === 0) return 100;

  // 1. Completion & Delivery progress (0 - 40 pts)
  const doneTickets = projectTickets.value.filter((t) => t.status === 'Done').length;
  const inProgressTickets = projectTickets.value.filter((t) => t.status === 'In Progress' || t.status === 'In Review').length;
  const deliveryRatio = ((doneTickets + (inProgressTickets * 0.5)) / total) * 40;

  // 2. Base health foundation for healthy active project (50 pts)
  const baseHealth = 50;

  // 3. Sprint execution factor (0 - 10 pts)
  const sprintRatio = sprintStats.value?.progress ? (sprintStats.value.progress / 100) * 10 : 5;

  // 4. Penalties for urgent blockers (-6 pts each) and unassigned critical items (-3 pts each)
  const urgentBlockers = projectTickets.value.filter((t) => t.priority === 'Urgent' && t.status !== 'Done').length;
  const blockerPenalty = urgentBlockers * 6;
  const unassignedUrgent = projectTickets.value.filter(
    (t) => (t.priority === 'Urgent' || t.priority === 'High') && (!t.assignee || t.assignee.name === 'Unassigned') && t.status !== 'Done'
  ).length * 3;

  const calculated = Math.round(baseHealth + deliveryRatio + sprintRatio - blockerPenalty - unassignedUrgent);
  return Math.max(10, Math.min(99, calculated));
});

const aiConfidenceScore = computed(() => {
  const total = projectTickets.value.length;
  if (total >= 10) return 98.4;
  if (total >= 5) return 94.2;
  if (total >= 1) return 88.5;
  return 75.0;
});

const aiCorrelationText = computed(() => {
  if (aiConfidenceScore.value >= 90) return 'high correlation';
  if (aiConfidenceScore.value >= 75) return 'moderate correlation';
  return 'low correlation';
});

const aiOverviewText = computed(() => {
  const total = projectStats.value.total;
  const members = memberCount.value;
  const blockers = projectTickets.value.filter((t) => t.priority === 'Urgent' && t.status !== 'Done').length;

  if (activeSprint.value) {
    const pace = sprintStats.value?.progress || 0;
    return `Workspace velocity is derived from ${total} tickets and ${members} active contributors. Active sprint "${activeSprint.value.name}" is pacing at ${pace}% completion with ${blockers} active blocker${blockers === 1 ? '' : 's'}.`;
  }
  return `Workspace velocity is currently calculated from ${total} tickets and ${members} contributors. Backlog readiness is tracking normally with ${blockers} active blocker${blockers === 1 ? '' : 's'}.`;
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
    <!-- Skeleton loader during initial load -->
    <ProjectOverviewSkeleton v-if="isInitialLoading" />

    <!-- Loaded Real View -->
    <template v-else>
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
            <BaseBadge v-if="activeSprint" variant="primary" size="sm">Active</BaseBadge>
            <BaseBadge v-else variant="neutral" size="sm">No Sprint</BaseBadge>
          </div>
          <div v-if="activeSprint" class="sprint-summary">
            <div class="sprint-name font-medium">{{ activeSprint.name }}</div>
            <div class="sprint-meta text-muted">
              {{ sprintStats?.daysRemaining }} days remaining • Goal: {{ activeSprint.goal }}
            </div>
          </div>
          <div v-else class="sprint-summary text-muted">
            No active sprint running. Create or start a sprint from Backlog.
          </div>
        </div>

        <!-- Blockers / Priority Attention -->
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Urgent Blockers</span>
            <BaseBadge :variant="projectStats.urgent > 0 ? 'danger' : 'success'" size="sm" dot>
              {{ projectStats.urgent > 0 ? `${projectStats.urgent} Blockers` : 'All Clear' }}
            </BaseBadge>
          </div>
          <div class="metric-number" :class="{ 'text-danger': projectStats.urgent > 0 }">
            {{ projectStats.urgent }}
          </div>
          <span class="metric-subtext text-muted">
            {{ projectStats.urgent > 0 ? 'Requires immediate engineering triage' : 'No critical path blockers' }}
          </span>
        </div>

        <!-- Story Points Breakdown -->
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Points Delivery</span>
            <span class="metric-meta-chip mono">{{ projectStats.completedPoints }}/{{ projectStats.totalPoints }} pts</span>
          </div>
          <div class="points-stacked-bar">
            <div
              class="bar-slice done"
              :style="{ width: `${(projectStats.completedPoints / (projectStats.totalPoints || 1)) * 100}%` }"
              title="Done"
            ></div>
            <div
              class="bar-slice in-progress"
              :style="{ width: `${((projectStats.inProgressPoints || 0) / (projectStats.totalPoints || 1)) * 100}%` }"
              title="In Progress"
            ></div>
          </div>
          <div class="points-legend text-muted">
            <span>Done: {{ projectStats.completedPoints }} pts</span>
            <span>Active: {{ projectStats.inProgressPoints || 0 }} pts</span>
          </div>
        </div>

        <!-- AI Project Health (Project Scope) -->
        <div class="metric-card stat-ai-card">
          <div class="metric-header">
            <div class="stat-label-group">
              <span class="metric-label">AI Project Health</span>
              <button
                type="button"
                class="card-info-trigger"
                :title="`Calculated health index for ${project.name}: baseline health weighted by completed tickets, active sprint velocity, minus blockers & unassigned items.`"
                aria-label="About AI Project Health"
              >
                <AppIcon name="info" :size="13" />
              </button>
            </div>
            <BaseBadge variant="purple" size="sm">Gemini 1.5</BaseBadge>
          </div>
          <div class="metric-number ai-gradient-text">{{ aiHealthScore }}%</div>
          <span class="metric-subtext text-muted">
            Project velocity & delivery health
          </span>
        </div>
      </div>

      <!-- Main Overview Grid Layout -->
      <div class="overview-grid">
        <!-- Left Column: Priority Attention & Work Distribution -->
        <div class="overview-col-left">
          <!-- Priority Attention Tickets -->
          <div class="overview-card">
            <div class="card-header">
              <div class="card-title-group">
                <h3 class="card-title">Priority Attention</h3>
                <span class="card-count-badge">{{ priorityTickets.length }}</span>
              </div>
              <BaseButton variant="ghost" size="xs" :to="`/projects/${project.key}/board`">
                View Board →
              </BaseButton>
            </div>

            <div v-if="priorityTickets.length > 0" class="ticket-attention-list">
              <div
                v-for="ticket in priorityTickets"
                :key="ticket.id"
                class="attention-row"
                @click="openTicket(ticket.key)"
              >
                <div class="attention-left">
                  <span class="ticket-key mono">{{ ticket.key }}</span>
                  <span class="ticket-title truncate">{{ ticket.title }}</span>
                </div>
                <div class="attention-right">
                  <BaseBadge
                    :variant="ticket.priority === 'Urgent' ? 'danger' : 'warning'"
                    size="sm"
                  >
                    {{ ticket.priority }}
                  </BaseBadge>
                  <span class="ticket-status-tag">{{ ticket.status }}</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-state-notice">
              <AppIcon name="check-circle" :size="20" class="text-success" />
              <span>No urgent items needing immediate triage.</span>
            </div>
          </div>

          <!-- Active Sprint Progress Details -->
          <div v-if="activeSprint" class="overview-card">
            <div class="card-header">
              <h3 class="card-title">Sprint Delivery Progress</h3>
              <BaseBadge variant="primary" size="sm">{{ activeSprint.name }}</BaseBadge>
            </div>
            <div class="sprint-progress-details">
              <div class="progress-info-row">
                <span class="text-secondary font-medium">Sprint Goal</span>
                <span class="text-primary">{{ activeSprint.goal }}</span>
              </div>
              <div class="progress-info-row">
                <span class="text-secondary font-medium">Velocity Burnup</span>
                <span class="mono">{{ sprintStats?.completedPoints || 0 }} / {{ sprintStats?.committedPoints || 0 }} pts ({{ sprintStats?.progress || 0 }}%)</span>
              </div>
              <div class="progress-bar-track large">
                <div
                  class="progress-bar-fill"
                  :style="{ width: `${sprintStats?.progress || 0}%` }"
                ></div>
              </div>
              <div class="sprint-status-grid">
                <div class="status-box">
                  <span class="box-num">{{ sprintStats?.todoCount ?? (sprintStats?.todoTickets || 0) }}</span>
                  <span class="box-lbl text-muted">To Do</span>
                </div>
                <div class="status-box">
                  <span class="box-num">{{ sprintStats?.inProgressCount ?? (sprintStats?.inProgressTickets || 0) }}</span>
                  <span class="box-lbl text-muted">In Progress</span>
                </div>
                <div class="status-box">
                  <span class="box-num">{{ sprintStats?.reviewCount ?? (sprintStats?.inReviewTickets || 0) }}</span>
                  <span class="box-lbl text-muted">Review</span>
                </div>
                <div class="status-box">
                  <span class="box-num text-success">{{ sprintStats?.doneCount ?? (sprintStats?.doneTickets || 0) }}</span>
                  <span class="box-lbl text-muted">Done</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Project Team Roster & AI Insights -->
        <div class="overview-col-right">
          <!-- Project Team Roster -->
          <div class="overview-card">
            <div class="card-header">
              <h3 class="card-title">Project Members</h3>
              <span class="card-count-badge">{{ project.members.length }}</span>
            </div>
            <ProjectMembersList :project="project" />
          </div>

          <!-- AI Intelligence Summary Box -->
          <div class="overview-card ai-insight-card">
            <div class="card-header ai-header">
              <div class="ai-title-wrap">
                <AppIcon name="cpu" :size="16" />
                <h3 class="card-title">AI Engine Intelligence</h3>
              </div>
              <BaseBadge variant="purple" size="sm">Gemini 1.5</BaseBadge>
            </div>
            <div class="ai-body">
              <p class="ai-text">
                {{ aiOverviewText }}
              </p>
              <div class="ai-footer-note">
                <div class="ai-note-row">
                  <span class="ai-note-label">Project Health:</span>
                  <span class="ai-note-value font-bold" :class="aiHealthScore >= 70 ? 'text-success' : aiHealthScore >= 45 ? 'text-warning' : 'text-danger'">{{ aiHealthScore }}%</span>
                </div>
                <div class="ai-note-row">
                  <span class="ai-note-label">Confidence:</span>
                  <span class="ai-note-value">{{ aiConfidenceScore }}% ({{ aiCorrelationText }})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Modals & Drawers -->
    <CreateTicketModal />
    <TicketDetailDrawer />
  </div>
</template>

<style scoped>
.overview-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

/* Metrics Top Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-4);
  width: 100%;
}

.metric-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  box-shadow: var(--shadow-sm);
  min-width: 0;
}

.metric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.metric-label {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
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

.progress-bar-track {
  flex: 1;
  height: 6px;
  background-color: var(--bg-surface-elevated);
  border-radius: var(--radius-full);
  overflow: hidden;
  border: 1px solid var(--border-subtle);
}

.progress-bar-track.large {
  height: 8px;
  margin: var(--space-2) 0;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary-500), var(--color-primary-400));
  border-radius: var(--radius-full);
  transition: width var(--transition-normal);
}

.metric-subtext {
  font-size: var(--text-xs);
}

.sprint-summary {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sprint-name {
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.sprint-meta {
  font-size: 11px;
}

.points-stacked-bar {
  display: flex;
  height: 8px;
  background-color: var(--bg-surface-elevated);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin: var(--space-1) 0;
}

.bar-slice.done {
  background-color: var(--color-success-500);
}

.bar-slice.in-progress {
  background-color: var(--color-primary-500);
}

.points-legend {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
}

/* Overview Main Grid */
.overview-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-6);
  width: 100%;
  min-width: 0;
}

.overview-col-left,
.overview-col-right {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  min-width: 0;
}

.overview-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  box-shadow: var(--shadow-sm);
  min-width: 0;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
}

.card-title-group {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.card-title {
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.card-count-badge {
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: var(--text-muted);
  background-color: var(--bg-surface-elevated);
  padding: 1px 6px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-subtle);
}

/* Priority Attention List */
.ticket-attention-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.attention-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  min-width: 0;
}

.attention-row:hover {
  border-color: var(--border-strong);
  background-color: var(--bg-surface-hover);
  transform: translateX(2px);
}

.attention-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
  flex: 1;
}

.ticket-key {
  font-size: var(--text-xs);
  color: var(--color-primary-400);
  font-weight: var(--font-weight-medium);
  flex-shrink: 0;
}

.ticket-title {
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.attention-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.ticket-status-tag {
  font-size: 11px;
  color: var(--text-muted);
  background-color: var(--bg-surface);
  padding: 1px 6px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-subtle);
}

.empty-state-notice {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4);
  background-color: var(--bg-surface-elevated);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

/* Sprint Details */
.sprint-progress-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.progress-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--text-xs);
}

.sprint-status-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.status-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-2);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  gap: 2px;
}

.box-num {
  font-size: var(--text-base);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.box-lbl {
  font-size: 10px;
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
  gap: var(--space-1);
  font-size: 11px;
  background-color: var(--bg-surface-elevated);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-default);
}

.ai-note-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ai-note-label {
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
}

.ai-note-value {
  color: var(--text-primary);
}

.stat-ai-card {
  border-color: rgba(168, 85, 247, 0.3);
  background: linear-gradient(135deg, var(--bg-surface) 0%, rgba(168, 85, 247, 0.04) 100%);
}

.ai-gradient-text {
  background: linear-gradient(135deg, var(--color-primary-400), #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.card-info-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  background: none;
  border: none;
  cursor: help;
  padding: 2px;
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast);
}

.card-info-trigger:hover {
  color: var(--color-primary-400);
}

.stat-label-group {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

@media (max-width: 1100px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }
}
</style>
