<script setup>
import { ref, computed } from 'vue';
import { useSprintStore } from '@/stores/sprint.store';
import { useProjectStore } from '@/stores/project.store';
import SprintCard from '@/components/sprints/SprintCard.vue';
import CreateSprintModal from '@/components/sprints/CreateSprintModal.vue';
import CompleteSprintModal from '@/components/sprints/CompleteSprintModal.vue';
import TicketDetailDrawer from '@/components/tickets/TicketDetailDrawer.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const sprintStore = useSprintStore();
const projectStore = useProjectStore();

const selectedProject = ref('all');
const completingSprint = ref(null);
const toastMessage = ref('');

const allSprints = computed(() => {
  return sprintStore.getSprintsByProject(selectedProject.value);
});

const activeSprints = computed(() => {
  return allSprints.value.filter((s) => s.status === 'active');
});

const plannedSprints = computed(() => {
  return allSprints.value.filter((s) => s.status === 'planned');
});

const completedSprints = computed(() => {
  return allSprints.value.filter((s) => s.status === 'completed');
});

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

function handleEditSprint(sprint) {
  sprintStore.openCreateModal(sprint.projectKey, sprint);
}

function handleDeleteSprint(sprint) {
  if (confirm(`Are you sure you want to delete "${sprint.name}"? All assigned tickets will return to the backlog.`)) {
    sprintStore.deleteSprint(sprint.id);
    toastMessage.value = `Sprint deleted.`;
    setTimeout(() => {
      toastMessage.value = '';
    }, 3000);
  }
}

function onSprintCompleted(result) {
  completingSprint.value = null;
  toastMessage.value = `Sprint completed!`;
  setTimeout(() => {
    toastMessage.value = '';
  }, 3000);
}
</script>

<template>
  <div class="page-container">
    <!-- Header Area -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Sprints & Delivery</h2>
        <p class="page-subtitle">Cross-workspace sprint cadences, story point allocation, and release tracking.</p>
      </div>

      <div class="page-actions">
        <!-- Project Scope Filter -->
        <div class="project-filter-wrap">
          <select v-model="selectedProject" class="project-select">
            <option value="all">All Projects</option>
            <option
              v-for="p in projectStore.allProjects"
              :key="p.id"
              :value="p.key"
            >
              {{ p.name }} ({{ p.key }})
            </option>
          </select>
        </div>

        <BaseButton
          variant="primary"
          size="sm"
          @click="sprintStore.openCreateModal(selectedProject !== 'all' ? selectedProject : 'PILOT')"
        >
          <template #prefix><AppIcon name="plus" :size="14" /></template>
          Plan Sprint
        </BaseButton>
      </div>
    </div>

    <!-- Toast Notification (Fixed Overlay to Prevent Layout Shift) -->
    <Transition name="toast">
      <div v-if="toastMessage" class="feedback-toast" role="status" aria-live="polite">
        <div class="toast-icon-wrap">
          <AppIcon name="check" :size="18" />
        </div>
        <span class="toast-text">{{ toastMessage }}</span>
      </div>
    </Transition>

    <!-- 1. Active Sprints Section -->
    <div class="sprint-section">
      <div class="section-heading-row">
        <h3 class="section-title">Active Sprints ({{ activeSprints.length }})</h3>
        <span class="text-muted text-xs">Currently in execution across workspaces</span>
      </div>

      <div v-if="activeSprints.length > 0" class="sprints-grid">
        <SprintCard
          v-for="sprint in activeSprints"
          :key="sprint.id"
          :sprint="sprint"
          :showProjectBadge="true"
          @complete="handleCompleteSprint"
          @edit="handleEditSprint"
        />
      </div>
      <div v-else class="empty-state-banner text-muted">
        No active sprints running for the selected workspace.
      </div>
    </div>

    <!-- 2. Upcoming / Planned Sprints Section -->
    <div class="sprint-section">
      <div class="section-heading-row">
        <h3 class="section-title">Upcoming Sprints ({{ plannedSprints.length }})</h3>
        <span class="text-muted text-xs">Planned cadences and backlog commitments</span>
      </div>

      <div v-if="plannedSprints.length > 0" class="sprints-grid">
        <SprintCard
          v-for="sprint in plannedSprints"
          :key="sprint.id"
          :sprint="sprint"
          :showProjectBadge="true"
          @start="handleStartSprint"
          @edit="handleEditSprint"
          @delete="handleDeleteSprint"
        />
      </div>
      <div v-else class="empty-state-banner text-muted">
        No upcoming planned sprints. Click "Plan Sprint" to schedule the next delivery milestone.
      </div>
    </div>

    <!-- 3. Recently Completed Sprints Section -->
    <div class="sprint-section">
      <div class="section-heading-row">
        <h3 class="section-title">Recently Completed Sprints ({{ completedSprints.length }})</h3>
        <span class="text-muted text-xs">Archived sprint outcomes and velocity history</span>
      </div>

      <div v-if="completedSprints.length > 0" class="sprints-grid">
        <SprintCard
          v-for="sprint in completedSprints"
          :key="sprint.id"
          :sprint="sprint"
          :showProjectBadge="true"
        />
      </div>
      <div v-else class="empty-state-banner text-muted">
        No completed sprints yet.
      </div>
    </div>

    <!-- Modals & Drawers -->
    <CreateSprintModal
      :modelValue="sprintStore.isCreateModalOpen"
      :projectKey="selectedProject !== 'all' ? selectedProject : 'PILOT'"
    />

    <CompleteSprintModal
      v-if="completingSprint"
      :sprintId="completingSprint.id"
      @completed="onSprintCompleted"
      @close="completingSprint = null"
    />

    <TicketDetailDrawer />
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.page-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-1);
}

.page-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.project-select {
  height: 32px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 0 var(--space-3);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  outline: none;
  cursor: pointer;
}

.project-select:focus {
  border-color: var(--border-focus);
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

.sprint-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.section-heading-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: var(--text-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.sprints-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.empty-state-banner {
  background-color: var(--bg-surface);
  border: 1px dashed var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  text-align: center;
  font-size: var(--text-sm);
}
</style>
