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
  description: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg', 'xl'].includes(v)
  },
  hideClose: {
    type: Boolean,
    default: false
  },
  zIndex: {
    type: [Number, String],
    default: null
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
    <Transition name="modal-fade">
      <div
        v-if="modelValue"
        class="modal-backdrop"
        :style="zIndex ? { zIndex } : undefined"
        @click="handleBackdropClick"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? 'modal-title' : undefined"
      >
        <div class="modal-card" :class="`modal-${size}`">
          <!-- Modal Header -->
          <div v-if="title || $slots.header || !hideClose" class="modal-header">
            <div class="modal-title-group">
              <slot name="header">
                <h3 v-if="title" id="modal-title" class="modal-title">{{ title }}</h3>
                <p v-if="description" class="modal-desc">{{ description }}</p>
              </slot>
            </div>

            <button
              v-if="!hideClose"
              type="button"
              class="modal-close-btn"
              @click="close"
              aria-label="Close dialog"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body">
            <slot></slot>
          </div>

          <!-- Modal Footer -->
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background-color: rgba(0, 0, 0, 0.58);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.modal-card {
  background-color: var(--glass-bg-elevated);
  backdrop-filter: var(--glass-blur-lg);
  -webkit-backdrop-filter: var(--glass-blur-lg);
  border: 1px solid var(--glass-border-glow);
  border-radius: var(--radius-xl);
  box-shadow: var(--glass-shadow-modal);
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-sm { max-width: 420px; }
.modal-md { max-width: 540px; }
.modal-lg { max-width: 720px; }
.modal-xl { max-width: 900px; }

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--border-subtle);
  gap: var(--space-4);
}

.modal-title-group {
  flex: 1;
}

.modal-title {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  line-height: var(--line-height-tight);
}

.modal-desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-1);
}

.modal-close-btn {
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

.modal-close-btn:hover {
  background-color: var(--btn-close-bg-hover, rgba(239, 68, 68, 0.20)) !important;
  color: var(--btn-close-color-hover, #ef4444) !important;
  border-color: var(--btn-close-border-hover, rgba(239, 68, 68, 0.50)) !important;
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.25);
}

.modal-close-btn:hover svg {
  stroke: var(--btn-close-color-hover, #ef4444) !important;
}

.modal-close-btn:active {
  background-color: var(--btn-close-bg-active, rgba(239, 68, 68, 0.35)) !important;
  color: var(--btn-close-color-active, #dc2626) !important;
  border-color: var(--btn-close-border-active, rgba(239, 68, 68, 0.70)) !important;
  box-shadow: 0 0 14px rgba(239, 68, 68, 0.40);
  transform: scale(0.92);
}

.modal-close-btn:active svg {
  stroke: var(--btn-close-color-active, #dc2626) !important;
}

.modal-body {
  padding: var(--space-6);
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--border-subtle);
  background-color: var(--bg-surface);
  gap: var(--space-3);
}

/* Transitions & Animation */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 200ms var(--motion-spring, cubic-bezier(0.16, 1, 0.3, 1));
}

.modal-fade-enter-active .modal-card,
.modal-fade-leave-active .modal-card {
  transition: transform 200ms var(--motion-spring, cubic-bezier(0.16, 1, 0.3, 1)),
              opacity 200ms var(--motion-spring, cubic-bezier(0.16, 1, 0.3, 1));
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-card,
.modal-fade-leave-to .modal-card {
  opacity: 0;
  transform: scale(0.97) translateY(6px);
}

@media (prefers-reduced-motion: reduce) {
  .modal-fade-enter-active,
  .modal-fade-leave-active,
  .modal-fade-enter-active .modal-card,
  .modal-fade-leave-active .modal-card {
    transition: none !important;
    transform: none !important;
  }
}
</style>
