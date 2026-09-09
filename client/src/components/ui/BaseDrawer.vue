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
  background-color: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
}

.drawer-panel {
  position: fixed;
  top: 0;
  bottom: 0;
  background-color: var(--glass-bg-elevated);
  backdrop-filter: var(--glass-blur-lg);
  -webkit-backdrop-filter: var(--glass-blur-lg);
  box-shadow: var(--glass-shadow-drawer);
  display: flex;
  flex-direction: column;
  height: 100vh;
  z-index: calc(var(--z-drawer) + 1);
}

.drawer-right {
  right: 0;
  border-left: 1px solid var(--glass-border-glow);
}

.drawer-left {
  left: 0;
  border-right: 1px solid var(--glass-border-glow);
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
  color: var(--btn-close-color, var(--text-muted));
  background-color: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.drawer-close-btn:hover {
  background-color: var(--btn-close-bg-hover, rgba(239, 68, 68, 0.20)) !important;
  color: var(--btn-close-color-hover, #ef4444) !important;
  border-color: var(--btn-close-border-hover, rgba(239, 68, 68, 0.50)) !important;
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.25);
}

.drawer-close-btn:hover svg {
  stroke: var(--btn-close-color-hover, #ef4444) !important;
}

.drawer-close-btn:active {
  background-color: var(--btn-close-bg-active, rgba(239, 68, 68, 0.35)) !important;
  color: var(--btn-close-color-active, #dc2626) !important;
  border-color: var(--btn-close-border-active, rgba(239, 68, 68, 0.70)) !important;
  box-shadow: 0 0 14px rgba(239, 68, 68, 0.40);
  transform: scale(0.92);
}

.drawer-close-btn:active svg {
  stroke: var(--btn-close-color-active, #dc2626) !important;
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
  transition: opacity 200ms var(--motion-spring, cubic-bezier(0.16, 1, 0.3, 1));
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active,
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 220ms var(--motion-spring, cubic-bezier(0.16, 1, 0.3, 1));
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-100%);
}

@media (prefers-reduced-motion: reduce) {
  .drawer-fade-enter-active,
  .drawer-fade-leave-active,
  .slide-right-enter-active,
  .slide-right-leave-active,
  .slide-left-enter-active,
  .slide-left-leave-active {
    transition: none !important;
    transform: none !important;
  }
}
</style>
