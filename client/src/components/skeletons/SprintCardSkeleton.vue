<script setup>
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue';

defineProps({
  count: {
    type: Number,
    default: 2
  }
});
</script>

<template>
  <div class="sprint-skeleton-stack" aria-label="Loading sprints" aria-busy="true">
    <div v-for="i in count" :key="i" class="sprint-card-skeleton">
      <!-- Top header with badge and actions -->
      <div class="sprint-card-header">
        <div class="sprint-title-group">
          <BaseSkeleton width="160px" height="20px" rounded="sm" />
          <BaseSkeleton width="60px" height="20px" rounded="full" />
        </div>
        <div class="sprint-actions-group">
          <BaseSkeleton width="80px" height="28px" rounded="md" />
        </div>
      </div>

      <!-- Goal and dates -->
      <div class="sprint-meta-row">
        <BaseSkeleton width="60%" height="13px" rounded="xs" />
        <BaseSkeleton width="180px" height="13px" rounded="xs" />
      </div>

      <!-- Burnup / Progress Bar -->
      <div class="sprint-progress-skeleton">
        <div class="progress-labels">
          <BaseSkeleton width="90px" height="12px" rounded="xs" />
          <BaseSkeleton width="40px" height="12px" rounded="xs" />
        </div>
        <BaseSkeleton width="100%" height="8px" rounded="full" />
      </div>

      <!-- Mini KPI blocks -->
      <div class="sprint-stats-skeleton">
        <div v-for="s in 4" :key="s" class="stat-pill-skeleton">
          <BaseSkeleton width="50px" height="11px" rounded="xs" />
          <BaseSkeleton width="30px" height="18px" rounded="xs" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sprint-skeleton-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
}

.sprint-card-skeleton {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.sprint-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sprint-title-group {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.sprint-actions-group {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.sprint-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sprint-progress-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.progress-labels {
  display: flex;
  justify-content: space-between;
}

.sprint-stats-skeleton {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-subtle);
}

.stat-pill-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  background-color: var(--bg-surface-elevated);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
}

@media (max-width: 640px) {
  .sprint-stats-skeleton {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
