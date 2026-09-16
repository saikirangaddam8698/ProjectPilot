<script setup>
import { computed, ref, onBeforeUnmount } from 'vue';
import { usePermissions } from '@/composables/usePermissions';

const props = defineProps({
  action: {
    type: String,
    required: true
  },
  context: {
    type: Object,
    default: () => ({})
  },
  customReason: {
    type: String,
    default: ''
  }
});

const { checkPermission } = usePermissions();

const permissionResult = computed(() => checkPermission(props.action, props.context));
const isAllowed = computed(() => permissionResult.value.allowed);
const restrictionReason = computed(() => props.customReason || permissionResult.value.reason);

// ── Teleported tooltip positioning ──────────────────────────────────────────
const wrapperRef = ref(null);
const tooltipVisible = ref(false);
const tooltipStyle = ref({});
let showTimer = null;

function showTooltip() {
  if (isAllowed.value) return;
  clearTimeout(showTimer);
  showTimer = setTimeout(() => {
    const el = wrapperRef.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();

    // Tooltip max-width is 300px; keep half (150) + 12px margin from edges
    const HALF_W = 150;
    const APPROX_H = 52;
    let top = rect.top - APPROX_H - 8;
    let placement = 'top';

    // If there's not enough room above, flip below
    if (top < 8) {
      top = rect.bottom + 8;
      placement = 'bottom';
    }
    top = Math.max(8, Math.min(window.innerHeight - APPROX_H - 8, top));

    let left = rect.left + rect.width / 2;
    left = Math.max(HALF_W + 12, Math.min(window.innerWidth - HALF_W - 12, left));

    tooltipStyle.value = { top: `${top}px`, left: `${left}px` };
    tooltipVisible.value = true;
  }, 100);
}

function hideTooltip() {
  clearTimeout(showTimer);
  tooltipVisible.value = false;
}

onBeforeUnmount(() => {
  clearTimeout(showTimer);
});
</script>

<template>
  <div
    ref="wrapperRef"
    class="rbac-action-wrapper"
    :class="{ 'is-disabled': !isAllowed }"
    :tabindex="!isAllowed ? 0 : undefined"
    :aria-disabled="!isAllowed"
    @mouseenter="showTooltip"
    @mouseleave="hideTooltip"
    @focusin="showTooltip"
    @focusout="hideTooltip"
  >
    <slot :allowed="isAllowed" :disabled="!isAllowed" :reason="restrictionReason"></slot>

    <!-- Teleported Liquid Glass RBAC Tooltip — renders at <body> to escape overflow:hidden -->
    <Teleport to="body">
      <Transition name="rbac-tooltip-fade">
        <div
          v-if="!isAllowed && tooltipVisible"
          class="rbac-teleport-tooltip"
          role="tooltip"
          aria-hidden="true"
          :style="tooltipStyle"
        >
          <span class="rbac-tip-icon">🔒</span>
          <span class="rbac-tip-text">{{ restrictionReason }}</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<!-- Global styles — must NOT be scoped since tooltip is teleported to <body> -->
<style>
.rbac-teleport-tooltip {
  position: fixed;
  z-index: 99999;
  transform: translateX(-50%);
  pointer-events: none;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  max-width: 300px;
  /* Text wrapping */
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
  /* Glass style */
  background: var(--glass-bg-elevated, rgba(18, 24, 38, 0.95));
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(239, 68, 68, 0.4);
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.6),
    0 0 12px rgba(239, 68, 68, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  color: var(--text-primary, #ffffff);
  font-family: var(--font-sans, 'Inter', sans-serif);
  font-size: 11.5px;
  font-weight: 500;
  line-height: 1.5;
}

.rbac-tip-icon {
  flex-shrink: 0;
  font-size: 12px;
  line-height: 1.5;
}

.rbac-tip-text {
  flex: 1;
}

.rbac-tooltip-fade-enter-active,
.rbac-tooltip-fade-leave-active {
  transition:
    opacity 150ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.rbac-tooltip-fade-enter-from,
.rbac-tooltip-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px) scale(0.96);
}
</style>

<!-- Scoped styles for the wrapper itself (these don't need to escape) -->
<style scoped>
.rbac-action-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.rbac-action-wrapper.is-disabled {
  cursor: not-allowed;
}

.rbac-action-wrapper.is-disabled > * {
  pointer-events: none !important;
}
</style>
