<script setup>
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue';

defineProps({
  count: {
    type: Number,
    default: 6
  }
});
</script>

<template>
  <div class="activity-feed-skeleton" aria-label="Loading activity feed" aria-busy="true">
    <div v-for="i in count" :key="i" class="activity-item-skeleton">
      <div class="activity-avatar-col">
        <BaseSkeleton width="34px" height="34px" rounded="full" />
      </div>
      <div class="activity-content-col">
        <div class="activity-line-top">
          <BaseSkeleton :width="`${Math.floor(55 + (i * 9) % 35)}%`" height="14px" rounded="xs" />
          <BaseSkeleton width="70px" height="12px" rounded="xs" />
        </div>
        <BaseSkeleton width="120px" height="12px" rounded="xs" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.activity-feed-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}

.activity-item-skeleton {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}

.activity-item-skeleton:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.activity-content-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
}

.activity-line-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}
</style>
