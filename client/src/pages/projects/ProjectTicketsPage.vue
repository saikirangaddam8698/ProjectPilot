<script setup>
import { ref } from 'vue';
import KanbanBoard from '@/components/tickets/KanbanBoard.vue';
import TicketListView from '@/components/tickets/TicketListView.vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
});

const currentViewMode = ref('table'); // 'table' | 'kanban'
</script>

<template>
  <div class="project-tickets-page">
    <!-- View Mode Switcher Header -->
    <div class="view-mode-bar">
      <div class="mode-tabs">
        <button
          type="button"
          class="mode-btn"
          :class="{ 'is-active': currentViewMode === 'table' }"
          @click="currentViewMode = 'table'"
        >
          <AppIcon name="my-work" :size="14" />
          <span>Table View</span>
        </button>
        <button
          type="button"
          class="mode-btn"
          :class="{ 'is-active': currentViewMode === 'kanban' }"
          @click="currentViewMode = 'kanban'"
        >
          <AppIcon name="tickets" :size="14" />
          <span>Kanban Board</span>
        </button>
      </div>

      <div class="project-tag-wrap">
        <BaseBadge variant="neutral" size="sm">Project Scope: {{ project.key }}</BaseBadge>
      </div>
    </div>

    <!-- Active View Component -->
    <div class="view-content">
      <TicketListView
        v-if="currentViewMode === 'table'"
        :projectKey="project.key"
      />
      <KanbanBoard
        v-else
        :projectKey="project.key"
      />
    </div>
  </div>
</template>

<style scoped>
.project-tickets-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
}

.view-mode-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.mode-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 2px;
}

.mode-btn {
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

.mode-btn:hover {
  color: var(--text-primary);
}

.mode-btn.is-active {
  background-color: var(--bg-surface-elevated);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

.view-content {
  width: 100%;
}
</style>
