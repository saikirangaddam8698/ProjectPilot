<script setup>
import { ref, computed } from 'vue';
import { useSprintStore } from '@/stores/sprint.store';
import { useTicketStore } from '@/stores/ticket.store';
import { useAuthStore } from '@/stores/auth.store';
import BacklogTicketRow from './BacklogTicketRow.vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import RbacActionWrapper from '@/components/ui/RbacActionWrapper.vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  sprint: {
    type: Object,
    default: null
  },
  tickets: {
    type: Array,
    default: () => []
  },
  isBacklog: {
    type: Boolean,
    default: false
  },
  projectKey: {
    type: String,
    required: true
  }
});

const emit = defineEmits([
  'ticket-click',
  'ticket-drop',
  'start-sprint',
  'complete-sprint',
  'create-ticket'
]);

const sprintStore = useSprintStore();
const ticketStore = useTicketStore();
const authStore = useAuthStore();

const isDragOver = ref(false);
const isCollapsed = ref(false);

const stats = computed(() => {
  if (!props.sprint) {
    const totalPoints = props.tickets.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
    return {
      totalTickets: props.tickets.length,
      committedPoints: totalPoints,
      capacity: 0,
      capacityState: 'under'
    };
  }
  return sprintStore.getSprintStats(props.sprint.id);
});

function onDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

function onDragEnter() {
  isDragOver.value = true;
}

function onDragLeave(event) {
  if (event.currentTarget && !event.currentTarget.contains(event.relatedTarget)) {
    isDragOver.value = false;
  }
}

function onDrop(event) {
  event.preventDefault();
  isDragOver.value = false;
  const ticketKey = event.dataTransfer.getData('text/plain');
  if (ticketKey) {
    emit('ticket-drop', {
      targetSprintId: props.sprint ? props.sprint.id : null,
      ticketKey
    });
  }
}

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
  <div
    class="backlog-group-card"
    :class="{
      'is-drag-over': isDragOver,
      'is-active-sprint': sprint?.status === 'active',
      'is-backlog-container': isBacklog
    }"
    @dragover="onDragOver"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <!-- Group Header -->
    <div class="group-header" @click="isCollapsed = !isCollapsed">
      <div class="header-left">
        <button
          type="button"
          class="collapse-toggle-btn"
          :aria-expanded="!isCollapsed"
          @click.stop="isCollapsed = !isCollapsed"
        >
          <span class="chevron" :class="{ 'is-open': !isCollapsed }">▶</span>
        </button>

        <div class="header-title-stack">
          <div class="title-status-row">
            <h3 class="group-title">{{ title }}</h3>
            <BaseBadge
              v-if="sprint"
              :variant="getStatusBadgeVariant(sprint.status)"
              size="xs"
            >
              {{ sprint.status.toUpperCase() }}
            </BaseBadge>
            <BaseBadge v-else variant="neutral" size="xs">
              UNASSIGNED
            </BaseBadge>
          </div>

          <span v-if="sprint" class="sprint-date-meta text-muted">
            {{ sprint.startDate }} – {{ sprint.endDate }}
            <template v-if="sprint.status === 'active'">
              • {{ stats.daysRemaining }} days remaining
            </template>
          </span>
          <span v-else class="sprint-date-meta text-muted">
            Prioritized product roadmap & upcoming queue
          </span>
        </div>
      </div>

      <!-- Right Summary & Actions -->
      <div class="header-right" @click.stop>
        <div class="group-summary-stats">
          <!-- Capacity Indicator if Sprint -->
          <BaseBadge
            v-if="sprint && stats.capacityState === 'over'"
            variant="danger"
            size="xs"
          >
            ⚠️ Over Capacity ({{ stats.committedPoints }}/{{ stats.capacity }} pts)
          </BaseBadge>

          <span class="stat-pill mono">
            {{ stats.totalTickets }} issues • {{ stats.committedPoints }} pts
          </span>
        </div>

        <div class="group-actions">
          <!-- Active Sprint Action -->
          <RbacActionWrapper
            v-if="sprint?.status === 'active'"
            action="complete_sprint"
            :context="{ projectKey }"
          >
            <template #default="{ disabled }">
              <BaseButton
                variant="outline"
                size="xs"
                :disabled="disabled"
                @click="$emit('complete-sprint', sprint)"
              >
                Complete Sprint
              </BaseButton>
            </template>
          </RbacActionWrapper>

          <!-- Planned Sprint Action -->
          <RbacActionWrapper
            v-else-if="sprint?.status === 'planned'"
            action="start_sprint"
            :context="{ projectKey }"
          >
            <template #default="{ disabled }">
              <BaseButton
                variant="primary"
                size="xs"
                :disabled="disabled"
                @click="$emit('start-sprint', sprint)"
              >
                Start Sprint
              </BaseButton>
            </template>
          </RbacActionWrapper>

          <RbacActionWrapper action="create_ticket">
            <template #default="{ disabled }">
              <BaseButton
                variant="ghost"
                size="xs"
                :disabled="disabled"
                @click="$emit('create-ticket', sprint ? sprint.id : null)"
              >
                <template #prefix><AppIcon name="plus" :size="12" /></template>
                Add Issue
              </BaseButton>
            </template>
          </RbacActionWrapper>
        </div>
      </div>
    </div>

    <!-- Ticket List Container -->
    <div v-show="!isCollapsed" class="group-tickets-container">
      <div v-if="tickets.length > 0" class="tickets-rows-wrapper">
        <BacklogTicketRow
          v-for="(ticket, idx) in tickets"
          :key="ticket.key"
          :ticket="ticket"
          :showRank="isBacklog"
          :rankIndex="idx"
          @click="$emit('ticket-click', $event)"
        />
      </div>

      <div v-else class="empty-group-state">
        <p class="empty-drop-text">
          {{ isBacklog ? 'Backlog is empty. Create new issues to plan ahead.' : 'No issues in this sprint. Drag backlog items here.' }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.backlog-group-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: border-color var(--transition-fast), background-color var(--transition-fast);
}

.backlog-group-card.is-active-sprint {
  border-color: rgba(99, 102, 241, 0.4);
}

.backlog-group-card.is-drag-over {
  border-color: var(--color-primary-500);
  background-color: var(--bg-surface-hover);
  box-shadow: 0 0 0 2px var(--color-primary-500);
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background-color: var(--bg-surface-elevated);
  border-bottom: 1px solid var(--border-subtle);
  cursor: pointer;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.collapse-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--text-muted);
  font-size: 10px;
}

.chevron {
  transition: transform var(--transition-fast);
  display: inline-block;
}

.chevron.is-open {
  transform: rotate(90deg);
}

.header-title-stack {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.title-status-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.group-title {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.sprint-date-meta {
  font-size: 11px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.group-summary-stats {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.stat-pill {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  color: var(--text-muted);
}

.group-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.group-tickets-container {
  display: flex;
  flex-direction: column;
}

.tickets-rows-wrapper {
  display: flex;
  flex-direction: column;
}

.empty-group-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  border-top: 1px dashed var(--border-subtle);
  background-color: var(--bg-surface);
}

.empty-drop-text {
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-style: italic;
}
</style>
