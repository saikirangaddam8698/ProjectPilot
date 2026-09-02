<script setup>
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue';

defineProps({
  count: {
    type: Number,
    default: 4
  }
});
</script>

<template>
  <div class="kpi-skeleton-grid" aria-label="Loading metric cards" aria-busy="true">
    <div v-for="i in count" :key="i" class="kpi-skeleton-card">
      <div class="kpi-skeleton-top">
        <BaseSkeleton width="100px" height="13px" rounded="sm" />
        <BaseSkeleton width="34px" height="34px" rounded="md" />
      </div>
      <div class="kpi-skeleton-main">
        <BaseSkeleton width="80px" height="30px" rounded="sm" />
      </div>
      <div class="kpi-skeleton-bottom">
        <BaseSkeleton width="120px" height="14px" rounded="xs" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.kpi-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  width: 100%;
}

.kpi-skeleton-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  box-shadow: var(--shadow-sm);
  min-height: 120px;
}

.kpi-skeleton-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.kpi-skeleton-main {
  margin: var(--space-1) 0;
}

.kpi-skeleton-bottom {
  display: flex;
  align-items: center;
}

@media (max-width: 1024px) {
  .kpi-skeleton-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .kpi-skeleton-grid {
    grid-template-columns: 1fr;
  }
}
</style>
