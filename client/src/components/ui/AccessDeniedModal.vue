<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
import BaseModal from '@/components/ui/BaseModal.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const authStore = useAuthStore();

const isOpen = computed({
  get: () => authStore.showAccessDeniedModal,
  set: (val) => {
    if (!val) authStore.dismissAccessDeniedModal();
  }
});

const info = computed(() => authStore.accessDeniedInfo || {});
const currentRole = computed(() => authStore.globalRole || 'VIEWER');

function handleDismiss() {
  authStore.dismissAccessDeniedModal();
}
</script>

<template>
  <BaseModal
    :model-value="isOpen"
    size="sm"
    :hide-close="false"
    @close="handleDismiss"
  >
    <div class="swal-restricted-container" role="alertdialog" aria-live="assertive">
      <!-- Animated Warning Badge / Swal Icon -->
      <div class="swal-warning-icon-wrap">
        <div class="swal-warning-pulse"></div>
        <div class="swal-warning-badge">
          <AppIcon name="alert-triangle" :size="32" class="warning-icon-svg" />
        </div>
      </div>

      <!-- Main Swal Content -->
      <div class="swal-content-group">
        <h3 class="swal-title">{{ info.title || 'Access Restricted' }}</h3>
        <p class="swal-message">
          {{ info.message || 'You are not authorized to perform this operation.' }}
        </p>
      </div>

      <!-- Context / Role Information Box -->
      <div class="swal-role-context">
        <div class="context-row">
          <span class="context-label">Your Current Role</span>
          <BaseBadge variant="neutral" size="sm" class="font-semibold">
            {{ currentRole }}
          </BaseBadge>
        </div>

        <div v-if="info.requiredRole" class="context-row">
          <span class="context-label">Required Permission</span>
          <BaseBadge variant="purple" size="sm" class="font-semibold">
            {{ info.requiredRole }}
          </BaseBadge>
        </div>

        <div v-if="info.action" class="context-row">
          <span class="context-label">Restricted Action</span>
          <span class="context-action-tag mono">{{ info.action }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="swal-footer">
        <BaseButton
          variant="primary"
          class="swal-btn-dismiss"
          @click="handleDismiss"
        >
          I Understand
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.swal-restricted-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-4) var(--space-2) 0 var(--space-2);
  gap: var(--space-4);
}

/* Animated Glowing Warning Icon */
.swal-warning-icon-wrap {
  position: relative;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.swal-warning-pulse {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background-color: rgba(245, 158, 11, 0.2);
  animation: warningPulse 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
}

.swal-warning-badge {
  position: relative;
  z-index: 1;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.3));
  border: 2px solid rgba(245, 158, 11, 0.6);
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f59e0b;
}

.warning-icon-svg {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

@keyframes warningPulse {
  0%, 100% {
    transform: scale(0.92);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.18);
    opacity: 0.15;
  }
}

.swal-content-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: 360px;
}

.swal-title {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.01em;
  margin: 0;
}

.swal-message {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  margin: 0;
}

/* Role & Context Box */
.swal-role-context {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  box-sizing: border-box;
}

.context-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--text-xs);
  gap: var(--space-2);
}

.context-label {
  color: var(--text-muted);
  font-weight: var(--font-weight-medium);
}

.context-action-tag {
  font-size: 11px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  padding: 1px 6px;
  border-radius: var(--radius-xs);
  color: var(--text-secondary);
}

.swal-footer {
  display: flex;
  width: 100%;
}

.swal-btn-dismiss {
  width: 100%;
  justify-content: center;
}
</style>
