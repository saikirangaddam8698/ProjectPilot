<script setup>
import { computed } from 'vue';
import BaseModal from './BaseModal.vue';
import BaseButton from './BaseButton.vue';
import BaseBadge from './BaseBadge.vue';
import AppIcon from './AppIcon.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  isOpen: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Confirm Deletion'
  },
  message: {
    type: String,
    default: 'Are you sure you want to delete this item? This action cannot be undone.'
  },
  itemName: {
    type: String,
    default: ''
  },
  itemType: {
    type: String,
    default: ''
  },
  confirmText: {
    type: String,
    default: 'Delete'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  confirmVariant: {
    type: String,
    default: 'danger'
  },
  loading: {
    type: Boolean,
    default: false
  },
  zIndex: {
    type: [Number, String],
    default: 10002
  }
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel', 'close']);

const isVisible = computed({
  get: () => props.modelValue || props.isOpen,
  set: (val) => {
    emit('update:modelValue', val);
    if (!val) emit('close');
  }
});

function handleCancel() {
  isVisible.value = false;
  emit('cancel');
}

function handleConfirm() {
  emit('confirm');
}
</script>

<template>
  <BaseModal
    v-model="isVisible"
    :title="title"
    size="sm"
    :z-index="zIndex"
    @close="handleCancel"
  >
    <div class="confirm-content">
      <!-- Warning Icon & Context Banner -->
      <div class="confirm-banner">
        <div class="warning-icon-wrap">
          <AppIcon name="alert-triangle" :size="20" />
        </div>
        <div class="banner-text">
          <p class="confirm-message">{{ message }}</p>
        </div>
      </div>

      <!-- Target Item Card (if provided) -->
      <div v-if="itemName" class="target-item-card">
        <div class="item-meta">
          <BaseBadge v-if="itemType" variant="neutral" size="xs">{{ itemType }}</BaseBadge>
          <span class="item-name truncate font-medium">{{ itemName }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <BaseButton
        variant="close"
        size="sm"
        :disabled="loading"
        @click="handleCancel"
      >
        {{ cancelText }}
      </BaseButton>
      <BaseButton
        :variant="confirmVariant"
        size="sm"
        :loading="loading"
        @click="handleConfirm"
      >
        <template #prefix>
          <AppIcon v-if="confirmVariant === 'danger'" name="trash" :size="14" />
        </template>
        {{ confirmText }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.confirm-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.confirm-banner {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background-color: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-md);
}

.warning-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-danger-500);
  flex-shrink: 0;
  margin-top: 1px;
}

.banner-text {
  flex: 1;
}

.confirm-message {
  font-size: var(--text-sm);
  color: var(--text-primary);
  line-height: var(--line-height-normal);
}

.target-item-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.item-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

.item-name {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}
</style>
