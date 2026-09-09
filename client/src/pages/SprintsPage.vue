<script setup>
import { ref, computed } from 'vue';
import { useSprintStore } from '@/stores/sprint.store';
import { useProjectStore } from '@/stores/project.store';
import SprintCard from '@/components/sprints/SprintCard.vue';
import SprintCardSkeleton from '@/components/skeletons/SprintCardSkeleton.vue';
import ServiceUnavailableBanner from '@/components/ui/ServiceUnavailableBanner.vue';
import CreateSprintModal from '@/components/sprints/CreateSprintModal.vue';
import CompleteSprintModal from '@/components/sprints/CompleteSprintModal.vue';
import TicketDetailDrawer from '@/components/tickets/TicketDetailDrawer.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import BaseConfirmModal from '@/components/ui/BaseConfirmModal.vue';
import BaseSelect from '@/components/ui/BaseSelect.vue';

const sprintStore = useSprintStore();
const projectStore = useProjectStore();

const selectedProject = ref('all');
const completingSprint = ref(null);
const toastMessage = ref('');
const isDeleteConfirmOpen = ref(false);
const sprintToDelete = ref(null);

const isInitialLoading = computed(() => {
  return sprintStore.isLoading && sprintStore.allSprints.length === 0;
});

const allSprints = computed(() => {
  return sprintStore.getSprintsByProject(selectedProject.value);
});

const projectOptions = computed(() => {
  return [
    { value: 'all', label: 'All Projects' },
    ...projectStore.allProjects.map((p) => ({
      value: p.key,
      label: `${p.name} (${p.key})`
    }))
  ];
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

function handleRetry() {
  sprintStore.fetchSprints();
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

function handleEditSprint(sprint) {
  sprintStore.openCreateModal(sprint.projectKey, sprint);
}

function handleDeleteSprint(sprint) {
  sprintToDelete.value = sprint;
  isDeleteConfirmOpen.value = true;
}

function handleConfirmDeleteSprint() {
  if (!sprintToDelete.value) return;
  sprintStore.deleteSprint(sprintToDelete.value.id);
  toastMessage.value = `Sprint deleted.`;
  setTimeout(() => {
    toastMessage.value = '';
  }, 3000);
  isDeleteConfirmOpen.value = false;
  sprintToDelete.value = null;
}
</script>

<template>
  <div class="sprints-page-container">
    <!-- Header -->
    <div class="page-header">
      <div class="page-header-text">
        <h2 class="page-title">Sprints & Delivery</h2>
        <p class="page-subtitle">Track cross-project sprint commitments, velocity, and burnup milestones.</p>
      </div>

      <div class="page-header-actions">
        <!-- Project Filter -->
        <div class="project-filter-box">
          <BaseSelect
            v-model="selectedProject"
            :options="projectOptions"
            size="sm"
          />
        </div>

        <BaseButton variant="primary" size="sm" @click="sprintStore.openCreateModal(selectedProject !== 'all' ? selectedProject : 'PILOT')">
          <template #prefix><AppIcon name="plus" :size="14" /></template>
          Plan New Sprint
        </BaseButton>
      </div>
    </div>

    <!-- Service Unavailable Error Banner -->
    <ServiceUnavailableBanner
      v-if="sprintStore.error && !isInitialLoading"
      :message="sprintStore.error"
      @retry="handleRetry"
    />

    <!-- Toast Notification -->
    <Transition name="toast">
      <div v-if="toastMessage" class="page-toast" role="status" aria-live="polite">
        <div class="toast-icon-wrap">
          <AppIcon name="check" :size="18" />
        </div>
        <span class="toast-text">{{ toastMessage }}</span>
      </div>
    </Transition>

    <!-- Skeleton Loader on Initial Load -->
    <SprintCardSkeleton v-if="isInitialLoading" :count="3" />

    <!-- Sprints Content Sections -->
    <template v-else-if="allSprints.length > 0">
      <!-- Active Sprints Section -->
      <section v-if="activeSprints.length > 0" class="sprints-section">
        <div class="section-header">
          <h3 class="section-title">Active Sprints</h3>
          <span class="section-badge active">{{ activeSprints.length }} Running</span>
        </div>
        <div class="sprints-list">
          <SprintCard
            v-for="sprint in activeSprints"
            :key="sprint.id"
            :sprint="sprint"
            @start="handleStartSprint(sprint)"
            @complete="handleCompleteSprint(sprint)"
            @edit="handleEditSprint(sprint)"
            @delete="handleDeleteSprint(sprint)"
          />
        </div>
      </section>

      <!-- Planned / Future Sprints Section -->
      <section v-if="plannedSprints.length > 0" class="sprints-section">
        <div class="section-header">
          <h3 class="section-title">Planned Sprints</h3>
          <span class="section-badge planned">{{ plannedSprints.length }} Upcoming</span>
        </div>
        <div class="sprints-list">
          <SprintCard
            v-for="sprint in plannedSprints"
            :key="sprint.id"
            :sprint="sprint"
            @start="handleStartSprint(sprint)"
            @complete="handleCompleteSprint(sprint)"
            @edit="handleEditSprint(sprint)"
            @delete="handleDeleteSprint(sprint)"
          />
        </div>
      </section>

      <!-- Completed Sprints Section -->
      <section v-if="completedSprints.length > 0" class="sprints-section">
        <div class="section-header">
          <h3 class="section-title">Completed Sprints</h3>
          <span class="section-badge completed">{{ completedSprints.length }} Closed</span>
        </div>
        <div class="sprints-list">
          <SprintCard
            v-for="sprint in completedSprints"
            :key="sprint.id"
            :sprint="sprint"
            @start="handleStartSprint(sprint)"
            @complete="handleCompleteSprint(sprint)"
            @edit="handleEditSprint(sprint)"
            @delete="handleDeleteSprint(sprint)"
          />
        </div>
      </section>
    </template>

    <!-- Empty State -->
    <div v-else-if="!isInitialLoading && !sprintStore.error" class="empty-state">
      <div class="empty-icon-wrap">
        <AppIcon name="sprints" :size="32" />
      </div>
      <h3 class="empty-title">No sprints planned yet</h3>
      <p class="empty-desc">
        Create sprint milestones from the backlog to track delivery velocity and sprint goals.
      </p>
      <BaseButton variant="primary" size="sm" @click="sprintStore.openCreateModal('PILOT')">
        Plan First Sprint
      </BaseButton>
    </div>

    <!-- Modals & Drawers -->
    <CreateSprintModal />
    <CompleteSprintModal
      :isOpen="!!completingSprint"
      :sprint="completingSprint"
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
.sprints-page-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-6);
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.page-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.02em;
  margin: 0 0 var(--space-1) 0;
}

.page-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}

.page-header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.project-filter-box {
  min-width: 200px;
}


/* Sprints Section */
.sprints-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.section-title {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.section-badge {
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.section-badge.active {
  background-color: rgba(99, 102, 241, 0.12);
  color: var(--color-primary-400);
  border: 1px solid rgba(99, 102, 241, 0.3);
}

.section-badge.planned {
  background-color: var(--bg-surface-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
}

.section-badge.completed {
  background-color: rgba(16, 185, 129, 0.12);
  color: var(--color-success-500);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.sprints-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12) var(--space-4);
  background-color: var(--bg-surface);
  border: 1px dashed var(--border-default);
  border-radius: var(--radius-lg);
  text-align: center;
  gap: var(--space-3);
}

.empty-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background-color: var(--bg-surface-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.empty-title {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.empty-desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  max-width: 380px;
  margin: 0;
}

/* Toast */
.page-toast {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-success-500);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.toast-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  background-color: rgba(16, 185, 129, 0.15);
  color: var(--color-success-500);
}

.toast-text {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

/* Toast Transition */
.toast-enter-active,
.toast-leave-active {
  transition: all var(--transition-normal);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
</style>
