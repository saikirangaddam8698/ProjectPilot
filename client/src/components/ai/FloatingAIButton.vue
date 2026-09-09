<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useUiStore } from '@/stores/ui.store';
import { useAiStore } from '@/stores/ai.store';
import AppIcon from '@/components/ui/AppIcon.vue';

const route = useRoute();
const uiStore = useUiStore();
const aiStore = useAiStore();

const isHovered = ref(false);
const isFocused = ref(false);

// Hidden on /login and /ai
const isVisible = computed(() => {
  const path = route.path || '';
  if (path === '/login' || path.startsWith('/ai')) {
    return false;
  }
  return true;
});

const isGenerating = computed(() => aiStore.isGenerating);
const isQuickChatOpen = computed(() => uiStore.isQuickChatOpen);
const isQuickChatMinimized = computed(() => uiStore.isQuickChatMinimized);

// Show the interactive "Ask AI" bubble on hover or keyboard focus if quick chat is not already open
const showBubble = computed(() => {
  return (isHovered.value || isFocused.value) && !isQuickChatOpen.value;
});

function handleClick() {
  uiStore.toggleQuickChat();
}

function handleKeydown(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleClick();
  }
}
</script>

<template>
  <Transition name="ai-cluster-fade">
    <div
      v-if="isVisible"
      class="floating-ai-cluster"
    >
      <!-- Purely visual Liquid Glass Label (No hover/click operations or interactive classes) -->
      <Transition name="ai-bubble-emerge">
        <div
          v-if="showBubble"
          class="ai-speech-bubble"
          aria-hidden="true"
        >
          <span class="bubble-spark-dot" aria-hidden="true">✦</span>
          <span class="bubble-text">Ask AI</span>
          <!-- Connecting tail pointing towards the floating button -->
          <span class="bubble-tail" aria-hidden="true"></span>
        </div>
      </Transition>

      <!-- Main Floating AI Trigger Button (The only interactive element) -->
      <button
        type="button"
        class="floating-ai-trigger"
        :class="{
          'is-active': isQuickChatOpen,
          'is-generating': isGenerating,
          'is-minimized': isQuickChatMinimized,
          'is-engaged': isHovered || isFocused
        }"
        aria-label="Ask ProjectPilot AI"
        :aria-expanded="isQuickChatOpen"
        @click="handleClick"
        @keydown="handleKeydown"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
        @focus="isFocused = true"
        @blur="isFocused = false"
      >
        <!-- Pulsing generating glow ring -->
        <span v-if="isGenerating" class="ai-pulse-ring" aria-hidden="true"></span>

        <!-- AI Spark Icon with restrained rotation on engagement -->
        <div class="icon-wrap" :class="{ 'is-rotated': isHovered || isFocused, 'sparkle-spin': isGenerating }">
          <AppIcon name="ai" :size="22" />
        </div>

        <!-- Generating Status Dot -->
        <span
          v-if="isGenerating"
          class="status-indicator-dot"
          aria-hidden="true"
        ></span>
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.floating-ai-cluster {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 45;
  display: flex;
  align-items: center;
  gap: 10px;
  pointer-events: none;
}

/* ── Purely Visual Liquid Glass Label (Non-interactive: No hover/click) ───── */
.ai-speech-bubble {
  pointer-events: none !important;
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 15px 8px 13px;
  background: var(--glass-bg-elevated, rgba(23, 27, 33, 0.94));
  border: 1px solid var(--glass-border-glow, rgba(147, 197, 253, 0.28));
  border-radius: var(--radius-full, 9999px);
  backdrop-filter: var(--glass-blur-md, blur(16px));
  -webkit-backdrop-filter: var(--glass-blur-md, blur(16px));
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.45),
              0 0 16px -2px rgba(99, 102, 241, 0.25);
  color: var(--text-primary, #f3f4f6);
  font-family: var(--font-sans, inherit);
  font-size: 12.5px;
  font-weight: var(--font-weight-semibold, 600);
  letter-spacing: 0.01em;
  white-space: nowrap;
  user-select: none;
  cursor: default !important;
  transform-origin: right center;
}

.bubble-spark-dot {
  color: var(--color-primary-400, #818cf8);
  font-size: 13px;
  line-height: 1;
  filter: drop-shadow(0 0 4px rgba(129, 140, 248, 0.6));
}

.bubble-text {
  color: var(--text-primary, #f3f4f6);
}

/* Little tail pointer on right pointing to the spark button */
.bubble-tail {
  position: absolute;
  right: -5px;
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
  width: 8px;
  height: 8px;
  background: var(--glass-bg-elevated, rgba(23, 27, 33, 0.94));
  border-top: 1px solid var(--glass-border-glow, rgba(147, 197, 253, 0.28));
  border-right: 1px solid var(--glass-border-glow, rgba(147, 197, 253, 0.28));
}

/* Bubble enter / leave animations */
.ai-bubble-emerge-enter-active,
.ai-bubble-emerge-leave-active {
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1),
              opacity 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.ai-bubble-emerge-enter-from,
.ai-bubble-emerge-leave-to {
  opacity: 0;
  transform: translateX(10px) scale(0.92);
}

/* ── Floating AI Trigger Button ──────────────────────────── */
.floating-ai-trigger {
  pointer-events: auto;
  position: relative;
  width: 50px;
  height: 50px;
  border-radius: var(--radius-lg, 14px);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px solid var(--glass-border-glow, rgba(147, 197, 253, 0.25));
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.9), rgba(124, 58, 237, 0.9));
  color: #ffffff;
  backdrop-filter: var(--glass-blur-md, blur(16px));
  -webkit-backdrop-filter: var(--glass-blur-md, blur(16px));
  box-shadow: 0 8px 24px -4px rgba(79, 70, 229, 0.45),
              0 0 0 1px rgba(255, 255, 255, 0.15) inset;
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 200ms ease,
              border-color 200ms ease;
  outline: none;
  user-select: none;
}

.floating-ai-trigger:hover,
.floating-ai-trigger.is-engaged {
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 12px 30px -4px rgba(79, 70, 229, 0.55),
              0 0 24px rgba(124, 58, 237, 0.4),
              0 0 0 1px rgba(255, 255, 255, 0.25) inset;
  border-color: rgba(199, 210, 254, 0.55);
}

.floating-ai-trigger:active {
  transform: translateY(0) scale(0.96);
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
}

.floating-ai-trigger:focus-visible {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.5),
              0 8px 24px -4px rgba(79, 70, 229, 0.45);
}

.floating-ai-trigger.is-minimized {
  background: linear-gradient(135deg, rgba(67, 56, 202, 0.95), rgba(109, 40, 217, 0.95));
  border-color: rgba(165, 180, 252, 0.5);
}

/* ── Restrained Icon Rotation on Hover/Focus ─────────────── */
.icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.icon-wrap.is-rotated {
  transform: rotate(18deg) scale(1.08);
}

/* Generating / Activity Animation */
.floating-ai-trigger.is-generating {
  border-color: rgba(167, 139, 250, 0.65);
}

.sparkle-spin {
  animation: subtlePulse 1.6s ease-in-out infinite;
}

@keyframes subtlePulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.12); opacity: 0.85; }
}

/* Pulsing background ring */
.ai-pulse-ring {
  position: absolute;
  inset: -5px;
  border-radius: calc(var(--radius-lg, 14px) + 5px);
  border: 2px solid rgba(139, 92, 246, 0.5);
  animation: ringPulse 2s cubic-bezier(0.24, 0, 0.38, 1) infinite;
  pointer-events: none;
}

@keyframes ringPulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.15); opacity: 0.2; }
  100% { transform: scale(1.25); opacity: 0; }
}

/* Top right active dot */
.status-indicator-dot {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background-color: #38bdf8;
  border: 1.5px solid #ffffff;
  box-shadow: 0 0 8px #38bdf8;
  animation: dotBlink 1.4s ease-in-out infinite;
}

@keyframes dotBlink {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}

/* Fade in for cluster */
.ai-cluster-fade-enter-active,
.ai-cluster-fade-leave-active {
  transition: transform 220ms var(--motion-spring, cubic-bezier(0.16, 1, 0.3, 1)),
              opacity 180ms ease;
}

.ai-cluster-fade-enter-from,
.ai-cluster-fade-leave-to {
  opacity: 0;
  transform: scale(0.6) translateY(12px);
}

@media (max-width: 768px) {
  .floating-ai-cluster {
    bottom: 20px;
    right: 20px;
  }
  .floating-ai-trigger {
    width: 48px;
    height: 48px;
  }
  /* On mobile touch devices, hide bubble by default to prevent taking up tap space */
  .ai-speech-bubble {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .floating-ai-trigger,
  .icon-wrap,
  .ai-speech-bubble,
  .ai-pulse-ring,
  .sparkle-spin,
  .status-indicator-dot {
    animation: none !important;
    transition: none !important;
    transform: none !important;
  }
}
</style>
