<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '@/stores/project.store';
import { useTicketStore } from '@/stores/ticket.store';
import { useAuthStore } from '@/stores/auth.store';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import BaseInput from '@/components/ui/BaseInput.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import ServiceUnavailableBanner from '@/components/ui/ServiceUnavailableBanner.vue';
import ProjectGridSkeleton from '@/components/skeletons/ProjectGridSkeleton.vue';
import CreateProjectModal from '@/components/projects/CreateProjectModal.vue';
import BaseConfirmModal from '@/components/ui/BaseConfirmModal.vue';
import RbacActionWrapper from '@/components/ui/RbacActionWrapper.vue';

const router = useRouter();
const projectStore = useProjectStore();
const ticketStore = useTicketStore();
const authStore = useAuthStore();

const isCreateModalOpen = ref(false);
const toastMessage = ref('');
const isDeleteModalOpen = ref(false);
const projectToDelete = ref(null);
const isDeleting = ref(false);

function promptDeleteProject(project) {
  projectToDelete.value = project;
  isDeleteModalOpen.value = true;
}

async function handleConfirmDelete() {
  if (!projectToDelete.value) return;
  isDeleting.value = true;
  try {
    const success = await projectStore.deleteProject(projectToDelete.value.key);
    if (success) {
      toastMessage.value = `Project workspace "${projectToDelete.value.name}" deleted.`;
      setTimeout(() => {
        toastMessage.value = '';
      }, 4000);
    }
  } catch (err) {
    console.error('Failed to delete project:', err);
  } finally {
    isDeleting.value = false;
    isDeleteModalOpen.value = false;
    projectToDelete.value = null;
  }
}

function handleCreateProjectClick() {
  if (!authStore.canCreateProject) {
    authStore.showAccessDenied({
      title: 'Operation Restricted',
      message: 'You are not authorized to create new project workspaces. Only Workspace Admins and Project Managers can create projects.',
      requiredRole: 'PROJECT_MANAGER or ADMIN',
      action: 'Create Project'
    });
    return;
  }
  isCreateModalOpen.value = true;
}

const isInitialLoading = computed(() => {
  return projectStore.isLoading && projectStore.allProjects.length === 0;
});

function handleProjectCreated(newProject) {
  toastMessage.value = `Project "${newProject.name}" (${newProject.key}) created successfully!`;
  setTimeout(() => {
    toastMessage.value = '';
  }, 4000);
}

function openProject(key) {
  router.push(`/projects/${key}/overview`);
}

function resetFilters() {
  projectStore.setSearchQuery('');
  projectStore.setStatusFilter('all');
}

function handleRetry() {
  projectStore.fetchProjects();
}

function getAvatarBgColor(key) {
  if (key === 'PILOT') return '#4F46E5';
  if (key === 'INFRA') return '#0284C7';
  if (key === 'MOBILE') return '#8B5CF6';
  return '#10B981';
}

function getProjectTicketCount(key) {
  return ticketStore.getTicketsByProject(key).length;
}

function getProjectProgress(key) {
  const stats = ticketStore.getProjectStats(key);
  if (stats.totalPoints > 0) {
    return Math.round((stats.completedPoints / stats.totalPoints) * 100);
  }
  if (stats.total > 0) {
    return Math.round((stats.done / stats.total) * 100);
  }
  return 0;
}
</script>

<template>
  <div class="page-container">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Projects</h2>
        <p class="page-subtitle">Manage workspaces, project keys, sprint configurations, and team access.</p>
      </div>
      <RbacActionWrapper action="create_project">
        <template #default="{ disabled }">
          <BaseButton
            variant="primary"
            size="sm"
            :disabled="disabled"
            @click="handleCreateProjectClick"
          >
            <template #prefix><AppIcon name="plus" :size="14" /></template>
            Create Project
          </BaseButton>
        </template>
      </RbacActionWrapper>
    </div>

    <!-- Service / Database Error Banner -->
    <ServiceUnavailableBanner
      v-if="projectStore.error && !isInitialLoading"
      :message="projectStore.error"
      @retry="handleRetry"
    />

    <!-- Success Feedback Toast (Fixed Overlay to Prevent Layout Shift) -->
    <Transition name="toast">
      <div v-if="toastMessage" class="feedback-toast" role="status" aria-live="polite">
        <div class="toast-left">
          <div class="toast-icon-wrap">
            <AppIcon name="check" :size="18" />
          </div>
          <span class="toast-text">{{ toastMessage }}</span>
        </div>
        <button type="button" class="toast-close" @click="toastMessage = ''">✕</button>
      </div>
    </Transition>

    <!-- Toolbar: Search & Filter Tabs -->
    <div class="projects-toolbar">
      <div class="search-box-wrapper">
        <BaseInput
          :modelValue="projectStore.searchQuery"
          @update:modelValue="projectStore.setSearchQuery"
          placeholder="Search by name, key (e.g. PILOT), or description..."
          size="sm"
        >
          <template #prefix><AppIcon name="search" :size="14" /></template>
        </BaseInput>
      </div>

      <!-- Status Filter Chips -->
      <div class="filter-chips">
        <button
          type="button"
          class="filter-chip"
          :class="{ 'is-active': projectStore.statusFilter === 'all' }"
          @click="projectStore.setStatusFilter('all')"
        >
          All ({{ projectStore.allProjects.length }})
        </button>
        <button
          type="button"
          class="filter-chip"
          :class="{ 'is-active': projectStore.statusFilter === 'active' }"
          @click="projectStore.setStatusFilter('active')"
        >
          Active
        </button>
        <button
          type="button"
          class="filter-chip"
          :class="{ 'is-active': projectStore.statusFilter === 'planning' }"
          @click="projectStore.setStatusFilter('planning')"
        >
          Planning
        </button>
        <button
          type="button"
          class="filter-chip"
          :class="{ 'is-active': projectStore.statusFilter === 'completed' }"
          @click="projectStore.setStatusFilter('completed')"
        >
          Completed
        </button>
      </div>
    </div>

    <!-- Projects Grid (Skeleton vs Loaded Data vs Empty) -->
    <ProjectGridSkeleton v-if="isInitialLoading" :count="3" />

    <div v-else-if="projectStore.filteredProjects.length > 0" class="projects-grid">
      <div
        v-for="project in projectStore.filteredProjects"
        :key="project.id"
        class="project-card"
        tabindex="0"
        role="button"
        :aria-label="`Open ${project.name} workspace`"
        @click="openProject(project.key)"
        @keydown.enter="openProject(project.key)"
        @keydown.space.prevent="openProject(project.key)"
      >
        <!-- Card Top Bar (Avatar + Key + Status Badge) -->
        <div class="project-card-topbar">
          <div class="topbar-left">
            <div class="project-avatar" :style="{ backgroundColor: getAvatarBgColor(project.key) }">
              {{ project.key.slice(0, 3) }}
            </div>
            <span class="project-key mono">{{ project.key }}</span>
          </div>

          <div class="topbar-right">
            <BaseBadge :variant="project.status === 'active' ? 'success' : 'neutral'" size="sm">
              {{ project.status === 'active' ? 'Active' : 'Planning' }}
            </BaseBadge>
            <RbacActionWrapper action="delete_project">
              <template #default="{ disabled }">
                <button
                  type="button"
                  class="card-action-btn delete-proj-btn btn-close-destructive"
                  :disabled="disabled"
                  :class="{ 'btn-disabled': disabled }"
                  aria-label="Delete project"
                  @click.stop="promptDeleteProject(project)"
                >
                  <AppIcon name="trash" :size="13" />
                </button>
              </template>
            </RbacActionWrapper>
          </div>
        </div>

        <!-- Project Title & Lead -->
        <div class="project-identity-block">
          <h3 class="project-name">{{ project.name }}</h3>
          <span class="project-lead-subtext text-muted">
            Lead: <span class="lead-name">{{ project.lead?.name || 'Unassigned' }}</span>
          </span>
        </div>

        <!-- Description -->
        <p class="project-description">
          {{ project.description }}
        </p>

        <!-- Sprint Information Banner if Active -->
        <div v-if="project.activeSprint" class="sprint-info-badge">
          <span class="sprint-icon">⚡</span>
          <span class="sprint-name truncate">{{ project.activeSprint.name }}</span>
          <span class="sprint-progress-pill mono">{{ getProjectProgress(project.key) }}%</span>
        </div>
        <div v-else class="sprint-info-badge is-backlog">
          <span class="sprint-icon">📋</span>
          <span class="sprint-name">Backlog Grooming</span>
        </div>

        <!-- Card Footer Stats derived from single source of truth -->
        <div class="project-card-footer">
          <div class="project-stat" title="Total Tracked Tickets">
            <span class="stat-num mono">{{ getProjectTicketCount(project.key) }}</span>
            <span class="stat-lbl">Tickets</span>
          </div>
          <div class="project-stat" title="Project Members">
            <span class="stat-num mono">{{ project.members?.length || 0 }}</span>
            <span class="stat-lbl">Members</span>
          </div>
          <div class="project-stat" title="Workspace Progress">
            <span class="stat-num mono">{{ getProjectProgress(project.key) }}%</span>
            <span class="stat-lbl">Progress</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!isInitialLoading && !projectStore.error" class="empty-state">
      <div class="empty-icon-wrap">
        <AppIcon name="projects" :size="32" />
      </div>
      <h3 class="empty-title">No projects found</h3>
      <p class="empty-desc">
        No projects match your current search or filter criteria.
      </p>
      <BaseButton variant="outline" size="sm" @click="resetFilters">
        Reset Filters
      </BaseButton>
    </div>

    <!-- Create Project Modal -->
    <CreateProjectModal
      v-model="isCreateModalOpen"
      :isOpen="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @created="handleProjectCreated"
    />

    <!-- Delete Project Confirmation Modal -->
    <BaseConfirmModal
      v-model="isDeleteModalOpen"
      title="Delete Project Workspace"
      :message="`Are you sure you want to delete the project workspace &quot;${projectToDelete?.name}&quot;? All associated tickets, sprints, and documentation will be permanently removed.`"
      :itemName="projectToDelete ? `${projectToDelete.name} (${projectToDelete.key})` : ''"
      itemType="PROJECT"
      :confirmText="isDeleting ? 'Deleting Workspace...' : 'Delete Workspace'"
      :loading="isDeleting"
      @confirm="handleConfirmDelete"
      @cancel="isDeleteModalOpen = false"
    />
  </div>
</template>

<style scoped>
.page-container {
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

/* Toast */
.feedback-toast {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background-color: var(--glass-bg-elevated);
  backdrop-filter: var(--glass-blur-lg);
  -webkit-backdrop-filter: var(--glass-blur-lg);
  border: 1px solid rgba(16, 185, 129, 0.4);
  border-radius: var(--radius-lg);
  box-shadow: var(--glass-shadow-modal), 0 0 16px rgba(16, 185, 129, 0.15);
}

.toast-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.toast-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background-color: rgba(16, 185, 129, 0.15);
  color: var(--color-success-500);
}

.toast-text {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.toast-close {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
}

/* Toolbar */
.projects-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.search-box-wrapper {
  width: 380px;
  max-width: 100%;
}

.filter-chips {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.filter-chip {
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-chip:hover {
  background-color: var(--bg-surface-hover);
  color: var(--text-primary);
}

.filter-chip.is-active {
  background-color: var(--color-primary-500);
  border-color: var(--color-primary-500);
  color: #ffffff;
}

/* Projects Grid */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: var(--space-6);
}

.project-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.project-card:hover {
  border-color: var(--border-strong);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.project-card:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

.project-card-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.delete-proj-btn {
  opacity: 0.5;
  transition: opacity var(--transition-fast), background-color var(--transition-fast), color var(--transition-fast);
}

.project-card:hover .delete-proj-btn {
  opacity: 1;
}

.project-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  color: #ffffff;
  font-size: var(--text-xs);
  font-weight: var(--font-weight-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.project-key {
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: var(--text-muted);
  background-color: var(--bg-surface-elevated);
  padding: 2px 7px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-subtle);
}

.project-identity-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.project-name {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
  line-height: 1.3;
  word-break: break-word;
}

.project-lead-subtext {
  font-size: var(--text-xs);
}

.lead-name {
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.project-description {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.6;
  min-height: 38px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Sprint banner */
.sprint-info-badge {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background-color: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
}

.sprint-info-badge.is-backlog {
  background-color: var(--bg-surface-elevated);
  border-color: var(--border-subtle);
  color: var(--text-muted);
}

.sprint-name {
  flex: 1;
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.sprint-progress-pill {
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  color: var(--color-primary-400);
}

/* Footer */
.project-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-subtle);
  margin-top: auto;
}

.project-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.stat-num {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.stat-lbl {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
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
