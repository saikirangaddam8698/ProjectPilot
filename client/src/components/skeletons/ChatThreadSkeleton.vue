<script setup>
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue';

defineProps({
  count: {
    type: Number,
    default: 2
  }
});
</script>

<template>
  <div class="chat-thread-skeleton" aria-label="Loading conversation messages" aria-busy="true">
    <div v-for="i in count" :key="i" class="chat-turn-group">
      <!-- User message skeleton (Right aligned) -->
      <div class="skeleton-msg-row user-row">
        <div class="skeleton-msg-content user-content">
          <div class="skeleton-author-row right">
            <BaseSkeleton width="50px" height="12px" rounded="xs" />
          </div>
          <div class="skeleton-bubble user-bubble">
            <BaseSkeleton :width="`${Math.floor(160 + (i * 45) % 120)}px`" height="16px" rounded="sm" />
          </div>
        </div>
        <BaseSkeleton width="32px" height="32px" rounded="full" class="avatar-skeleton" />
      </div>

      <!-- Assistant response skeleton (Left aligned) -->
      <div class="skeleton-msg-row assistant-row">
        <BaseSkeleton width="32px" height="32px" rounded="full" class="avatar-skeleton" />
        <div class="skeleton-msg-content assistant-content">
          <div class="skeleton-author-row">
            <BaseSkeleton width="110px" height="13px" rounded="xs" />
            <BaseSkeleton width="80px" height="12px" rounded="xs" />
          </div>

          <!-- Tool badge skeleton pills -->
          <div class="skeleton-tools-row">
            <BaseSkeleton width="140px" height="20px" rounded="full" />
            <BaseSkeleton width="120px" height="20px" rounded="full" />
          </div>

          <!-- Message bubble skeleton text lines -->
          <div class="skeleton-bubble assistant-bubble">
            <BaseSkeleton width="92%" height="14px" rounded="xs" />
            <BaseSkeleton width="85%" height="14px" rounded="xs" />
            <BaseSkeleton width="65%" height="14px" rounded="xs" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-thread-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-6);
  width: 100%;
}

.chat-turn-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.skeleton-msg-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  width: 100%;
}

.skeleton-msg-row.user-row {
  justify-content: flex-end;
}

.skeleton-msg-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: 75%;
}

.skeleton-msg-content.user-content {
  align-items: flex-end;
}

.skeleton-author-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.skeleton-author-row.right {
  justify-content: flex-end;
}

.skeleton-tools-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}

.skeleton-bubble {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.skeleton-bubble.user-bubble {
  background-color: var(--color-primary-600);
  opacity: 0.7;
  border-bottom-right-radius: var(--radius-xs);
}

.skeleton-bubble.assistant-bubble {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-bottom-left-radius: var(--radius-xs);
}

.avatar-skeleton {
  flex-shrink: 0;
}
</style>
