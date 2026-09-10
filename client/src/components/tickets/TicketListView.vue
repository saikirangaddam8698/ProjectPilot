<script setup>
import { computed } from 'vue';
import { useTicketStore } from '@/stores/ticket.store';
import { useProjectStore } from '@/stores/project.store';
import { useAuthStore } from '@/stores/auth.store';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseInput from '@/components/ui/BaseInput.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import TicketListSkeleton from '@/components/skeletons/TicketListSkeleton.vue';
import ServiceUnavailableBanner from '@/components/ui/ServiceUnavailableBanner.vue';
import TicketDetailDrawer from './TicketDetailDrawer.vue';
import CreateTicketModal from './CreateTicketModal.vue';
import BaseSelect from '@/components/ui/BaseSelect.vue';
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
const authStore = useAuthStore();

const isInitialLoading = computed(() => {
  return ticketStore.isLoading && ticketStore.allTickets.length === 0;
});

const tickets = computed(() => {
  return ticketStore.getFilteredTickets(props.projectKey);
});

const projectScopeOptions = computed(() => [
  { value: 'all', label: 'All Projects' },
  ...projectStore.allProjects.map((p) => ({
    value: p.key,
    label: `${p.name} (${p.key})`
  }))
]);

const statusFilterOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Backlog', label: 'Backlog' },
  { value: 'Todo', label: 'To Do' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'In Review', label: 'In Review' },
  { value: 'Done', label: 'Done' }
];

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

function openTicket(ticketKey) {
  ticketStore.openTicketDetail(ticketKey);
}

function handleRetry() {
  ticketStore.fetchTickets();
}

function getTypeBadgeVariant(type) {
  if (type === 'Bug') return 'danger';
  if (type === 'Story') return 'primary';
  if (type === 'Epic') return 'purple';
  return 'neutral';
}

function getStatusBadgeVariant(status) {
  if (status === 'Done') return 'success';
  if (status === 'In Review') return 'warning';
  if (status === 'In Progress') return 'info';
  return 'neutral';
}

function getPriorityBadgeVariant(p) {
  if (p === 'Urgent') return 'danger';
  if (p === 'High') return 'warning';
  if (p === 'Medium') return 'info';
  return 'neutral';
}
</script>

<template>
  <div class="ticket-list-view-container">
    <!-- Service Unavailable Error Banner -->
    <ServiceUnavailableBanner
      v-if="ticketStore.error && !isInitialLoading"
      :message="ticketStore.error"
      @retry="handleRetry"
    />

    <!-- Filters & Search Toolbar -->
    <div class="list-toolbar">
      <div class="toolbar-left">
        <!-- Search Input -->
        <div class="search-box">
          <BaseInput
            :modelValue="ticketStore.searchQuery"
            @update:modelValue="ticketStore.searchQuery = $event"
            placeholder="Search tickets by summary or key..."
            size="sm"
          >
            <template #prefix><AppIcon name="search" :size="14" /></template>
          </BaseInput>
        </div>

        <!-- Optional Project Scope Switcher (for Global View) -->
        <div v-if="showProjectFilter" class="filter-select-wrap">
          <BaseSelect
            :model-value="ticketStore.activeProjectFilter"
            :options="projectScopeOptions"
            size="sm"
            @update:model-value="ticketStore.setProjectFilter"
          />
        </div>

        <!-- Status Filter -->
        <div class="filter-select-wrap">
          <BaseSelect
            v-model="ticketStore.statusFilter"
            :options="statusFilterOptions"
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
          v-if="ticketStore.searchQuery || ticketStore.statusFilter !== 'all' || ticketStore.typeFilter !== 'all' || ticketStore.priorityFilter !== 'all'"
          type="button"
          class="clear-filters-btn"
          @click="ticketStore.resetFilters"
        >
          Reset
        </button>
      </div>

      <div class="toolbar-right">
        <RbacActionWrapper action="create_ticket">
          <template #default="{ disabled }">
            <BaseButton
              variant="primary"
              size="sm"
              :disabled="disabled"
              @click="ticketStore.openCreateModal(projectKey || 'PILOT')"
            >
              <template #prefix><AppIcon name="plus" :size="14" /></template>
              New Ticket
            </BaseButton>
          </template>
        </RbacActionWrapper>
      </div>
    </div>

    <!-- Skeleton Loader for Initial Load -->
    <TicketListSkeleton v-if="isInitialLoading" :rows="8" />

    <!-- Table View Container -->
    <div v-else-if="tickets.length > 0" class="tickets-table-card">
      <table class="tickets-table">
        <thead>
          <tr>
            <th class="th-key">Key</th>
            <th class="th-title">Title</th>
            <th class="th-type">Type</th>
            <th class="th-status">Status</th>
            <th class="th-priority">Priority</th>
            <th class="th-assignee">Assignee</th>
            <th class="th-points">Points</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="ticket in tickets"
            :key="ticket.id"
            class="ticket-table-row"
            @click="openTicket(ticket.key)"
          >
            <!-- Key -->
            <td class="td-key">
              <span class="ticket-key-chip mono">{{ ticket.key }}</span>
            </td>

            <!-- Title & Summary -->
            <td class="td-title">
              <span class="ticket-title-text font-medium">{{ ticket.title }}</span>
            </td>

            <!-- Type -->
            <td class="td-type">
              <BaseBadge :variant="getTypeBadgeVariant(ticket.type)" size="xs">
                {{ ticket.type }}
              </BaseBadge>
            </td>

            <!-- Status -->
            <td class="td-status">
              <BaseBadge :variant="getStatusBadgeVariant(ticket.status)" size="xs">
                {{ ticket.status }}
              </BaseBadge>
            </td>

            <!-- Priority -->
            <td class="td-priority">
              <BaseBadge :variant="getPriorityBadgeVariant(ticket.priority)" size="xs">
                {{ ticket.priority }}
              </BaseBadge>
            </td>

            <!-- Assignee -->
            <td class="td-assignee">
              <div v-if="ticket.assignee" class="assignee-pill" :title="ticket.assignee.name">
                <div class="avatar-circle-xs">{{ ticket.assignee.avatar || ticket.assignee.name.slice(0, 2) }}</div>
                <span class="assignee-name truncate">{{ ticket.assignee.name }}</span>
              </div>
              <span v-else class="text-muted text-xs">Unassigned</span>
            </td>

            <!-- Story Points -->
            <td class="td-points">
              <span class="points-pill mono">{{ ticket.storyPoints || 0 }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-else-if="!isInitialLoading && !ticketStore.error" class="empty-state">
      <div class="empty-icon-wrap">
        <AppIcon name="tickets" :size="32" />
      </div>
      <h3 class="empty-title">No tickets match your filters</h3>
      <p class="empty-desc">
        Try resetting your search query or adjusting your status and type filters.
      </p>
      <BaseButton variant="outline" size="sm" @click="ticketStore.resetFilters">
        Reset Filters
      </BaseButton>
    </div>

    <!-- Drawers & Modals -->
    <TicketDetailDrawer />
    <CreateTicketModal />
  </div>
</template>

<style scoped>
.ticket-list-view-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
}

.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  flex: 1;
}

.search-box {
  width: 280px;
}

.filter-select-wrap {
  min-width: 140px;
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

/* Table Card */
.tickets-table-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.tickets-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: var(--text-xs);
}

.tickets-table thead {
  background-color: var(--bg-surface-elevated);
  border-bottom: 1px solid var(--border-subtle);
}

.tickets-table th {
  padding: var(--space-3) var(--space-4);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 11px;
}

.tickets-table td {
  padding: 12px var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
  vertical-align: middle;
}

.td-type,
.td-status,
.td-priority {
  white-space: nowrap;
  vertical-align: middle;
}

.ticket-table-row {
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.ticket-table-row:hover {
  background-color: var(--bg-surface-hover);
}

.ticket-key-chip {
  color: var(--color-primary-400);
  font-weight: var(--font-weight-medium);
}

.ticket-title-text {
  font-size: var(--text-sm);
}

.assignee-pill {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  max-width: 150px;
}

.avatar-circle-xs {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background-color: var(--color-primary-600);
  color: #ffffff;
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.points-pill {
  background-color: var(--bg-surface-elevated);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-subtle);
  font-weight: var(--font-weight-medium);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12) var(--space-4);
  background-color: var(--bg-surface);
  border: 1px dashed var(--border-default);
  border-radius: var(--radius-lg);
  text-align: center;
  gap: var(--space-3);
}

.empty-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background-color: var(--bg-surface-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.empty-title {
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.empty-desc {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  max-width: 320px;
  margin: 0;
}
</style>
