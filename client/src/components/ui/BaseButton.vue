<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'ghost', 'danger', 'outline'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['xs', 'sm', 'md', 'lg'].includes(v)
  },
  type: {
    type: String,
    default: 'button'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  as: {
    type: String,
    default: 'button'
  },
  to: {
    type: [String, Object],
    default: null
  },
  iconOnly: {
    type: Boolean,
    default: false
  },
  ariaLabel: {
    type: String,
    default: null
  }
});

const componentTag = computed(() => {
  if (props.to) return 'router-link';
  if (props.as === 'a') return 'a';
  return 'button';
});

const classes = computed(() => [
  'btn',
  `btn-${props.variant}`,
  `btn-${props.size}`,
  {
    'btn-icon-only': props.iconOnly,
    'btn-loading': props.loading,
    'btn-disabled': props.disabled || props.loading
  }
]);
</script>

<template>
  <component
    :is="componentTag"
    :type="componentTag === 'button' ? type : undefined"
    :to="to"
    :disabled="disabled || loading"
    :aria-disabled="disabled || loading"
    :aria-label="ariaLabel"
    :class="classes"
  >
    <!-- Loading spinner indicator -->
    <span v-if="loading" class="spinner" aria-hidden="true"></span>
    
    <!-- Prefix Icon slot -->
    <span v-if="$slots.prefix && !loading" class="btn-prefix">
      <slot name="prefix"></slot>
    </span>

    <!-- Default Content Slot -->
    <span v-if="$slots.default" class="btn-content">
      <slot></slot>
    </span>

    <!-- Suffix Icon slot -->
    <span v-if="$slots.suffix && !loading" class="btn-suffix">
      <slot name="suffix"></slot>
    </span>
  </component>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-sans);
  font-weight: var(--font-weight-medium);
  line-height: 1;
  white-space: nowrap;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  user-select: none;
  transition: background-color var(--transition-fast),
              border-color var(--transition-fast),
              color var(--transition-fast),
              box-shadow var(--transition-fast),
              transform var(--transition-fast);
  gap: var(--space-2);
}

.btn:active:not(:disabled) {
  transform: scale(0.98);
}

/* Sizes */
.btn-xs {
  height: 24px;
  padding: 0 var(--space-2);
  font-size: var(--text-xs);
  gap: var(--space-1);
}

.btn-sm {
  height: 30px;
  padding: 0 var(--space-3);
  font-size: var(--text-sm);
  gap: var(--space-2);
}

.btn-md {
  height: 36px;
  padding: 0 var(--space-4);
  font-size: var(--text-base);
}

.btn-lg {
  height: 42px;
  padding: 0 var(--space-5);
  font-size: var(--text-md);
}

.btn-icon-only.btn-xs { width: 24px; padding: 0; }
.btn-icon-only.btn-sm { width: 30px; padding: 0; }
.btn-icon-only.btn-md { width: 36px; padding: 0; }
.btn-icon-only.btn-lg { width: 42px; padding: 0; }

/* Variants */
.btn-primary {
  background-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--btn-primary-hover);
}

.btn-secondary {
  background-color: var(--btn-secondary-bg);
  color: var(--btn-secondary-text);
  border-color: var(--btn-secondary-border);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--btn-secondary-hover);
  border-color: var(--border-strong);
}

.btn-outline {
  background-color: transparent;
  color: var(--text-primary);
  border-color: var(--border-default);
}

.btn-outline:hover:not(:disabled) {
  background-color: var(--bg-surface-hover);
  border-color: var(--border-strong);
}

.btn-ghost {
  background-color: transparent;
  color: var(--btn-ghost-text);
}

.btn-ghost:hover:not(:disabled) {
  background-color: var(--btn-ghost-hover);
  color: var(--btn-ghost-active-text);
}

.btn-danger {
  background-color: var(--color-danger-500);
  color: #FFFFFF;
}

.btn-danger:hover:not(:disabled) {
  background-color: var(--color-danger-600);
}

/* Disabled state */
.btn:disabled,
.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Spinner */
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.btn-prefix, .btn-suffix {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
