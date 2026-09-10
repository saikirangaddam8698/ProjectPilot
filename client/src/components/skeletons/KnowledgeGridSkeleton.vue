<script setup>
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue';
import BaseLoader from '@/components/ui/BaseLoader.vue';

defineProps({
  count: {
    type: Number,
    default: 6
  },
  message: {
    type: String,
    default: 'Loading Knowledge Base Documents...'
  },
  subtext: {
    type: String,
    default: 'Retrieving project documents & pgvector embeddings...'
  }
});
</script>

<template>
  <div class="knowledge-skeleton-wrap" aria-label="Loading knowledge base" aria-busy="true">
    <!-- Active Status Banner with Spinning Loader -->
    <div class="knowledge-loader-banner">
      <BaseLoader
        size="md"
        :message="message"
        :subtext="subtext"
      />
    </div>

    <!-- Skeleton Documents Grid -->
    <div class="docs-skeleton-grid">
      <div v-for="i in count" :key="i" class="doc-card-skeleton">
        <!-- Header -->
        <div class="card-head-skeleton">
          <div class="head-left-skeleton">
            <BaseSkeleton width="28px" height="28px" rounded="md" />
            <div class="title-meta-skeleton">
              <BaseSkeleton width="180px" height="18px" rounded="sm" />
              <BaseSkeleton width="120px" height="12px" rounded="xs" />
            </div>
          </div>
          <BaseSkeleton width="64px" height="22px" rounded="full" />
        </div>

        <!-- Excerpt Lines -->
        <div class="card-body-skeleton">
          <BaseSkeleton width="100%" height="13px" rounded="xs" />
          <BaseSkeleton width="90%" height="13px" rounded="xs" />
          <BaseSkeleton width="65%" height="13px" rounded="xs" />
        </div>

        <!-- Footer -->
        <div class="card-foot-skeleton">
          <BaseSkeleton width="70px" height="24px" rounded="xs" />
          <BaseSkeleton width="60px" height="24px" rounded="xs" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.knowledge-skeleton-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
}

.knowledge-loader-banner {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--space-4) var(--space-6);
  background: var(--glass-bg-subtle, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--glass-border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--radius-xl, 16px);
  backdrop-filter: var(--glass-blur-sm, blur(6px));
  -webkit-backdrop-filter: var(--glass-blur-sm, blur(6px));
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.docs-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-4);
  width: 100%;
}

.doc-card-skeleton {
  background-color: var(--bg-surface, #1e293b);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-lg, 12px);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
}

.card-head-skeleton {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.head-left-skeleton {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
}

.title-meta-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
}

.card-body-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: var(--space-1) 0;
}

.card-foot-skeleton {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
}
</style>
