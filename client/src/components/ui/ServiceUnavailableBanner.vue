<script setup>
import AppIcon from '@/components/ui/AppIcon.vue';
import BaseButton from '@/components/ui/BaseButton.vue';

defineProps({
  title: {
    type: String,
    default: 'Database Service Unavailable'
  },
  message: {
    type: String,
    default: 'Unable to connect to PostgreSQL database. Please ensure PostgreSQL is running at localhost:5432.'
  },
  retryLabel: {
    type: String,
    default: 'Retry Connection'
  }
});

const emit = defineEmits(['retry']);
</script>

<template>
  <div class="service-unavailable-banner" role="alert">
    <div class="banner-icon">
      <AppIcon name="database" :size="22" />
    </div>
    <div class="banner-content">
      <h4 class="banner-title">{{ title }}</h4>
      <p class="banner-message">{{ message }}</p>
    </div>
    <div class="banner-action">
      <BaseButton variant="outline" size="sm" @click="emit('retry')">
        <template #prefix><AppIcon name="refresh-cw" :size="14" /></template>
        {{ retryLabel }}
      </BaseButton>
    </div>
  </div>
</template>

<style scoped>
.service-unavailable-banner {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background-color: rgba(245, 158, 11, 0.08);
  border: 1px solid var(--color-warning-500);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-5);
}

.banner-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background-color: rgba(245, 158, 11, 0.15);
  color: var(--color-warning-500);
  flex-shrink: 0;
}

.banner-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.banner-title {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.banner-message {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

.banner-action {
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .service-unavailable-banner {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }
}
</style>
