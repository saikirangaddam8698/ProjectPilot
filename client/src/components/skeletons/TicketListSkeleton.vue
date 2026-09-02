<script setup>
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue';

defineProps({
  rows: {
    type: Number,
    default: 7
  }
});
</script>

<template>
  <div class="ticket-list-skeleton" aria-label="Loading tickets table" aria-busy="true">
    <!-- Table Header Skeleton -->
    <div class="table-header-skeleton">
      <BaseSkeleton width="80px" height="13px" rounded="xs" />
      <BaseSkeleton width="200px" height="13px" rounded="xs" />
      <BaseSkeleton width="70px" height="13px" rounded="xs" />
      <BaseSkeleton width="70px" height="13px" rounded="xs" />
      <BaseSkeleton width="90px" height="13px" rounded="xs" />
      <BaseSkeleton width="60px" height="13px" rounded="xs" />
    </div>

    <!-- Table Rows Stack -->
    <div class="table-rows-skeleton">
      <div v-for="i in rows" :key="i" class="table-row-skeleton">
        <div class="cell-key">
          <BaseSkeleton width="18px" height="18px" rounded="xs" />
          <BaseSkeleton width="68px" height="14px" rounded="xs" />
        </div>
        <div class="cell-title">
          <BaseSkeleton :width="`${Math.floor(60 + (i * 7) % 35)}%`" height="14px" rounded="xs" />
        </div>
        <div class="cell-badge">
          <BaseSkeleton width="65px" height="18px" rounded="full" />
        </div>
        <div class="cell-badge">
          <BaseSkeleton width="60px" height="18px" rounded="full" />
        </div>
        <div class="cell-assignee">
          <BaseSkeleton width="22px" height="22px" rounded="full" />
          <BaseSkeleton width="75px" height="12px" rounded="xs" />
        </div>
        <div class="cell-points">
          <BaseSkeleton width="26px" height="18px" rounded="xs" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ticket-list-skeleton {
  width: 100%;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.table-header-skeleton {
  display: grid;
  grid-template-columns: 110px 1fr 100px 100px 140px 60px;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background-color: var(--bg-surface-elevated);
  border-bottom: 1px solid var(--border-subtle);
  align-items: center;
}

.table-rows-skeleton {
  display: flex;
  flex-direction: column;
}

.table-row-skeleton {
  display: grid;
  grid-template-columns: 110px 1fr 100px 100px 140px 60px;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
  align-items: center;
}

.table-row-skeleton:last-child {
  border-bottom: none;
}

.cell-key {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.cell-title {
  display: flex;
  align-items: center;
}

.cell-badge {
  display: flex;
  align-items: center;
}

.cell-assignee {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.cell-points {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .table-header-skeleton,
  .table-row-skeleton {
    grid-template-columns: 90px 1fr 80px;
  }
  .cell-badge:nth-of-type(2),
  .cell-assignee,
  .cell-points {
    display: none;
  }
}
</style>
