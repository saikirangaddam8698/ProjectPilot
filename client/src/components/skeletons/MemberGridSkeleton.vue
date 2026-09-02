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
  <div class="member-grid-skeleton" aria-label="Loading workspace members" aria-busy="true">
    <div v-for="i in count" :key="i" class="member-card-skeleton">
      <!-- Member Header: Avatar & Info -->
      <div class="member-head-skeleton">
        <BaseSkeleton width="48px" height="48px" rounded="full" />
        <div class="member-info-skeleton">
          <BaseSkeleton width="130px" height="16px" rounded="sm" />
          <BaseSkeleton width="160px" height="12px" rounded="xs" />
          <BaseSkeleton width="80px" height="18px" rounded="xs" />
        </div>
      </div>

      <!-- Capacity & Skills -->
      <div class="member-body-skeleton">
        <div class="member-capacity-skeleton">
          <BaseSkeleton width="90px" height="12px" rounded="xs" />
          <BaseSkeleton width="100%" height="6px" rounded="full" />
        </div>
        <div class="skills-tags-skeleton">
          <BaseSkeleton width="50px" height="18px" rounded="xs" />
          <BaseSkeleton width="60px" height="18px" rounded="xs" />
          <BaseSkeleton width="55px" height="18px" rounded="xs" />
        </div>
      </div>

      <!-- Footer: Projects & Action -->
      <div class="member-foot-skeleton">
        <BaseSkeleton width="80px" height="12px" rounded="xs" />
        <BaseSkeleton width="70px" height="26px" rounded="md" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.member-grid-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-5);
  width: 100%;
}

.member-card-skeleton {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.member-head-skeleton {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.member-info-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.member-body-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.member-capacity-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.skills-tags-skeleton {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.member-foot-skeleton {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-subtle);
  margin-top: auto;
}
</style>
