<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
import { useTicketStore } from '@/stores/ticket.store';
import BaseBadge from '@/components/ui/BaseBadge.vue';

const props = defineProps({
  ticket: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['click', 'dragstart', 'dragend']);

const authStore = useAuthStore();
const ticketStore = useTicketStore();
const isDragging = ref(false);

const isPending = computed(() => ticketStore.isTicketPending(props.ticket.key));

function onDragStart(event) {
  if (authStore.isViewer || isPending.value) {
    event.preventDefault();
    return;
  }
  isDragging.value = true;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', props.ticket.key);
  emit('dragstart', props.ticket);
}

function onDragEnd() {
  isDragging.value = false;
  emit('dragend', props.ticket);
}

function getTypeBadgeVariant(type) {
  if (type === 'Bug') return 'danger';
  if (type === 'Story') return 'primary';
  if (type === 'Epic') return 'purple';
  return 'neutral';
}

function getPriorityVariant(p) {
  if (p === 'Urgent') return 'danger';
  if (p === 'High') return 'warning';
  if (p === 'Medium') return 'info';
  return 'neutral';
}
</script>

<template>
  <div
    class="kanban-card"
    :class="{ 'is-dragging': isDragging, 'is-urgent': ticket.priority === 'Urgent', 'is-readonly': authStore.isViewer, 'is-pending': isPending }"
    :draggable="!authStore.isViewer && !isPending"
    tabindex="0"
    role="button"
    :aria-label="`Ticket ${ticket.key}: ${ticket.title}`"
    :title="authStore.isViewer ? `${ticket.key}: Viewers have read-only permissions` : (isPending ? 'Updating...' : '')"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @click="$emit('click', ticket)"
    @keydown.enter="$emit('click', ticket)"
    @keydown.space.prevent="$emit('click', ticket)"
  >
    <!-- Top row: Type & Key & Priority -->
    <div class="card-header-row">
      <div class="header-left">
        <BaseBadge :variant="getTypeBadgeVariant(ticket.type)" size="sm">
          {{ ticket.type }}
        </BaseBadge>
        <span class="card-key mono">{{ ticket.key }}</span>
        <span v-if="isPending" class="card-pending-indicator" title="Updating...">
          <span class="card-spinner"></span>
        </span>
      </div>

      <div class="header-right">
        <span
          class="priority-indicator"
          :class="`priority-${ticket.priority.toLowerCase()}`"
          :title="`Priority: ${ticket.priority}`"
        >
          <span class="priority-bar"></span>
          <span class="priority-bar"></span>
          <span class="priority-bar"></span>
        </span>
      </div>
    </div>

    <!-- Title -->
    <p class="card-title">{{ ticket.title }}</p>

    <!-- Labels -->
    <div v-if="ticket.labels && ticket.labels.length" class="card-labels">
      <span v-for="l in ticket.labels.slice(0, 3)" :key="l" class="label-chip">
        #{{ l }}
      </span>
      <span v-if="ticket.labels.length > 3" class="label-more">
        +{{ ticket.labels.length - 3 }}
      </span>
    </div>

    <!-- Footer row: Points & Assignee -->
    <div class="card-footer-row">
      <div class="footer-left">
        <span v-if="ticket.storyPoints" class="points-badge mono" title="Story Points">
          {{ ticket.storyPoints }} pts
        </span>
        <span v-if="ticket.dueDate" class="due-badge" title="Due Date">
          📅 {{ ticket.dueDate.slice(5) }}
        </span>
      </div>

      <div class="footer-right">
        <div
          v-if="ticket.assignee"
          class="assignee-avatar"
          :title="`Assigned to ${ticket.assignee.name} (${ticket.assignee.role || 'Member'})`"
        >
          {{ ticket.assignee.avatar || ticket.assignee.name.slice(0, 2).toUpperCase() }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kanban-card {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  cursor: grab;
  user-select: none;
  outline: none;
  transition: border-color var(--transition-fast),
              box-shadow var(--transition-fast),
              transform var(--transition-fast),
              opacity var(--transition-fast);
}

.kanban-card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.kanban-card:focus-visible {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 2px var(--border-focus);
}

.kanban-card.is-dragging {
  opacity: 0.85;
  transform: scale(1.015) translateY(-2px);
  background-color: var(--glass-card-drag-bg);
  border-color: var(--color-primary-400);
  box-shadow: 0 12px 28px -6px rgba(0, 0, 0, 0.35), 0 0 16px rgba(99, 102, 241, 0.25);
  cursor: grabbing;
}

.kanban-card.is-readonly {
  cursor: pointer;
}

.kanban-card.is-pending {
  opacity: 0.65;
  pointer-events: none;
  cursor: wait;
}

.card-pending-indicator {
  display: inline-flex;
  align-items: center;
  margin-left: 2px;
}

.card-spinner {
  width: 10px;
  height: 10px;
  border: 2px solid rgba(99, 102, 241, 0.25);
  border-top-color: var(--color-primary-400);
  border-radius: 50%;
  animation: card-spin 0.6s linear infinite;
}

@keyframes card-spin {
  to { transform: rotate(360deg); }
}

.kanban-card.is-urgent {
  border-left: 3px solid var(--color-danger-500);
}

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.card-key {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.card-title {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  line-height: var(--line-height-normal);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Priority visual indicator */
.priority-indicator {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 12px;
}

.priority-bar {
  width: 3px;
  background-color: var(--border-default);
  border-radius: 1px;
}

.priority-bar:nth-child(1) { height: 4px; }
.priority-bar:nth-child(2) { height: 8px; }
.priority-bar:nth-child(3) { height: 12px; }

.priority-low .priority-bar:nth-child(1) { background-color: var(--color-info-500); }
.priority-medium .priority-bar:nth-child(1),
.priority-medium .priority-bar:nth-child(2) { background-color: var(--color-warning-500); }
.priority-high .priority-bar,
.priority-urgent .priority-bar { background-color: var(--color-danger-500); }

/* Labels */
.card-labels {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-wrap: wrap;
}

.label-chip {
  font-size: 10px;
  font-family: var(--font-mono);
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  padding: 1px 4px;
  border-radius: var(--radius-xs);
  color: var(--text-muted);
}

.label-more {
  font-size: 10px;
  color: var(--text-muted);
}

/* Footer */
.card-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2px;
  padding-top: var(--space-2);
  border-top: 1px solid var(--border-subtle);
}

.footer-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.points-badge {
  font-size: 11px;
  color: var(--text-muted);
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  padding: 1px 5px;
  border-radius: var(--radius-xs);
}

.due-badge {
  font-size: 10px;
  color: var(--text-muted);
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
  border: 1px solid var(--border-default);
}
</style>
