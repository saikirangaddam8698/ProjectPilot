<script setup>
import { ref, computed } from 'vue';
import { useTicketStore } from '@/stores/ticket.store';
import { useProjectStore } from '@/stores/project.store';
import { useSprintStore } from '@/stores/sprint.store';
import { useAuthStore } from '@/stores/auth.store';
import KanbanColumn from './KanbanColumn.vue';
import KanbanBoardSkeleton from '@/components/skeletons/KanbanBoardSkeleton.vue';
import ServiceUnavailableBanner from '@/components/ui/ServiceUnavailableBanner.vue';
import TicketDetailDrawer from './TicketDetailDrawer.vue';
import CreateTicketModal from './CreateTicketModal.vue';
import BaseInput from '@/components/ui/BaseInput.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseSelect from '@/components/ui/BaseSelect.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import RbacActionWrapper from '@/components/ui/RbacActionWrapper.vue';

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
const authStore = useAuthStore();

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

const projectScopeOptions = computed(() => [
  { value: 'all', label: 'All Projects' },
  ...projectStore.allProjects.map((p) => ({
    value: p.key,
    label: `${p.name} (${p.key})`
  }))
]);

const sprintFilterOptions = computed(() => [
  { value: 'all', label: 'All Sprints & Backlog' },
  { value: 'backlog', label: 'Backlog Only (Unscheduled)' },
  ...availableSprints.value.map((s) => ({
    value: s.id,
    label: `${s.name.split('—')[0].trim()} (${s.status})`
  }))
]);

const typeFilterOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'Story', label: 'Story' },
  { value: 'Task', label: 'Task' },
  { value: 'Bug', label: 'Bug' },
  { value: 'Epic', label: 'Epic' }
];

const priorityFilterOptions = [
  { value: 'all', label: 'All Priorities' },
  { value: 'Urgent', label: 'Urgent' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' }
];

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

async function handleTicketDrop(payload) {
  // If user is a viewer, block drag-and-drop mutations cleanly
  if (authStore.isViewer) {
    authStore.showAccessDenied({
      title: 'Action Restricted',
      message: 'Viewers have read-only permissions and cannot move cards or change ticket statuses.',
      requiredRole: 'DEVELOPER or higher',
      action: 'Move ticket'
    });
    return;
  }

  const key = payload?.ticketKey || payload?.ticketId || payload?.key;
  const newStatus = payload?.status || payload?.newStatus;
  if (!key || !newStatus) return;

  const ticket = ticketStore.getTicketByKey(key) || ticketStore.getTicketById(key);
  if (!ticket) return;

  // Verify project authorization for non-admins
  if (!authStore.isAdmin && ticket.projectKey && !authStore.hasProjectAccess(ticket.projectKey)) {
    authStore.showAccessDenied({
      title: 'Access Restricted',
      message: `You are not assigned to project "${ticket.projectKey}" and cannot modify its tickets.`,
      requiredRole: 'Project Member',
      action: `Move ticket ${ticket.key}`
    });
    return;
  }

  const oldStatus = ticket?.status;
  if (oldStatus && oldStatus.toLowerCase() === newStatus.toLowerCase()) return;

  try {
    // Safe status update using ticket key
    await ticketStore.updateTicketStatus(ticket.key, newStatus);

    // Micro feedback toast
    toastMessage.value = `${ticket.key} moved to ${newStatus}`;
    setTimeout(() => {
      toastMessage.value = '';
    }, 3000);
  } catch (err) {
    console.error('Failed to move ticket:', err);
  }
}

function handleCreateInColumn(statusId) {
  createPrefillStatus.value = statusId;
  ticketStore.openCreateModal(activeScope.value || 'PILOT', statusId);
  isCreateModalOpen.value = true;
}

function openCreateModal() {
  createPrefillStatus.value = 'Todo';
  ticketStore.openCreateModal(activeScope.value || 'PILOT', 'Todo');
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
          <BaseSelect
            v-model="selectedProjectScope"
            :options="projectScopeOptions"
            size="sm"
          />
        </div>

        <!-- Sprint Filter (Step 15) -->
        <div class="filter-select-wrap">
          <BaseSelect
            v-model="ticketStore.sprintFilter"
            :options="sprintFilterOptions"
            size="sm"
          />
        </div>

        <!-- Type Filter -->
        <div class="filter-select-wrap">
          <BaseSelect
            v-model="ticketStore.typeFilter"
            :options="typeFilterOptions"
            size="sm"
          />
        </div>

        <!-- Priority Filter -->
        <div class="filter-select-wrap">
          <BaseSelect
            v-model="ticketStore.priorityFilter"
            :options="priorityFilterOptions"
            size="sm"
          />
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
        <RbacActionWrapper action="create_ticket">
          <template #default="{ disabled }">
            <BaseButton
              variant="primary"
              size="sm"
              :disabled="disabled"
              @click="openCreateModal"
            >
              <template #prefix><AppIcon name="plus" :size="14" /></template>
              Create Ticket
            </BaseButton>
          </template>
        </RbacActionWrapper>
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
      v-model="isCreateModalOpen"
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

.filter-select-wrap {
  min-width: 145px;
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
