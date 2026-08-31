<script setup>
import BaseBadge from '@/components/ui/BaseBadge.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  subtext: {
    type: String,
    default: ''
  },
  badgeText: {
    type: String,
    default: ''
  },
  badgeVariant: {
    type: String,
    default: 'neutral'
  },
  icon: {
    type: String,
    default: ''
  },
  trend: {
    type: String, // 'up' | 'down' | 'neutral' | ''
    default: ''
  },
  isHighlight: {
    type: Boolean,
    default: false
  }
});
</script>

<template>
  <div class="kpi-card" :class="{ 'is-highlight': isHighlight }">
    <div class="kpi-header">
      <div class="kpi-label-wrap">
        <div v-if="icon" class="kpi-icon">
          <AppIcon :name="icon" :size="15" />
        </div>
        <span class="kpi-label">{{ label }}</span>
      </div>
      <BaseBadge v-if="badgeText" :variant="badgeVariant" size="sm">
        {{ badgeText }}
      </BaseBadge>
    </div>

    <div class="kpi-body">
      <div class="kpi-value-row">
        <span class="kpi-value">{{ value }}</span>
        <div v-if="trend" class="trend-pill" :class="`trend-${trend}`">
          <span v-if="trend === 'up'">↑</span>
          <span v-else-if="trend === 'down'">↓</span>
          <span v-else>•</span>
        </div>
      </div>
      <p v-if="subtext" class="kpi-subtext text-muted truncate">{{ subtext }}</p>
    </div>
  </div>
</template>

<style scoped>
.kpi-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.kpi-card:hover {
  border-color: var(--border-default);
  box-shadow: var(--shadow-sm);
}

.kpi-card.is-highlight {
  border-color: var(--color-primary-300);
  background: linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-surface-elevated) 100%);
}

.kpi-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.kpi-label-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.kpi-icon {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  background-color: var(--bg-surface-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary-500);
}

.kpi-label {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.kpi-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.kpi-value-row {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.kpi-value {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.trend-pill {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-bold);
  padding: 1px 6px;
  border-radius: var(--radius-full);
}

.trend-up {
  background-color: var(--badge-success-bg);
  color: var(--badge-success-text);
}

.trend-down {
  background-color: var(--badge-danger-bg);
  color: var(--badge-danger-text);
}

.trend-neutral {
  background-color: var(--bg-surface-active);
  color: var(--text-muted);
}

.kpi-subtext {
  font-size: var(--text-xs);
  margin-top: 2px;
}
</style>
