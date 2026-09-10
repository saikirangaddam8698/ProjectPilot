<script setup>
import { ref, computed } from 'vue';
import KanbanCard from './KanbanCard.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import RbacActionWrapper from '@/components/ui/RbacActionWrapper.vue';

const props = defineProps({
  status: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  tickets: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['ticket-click', 'ticket-drop', 'create-ticket']);

const isDragOver = ref(false);

const totalPoints = computed(() => {
  return props.tickets.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
});

function onDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

function onDragEnter() {
  isDragOver.value = true;
}

function onDragLeave(event) {
  // Only turn off if leaving column container
  if (event.currentTarget && !event.currentTarget.contains(event.relatedTarget)) {
    isDragOver.value = false;
  }
}

function onDrop(event) {
  event.preventDefault();
  isDragOver.value = false;
  const ticketKey = event.dataTransfer.getData('text/plain');
  if (ticketKey) {
    emit('ticket-drop', { status: props.status, ticketKey });
  }
}

function getStatusDotColor(status) {
  if (status === 'Backlog') return '#64748B';
  if (status === 'Todo') return '#94A3B8';
  if (status === 'In Progress') return '#38BDF8';
  if (status === 'In Review') return '#F59E0B';
  if (status === 'Done') return '#10B981';
  if (status === 'Reopened') return '#F43F5E';
  return '#6366F1';
}
</script>

<template>
  <div
    class="kanban-column"
    :class="{ 'is-drag-over': isDragOver }"
    @dragover="onDragOver"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <!-- Column Header -->
    <div class="column-header">
      <div class="header-left">
        <span class="status-dot" :style="{ backgroundColor: getStatusDotColor(status) }"></span>
        <h4 class="column-title">{{ title }}</h4>
        <span class="count-pill mono">{{ tickets.length }}</span>
      </div>

      <div class="header-right">
        <span v-if="totalPoints > 0" class="points-pill mono" title="Total Story Points">
          {{ totalPoints }} pts
        </span>
        <RbacActionWrapper action="create_ticket">
          <template #default="{ disabled }">
            <button
              type="button"
              class="col-add-btn"
              :disabled="disabled"
              :class="{ 'btn-disabled': disabled }"
              aria-label="Create ticket in this column"
              @click="$emit('create-ticket', status)"
            >
              <AppIcon name="plus" :size="13" />
            </button>
          </template>
        </RbacActionWrapper>
      </div>
    </div>

    <!-- Cards List -->
    <div class="cards-list-container">
      <div v-if="tickets.length > 0" class="cards-wrapper">
        <KanbanCard
          v-for="ticket in tickets"
          :key="ticket.key"
          :ticket="ticket"
          @click="$emit('ticket-click', $event)"
        />
      </div>

      <!-- Empty Column State -->
      <div v-else class="empty-column-state">
        <p class="empty-text">No tickets</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kanban-column {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  min-width: 270px;
  width: 100%;
  min-height: 540px;
  transition: background-color var(--transition-fast), border-color var(--transition-fast);
}

.kanban-column.is-drag-over {
  background-color: var(--glass-column-highlight);
  border-color: rgba(99, 102, 241, 0.45);
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.12), inset 0 0 0 1px rgba(99, 102, 241, 0.3);
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
  background-color: var(--bg-surface-elevated);
  border-top-left-radius: var(--radius-lg);
  border-top-right-radius: var(--radius-lg);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.column-title {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.count-pill {
  font-size: 11px;
  padding: 2px 7px;
  min-width: 18px;
  line-height: 1.2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-full);
  color: var(--text-muted);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.points-pill {
  font-size: 10px;
  color: var(--text-muted);
}

.col-add-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: var(--radius-xs);
  color: var(--text-muted);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.col-add-btn:hover {
  background-color: var(--bg-surface-hover);
  color: var(--text-primary);
}

.cards-list-container {
  padding: var(--space-3);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.cards-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  flex: 1;
}

.empty-column-state {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 120px;
  border: 1px dashed var(--border-subtle);
  border-radius: var(--radius-md);
  margin: var(--space-2) 0;
}

.empty-text {
  font-size: var(--text-xs);
  color: var(--text-muted);
}
</style>
