<script setup>
import { ref, computed } from 'vue';
import { useSprintStore } from '@/stores/sprint.store';
import { useTicketStore } from '@/stores/ticket.store';
import BaseModal from '@/components/ui/BaseModal.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';

const props = defineProps({
  sprintId: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['completed', 'close']);

const sprintStore = useSprintStore();
const ticketStore = useTicketStore();

const moveTarget = ref('backlog');

const sprint = computed(() => {
  return sprintStore.getSprintById(props.sprintId);
});

const sprintTickets = computed(() => {
  if (!props.sprintId) return [];
  return ticketStore.allTickets.filter((t) => t.sprintId === props.sprintId);
});

const completedTickets = computed(() => {
  return sprintTickets.value.filter((t) => t.status === 'Done');
});

const incompleteTickets = computed(() => {
  return sprintTickets.value.filter((t) => t.status !== 'Done');
});

const availableFutureSprints = computed(() => {
  if (!sprint.value) return [];
  return sprintStore.getPlannedSprints(sprint.value.projectKey);
});

function handleComplete() {
  if (!props.sprintId) return;

  const result = sprintStore.completeSprint(props.sprintId, {
    moveIncompleteTo: moveTarget.value
  });

  emit('completed', result);
  emit('close');
}
</script>

<template>
  <BaseModal
    :modelValue="!!sprintId"
    @update:modelValue="$emit('close')"
    @close="$emit('close')"
    size="md"
    :title="`Complete ${sprint?.name || 'Sprint'}`"
    description="Review deliverable outcomes and handle unfinished sprint items."
  >
    <div v-if="sprint" class="complete-sprint-body">
      <!-- Outcome Summary Card -->
      <div class="outcome-stats-card">
        <div class="stat-col">
          <span class="stat-val text-success">{{ completedTickets.length }}</span>
          <span class="stat-lbl">Completed Issues</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-col">
          <span class="stat-val" :class="{ 'text-warning': incompleteTickets.length > 0 }">
            {{ incompleteTickets.length }}
          </span>
          <span class="stat-lbl">Open / Incomplete</span>
        </div>
      </div>

      <!-- Incomplete issues list if any -->
      <div v-if="incompleteTickets.length > 0" class="incomplete-section">
        <div class="section-label-row">
          <span class="incomplete-heading font-medium">Incomplete Issues ({{ incompleteTickets.length }}):</span>
        </div>

        <div class="incomplete-list">
          <div
            v-for="ticket in incompleteTickets"
            :key="ticket.key"
            class="incomplete-item"
          >
            <BaseBadge :variant="ticket.status === 'In Review' ? 'warning' : 'info'" size="sm">
              {{ ticket.status }}
            </BaseBadge>
            <span class="ticket-key mono">{{ ticket.key }}</span>
            <span class="ticket-title truncate">{{ ticket.title }}</span>
            <span class="ticket-points mono text-muted">{{ ticket.storyPoints }} pts</span>
          </div>
        </div>

        <!-- Destination Selector for Incomplete Tickets -->
        <div class="destination-picker">
          <label class="dest-label font-medium">Move open issues to:</label>
          <select v-model="moveTarget" class="dest-select">
            <option value="backlog">Product Backlog (Unassigned)</option>
            <option
              v-for="nextSprint in availableFutureSprints"
              :key="nextSprint.id"
              :value="nextSprint.id"
            >
              {{ nextSprint.name }} (Planned)
            </option>
          </select>
        </div>
      </div>

      <div v-else class="all-done-banner">
        🎉 <strong>Outstanding execution!</strong> All sprint tickets were successfully completed.
      </div>
    </div>

    <template #footer>
      <BaseButton variant="ghost" size="md" @click="$emit('close')">
        Cancel
      </BaseButton>
      <BaseButton variant="primary" size="md" @click="handleComplete">
        Confirm & Complete Sprint
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.complete-sprint-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.outcome-stats-card {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.stat-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-val {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
}

.text-success {
  color: var(--color-success-500);
}

.text-warning {
  color: var(--color-warning-500);
}

.stat-lbl {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.stat-divider {
  width: 1px;
  height: 40px;
  background-color: var(--border-subtle);
}

.incomplete-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.incomplete-heading {
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.incomplete-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-height: 180px;
  overflow-y: auto;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-2);
  background-color: var(--bg-surface);
}

.incomplete-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  background-color: var(--bg-surface-elevated);
  font-size: var(--text-xs);
}

.ticket-key {
  color: var(--text-muted);
  width: 70px;
  flex-shrink: 0;
}

.ticket-title {
  flex: 1;
  color: var(--text-primary);
}

.destination-picker {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-top: var(--space-2);
}

.dest-label {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.dest-select {
  height: 36px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 0 var(--space-3);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  outline: none;
  cursor: pointer;
}

.dest-select:focus {
  border-color: var(--border-focus);
}

.all-done-banner {
  padding: var(--space-4);
  background-color: var(--badge-success-bg);
  border: 1px solid var(--badge-success-border);
  border-radius: var(--radius-md);
  color: var(--badge-success-text);
  font-size: var(--text-sm);
  text-align: center;
}
</style>
