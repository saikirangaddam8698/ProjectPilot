<script setup>
import { ref, computed } from 'vue';
import { useTicketStore } from '@/stores/ticket.store';
import { useProjectStore } from '@/stores/project.store';
import BaseModal from '@/components/ui/BaseModal.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  member: {
    type: Object,
    default: null
  },
  projectKey: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'removed', 'close']);

const ticketStore = useTicketStore();
const projectStore = useProjectStore();

const shouldReassign = ref(true);

const affectedTickets = computed(() => {
  if (!props.member || !props.projectKey) return [];
  return ticketStore.allTickets.filter(
    (t) =>
      t.projectKey.toUpperCase() === props.projectKey.toUpperCase() &&
      (t.assignee?.id === props.member.id || t.assignee?.name === props.member.name) &&
      t.status !== 'Done'
  );
});

function handleConfirmRemove() {
  if (!props.member || !props.projectKey) return;

  // 1. Reassign tickets if needed
  if (shouldReassign.value && affectedTickets.value.length > 0) {
    ticketStore.reassignMemberTickets(props.projectKey, props.member.id);
  }

  // 2. Remove member from project
  const success = projectStore.removeMemberFromProject(props.projectKey, props.member.id);

  if (success) {
    emit('removed', {
      member: props.member,
      reassignedCount: shouldReassign.value ? affectedTickets.value.length : 0
    });
  }

  handleClose();
}

function handleClose() {
  emit('update:modelValue', false);
  emit('close');
}
</script>

<template>
  <BaseModal
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    @close="handleClose"
    size="sm"
    title="Remove Team Member"
    description="Remove this member from the project workspace membership."
  >
    <div v-if="member" class="remove-dialog-body">
      <div class="member-summary-box">
        <div class="member-avatar">{{ member.avatar }}</div>
        <div class="member-meta">
          <span class="member-name">{{ member.name }}</span>
          <span class="member-role text-muted">{{ member.role }} • {{ projectKey }}</span>
        </div>
      </div>

      <!-- Warning if member has open assigned tickets -->
      <div v-if="affectedTickets.length > 0" class="tickets-warning-card">
        <div class="warning-header">
          <div class="warning-icon-badge">⚠️</div>
          <span class="warning-title">Active Work Assigned ({{ affectedTickets.length }} tickets)</span>
        </div>
        <p class="warning-text">
          <strong>{{ member.name }}</strong> has {{ affectedTickets.length }} unresolved ticket{{ affectedTickets.length > 1 ? 's' : '' }} in this workspace:
        </p>

        <div class="affected-tickets-preview">
          <span
            v-for="t in affectedTickets.slice(0, 3)"
            :key="t.key"
            class="ticket-chip mono"
          >
            {{ t.key }}
          </span>
          <span v-if="affectedTickets.length > 3" class="text-muted text-xs">
            +{{ affectedTickets.length - 3 }} more
          </span>
        </div>

        <label class="reassign-checkbox-row">
          <input type="checkbox" v-model="shouldReassign" class="checkbox-input" />
          <span class="checkbox-label">Automatically reassign open tickets to <strong>Unassigned</strong></span>
        </label>
      </div>

      <div v-else class="clean-removal-notice text-muted">
        <span>No open tickets are currently assigned to {{ member.name }}. They can be safely removed.</span>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="close" size="md" @click="handleClose">
        Cancel
      </BaseButton>
      <BaseButton variant="danger" size="md" @click="handleConfirmRemove">
        Remove Member
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.remove-dialog-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.member-summary-box {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.member-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--color-primary-600);
  color: #ffffff;
  font-size: var(--text-xs);
  font-weight: var(--font-weight-bold);
  display: flex;
  align-items: center;
  justify-content: center;
}

.member-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.member-name {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.member-role {
  font-size: 11px;
}

.tickets-warning-card {
  padding: var(--space-3) var(--space-4);
  background-color: var(--badge-warning-bg);
  border: 1px solid var(--badge-warning-border);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.warning-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.warning-icon-badge {
  font-size: var(--text-sm);
}

.warning-title {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-bold);
  color: var(--badge-warning-text);
}

.warning-text {
  font-size: var(--text-xs);
  color: var(--text-primary);
}

.affected-tickets-preview {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.ticket-chip {
  font-size: 11px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  color: var(--text-primary);
}

.reassign-checkbox-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin-top: var(--space-1);
  cursor: pointer;
}

.checkbox-input {
  margin-top: 2px;
  cursor: pointer;
}

.checkbox-label {
  font-size: var(--text-xs);
  color: var(--text-primary);
  line-height: 1.3;
}

.clean-removal-notice {
  font-size: var(--text-xs);
  padding: var(--space-2) 0;
}
</style>
