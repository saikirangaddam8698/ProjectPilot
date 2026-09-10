<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'neutral',
    validator: (v) => ['neutral', 'primary', 'success', 'warning', 'danger', 'info', 'purple'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['xs', 'sm', 'md', 'lg'].includes(v)
  },
  dot: {
    type: Boolean,
    default: false
  }
});

const classes = computed(() => [
  'badge',
  `badge-${props.variant}`,
  `badge-${props.size}`,
  { 'has-dot': props.dot }
]);
</script>

<template>
  <span :class="classes">
    <span v-if="dot" class="badge-dot" aria-hidden="true"></span>
    <span class="badge-label"><slot></slot></span>
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-sans);
  font-weight: var(--font-weight-medium, 500);
  line-height: 1.3;
  border-radius: var(--radius-full, 9999px);
  border: 1px solid transparent;
  white-space: nowrap;
  gap: 5px;
  box-sizing: border-box;
  vertical-align: middle;
  text-align: center;
  transition: all var(--transition-fast, 150ms ease);
}

.badge-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.badge-xs {
  padding: 3px 9px;
  font-size: 11px;
  min-height: 22px;
  letter-spacing: 0.01em;
}

.badge-sm {
  padding: 4px 11px;
  font-size: 11.5px;
  min-height: 24px;
  letter-spacing: 0.01em;
}

.badge-md {
  padding: 5px 14px;
  font-size: 12px;
  min-height: 28px;
}

.badge-lg {
  padding: 6px 16px;
  font-size: 13px;
  min-height: 32px;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
  flex-shrink: 0;
  margin-right: 1px;
}

/* Neutral */
.badge-neutral {
  background-color: var(--badge-neutral-bg, rgba(148, 163, 184, 0.12));
  color: var(--badge-neutral-text, #94a3b8);
  border-color: var(--badge-neutral-border, rgba(148, 163, 184, 0.25));
}

/* Primary */
.badge-primary {
  background-color: var(--badge-primary-bg, rgba(99, 102, 241, 0.14));
  color: var(--badge-primary-text, #818cf8);
  border-color: var(--badge-primary-border, rgba(99, 102, 241, 0.32));
}

/* Success */
.badge-success {
  background-color: var(--badge-success-bg, rgba(16, 185, 129, 0.14));
  color: var(--badge-success-text, #34d399);
  border-color: var(--badge-success-border, rgba(16, 185, 129, 0.32));
}

/* Warning */
.badge-warning {
  background-color: var(--badge-warning-bg, rgba(245, 158, 11, 0.14));
  color: var(--badge-warning-text, #fbbf24);
  border-color: var(--badge-warning-border, rgba(245, 158, 11, 0.32));
}

/* Danger */
.badge-danger {
  background-color: var(--badge-danger-bg, rgba(239, 68, 68, 0.14));
  color: var(--badge-danger-text, #f87171);
  border-color: var(--badge-danger-border, rgba(239, 68, 68, 0.32));
}

/* Info */
.badge-info {
  background-color: var(--badge-info-bg, rgba(56, 189, 248, 0.14));
  color: var(--badge-info-text, #38bdf8);
  border-color: var(--badge-info-border, rgba(56, 189, 248, 0.32));
}

/* Purple (AI special) */
.badge-purple {
  background-color: rgba(139, 92, 246, 0.14);
  color: #c4b5fd;
  border-color: rgba(139, 92, 246, 0.32);
}
:root[data-theme='light'] .badge-purple {
  background-color: #f5f3ff;
  color: #6d28d9;
  border-color: #ddd6fe;
}
</style>
