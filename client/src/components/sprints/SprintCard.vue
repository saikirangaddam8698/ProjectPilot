<script setup>
import { computed } from 'vue';
import { useSprintStore } from '@/stores/sprint.store';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const props = defineProps({
  sprint: {
    type: Object,
    required: true
  },
  showProjectBadge: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['start', 'complete', 'edit', 'delete']);

const sprintStore = useSprintStore();

const isPending = computed(() => sprintStore.isSprintPending(props.sprint.id));

const stats = computed(() => {
  return sprintStore.getSprintStats(props.sprint.id);
});

function getStatusBadgeVariant(status) {
  if (status === 'active') return 'success';
  if (status === 'planned') return 'primary';
  if (status === 'completed') return 'purple';
  return 'neutral';
}

function getCapacityBadgeVariant(state) {
  if (state === 'over') return 'danger';
  if (state === 'near') return 'warning';
  return 'success';
}
</script>

<template>
  <div class="sprint-card" :class="[`is-${sprint.status}`, { 'is-pending': isPending }]">
    <!-- Header -->
    <div class="sprint-card-header">
      <div class="header-left">
        <div class="title-row">
          <h3 class="sprint-name">{{ sprint.name }}</h3>
          <BaseBadge :variant="getStatusBadgeVariant(sprint.status)" size="sm">
            {{ sprint.status.toUpperCase() }}
          </BaseBadge>
          <span v-if="showProjectBadge" class="project-pill mono">
            {{ sprint.projectKey }}
          </span>
        </div>

        <span class="sprint-meta text-muted">
          {{ sprint.startDate }} – {{ sprint.endDate }}
          <template v-if="sprint.status === 'active'">
            • <strong class="text-primary">{{ stats.daysRemaining }} days remaining</strong>
          </template>
          <template v-else-if="sprint.status === 'completed'">
            • Completed
          </template>
          <template v-else>
            • Planned
          </template>
        </span>
      </div>

      <!-- Action Buttons -->
      <div class="header-actions">
        <!-- If Active -->
        <template v-if="sprint.status === 'active'">
          <BaseButton
            variant="outline"
            size="xs"
            :to="`/projects/${sprint.projectKey}/board`"
          >
            Kanban Board →
          </BaseButton>
          <BaseButton
            variant="primary"
            size="xs"
            @click="$emit('complete', sprint)"
          >
            Complete Sprint
          </BaseButton>
        </template>

        <!-- If Planned -->
        <template v-else-if="sprint.status === 'planned'">
          <BaseButton
            variant="outline"
            size="xs"
            :to="`/projects/${sprint.projectKey}/backlog`"
          >
            Plan in Backlog →
          </BaseButton>
          <BaseButton
            variant="primary"
            size="xs"
            :loading="isPending"
            :disabled="isPending"
            @click="$emit('start', sprint)"
          >
            {{ isPending ? 'Starting Sprint...' : 'Start Sprint' }}
          </BaseButton>
        </template>

        <!-- Common Edit / Delete Dropdown or buttons -->
        <button
          v-if="sprint.status !== 'completed'"
          type="button"
          class="card-action-btn"
          title="Edit sprint settings"
          @click="$emit('edit', sprint)"
        >
          <AppIcon name="settings" :size="14" />
        </button>

        <button
          v-if="sprint.status === 'planned'"
          type="button"
          class="card-action-btn text-danger"
          title="Delete sprint"
          @click="$emit('delete', sprint)"
        >
          <AppIcon name="trash" :size="14" />
        </button>
      </div>
    </div>

    <!-- Sprint Goal Box -->
    <div v-if="sprint.goal" class="sprint-goal-box">
      <strong>Goal:</strong> {{ sprint.goal }}
    </div>

    <!-- Metrics & Capacity Row -->
    <div class="sprint-metrics-grid">
      <!-- Story Points Velocity Bar -->
      <div class="metric-block">
        <div class="metric-top">
          <span class="metric-label">Points Delivery</span>
          <span class="metric-val mono">
            {{ stats.completedPoints }} / {{ stats.committedPoints }} pts ({{ stats.progress }}%)
          </span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${stats.progress}%` }"></div>
        </div>
      </div>

      <!-- Capacity Meter & State (Step 14) -->
      <div class="metric-block">
        <div class="metric-top">
          <span class="metric-label">Capacity (Target: {{ stats.capacity }} pts)</span>
          <BaseBadge :variant="getCapacityBadgeVariant(stats.capacityState)" size="xs">
            {{ stats.capacityState === 'over' ? '⚠️ Over Capacity' : stats.capacityState === 'near' ? 'Near Capacity' : 'Within Capacity' }}
          </BaseBadge>
        </div>
        <div class="capacity-track">
          <div
            class="capacity-fill"
            :class="`fill-${stats.capacityState}`"
            :style="{ width: `${Math.min(100, Math.round((stats.committedPoints / (stats.capacity || 1)) * 100))}%` }"
          ></div>
        </div>
      </div>

      <!-- Ticket Breakdown Pills -->
      <div class="ticket-breakdown-row">
        <div class="breakdown-pill" title="Total Issues in Sprint">
          <span class="bd-num mono">{{ stats.totalTickets }}</span>
          <span class="bd-lbl">Tickets</span>
        </div>
        <div class="breakdown-pill" title="In Progress">
          <span class="bd-num mono text-info">{{ stats.inProgressTickets }}</span>
          <span class="bd-lbl">In Progress</span>
        </div>
        <div class="breakdown-pill" title="In Review">
          <span class="bd-num mono text-warning">{{ stats.inReviewTickets }}</span>
          <span class="bd-lbl">In Review</span>
        </div>
        <div class="breakdown-pill" title="Done">
          <span class="bd-num mono text-success">{{ stats.doneTickets }}</span>
          <span class="bd-lbl">Done</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sprint-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  transition: border-color var(--transition-fast);
}

.sprint-card.is-active {
  border-color: rgba(99, 102, 241, 0.4);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.05);
}

.sprint-card.is-pending {
  opacity: 0.65;
  pointer-events: none;
}

.sprint-card:hover {
  border-color: var(--border-default);
}

.sprint-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.title-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.sprint-name {
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.project-pill {
  font-size: 11px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  padding: 1px 6px;
  border-radius: var(--radius-xs);
  color: var(--text-muted);
}

.sprint-meta {
  font-size: var(--text-xs);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.card-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.card-action-btn:hover {
  background-color: var(--bg-surface-hover);
  color: var(--text-primary);
}

.card-action-btn.text-danger:hover {
  color: var(--color-danger-500);
}

.sprint-goal-box {
  padding: var(--space-3) var(--space-4);
  background-color: var(--bg-surface-elevated);
  border-left: 3px solid var(--color-primary-500);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.sprint-metrics-grid {
  display: grid;
  grid-template-columns: 1.2fr 1.2fr 1.6fr;
  gap: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-subtle);
  align-items: center;
}

.metric-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.metric-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--text-xs);
}

.metric-label {
  color: var(--text-muted);
}

.metric-val {
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.progress-track,
.capacity-track {
  height: 6px;
  background-color: var(--border-default);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-success-500);
  border-radius: var(--radius-full);
  transition: width var(--transition-base);
}

.capacity-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--transition-base);
}

.capacity-fill.fill-under { background-color: var(--color-primary-500); }
.capacity-fill.fill-near { background-color: var(--color-warning-500); }
.capacity-fill.fill-over { background-color: var(--color-danger-500); }

.ticket-breakdown-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
}

.breakdown-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bd-num {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.bd-lbl {
  font-size: 10px;
  color: var(--text-muted);
}

.text-info { color: var(--color-info-500); }
.text-warning { color: var(--color-warning-500); }
.text-success { color: var(--color-success-500); }

@media (max-width: 900px) {
  .sprint-metrics-grid {
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }

  .ticket-breakdown-row {
    justify-content: flex-start;
  }
}
</style>
