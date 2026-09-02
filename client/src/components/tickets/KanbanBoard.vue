<script setup>
import { ref, computed } from 'vue';
import { useTicketStore } from '@/stores/ticket.store';
import { useProjectStore } from '@/stores/project.store';
import { useSprintStore } from '@/stores/sprint.store';
import KanbanColumn from './KanbanColumn.vue';
import KanbanBoardSkeleton from '@/components/skeletons/KanbanBoardSkeleton.vue';
import ServiceUnavailableBanner from '@/components/ui/ServiceUnavailableBanner.vue';
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

const isInitialLoading = computed(() => {
  return ticketStore.isLoading && ticketStore.allTickets.length === 0;
});

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

function handleTicketClick(ticketKey) {
  ticketStore.openTicketDetail(ticketKey);
}

function handleTicketDrop({ ticketId, newStatus }) {
  const ticket = ticketStore.getTicketById(ticketId);
  const oldStatus = ticket?.status;
  if (!ticket || oldStatus === newStatus) return;

  // Safe status update
  ticketStore.updateTicketStatus(ticketId, newStatus);

  // Micro feedback toast
  toastMessage.value = `${ticket.key} moved to ${newStatus}`;
  setTimeout(() => {
    toastMessage.value = '';
  }, 3000);
}

function handleCreateInColumn(statusId) {
  createPrefillStatus.value = statusId;
  isCreateModalOpen.value = true;
}

function openCreateModal() {
  createPrefillStatus.value = 'Todo';
  isCreateModalOpen.value = true;
}

function handleRetry() {
  ticketStore.fetchTickets();
}
</script>

<template>
  <div class="kanban-board-container">
    <!-- Service Unavailable Error Banner -->
    <ServiceUnavailableBanner
      v-if="ticketStore.error && !isInitialLoading"
      :message="ticketStore.error"
      @retry="handleRetry"
    />

    <!-- Filter & Action Toolbar -->
    <div class="board-toolbar">
      <div class="toolbar-left">
        <!-- Search Input -->
        <div class="search-wrap">
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

    <!-- Skeleton Loader for Initial Data Fetch -->
    <KanbanBoardSkeleton v-if="isInitialLoading" />

    <!-- Kanban Columns Grid -->
    <div v-else class="kanban-columns-grid">
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

    <!-- Modals and Drawers -->
    <TicketDetailDrawer />
    <CreateTicketModal
      :isOpen="isCreateModalOpen"
      :defaultProjectKey="activeScope || 'PILOT'"
      :defaultStatus="createPrefillStatus"
      @close="isCreateModalOpen = false"
    />
  </div>
</template>

<style scoped>
.kanban-board-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
  height: 100%;
}

/* Toolbar */
.board-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
  padding-bottom: var(--space-1);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  flex: 1;
}

.search-wrap {
  width: 240px;
}

.toolbar-select {
  height: 32px;
  padding: 0 var(--space-3);
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-xs);
  outline: none;
  cursor: pointer;
  transition: border-color var(--transition-fast);
}

.toolbar-select:focus {
  border-color: var(--color-primary-500);
}

.clear-filters-btn {
  background: none;
  border: none;
  color: var(--color-primary-400);
  font-size: var(--text-xs);
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
}

.clear-filters-btn:hover {
  text-decoration: underline;
}

/* Toast */
.board-toast {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-success-500);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.toast-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  background-color: rgba(16, 185, 129, 0.15);
  color: var(--color-success-500);
}

.toast-text {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

/* Kanban Grid */
.kanban-columns-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(280px, 1fr));
  gap: var(--space-4);
  overflow-x: auto;
  align-items: start;
  padding-bottom: var(--space-4);
}

/* Toast Transition */
.toast-enter-active,
.toast-leave-active {
  transition: all var(--transition-normal);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
</style>
