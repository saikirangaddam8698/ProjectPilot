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
    validator: (v) => ['sm', 'md'].includes(v)
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
    <slot></slot>
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-sans);
  font-weight: var(--font-weight-medium);
  line-height: 1;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  white-space: nowrap;
  gap: var(--space-1);
}

.badge-sm {
  padding: 2px var(--space-2);
  font-size: var(--text-xs);
  height: 18px;
}

.badge-md {
  padding: 3px var(--space-2);
  font-size: var(--text-xs);
  height: 22px;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}

/* Neutral */
.badge-neutral {
  background-color: var(--badge-neutral-bg);
  color: var(--badge-neutral-text);
  border-color: var(--badge-neutral-border);
}

/* Primary */
.badge-primary {
  background-color: var(--badge-primary-bg);
  color: var(--badge-primary-text);
  border-color: var(--badge-primary-border);
}

/* Success */
.badge-success {
  background-color: var(--badge-success-bg);
  color: var(--badge-success-text);
  border-color: var(--badge-success-border);
}

/* Warning */
.badge-warning {
  background-color: var(--badge-warning-bg);
  color: var(--badge-warning-text);
  border-color: var(--badge-warning-border);
}

/* Danger */
.badge-danger {
  background-color: var(--badge-danger-bg);
  color: var(--badge-danger-text);
  border-color: var(--badge-danger-border);
}

/* Info */
.badge-info {
  background-color: var(--badge-info-bg);
  color: var(--badge-info-text);
  border-color: var(--badge-info-border);
}

/* Purple (AI special) */
.badge-purple {
  background-color: rgba(139, 92, 246, 0.12);
  color: #C4B5FD;
  border-color: rgba(139, 92, 246, 0.3);
}
:root[data-theme='light'] .badge-purple {
  background-color: #F5F3FF;
  color: #6D28D9;
  border-color: #DDD6FE;
}
</style>
