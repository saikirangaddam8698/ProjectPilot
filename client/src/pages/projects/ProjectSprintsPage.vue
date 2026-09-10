<script setup>
import { ref, computed } from 'vue';
import { useSprintStore } from '@/stores/sprint.store';
import SprintCard from '@/components/sprints/SprintCard.vue';
import CreateSprintModal from '@/components/sprints/CreateSprintModal.vue';
import CompleteSprintModal from '@/components/sprints/CompleteSprintModal.vue';
import TicketDetailDrawer from '@/components/tickets/TicketDetailDrawer.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import BaseConfirmModal from '@/components/ui/BaseConfirmModal.vue';
import RbacActionWrapper from '@/components/ui/RbacActionWrapper.vue';
import { showWarning } from '@/utils/swal';

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
});

const sprintStore = useSprintStore();

const activeTab = ref('active'); // 'active' | 'planned' | 'history'
const completingSprint = ref(null);
const toastMessage = ref('');
const isDeleteConfirmOpen = ref(false);
const sprintToDelete = ref(null);

const activeSprint = computed(() => {
  return sprintStore.getActiveSprint(props.project.key);
});

const plannedSprints = computed(() => {
  return sprintStore.getPlannedSprints(props.project.key);
});

const completedSprints = computed(() => {
  return sprintStore.getCompletedSprints(props.project.key);
});

async function handleStartSprint(sprint) {
  const res = await sprintStore.startSprint(sprint.id);
  if (!res.success) {
    showWarning('Active Sprint Conflict', res.error);
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
  sprintStore.openCreateModal(props.project.key, sprint);
}

function handleDeleteSprint(sprint) {
  sprintToDelete.value = sprint;
  isDeleteConfirmOpen.value = true;
}

function handleConfirmDeleteSprint() {
  if (!sprintToDelete.value) return;
  sprintStore.deleteSprint(sprintToDelete.value.id);
  toastMessage.value = `Sprint deleted. Tickets returned to Backlog.`;
  setTimeout(() => {
    toastMessage.value = '';
  }, 3000);
  isDeleteConfirmOpen.value = false;
  sprintToDelete.value = null;
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
  <div class="project-sprints-page">
    <!-- Header Controls -->
    <div class="sprints-header-bar">
      <div class="sprint-tabs">
        <button
          type="button"
          class="sprint-tab-btn"
          :class="{ 'is-active': activeTab === 'active' }"
          @click="activeTab = 'active'"
        >
          <span>Active Sprint</span>
          <span v-if="activeSprint" class="tab-indicator-dot"></span>
        </button>
        <button
          type="button"
          class="sprint-tab-btn"
          :class="{ 'is-active': activeTab === 'planned' }"
          @click="activeTab = 'planned'"
        >
          <span>Planned ({{ plannedSprints.length }})</span>
        </button>
        <button
          type="button"
          class="sprint-tab-btn"
          :class="{ 'is-active': activeTab === 'history' }"
          @click="activeTab = 'history'"
        >
          <span>History ({{ completedSprints.length }})</span>
        </button>
      </div>

      <div class="header-actions">
        <BaseButton
          variant="outline"
          size="sm"
          :to="`/projects/${project.key}/backlog`"
        >
          <template #prefix><AppIcon name="my-work" :size="14" /></template>
          Backlog Planning
        </BaseButton>
        <BaseButton
          variant="primary"
          size="sm"
          @click="sprintStore.openCreateModal(project.key)"
        >
          <template #prefix><AppIcon name="plus" :size="14" /></template>
          Plan Sprint
        </BaseButton>
      </div>
    </div>

    <!-- Feedback Toast (Fixed Overlay to Prevent Layout Shift) -->
    <Transition name="toast">
      <div v-if="toastMessage" class="feedback-toast" role="status" aria-live="polite">
        <div class="toast-icon-wrap">
          <AppIcon name="check" :size="18" />
        </div>
        <span class="toast-text">{{ toastMessage }}</span>
      </div>
    </Transition>

    <!-- Active Sprint Tab -->
    <div v-if="activeTab === 'active'" class="sprints-view-content">
      <div v-if="activeSprint" class="sprints-list">
        <SprintCard
          :sprint="activeSprint"
          @complete="handleCompleteSprint"
          @edit="handleEditSprint"
        />
      </div>
      <div v-else class="empty-sprint-card">
        <div class="empty-icon-circle">⚡</div>
        <h3 class="empty-title">No Active Sprint</h3>
        <p class="empty-desc text-secondary">
          There is currently no active sprint running for {{ project.name }}. Start a planned sprint or plan new work in the backlog.
        </p>
        <div class="empty-actions">
          <BaseButton
            variant="outline"
            size="sm"
            :to="`/projects/${project.key}/backlog`"
          >
            Go to Backlog
          </BaseButton>
          <RbacActionWrapper action="plan_sprint" :context="{ projectKey: project.key }">
            <template #default="{ disabled }">
              <BaseButton
                variant="primary"
                size="sm"
                :disabled="disabled"
                @click="sprintStore.openCreateModal(project.key)"
              >
                Plan Sprint
              </BaseButton>
            </template>
          </RbacActionWrapper>
        </div>
      </div>
    </div>

    <!-- Planned Sprints Tab -->
    <div v-else-if="activeTab === 'planned'" class="sprints-view-content">
      <div v-if="plannedSprints.length > 0" class="sprints-list">
        <SprintCard
          v-for="sprint in plannedSprints"
          :key="sprint.id"
          :sprint="sprint"
          @start="handleStartSprint"
          @edit="handleEditSprint"
          @delete="handleDeleteSprint"
        />
      </div>
      <div v-else class="empty-sprint-card">
        <div class="empty-icon-circle">📋</div>
        <h3 class="empty-title">No Planned Sprints</h3>
        <p class="empty-desc text-secondary">
          Create a future sprint to allocate backlog items and establish capacity goals.
        </p>
        <RbacActionWrapper action="plan_sprint" :context="{ projectKey: project.key }">
          <template #default="{ disabled }">
            <BaseButton
              variant="primary"
              size="sm"
              :disabled="disabled"
              @click="sprintStore.openCreateModal(project.key)"
            >
              Plan Sprint
            </BaseButton>
          </template>
        </RbacActionWrapper>
      </div>
    </div>

    <!-- Sprint History (Completed) Tab -->
    <div v-else-if="activeTab === 'history'" class="sprints-view-content">
      <div v-if="completedSprints.length > 0" class="sprints-list">
        <SprintCard
          v-for="sprint in completedSprints"
          :key="sprint.id"
          :sprint="sprint"
        />
      </div>
      <div v-else class="empty-sprint-card">
        <div class="empty-icon-circle">🏁</div>
        <h3 class="empty-title">No Completed Sprints</h3>
        <p class="empty-desc text-secondary">
          Completed sprints will archive here for velocity auditing and retrospective analysis.
        </p>
      </div>
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

    <TicketDetailDrawer />

    <!-- Delete Sprint Confirmation Modal -->
    <BaseConfirmModal
      v-model="isDeleteConfirmOpen"
      title="Delete Sprint"
      :message="`Are you sure you want to delete &quot;${sprintToDelete?.name}&quot;? All assigned tickets will return to the backlog.`"
      :itemName="sprintToDelete?.name"
      itemType="SPRINT"
      confirmText="Delete Sprint"
      @confirm="handleConfirmDeleteSprint"
      @cancel="isDeleteConfirmOpen = false"
    />
  </div>
</template>

<style scoped>
.project-sprints-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
}

.sprints-header-bar {
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

.sprint-tabs {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 2px;
}

.sprint-tab-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 4px var(--space-3);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.sprint-tab-btn:hover {
  color: var(--text-primary);
}

.sprint-tab-btn.is-active {
  background-color: var(--bg-surface);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

.tab-indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--color-success-500);
}

.header-actions {
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

.sprints-view-content {
  width: 100%;
}

.sprints-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.empty-sprint-card {
  background-color: var(--bg-surface);
  border: 1px dashed var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-10) var(--space-6);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-3);
}

.empty-icon-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--bg-surface-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.empty-title {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.empty-desc {
  font-size: var(--text-sm);
  max-width: 440px;
}

.empty-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-2);
}
</style>
