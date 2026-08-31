<script setup>
import { computed } from 'vue';
import { useSprintStore } from '@/stores/sprint.store';
import { useTicketStore } from '@/stores/ticket.store';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const props = defineProps({
  ticket: {
    type: Object,
    required: true
  },
  showRank: {
    type: Boolean,
    default: false
  },
  rankIndex: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['click', 'dragstart', 'dragend']);

const sprintStore = useSprintStore();
const ticketStore = useTicketStore();

const availableSprints = computed(() => {
  return sprintStore.getSprintsByProject(props.ticket.projectKey).filter((s) => s.status !== 'completed');
});

function onDragStart(event) {
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', props.ticket.key);
  emit('dragstart', props.ticket);
}

function onDragEnd() {
  emit('dragend', props.ticket);
}

function handleSprintChange(event) {
  const newSprintId = event.target.value;
  if (newSprintId === 'backlog') {
    ticketStore.removeTicketFromSprint(props.ticket.key);
  } else {
    const s = sprintStore.getSprintById(newSprintId);
    ticketStore.assignTicketToSprint(props.ticket.key, newSprintId, s?.name);
  }
}

function getTypeBadgeVariant(type) {
  if (type === 'Bug') return 'danger';
  if (type === 'Story') return 'primary';
  if (type === 'Epic') return 'purple';
  return 'neutral';
}

function getPriorityBadgeVariant(p) {
  if (p === 'Urgent') return 'danger';
  if (p === 'High') return 'warning';
  if (p === 'Medium') return 'info';
  return 'neutral';
}

function getStatusBadgeVariant(status) {
  if (status === 'Done') return 'success';
  if (status === 'In Review') return 'warning';
  if (status === 'In Progress') return 'info';
  return 'neutral';
}
</script>

<template>
  <div
    class="backlog-ticket-row"
    draggable="true"
    tabindex="0"
    role="button"
    :aria-label="`Ticket ${ticket.key}: ${ticket.title}`"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @click="$emit('click', ticket)"
    @keydown.enter="$emit('click', ticket)"
    @keydown.space.prevent="$emit('click', ticket)"
  >
    <!-- Left: Drag Handle & Rank -->
    <div class="row-drag-handle" title="Drag to reorder or move to another sprint">
      <span class="handle-icon">⋮⋮</span>
      <span v-if="showRank" class="rank-label mono">#{{ rankIndex + 1 }}</span>
    </div>

    <!-- Type & Key -->
    <div class="row-identity">
      <BaseBadge :variant="getTypeBadgeVariant(ticket.type)" size="xs">
        {{ ticket.type }}
      </BaseBadge>
      <span class="ticket-key mono">{{ ticket.key }}</span>
    </div>

    <!-- Title & Labels -->
    <div class="row-title-wrap">
      <span class="ticket-title font-medium truncate">{{ ticket.title }}</span>
      <span v-if="ticket.labels && ticket.labels.length" class="inline-labels">
        <span v-for="l in ticket.labels.slice(0, 2)" :key="l" class="inline-label">#{{ l }}</span>
      </span>
    </div>

    <!-- Status & Priority -->
    <div class="row-status-group">
      <BaseBadge :variant="getStatusBadgeVariant(ticket.status)" size="xs" dot>
        {{ ticket.status }}
      </BaseBadge>
      <BaseBadge :variant="getPriorityBadgeVariant(ticket.priority)" size="xs">
        {{ ticket.priority }}
      </BaseBadge>
    </div>

    <!-- Story Points -->
    <div class="row-points mono" title="Story Points">
      {{ ticket.storyPoints || 0 }} pts
    </div>

    <!-- Assignee -->
    <div class="row-assignee">
      <div
        v-if="ticket.assignee"
        class="assignee-avatar"
        :title="ticket.assignee.name"
      >
        {{ ticket.assignee.avatar || 'M' }}
      </div>
      <span v-else class="text-muted">—</span>
    </div>

    <!-- Accessible Sprint Switcher Dropdown (Step 19) -->
    <div class="row-sprint-switcher" @click.stop>
      <select
        :value="ticket.sprintId || 'backlog'"
        class="sprint-quick-select"
        title="Move ticket to sprint or backlog"
        @change="handleSprintChange"
      >
        <option value="backlog">Backlog</option>
        <option
          v-for="s in availableSprints"
          :key="s.id"
          :value="s.id"
        >
          {{ s.name.split('—')[0].trim() }} ({{ s.status }})
        </option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.backlog-ticket-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
  background-color: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  font-size: var(--text-xs);
  cursor: grab;
  user-select: none;
  outline: none;
  transition: background-color var(--transition-fast), border-color var(--transition-fast);
}

.backlog-ticket-row:last-child {
  border-bottom: none;
}

.backlog-ticket-row:hover {
  background-color: var(--bg-surface-hover);
}

.backlog-ticket-row:focus-visible {
  background-color: var(--bg-surface-hover);
  box-shadow: inset 0 0 0 2px var(--border-focus);
}

.row-drag-handle {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-muted);
  cursor: grab;
}

.handle-icon {
  font-size: 13px;
  line-height: 1;
}

.rank-label {
  font-size: 10px;
  color: var(--text-muted);
  width: 22px;
}

.row-identity {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.ticket-key {
  font-size: 11px;
  color: var(--text-muted);
  width: 70px;
  flex-shrink: 0;
}

.row-title-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

.ticket-title {
  color: var(--text-primary);
}

.inline-labels {
  display: flex;
  gap: 3px;
}

.inline-label {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-muted);
}

.row-status-group {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.row-points {
  font-size: 11px;
  color: var(--text-muted);
  width: 45px;
  text-align: right;
}

.row-assignee {
  width: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.assignee-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background-color: var(--color-primary-600);
  color: #FFFFFF;
  font-size: 9px;
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  justify-content: center;
}

.row-sprint-switcher {
  display: flex;
  align-items: center;
}

.sprint-quick-select {
  height: 24px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xs);
  padding: 0 4px;
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: 10px;
  outline: none;
  cursor: pointer;
}

.sprint-quick-select:focus {
  border-color: var(--border-focus);
}

@media (max-width: 768px) {
  .inline-labels,
  .row-sprint-switcher {
    display: none;
  }
}
</style>
