<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  },
  error: {
    type: String,
    default: ''
  },
  id: {
    type: String,
    default: null
  },
  name: {
    type: String,
    default: null
  },
  autocomplete: {
    type: String,
    default: 'off'
  }
});

const emit = defineEmits(['update:modelValue', 'blur', 'focus', 'keydown']);

const handleInput = (event) => {
  emit('update:modelValue', event.target.value);
};
</script>

<template>
  <div class="input-wrapper" :class="[`input-wrapper-${size}`, { 'has-error': error, 'is-disabled': disabled }]">
    <span v-if="$slots.prefix" class="input-prefix">
      <slot name="prefix"></slot>
    </span>

    <input
      :id="id"
      :name="name"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :autocomplete="autocomplete"
      class="input-field"
      @input="handleInput"
      @focus="$emit('focus', $event)"
      @blur="$emit('blur', $event)"
      @keydown="$emit('keydown', $event)"
    />

    <span v-if="$slots.suffix" class="input-suffix">
      <slot name="suffix"></slot>
    </span>
  </div>
  <p v-if="error" class="input-error-text">{{ error }}</p>
</template>

<style scoped>
.input-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  color: var(--text-primary);
}

.input-wrapper:focus-within {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 1px var(--border-focus);
}

.input-wrapper.has-error {
  border-color: var(--color-danger-500);
}

.input-wrapper.is-disabled {
  opacity: 0.6;
  background-color: var(--bg-surface-subtle);
  cursor: not-allowed;
}

.input-field {
  width: 100%;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-family: var(--font-sans);
  outline: none;
}

.input-field::placeholder {
  color: var(--text-muted);
}

.input-field:disabled {
  cursor: not-allowed;
}

/* Sizes */
.input-wrapper-sm {
  height: 30px;
  padding: 0 var(--space-2);
  font-size: var(--text-sm);
}

.input-wrapper-md {
  height: 36px;
  padding: 0 var(--space-3);
  font-size: var(--text-base);
}

.input-wrapper-lg {
  height: 42px;
  padding: 0 var(--space-4);
  font-size: var(--text-md);
}

.input-prefix, .input-suffix {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  flex-shrink: 0;
}

.input-prefix {
  margin-right: var(--space-2);
}

.input-suffix {
  margin-left: var(--space-2);
}

.input-error-text {
  font-size: var(--text-xs);
  color: var(--color-danger-500);
  margin-top: var(--space-1);
}
</style>
