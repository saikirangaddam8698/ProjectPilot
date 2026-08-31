<script setup>
import { computed } from 'vue';

const props = defineProps({
  type: {
    type: String,
    default: 'text',
    validator: (v) => ['text', 'rect', 'circle', 'avatar'].includes(v)
  },
  width: {
    type: String,
    default: null
  },
  height: {
    type: String,
    default: null
  },
  rounded: {
    type: String,
    default: 'md'
  }
});

const style = computed(() => {
  const styles = {};
  if (props.width) styles.width = props.width;
  if (props.height) styles.height = props.height;
  return styles;
});

const classes = computed(() => [
  'skeleton',
  `skeleton-${props.type}`,
  `rounded-${props.rounded}`
]);
</script>

<template>
  <div :class="classes" :style="style" aria-hidden="true"></div>
</template>

<style scoped>
.skeleton {
  position: relative;
  overflow: hidden;
  background-color: var(--skeleton-base);
  border-radius: var(--radius-md);
}

.skeleton::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  transform: translateX(-100%);
  background-image: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0,
    rgba(255, 255, 255, 0.05) 20%,
    rgba(255, 255, 255, 0.1) 60%,
    rgba(255, 255, 255, 0)
  );
  animation: shimmer 1.8s infinite;
}

:root[data-theme='light'] .skeleton::after {
  background-image: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0) 0,
    rgba(0, 0, 0, 0.03) 20%,
    rgba(0, 0, 0, 0.06) 60%,
    rgba(0, 0, 0, 0)
  );
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

.skeleton-text {
  height: 14px;
  width: 100%;
  margin-bottom: var(--space-2);
}

.skeleton-circle,
.skeleton-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50% !important;
}

.skeleton-rect {
  width: 100%;
  height: 80px;
}

.rounded-xs { border-radius: var(--radius-xs); }
.rounded-sm { border-radius: var(--radius-sm); }
.rounded-md { border-radius: var(--radius-md); }
.rounded-lg { border-radius: var(--radius-lg); }
.rounded-full { border-radius: var(--radius-full); }
</style>
