<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import AppIcon from './AppIcon.vue';

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean],
    default: ''
  },
  options: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'sm',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  id: {
    type: String,
    default: null
  },
  name: {
    type: String,
    default: null
  },
  ariaLabel: {
    type: String,
    default: null
  },
  menuPlacement: {
    type: String,
    default: 'bottom',
    validator: (v) => ['bottom', 'top'].includes(v)
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const isOpen = ref(false);
const selectRef = ref(null);
const focusedIndex = ref(-1);

const formattedOptions = computed(() => {
  return props.options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value ?? opt.id ?? opt.key,
        label: opt.label ?? opt.name ?? opt.title ?? String(opt.value ?? opt.key ?? opt.id),
        disabled: opt.disabled || false
      };
    }
    return {
      value: opt,
      label: String(opt),
      disabled: false
    };
  });
});

const selectedOption = computed(() => {
  return formattedOptions.value.find(
    (opt) => String(opt.value) === String(props.modelValue)
  );
});

const displayLabel = computed(() => {
  if (selectedOption.value) {
    return selectedOption.value.label;
  }
  return props.placeholder || (formattedOptions.value[0]?.label ?? '');
});

function toggleDropdown() {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    const idx = formattedOptions.value.findIndex(
      (opt) => String(opt.value) === String(props.modelValue)
    );
    focusedIndex.value = idx >= 0 ? idx : 0;
  }
}

function selectOption(opt) {
  if (opt.disabled) return;
  emit('update:modelValue', opt.value);
  emit('change', opt.value);
  isOpen.value = false;
}

function handleKeyDown(e) {
  if (props.disabled) return;

  if (e.key === 'Escape') {
    isOpen.value = false;
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (!isOpen.value) {
      isOpen.value = true;
      focusedIndex.value = 0;
    } else {
      focusedIndex.value = Math.min(focusedIndex.value + 1, formattedOptions.value.length - 1);
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (!isOpen.value) {
      isOpen.value = true;
      focusedIndex.value = formattedOptions.value.length - 1;
    } else {
      focusedIndex.value = Math.max(focusedIndex.value - 1, 0);
    }
  } else if (e.key === 'Enter' || e.key === ' ') {
    if (isOpen.value && focusedIndex.value >= 0 && formattedOptions.value[focusedIndex.value]) {
      e.preventDefault();
      selectOption(formattedOptions.value[focusedIndex.value]);
    } else if (!isOpen.value && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      toggleDropdown();
    }
  } else if (e.key === 'Tab') {
    isOpen.value = false;
  }
}

function handleClickOutside(e) {
  if (selectRef.value && !selectRef.value.contains(e.target)) {
    isOpen.value = false;
  }
}

watch(isOpen, (newVal) => {
  if (!newVal) {
    focusedIndex.value = -1;
  }
});

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div
    ref="selectRef"
    class="base-select-wrapper"
    :class="[`size-${size}`, { 'is-open': isOpen, 'is-disabled': disabled }]"
    @keydown="handleKeyDown"
  >
    <!-- Trigger Button -->
    <button
      :id="id"
      type="button"
      class="base-select-trigger"
      :disabled="disabled"
      :aria-expanded="isOpen"
      :aria-label="ariaLabel"
      @click="toggleDropdown"
    >
      <span
        class="base-select-label"
        :class="{ 'is-placeholder': !selectedOption && placeholder }"
      >
        {{ displayLabel }}
      </span>
      <span class="base-select-chevron" :class="{ 'is-open': isOpen }">
        <AppIcon name="chevron-down" :size="size === 'sm' ? 14 : 16" />
      </span>
    </button>

    <!-- Liquid Glass Floating Menu -->
    <Transition name="select-dropdown-pop">
      <div
        v-if="isOpen"
        class="base-select-menu"
        :class="`placement-${menuPlacement}`"
        role="listbox"
      >
        <div
          v-if="placeholder && !formattedOptions.some(o => String(o.value) === '')"
          role="option"
          :aria-selected="!modelValue"
          class="base-select-option placeholder-option"
          :class="{ 'is-selected': !modelValue }"
          @click="selectOption({ value: '', label: placeholder })"
        >
          <span class="option-text text-muted">{{ placeholder }}</span>
          <span v-if="!modelValue" class="option-check">
            <AppIcon name="check" :size="13" />
          </span>
        </div>

        <div
          v-for="(opt, idx) in formattedOptions"
          :key="opt.value"
          role="option"
          :aria-selected="String(opt.value) === String(modelValue)"
          class="base-select-option"
          :class="{
            'is-selected': String(opt.value) === String(modelValue),
            'is-focused': idx === focusedIndex,
            'is-disabled': opt.disabled
          }"
          @click="selectOption(opt)"
          @mouseenter="focusedIndex = idx"
        >
          <span class="option-text">{{ opt.label }}</span>
          <span v-if="String(opt.value) === String(modelValue)" class="option-check">
            <AppIcon name="check" :size="13" />
          </span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.base-select-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
  vertical-align: middle;
}

.base-select-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  background: var(--select-bg, var(--bg-surface));
  color: var(--text-primary);
  border: 1px solid var(--select-border, var(--border-default));
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  outline: none;
  line-height: normal;
  box-sizing: border-box;
  transition: border-color var(--transition-fast, 150ms ease),
              background-color var(--transition-fast, 150ms ease),
              box-shadow var(--transition-fast, 150ms ease);
}

.base-select-wrapper.size-sm .base-select-trigger {
  height: 34px;
  font-size: 13px;
  padding: 0 10px;
}

.base-select-wrapper.size-md .base-select-trigger {
  height: 38px;
  font-size: 14px;
  padding: 0 12px;
}

.base-select-wrapper.size-lg .base-select-trigger {
  height: 44px;
  font-size: 15px;
  padding: 0 14px;
}

.base-select-trigger:hover:not(:disabled) {
  border-color: var(--brand-primary, #6366f1);
  background-color: var(--bg-surface-elevated, var(--bg-surface));
}

.base-select-wrapper.is-open .base-select-trigger,
.base-select-trigger:focus-visible {
  border-color: var(--brand-primary, #6366f1);
  box-shadow: 0 0 0 2px var(--select-focus-ring, rgba(99, 102, 241, 0.25));
}

.base-select-label {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  line-height: 1.35;
  padding: 1px 0;
}

.base-select-label.is-placeholder {
  color: var(--text-muted);
}

.base-select-chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), color 0.15s ease;
  flex-shrink: 0;
  margin-left: 6px;
}

.base-select-chevron.is-open {
  transform: rotate(180deg);
  color: var(--brand-primary);
}

/* Liquid Glass Menu Popup */
.base-select-menu {
  position: absolute;
  left: 0;
  width: 100%;
  min-width: 170px;
  max-height: 250px;
  overflow-y: auto;
  z-index: 1000;
  background: var(--glass-bg-elevated, rgba(15, 23, 42, 0.96));
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border-glow, rgba(99, 102, 241, 0.25));
  border-radius: var(--radius-lg, 8px);
  box-shadow: var(--glass-shadow-modal, 0 12px 28px -6px rgba(0, 0, 0, 0.35));
  padding: 4px;
}

.base-select-menu.placement-bottom {
  top: calc(100% + 4px);
}

.base-select-menu.placement-top {
  bottom: calc(100% + 4px);
}

/* Slim Scrollbar */
.base-select-menu::-webkit-scrollbar {
  width: 5px;
}
.base-select-menu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}

.base-select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  border-radius: var(--radius-md, 6px);
  cursor: pointer;
  font-size: 12.5px;
  color: var(--text-primary);
  transition: background 0.12s ease, color 0.12s ease;
  user-select: none;
}

.base-select-option:hover:not(.is-disabled),
.base-select-option.is-focused:not(.is-disabled) {
  background: rgba(99, 102, 241, 0.14);
  color: var(--brand-primary);
}

.base-select-option.is-selected {
  background: rgba(99, 102, 241, 0.2);
  color: var(--brand-primary);
  font-weight: 600;
}

.base-select-option.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.option-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.option-check {
  display: flex;
  align-items: center;
  color: var(--brand-primary);
  margin-left: 8px;
  flex-shrink: 0;
}

/* Dropdown Animation */
.select-dropdown-pop-enter-active,
.select-dropdown-pop-leave-active {
  transition: opacity 0.16s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.16s cubic-bezier(0.16, 1, 0.3, 1);
}

.select-dropdown-pop-enter-from,
.select-dropdown-pop-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-4px);
}

.is-disabled .base-select-trigger {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
