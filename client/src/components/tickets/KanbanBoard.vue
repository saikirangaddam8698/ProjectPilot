<script setup>
import { ref, computed } from 'vue';
import { useTicketStore } from '@/stores/ticket.store';
import { useProjectStore } from '@/stores/project.store';
import { useSprintStore } from '@/stores/sprint.store';
import KanbanColumn from './KanbanColumn.vue';
import TicketDetailDrawer from './TicketDetailDrawer.vue';
import CreateTicketModal from './CreateTicketModal.vue';
import BaseInput from '@/components/ui/BaseInput.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const props = defineProps({
  projectKey: {
    type: String,
    default: null
  },
  showProjectFilter: {
    type: Boolean,
    default: false
  }
});

const ticketStore = useTicketStore();
const projectStore = useProjectStore();
const sprintStore = useSprintStore();

const isCreateModalOpen = ref(false);
const createPrefillStatus = ref('Todo');
const selectedProjectScope = ref(props.projectKey || 'all');
const toastMessage = ref('');

const COLUMNS = [
  { id: 'Backlog', title: 'Backlog' },
  { id: 'Todo', title: 'To Do' },
  { id: 'In Progress', title: 'In Progress' },
  { id: 'In Review', title: 'In Review' },
  { id: 'Done', title: 'Done' }
];

const activeScope = computed(() => {
  return props.projectKey || (selectedProjectScope.value !== 'all' ? selectedProjectScope.value : null);
});

const availableSprints = computed(() => {
  if (activeScope.value) {
    return sprintStore.getSprintsByProject(activeScope.value);
  }
  return sprintStore.allSprints;
});

// Filtered tickets based on search, filters, and active project
const currentTickets = computed(() => {
  return ticketStore.getFilteredTickets(activeScope.value);
});

function getTicketsForColumn(statusId) {
  return currentTickets.value.filter((t) => t.status.toLowerCase() === statusId.toLowerCase());
}

function handleTicketClick(ticket) {
  ticketStore.openTicketDetail(ticket.key);
}

function handleTicketDrop({ status, ticketKey }) {
  const updated = ticketStore.updateTicketStatus(ticketKey, status);
  if (updated) {
    toastMessage.value = `Moved ${ticketKey} to ${status}`;
    setTimeout(() => {
      toastMessage.value = '';
    }, 2500);
  }
}

function handleCreateInColumn(status) {
  createPrefillStatus.value = status;
  ticketStore.openCreateModal(props.projectKey || 'PILOT');
}

function openCreateModal() {
  ticketStore.openCreateModal(props.projectKey || 'PILOT');
}

function handleTicketCreated(newTicket) {
  toastMessage.value = `Ticket ${newTicket.key} created!`;
  setTimeout(() => {
    toastMessage.value = '';
  }, 3000);
}
</script>

<template>
  <div class="kanban-board-container">
    <!-- Toolbar: Search & Filters & New Ticket -->
    <div class="board-toolbar">
      <div class="toolbar-left">
        <!-- Search -->
        <div class="search-input-wrap">
          <BaseInput
            :modelValue="ticketStore.searchQuery"
            @update:modelValue="ticketStore.searchQuery = $event"
            placeholder="Filter board tickets..."
            size="sm"
          >
            <template #prefix><AppIcon name="search" :size="14" /></template>
          </BaseInput>
        </div>

        <!-- Optional Project Scope Switcher (for Global View) -->
        <div v-if="showProjectFilter" class="filter-select-wrap">
          <select v-model="selectedProjectScope" class="toolbar-select">
            <option value="all">All Projects</option>
            <option
              v-for="p in projectStore.allProjects"
              :key="p.id"
              :value="p.key"
            >
              {{ p.name }} ({{ p.key }})
            </option>
          </select>
        </div>

        <!-- Sprint Filter (Step 15) -->
        <div class="filter-select-wrap">
          <select v-model="ticketStore.sprintFilter" class="toolbar-select">
            <option value="all">All Sprints & Backlog</option>
            <option value="backlog">Backlog Only (Unscheduled)</option>
            <option
              v-for="s in availableSprints"
              :key="s.id"
              :value="s.id"
            >
              {{ s.name.split('—')[0].trim() }} ({{ s.status }})
            </option>
          </select>
        </div>

        <!-- Type Filter -->
        <div class="filter-select-wrap">
          <select v-model="ticketStore.typeFilter" class="toolbar-select">
            <option value="all">All Types</option>
            <option value="Story">Story</option>
            <option value="Task">Task</option>
            <option value="Bug">Bug</option>
            <option value="Epic">Epic</option>
          </select>
        </div>

        <!-- Priority Filter -->
        <div class="filter-select-wrap">
          <select v-model="ticketStore.priorityFilter" class="toolbar-select">
            <option value="all">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <!-- Reset Button -->
        <button
          v-if="ticketStore.searchQuery || ticketStore.typeFilter !== 'all' || ticketStore.priorityFilter !== 'all' || ticketStore.sprintFilter !== 'all'"
          type="button"
          class="clear-filters-btn"
          @click="ticketStore.resetFilters"
        >
          Reset Filters
        </button>
      </div>

      <div class="toolbar-right">
        <BaseButton variant="primary" size="sm" @click="openCreateModal">
          <template #prefix><AppIcon name="plus" :size="14" /></template>
          Create Ticket
        </BaseButton>
      </div>
    </div>

    <!-- Micro Feedback Toast (Fixed Overlay to Prevent Layout Shift) -->
    <Transition name="toast">
      <div v-if="toastMessage" class="board-toast" role="status" aria-live="polite">
        <div class="toast-icon-wrap">
          <AppIcon name="check" :size="18" />
        </div>
        <span class="toast-text">{{ toastMessage }}</span>
      </div>
    </Transition>

    <!-- Kanban Columns Grid -->
    <div class="kanban-columns-grid">
      <KanbanColumn
        v-for="col in COLUMNS"
        :key="col.id"
        :status="col.id"
        :title="col.title"
        :tickets="getTicketsForColumn(col.id)"
        @ticket-click="handleTicketClick"
        @ticket-drop="handleTicketDrop"
        @create-ticket="handleCreateInColumn"
      />
    </div>

    <!-- Ticket Detail Side-Sheet Drawer -->
    <TicketDetailDrawer />

    <!-- Create Ticket Modal -->
    <CreateTicketModal
      :modelValue="ticketStore.isCreateModalOpen"
      :projectKey="projectKey"
      @created="handleTicketCreated"
    />
  </div>
</template>

<style scoped>
.kanban-board-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
}

.board-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
  flex: 1;
}

.search-input-wrap {
  max-width: 260px;
  width: 100%;
}

.filter-select-wrap {
  display: flex;
  align-items: center;
}

.toolbar-select {
  height: 30px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  padding: 0 var(--space-2);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  outline: none;
  cursor: pointer;
  transition: border-color var(--transition-fast);
}

.toolbar-select:focus {
  border-color: var(--border-focus);
}

.clear-filters-btn {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-decoration: underline;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.clear-filters-btn:hover {
  color: var(--text-primary);
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.board-toast {
  position: fixed;
  top: calc(var(--header-height) + 20px);
  right: 28px;
  z-index: var(--z-toast);
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-lg);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.2), 0 4px 12px -2px rgba(0, 0, 0, 0.12);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  min-width: 260px;
  max-width: 440px;
  pointer-events: auto;
}

.toast-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background-color: var(--badge-success-bg);
  color: var(--badge-success-text);
  flex-shrink: 0;
}

.toast-text {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity var(--transition-base), transform var(--transition-base);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.kanban-columns-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(260px, 1fr));
  gap: var(--space-4);
  overflow-x: auto;
  padding-bottom: var(--space-4);
}

@media (max-width: 1280px) {
  .kanban-columns-grid {
    grid-template-columns: repeat(5, 270px);
  }
}
</style>
