<script setup>
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue';

defineProps({
  count: {
    type: Number,
    default: 3
  }
});
</script>

<template>
  <div class="project-grid-skeleton" aria-label="Loading projects" aria-busy="true">
    <div v-for="i in count" :key="i" class="project-card-skeleton">
      <!-- Header -->
      <div class="card-head-skeleton">
        <div class="project-badge-skeleton">
          <BaseSkeleton width="36px" height="36px" rounded="md" />
          <div class="title-meta-skeleton">
            <BaseSkeleton width="140px" height="18px" rounded="sm" />
            <BaseSkeleton width="60px" height="12px" rounded="xs" />
          </div>
        </div>
        <BaseSkeleton width="50px" height="20px" rounded="full" />
      </div>

      <!-- Description lines -->
      <div class="card-body-skeleton">
        <BaseSkeleton width="100%" height="13px" rounded="xs" />
        <BaseSkeleton width="85%" height="13px" rounded="xs" />
      </div>

      <!-- Health Meter -->
      <div class="health-skeleton">
        <div class="health-meta-skeleton">
          <BaseSkeleton width="80px" height="12px" rounded="xs" />
          <BaseSkeleton width="36px" height="12px" rounded="xs" />
        </div>
        <BaseSkeleton width="100%" height="6px" rounded="full" />
      </div>

      <!-- Footer Stats & Avatars -->
      <div class="card-foot-skeleton">
        <div class="avatars-skeleton">
          <BaseSkeleton width="24px" height="24px" rounded="full" />
          <BaseSkeleton width="24px" height="24px" rounded="full" style="margin-left: -6px;" />
          <BaseSkeleton width="24px" height="24px" rounded="full" style="margin-left: -6px;" />
        </div>
        <BaseSkeleton width="90px" height="14px" rounded="xs" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-grid-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-5);
  width: 100%;
}

.project-card-skeleton {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  box-shadow: var(--shadow-sm);
  min-height: 220px;
}

.card-head-skeleton {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.project-badge-skeleton {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.title-meta-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.card-body-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.health-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.health-meta-skeleton {
  display: flex;
  justify-content: space-between;
}

.card-foot-skeleton {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-subtle);
  margin-top: auto;
}

.avatars-skeleton {
  display: flex;
  align-items: center;
}
</style>
