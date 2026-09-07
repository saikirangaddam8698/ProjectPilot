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
      <!-- Topbar: Avatar + Key + Status -->
      <div class="card-head-skeleton">
        <div class="project-badge-skeleton">
          <BaseSkeleton width="36px" height="36px" rounded="md" />
          <BaseSkeleton width="48px" height="20px" rounded="xs" />
        </div>
        <BaseSkeleton width="56px" height="22px" rounded="full" />
      </div>

      <!-- Title & Lead -->
      <div class="identity-skeleton">
        <BaseSkeleton width="180px" height="22px" rounded="sm" />
        <BaseSkeleton width="110px" height="13px" rounded="xs" />
      </div>

      <!-- Description lines -->
      <div class="card-body-skeleton">
        <BaseSkeleton width="100%" height="13px" rounded="xs" />
        <BaseSkeleton width="85%" height="13px" rounded="xs" />
      </div>

      <!-- Sprint Banner -->
      <div class="sprint-skeleton">
        <BaseSkeleton width="100%" height="32px" rounded="md" />
      </div>

      <!-- Footer Stats -->
      <div class="card-foot-skeleton">
        <BaseSkeleton width="60px" height="24px" rounded="xs" />
        <BaseSkeleton width="60px" height="24px" rounded="xs" />
        <BaseSkeleton width="60px" height="24px" rounded="xs" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-grid-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: var(--space-6);
  width: 100%;
}

.project-card-skeleton {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  box-shadow: var(--shadow-sm);
  min-height: 240px;
}

.card-head-skeleton {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.project-badge-skeleton {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.identity-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.card-body-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.sprint-skeleton {
  width: 100%;
}

.card-foot-skeleton {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-subtle);
  margin-top: auto;
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
