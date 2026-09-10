<script setup>
import { computed } from 'vue';

const props = defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(v)
  },
  message: {
    type: String,
    default: ''
  },
  subtext: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'purple', 'emerald', 'neutral'].includes(v)
  },
  glass: {
    type: Boolean,
    default: false
  },
  overlay: {
    type: Boolean,
    default: false
  },
  fullscreen: {
    type: Boolean,
    default: false
  },
  inline: {
    type: Boolean,
    default: false
  }
});

const spinnerDimensions = computed(() => {
  switch (props.size) {
    case 'xs': return 16;
    case 'sm': return 22;
    case 'lg': return 48;
    case 'xl': return 64;
    case 'md':
    default: return 32;
  }
});

const strokeWidth = computed(() => {
  switch (props.size) {
    case 'xs': return 2;
    case 'sm': return 2.5;
    case 'lg': return 3.5;
    case 'xl': return 4;
    case 'md':
    default: return 3;
  }
});

const containerClasses = computed(() => [
  'app-loader-container',
  `loader-size-${props.size}`,
  `loader-var-${props.variant}`,
  {
    'is-glass': props.glass,
    'is-overlay': props.overlay,
    'is-fullscreen': props.fullscreen,
    'is-inline': props.inline
  }
]);
</script>

<template>
  <div
    :class="containerClasses"
    role="status"
    aria-live="polite"
    :aria-label="message || 'Loading content'"
  >
    <!-- Dual-Ring Liquid Glass SVG Spinner -->
    <div class="spinner-visual-wrap" :style="{ width: `${spinnerDimensions}px`, height: `${spinnerDimensions}px` }">
      <svg
        class="spinner-svg"
        :width="spinnerDimensions"
        :height="spinnerDimensions"
        viewBox="0 0 50 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="loader-grad-primary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="var(--color-primary-400, #818cf8)" />
            <stop offset="100%" stop-color="#a855f7" />
          </linearGradient>
          <linearGradient id="loader-grad-purple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#c084fc" />
            <stop offset="100%" stop-color="#7c3aed" />
          </linearGradient>
          <linearGradient id="loader-grad-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#34d399" />
            <stop offset="100%" stop-color="#059669" />
          </linearGradient>
        </defs>

        <!-- Static Background Track -->
        <circle
          class="spinner-track"
          cx="25"
          cy="25"
          r="20"
          :stroke-width="strokeWidth * 1.3"
        />

        <!-- Animated Gradient Arc -->
        <circle
          class="spinner-arc"
          cx="25"
          cy="25"
          r="20"
          :stroke="`url(#loader-grad-${variant === 'emerald' ? 'emerald' : variant === 'purple' ? 'purple' : 'primary'})`"
          :stroke-width="strokeWidth * 1.3"
          stroke-linecap="round"
        />
      </svg>

      <!-- Inner Pulsing Glowing Core for Large Sizes -->
      <div v-if="size === 'lg' || size === 'xl'" class="spinner-core"></div>
    </div>

    <!-- Optional Informative Loading Messages -->
    <div v-if="message || subtext" class="loader-text-group">
      <span v-if="message" class="loader-message font-medium">{{ message }}</span>
      <span v-if="subtext" class="loader-subtext text-muted">{{ subtext }}</span>
    </div>

    <!-- Default Slot for Custom Skeleton or Fallback Content -->
    <slot></slot>
  </div>
</template>

<style scoped>
.app-loader-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-6);
  text-align: center;
  width: 100%;
  color: var(--text-primary);
  transition: all var(--transition-normal, 0.2s ease);
}

.app-loader-container.is-inline {
  display: inline-flex;
  flex-direction: row;
  padding: 0;
  width: auto;
  gap: var(--space-2);
}

.app-loader-container.is-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  background-color: var(--glass-overlay-bg, rgba(15, 23, 42, 0.65));
  backdrop-filter: var(--glass-blur-md, blur(8px));
  -webkit-backdrop-filter: var(--glass-blur-md, blur(8px));
  border-radius: inherit;
}

.app-loader-container.is-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background-color: var(--glass-overlay-bg, rgba(15, 23, 42, 0.8));
  backdrop-filter: var(--glass-blur-lg, blur(16px));
  -webkit-backdrop-filter: var(--glass-blur-lg, blur(16px));
}

.app-loader-container.is-glass {
  background: var(--glass-bg-subtle, rgba(255, 255, 255, 0.03));
  backdrop-filter: var(--glass-blur-sm, blur(6px));
  -webkit-backdrop-filter: var(--glass-blur-sm, blur(6px));
  border: 1px solid var(--glass-border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-lg, 12px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

/* Spinner Visuals */
.spinner-visual-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.spinner-svg {
  animation: rotateSpinner 1.1s cubic-bezier(0.4, 0.15, 0.2, 0.9) infinite;
}

.spinner-track {
  stroke: var(--border-subtle, rgba(255, 255, 255, 0.1));
}

.spinner-arc {
  stroke-dasharray: 90, 150;
  stroke-dashoffset: 0;
  animation: arcDash 1.4s ease-in-out infinite;
}

.spinner-core {
  position: absolute;
  width: 25%;
  height: 25%;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary-400, #818cf8), #a855f7);
  opacity: 0.7;
  filter: blur(2px);
  animation: corePulse 1.4s ease-in-out infinite alternate;
}

@keyframes rotateSpinner {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes arcDash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

@keyframes corePulse {
  0% {
    transform: scale(0.8);
    opacity: 0.4;
  }
  100% {
    transform: scale(1.3);
    opacity: 0.9;
  }
}

/* Text elements */
.loader-text-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.loader-message {
  font-size: var(--text-sm, 13.5px);
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.loader-subtext {
  font-size: var(--text-xs, 12px);
  color: var(--text-secondary);
  max-width: 320px;
  line-height: 1.4;
}

.loader-size-xs .loader-message { font-size: 11.5px; }
.loader-size-sm .loader-message { font-size: 12.5px; }
.loader-size-lg .loader-message { font-size: var(--text-base, 15px); font-weight: 600; }
.loader-size-xl .loader-message { font-size: var(--text-lg, 17px); font-weight: 600; }
</style>
