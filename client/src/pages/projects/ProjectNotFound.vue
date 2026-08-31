<script setup>
import { useRoute } from 'vue-router';
import BaseButton from '@/components/ui/BaseButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const route = useRoute();
</script>

<template>
  <div class="not-found-container">
    <div class="not-found-card">
      <div class="not-found-icon">
        <AppIcon name="projects" :size="32" />
      </div>
      <h2 class="not-found-title">Project Not Found</h2>
      <p class="not-found-desc">
        No project workspace matches the key <code class="mono">{{ route.params.projectKey }}</code>. It may have been renamed, moved, or deleted.
      </p>
      <div class="not-found-actions">
        <BaseButton variant="primary" size="md" to="/projects">
          ← Back to All Projects
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 450px;
  padding: var(--space-8);
}

.not-found-card {
  max-width: 480px;
  text-align: center;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-8) var(--space-6);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.not-found-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  background-color: var(--badge-neutral-bg);
  border: 1px solid var(--border-default);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
}

.not-found-title {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.not-found-desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
}

.not-found-desc code {
  background-color: var(--bg-surface-elevated);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-default);
  color: var(--color-primary-400);
}

.not-found-actions {
  margin-top: var(--space-2);
}
</style>
