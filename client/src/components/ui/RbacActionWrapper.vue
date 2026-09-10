<script setup>
import { computed } from 'vue';
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

const permissionResult = computed(() => {
  return checkPermission(props.action, props.context);
});

const isAllowed = computed(() => permissionResult.value.allowed);
const restrictionReason = computed(() => props.customReason || permissionResult.value.reason);
</script>

<template>
  <div
    class="rbac-action-wrapper"
    :class="{ 'is-disabled': !isAllowed }"
    :tabindex="!isAllowed ? 0 : undefined"
    :aria-disabled="!isAllowed"
  >
    <slot :allowed="isAllowed" :disabled="!isAllowed" :reason="restrictionReason"></slot>

    <!-- Liquid Glass Tooltip shown on hover / focus when disabled -->
    <div
      v-if="!isAllowed"
      class="rbac-glass-tooltip"
      role="tooltip"
      aria-hidden="true"
    >
      <span class="tooltip-icon">🔒</span>
      <span>{{ restrictionReason }}</span>
    </div>
  </div>
</template>
