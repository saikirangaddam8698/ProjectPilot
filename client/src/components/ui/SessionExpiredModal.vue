<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import BaseModal from '@/components/ui/BaseModal.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const router = useRouter();
const authStore = useAuthStore();

function handleLoginRedirect() {
  authStore.dismissSessionExpiredModal();
  router.push('/login');
}
</script>

<template>
  <BaseModal
    :model-value="authStore.showSessionExpiredModal"
    title="Session Expired"
    description="Your security session duration has reached its 1-hour limit."
    size="sm"
    :hide-close="true"
    @close="handleLoginRedirect"
  >
    <div class="session-expired-content">
      <div class="icon-badge">
        <AppIcon name="clock" class="clock-icon" />
      </div>
      <div class="message-group">
        <p class="body-text">
          Your active session has expired after 1 hour for security reasons.
        </p>
        <p class="sub-text">
          Please sign in again to continue working in ProjectPilot.
        </p>
      </div>
    </div>

    <template #footer>
      <BaseButton
        variant="primary"
        class="full-width-btn"
        @click="handleLoginRedirect"
      >
        Sign In Again
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.session-expired-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-4) 0;
  gap: var(--space-4);
}

.icon-badge {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--status-warning, #f59e0b);
}

.clock-icon {
  width: 28px;
  height: 28px;
}

.message-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.body-text {
  font-size: var(--text-base);
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.sub-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.full-width-btn {
  width: 100%;
  justify-content: center;
}
</style>
