<script setup>
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue';

const COLUMNS = ['Backlog', 'To Do', 'In Progress', 'In Review', 'Done'];
</script>

<template>
  <div class="kanban-skeleton-container" aria-label="Loading Kanban board" aria-busy="true">
    <div class="kanban-skeleton-board">
      <div v-for="col in COLUMNS" :key="col" class="kanban-skeleton-column">
        <!-- Column Header -->
        <div class="column-header-skeleton">
          <div class="col-title-group">
            <BaseSkeleton width="80px" height="15px" rounded="sm" />
            <BaseSkeleton width="22px" height="18px" rounded="full" />
          </div>
          <BaseSkeleton width="18px" height="18px" rounded="xs" />
        </div>

        <!-- Column Cards Stack -->
        <div class="column-cards-skeleton">
          <div v-for="card in 3" :key="card" class="ticket-card-skeleton">
            <!-- Top tag and priority -->
            <div class="ticket-card-top">
              <BaseSkeleton width="64px" height="14px" rounded="xs" />
              <BaseSkeleton width="14px" height="14px" rounded="xs" />
            </div>

            <!-- Title lines -->
            <div class="ticket-card-title">
              <BaseSkeleton width="100%" height="13px" rounded="xs" />
              <BaseSkeleton width="75%" height="13px" rounded="xs" />
            </div>

            <!-- Footer: Points & Assignee -->
            <div class="ticket-card-foot">
              <BaseSkeleton width="30px" height="16px" rounded="xs" />
              <BaseSkeleton width="22px" height="22px" rounded="full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kanban-skeleton-container {
  width: 100%;
  height: 100%;
  overflow-x: auto;
}

.kanban-skeleton-board {
  display: flex;
  gap: var(--space-4);
  min-width: 1000px;
  height: 100%;
  align-items: flex-start;
}

.kanban-skeleton-column {
  flex: 1;
  min-width: 260px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.column-header-skeleton {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-1) var(--space-1);
}

.col-title-group {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.column-cards-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.ticket-card-skeleton {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  box-shadow: var(--shadow-sm);
}

.ticket-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ticket-card-title {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin: var(--space-1) 0;
}

.ticket-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-1);
}
</style>
