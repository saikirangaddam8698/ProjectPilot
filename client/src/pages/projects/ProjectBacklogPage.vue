<script setup>
import { ref, computed } from 'vue';
import { useSprintStore } from '@/stores/sprint.store';
import { useTicketStore } from '@/stores/ticket.store';
import { useAuthStore } from '@/stores/auth.store';
import BacklogGroup from '@/components/sprints/BacklogGroup.vue';
import CreateSprintModal from '@/components/sprints/CreateSprintModal.vue';
import CompleteSprintModal from '@/components/sprints/CompleteSprintModal.vue';
import CreateTicketModal from '@/components/tickets/CreateTicketModal.vue';
import TicketDetailDrawer from '@/components/tickets/TicketDetailDrawer.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseInput from '@/components/ui/BaseInput.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
});

const sprintStore = useSprintStore();
const ticketStore = useTicketStore();
const authStore = useAuthStore();

const searchQuery = ref('');
const completingSprint = ref(null);
const toastMessage = ref('');

// Sprints for this project
const projectSprints = computed(() => {
  return sprintStore.getSprintsByProject(props.project.key);
});

const activeSprint = computed(() => {
  return projectSprints.value.find((s) => s.status === 'active') || null;
});

const plannedSprints = computed(() => {
  return projectSprints.value.filter((s) => s.status === 'planned');
});

// All project tickets
const allProjectTickets = computed(() => {
  return ticketStore.getTicketsByProject(props.project.key);
});

// Filter helper
function filterTickets(ticketList) {
  if (!searchQuery.value.trim()) return ticketList;
  const q = searchQuery.value.toLowerCase().trim();
  return ticketList.filter((t) => {
    return (
      t.key.toLowerCase().includes(q) ||
      t.title.toLowerCase().includes(q) ||
      t.assignee?.name.toLowerCase().includes(q)
    );
  });
}

const activeSprintTickets = computed(() => {
  if (!activeSprint.value) return [];
  const list = allProjectTickets.value.filter((t) => t.sprintId === activeSprint.value.id);
  return filterTickets(list);
});

function getSprintTickets(sprintId) {
  const list = allProjectTickets.value.filter((t) => t.sprintId === sprintId);
  return filterTickets(list);
}

const backlogTickets = computed(() => {
  const list = allProjectTickets.value
    .filter((t) => !t.sprintId)
    .sort((a, b) => (a.rank || 0) - (b.rank || 0));
  return filterTickets(list);
});

function handleTicketClick(ticket) {
  ticketStore.openTicketDetail(ticket.key);
}

function handleTicketDrop({ targetSprintId, ticketKey }) {
  if (targetSprintId) {
    const targetSprint = sprintStore.getSprintById(targetSprintId);
    ticketStore.assignTicketToSprint(ticketKey, targetSprintId, targetSprint?.name);
    toastMessage.value = `Moved ${ticketKey} into ${targetSprint?.name.split('—')[0].trim()}`;
  } else {
    ticketStore.removeTicketFromSprint(ticketKey);
    toastMessage.value = `Moved ${ticketKey} to Product Backlog`;
  }

  setTimeout(() => {
    toastMessage.value = '';
  }, 2500);
}

function handleStartSprint(sprint) {
  const res = sprintStore.startSprint(sprint.id);
  if (!res.success) {
    alert(res.error);
  } else {
    toastMessage.value = `${sprint.name} is now Active!`;
    setTimeout(() => {
      toastMessage.value = '';
    }, 3000);
  }
}

function handleCompleteSprint(sprint) {
  completingSprint.value = sprint;
}

function onSprintCompleted(result) {
  completingSprint.value = null;
  toastMessage.value = `Sprint completed successfully!`;
  setTimeout(() => {
    toastMessage.value = '';
  }, 3000);
}

function handleCreateTicketInScope(sprintId) {
  ticketStore.openCreateModal(props.project.key);
}
</script>

<template>
  <div class="project-backlog-page">
    <!-- Top Toolbar -->
    <div class="backlog-toolbar">
      <div class="toolbar-left">
        <div class="search-wrap">
          <BaseInput
            v-model="searchQuery"
            placeholder="Search backlog issues..."
            size="sm"
          >
            <template #prefix><AppIcon name="search" :size="14" /></template>
          </BaseInput>
        </div>
        <span class="toolbar-stats text-muted text-xs">
          {{ backlogTickets.length }} Unscheduled Backlog Items
        </span>
      </div>

      <div class="toolbar-right">
        <div :title="!authStore.canManageProject(project.key) ? 'Only Project Managers and Admins can plan sprints' : ''">
          <BaseButton
            variant="outline"
            size="sm"
            :disabled="!authStore.canManageProject(project.key)"
            @click="sprintStore.openCreateModal(project.key)"
          >
            <template #prefix><AppIcon name="sprints" :size="14" /></template>
            Plan Sprint
          </BaseButton>
        </div>
        <div :title="authStore.isViewer ? 'Viewers cannot create issues' : ''">
          <BaseButton
            variant="primary"
            size="sm"
            :disabled="authStore.isViewer"
            @click="ticketStore.openCreateModal(project.key)"
          >
            <template #prefix><AppIcon name="plus" :size="14" /></template>
            Create Issue
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Feedback Toast Notification (Fixed Overlay to Prevent Layout Shift) -->
    <Transition name="toast">
      <div v-if="toastMessage" class="feedback-toast" role="status" aria-live="polite">
        <div class="toast-icon-wrap">
          <AppIcon name="check" :size="18" />
        </div>
        <span class="toast-text">{{ toastMessage }}</span>
      </div>
    </Transition>

    <!-- Sprint Containers Section -->
    <div class="sprint-groups-column">
      <!-- 1. Active Sprint (if exists) -->
      <BacklogGroup
        v-if="activeSprint"
        :title="activeSprint.name"
        :sprint="activeSprint"
        :tickets="activeSprintTickets"
        :projectKey="project.key"
        @ticket-click="handleTicketClick"
        @ticket-drop="handleTicketDrop"
        @complete-sprint="handleCompleteSprint"
        @create-ticket="handleCreateTicketInScope(activeSprint.id)"
      />

      <!-- 2. Planned Sprints -->
      <BacklogGroup
        v-for="sprint in plannedSprints"
        :key="sprint.id"
        :title="sprint.name"
        :sprint="sprint"
        :tickets="getSprintTickets(sprint.id)"
        :projectKey="project.key"
        @ticket-click="handleTicketClick"
        @ticket-drop="handleTicketDrop"
        @start-sprint="handleStartSprint"
        @create-ticket="handleCreateTicketInScope(sprint.id)"
      />

      <!-- 3. Product Backlog Container -->
      <BacklogGroup
        title="Product Backlog"
        :isBacklog="true"
        :tickets="backlogTickets"
        :projectKey="project.key"
        @ticket-click="handleTicketClick"
        @ticket-drop="handleTicketDrop"
        @create-ticket="handleCreateTicketInScope(null)"
      />
    </div>

    <!-- Modals & Drawers -->
    <CreateSprintModal
      :modelValue="sprintStore.isCreateModalOpen"
      :projectKey="project.key"
    />

    <CompleteSprintModal
      v-if="completingSprint"
      :sprintId="completingSprint.id"
      @completed="onSprintCompleted"
      @close="completingSprint = null"
    />

    <CreateTicketModal
      :modelValue="ticketStore.isCreateModalOpen"
      :projectKey="project.key"
    />

    <TicketDetailDrawer />
  </div>
</template>

<style scoped>
.project-backlog-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
}

.backlog-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
  flex-wrap: wrap;
}

.search-wrap {
  max-width: 280px;
  width: 100%;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.feedback-toast {
  position: fixed;
  top: calc(var(--header-height) + 20px);
  right: 28px;
  z-index: var(--z-toast);
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-lg);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.2), 0 4px 12px -2px rgba(0, 0, 0, 0.12);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  min-width: 260px;
  max-width: 440px;
  pointer-events: auto;
}

.toast-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background-color: var(--badge-success-bg);
  color: var(--badge-success-text);
  flex-shrink: 0;
}

.toast-text {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity var(--transition-base), transform var(--transition-base);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.sprint-groups-column {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}
</style>
