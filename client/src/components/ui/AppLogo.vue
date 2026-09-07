<script setup>
import { computed } from 'vue';

const props = defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  },
  showText: {
    type: Boolean,
    default: true
  },
  showTagline: {
    type: Boolean,
    default: false
  }
});

const isDemoMode = computed(() => {
  if (import.meta.env.VITE_ENABLE_DEMO_ACCOUNTS === 'false') {
    return false;
  }
  return import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_ACCOUNTS === 'true';
});

const logoDimensions = computed(() => {
  switch (props.size) {
    case 'sm':
      return { box: 30, icon: 18, titleClass: 'title-sm' };
    case 'lg':
      return { box: 48, icon: 28, titleClass: 'title-lg' };
    case 'md':
    default:
      return { box: 38, icon: 22, titleClass: 'title-md' };
  }
});
</script>

<template>
  <div class="app-logo" :class="`logo-${size}`">
    <div
      class="logo-icon-box"
      :style="{ width: `${logoDimensions.box}px`, height: `${logoDimensions.box}px` }"
    >
      <svg
        :width="logoDimensions.icon"
        :height="logoDimensions.icon"
        viewBox="0 0 24 24"
        fill="none"
        class="logo-svg"
        aria-hidden="true"
      >
        <polygon
          points="12 2 19 21 12 17 5 21 12 2"
          fill="url(#pilot-brand-grad)"
          stroke="#818CF8"
          stroke-width="1.25"
          stroke-linejoin="round"
        />
        <defs>
          <linearGradient id="pilot-brand-grad" x1="5" y1="2" x2="19" y2="21" gradientUnits="userSpaceOnUse">
            <stop stop-color="#A5B4FC" />
            <stop offset="0.5" stop-color="#6366F1" />
            <stop offset="1" stop-color="#4F46E5" />
          </linearGradient>
        </defs>
      </svg>
    </div>

    <div v-if="showText" class="logo-text-wrapper">
      <div class="title-row">
        <span class="logo-title" :class="logoDimensions.titleClass">ProjectPilot</span>
        <span v-if="isDemoMode" class="demo-badge" title="Running in Demo Environment Mode">DEMO</span>
      </div>
      <span v-if="showTagline" class="logo-tagline">AI-Powered Project Intelligence & Agile Workspace</span>
    </div>
  </div>
</template>

<style scoped>
.app-logo {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  user-select: none;
}

.logo-icon-box {
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.25));
  border: 1px solid rgba(99, 102, 241, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.app-logo:hover .logo-icon-box {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3);
}

.logo-svg {
  filter: drop-shadow(0 2px 4px rgba(79, 70, 229, 0.4));
}

.logo-text-wrapper {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
  text-align: left;
}

.title-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.logo-title {
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.025em;
  font-family: var(--font-sans);
}

.demo-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 16px;
  padding: 0 6px;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: var(--font-weight-bold);
  border-radius: var(--radius-xs);
  background-color: rgba(245, 158, 11, 0.15);
  color: var(--color-warning-500);
  border: 1px solid rgba(245, 158, 11, 0.3);
  letter-spacing: 0.05em;
  line-height: 1;
  text-align: center;
  box-sizing: border-box;
}

.title-sm {
  font-size: var(--text-sm);
}

.title-md {
  font-size: var(--text-lg);
}

.title-lg {
  font-size: var(--text-xl);
}

.logo-tagline {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-top: 2px;
  font-weight: var(--font-weight-normal);
}
</style>
