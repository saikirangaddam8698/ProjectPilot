<script setup>
import { ref } from 'vue';
import { useTicketStore } from '@/stores/ticket.store';
import { useProjectStore } from '@/stores/project.store';
import KanbanBoard from '@/components/tickets/KanbanBoard.vue';
import TicketListView from '@/components/tickets/TicketListView.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const ticketStore = useTicketStore();
const projectStore = useProjectStore();

const viewMode = ref('kanban'); // 'kanban' | 'table'
const selectedProject = ref('all');
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">Tickets & Board</h2>
        <p class="page-subtitle">Track, filter, prioritize, and move tasks across all project workspaces.</p>
      </div>

      <div class="page-actions">
        <!-- View Mode Switcher -->
        <div class="view-mode-tabs">
          <button
            type="button"
            class="tab-mode-btn"
            :class="{ 'is-active': viewMode === 'kanban' }"
            @click="viewMode = 'kanban'"
          >
            <AppIcon name="tickets" :size="14" />
            <span>Kanban Board</span>
          </button>
          <button
            type="button"
            class="tab-mode-btn"
            :class="{ 'is-active': viewMode === 'table' }"
            @click="viewMode = 'table'"
          >
            <AppIcon name="my-work" :size="14" />
            <span>Table View</span>
          </button>
        </div>

        <BaseButton variant="primary" size="sm" @click="ticketStore.openCreateModal(selectedProject !== 'all' ? selectedProject : 'PILOT')">
          <template #prefix><AppIcon name="plus" :size="14" /></template>
          Create Ticket
        </BaseButton>
      </div>
    </div>

    <!-- Active View Component -->
    <div class="main-ticket-view">
      <KanbanBoard
        v-if="viewMode === 'kanban'"
        :projectKey="selectedProject !== 'all' ? selectedProject : null"
        :showProjectFilter="true"
      />
      <TicketListView
        v-else
        :projectKey="selectedProject !== 'all' ? selectedProject : null"
        :showProjectFilter="true"
      />
    </div>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.page-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-1);
}

.page-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.view-mode-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 2px;
}

.tab-mode-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 4px var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.tab-mode-btn:hover {
  color: var(--text-primary);
}

.tab-mode-btn.is-active {
  background-color: var(--bg-surface-elevated);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

.main-ticket-view {
  width: 100%;
}
</style>
