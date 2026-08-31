<script setup>
import { computed } from 'vue';
import { useTicketStore } from '@/stores/ticket.store';
import { useProjectStore } from '@/stores/project.store';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseInput from '@/components/ui/BaseInput.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import TicketDetailDrawer from './TicketDetailDrawer.vue';
import CreateTicketModal from './CreateTicketModal.vue';

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

const tickets = computed(() => {
  return ticketStore.getFilteredTickets(props.projectKey);
});

function openTicket(ticketKey) {
  ticketStore.openTicketDetail(ticketKey);
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
    <!-- Filters & Search Toolbar -->
    <div class="list-toolbar">
      <div class="toolbar-left">
        <div class="search-wrap">
          <BaseInput
            :modelValue="ticketStore.searchQuery"
            @update:modelValue="ticketStore.searchQuery = $event"
            placeholder="Search tickets by key, title, or assignee..."
            size="sm"
          >
            <template #prefix><AppIcon name="search" :size="14" /></template>
          </BaseInput>
        </div>

        <select v-model="ticketStore.statusFilter" class="toolbar-select">
          <option value="all">All Statuses</option>
          <option value="Backlog">Backlog</option>
          <option value="Todo">Todo</option>
          <option value="In Progress">In Progress</option>
          <option value="In Review">In Review</option>
          <option value="Done">Done</option>
        </select>

        <select v-model="ticketStore.typeFilter" class="toolbar-select">
          <option value="all">All Types</option>
          <option value="Story">Story</option>
          <option value="Task">Task</option>
          <option value="Bug">Bug</option>
          <option value="Epic">Epic</option>
        </select>

        <select v-model="ticketStore.priorityFilter" class="toolbar-select">
          <option value="all">All Priorities</option>
          <option value="Urgent">Urgent</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

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
        <BaseButton variant="primary" size="sm" @click="ticketStore.openCreateModal(projectKey || 'PILOT')">
          <template #prefix><AppIcon name="plus" :size="14" /></template>
          Create Ticket
        </BaseButton>
      </div>
    </div>

    <!-- Table Container -->
    <div class="table-card">
      <div class="table-scroll-wrapper">
        <table class="tickets-table">
          <thead>
            <tr>
              <th style="width: 110px;">Key</th>
              <th>Title</th>
              <th style="width: 90px;">Type</th>
              <th style="width: 120px;">Status</th>
              <th style="width: 100px;">Priority</th>
              <th style="width: 140px;">Assignee</th>
              <th style="width: 160px;">Sprint</th>
              <th style="width: 70px; text-align: right;">Points</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="t in tickets"
              :key="t.key"
              class="ticket-tr"
              @click="openTicket(t.key)"
            >
              <td>
                <span class="ticket-key mono">{{ t.key }}</span>
              </td>
              <td>
                <span class="ticket-title font-medium">{{ t.title }}</span>
                <span v-if="t.labels && t.labels.length" class="inline-labels">
                  <span v-for="l in t.labels" :key="l" class="inline-label">#{{ l }}</span>
                </span>
              </td>
              <td>
                <BaseBadge :variant="getTypeBadgeVariant(t.type)" size="sm">
                  {{ t.type }}
                </BaseBadge>
              </td>
              <td>
                <BaseBadge :variant="getStatusBadgeVariant(t.status)" size="sm" dot>
                  {{ t.status }}
                </BaseBadge>
              </td>
              <td>
                <BaseBadge :variant="getPriorityBadgeVariant(t.priority)" size="sm">
                  {{ t.priority }}
                </BaseBadge>
              </td>
              <td>
                <div v-if="t.assignee" class="assignee-cell">
                  <div class="cell-avatar">{{ t.assignee.avatar || 'M' }}</div>
                  <span class="truncate">{{ t.assignee.name }}</span>
                </div>
                <span v-else class="text-muted">—</span>
              </td>
              <td>
                <span class="sprint-cell truncate text-muted">{{ t.sprint || 'Backlog' }}</span>
              </td>
              <td style="text-align: right;">
                <span class="points-cell mono">{{ t.storyPoints || 0 }}</span>
              </td>
            </tr>

            <tr v-if="tickets.length === 0">
              <td colspan="8" class="empty-table-cell text-muted">
                No tickets found matching current filters.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Ticket Detail Drawer -->
    <TicketDetailDrawer />

    <!-- Create Ticket Modal -->
    <CreateTicketModal
      :modelValue="ticketStore.isCreateModalOpen"
      :projectKey="projectKey"
    />
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

.search-wrap {
  max-width: 300px;
  width: 100%;
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
}

.clear-filters-btn {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-decoration: underline;
  cursor: pointer;
}

.clear-filters-btn:hover {
  color: var(--text-primary);
}

.table-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.table-scroll-wrapper {
  overflow-x: auto;
}

.tickets-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: var(--text-sm);
}

.tickets-table th {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background-color: var(--bg-surface-elevated);
  border-bottom: 1px solid var(--border-subtle);
}

.ticket-tr {
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.ticket-tr:hover {
  background-color: var(--bg-surface-hover);
}

.tickets-table td {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
}

.tickets-table tr:last-child td {
  border-bottom: none;
}

.ticket-key {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.ticket-title {
  color: var(--text-primary);
  margin-right: var(--space-2);
}

.inline-labels {
  display: inline-flex;
  gap: 4px;
}

.inline-label {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-muted);
}

.assignee-cell {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.cell-avatar {
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
  flex-shrink: 0;
}

.sprint-cell {
  font-size: var(--text-xs);
  max-width: 140px;
  display: inline-block;
}

.points-cell {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.empty-table-cell {
  text-align: center;
  padding: var(--space-8);
  font-size: var(--text-sm);
}
</style>
