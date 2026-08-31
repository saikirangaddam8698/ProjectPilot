<script setup>
import { watch, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  side: {
    type: String,
    default: 'right',
    validator: (v) => ['left', 'right'].includes(v)
  },
  width: {
    type: String,
    default: '380px'
  },
  hideClose: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

function close() {
  emit('update:modelValue', false);
  emit('close');
}

function handleBackdropClick(e) {
  if (e.target === e.currentTarget) {
    close();
  }
}

function handleKeydown(e) {
  if (e.key === 'Escape' && props.modelValue) {
    close();
  }
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', handleKeydown);
    document.body.style.overflow = 'hidden';
  } else {
    document.removeEventListener('keydown', handleKeydown);
    document.body.style.overflow = '';
  }
}, { immediate: true });

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div
        v-if="modelValue"
        class="drawer-backdrop"
        @click="handleBackdropClick"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? 'drawer-title' : undefined"
      >
        <Transition :name="side === 'right' ? 'slide-right' : 'slide-left'">
          <div
            v-if="modelValue"
            class="drawer-panel"
            :class="`drawer-${side}`"
            :style="{ width, maxWidth: '100vw' }"
          >
            <!-- Drawer Header -->
            <div class="drawer-header">
              <slot name="header">
                <h3 v-if="title" id="drawer-title" class="drawer-title">{{ title }}</h3>
              </slot>

              <button
                v-if="!hideClose"
                type="button"
                class="drawer-close-btn"
                @click="close"
                aria-label="Close drawer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <!-- Drawer Body -->
            <div class="drawer-body">
              <slot></slot>
            </div>

            <!-- Drawer Footer -->
            <div v-if="$slots.footer" class="drawer-footer">
              <slot name="footer"></slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-drawer);
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
}

.drawer-panel {
  position: fixed;
  top: 0;
  bottom: 0;
  background-color: var(--bg-surface-elevated);
  border-left: 1px solid var(--border-default);
  box-shadow: var(--shadow-drawer);
  display: flex;
  flex-direction: column;
  height: 100vh;
  z-index: calc(var(--z-drawer) + 1);
}

.drawer-right {
  right: 0;
  border-left: 1px solid var(--border-default);
}

.drawer-left {
  left: 0;
  border-right: 1px solid var(--border-default);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border-subtle);
  min-height: var(--header-height);
}

.drawer-title {
  font-size: var(--text-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.drawer-close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.drawer-close-btn:hover {
  background-color: var(--bg-surface-hover);
  color: var(--text-primary);
}

.drawer-body {
  padding: var(--space-5);
  overflow-y: auto;
  flex: 1;
}

.drawer-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--border-subtle);
  background-color: var(--bg-surface);
  gap: var(--space-3);
}

/* Animations */
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity var(--transition-base);
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active,
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform var(--transition-base);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-100%);
}
</style>
