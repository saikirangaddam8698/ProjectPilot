<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '@/stores/project.store';
import { useTicketStore } from '@/stores/ticket.store';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import BaseInput from '@/components/ui/BaseInput.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import CreateProjectModal from '@/components/projects/CreateProjectModal.vue';

const router = useRouter();
const projectStore = useProjectStore();
const ticketStore = useTicketStore();

const isCreateModalOpen = ref(false);
const toastMessage = ref('');

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
      <BaseButton variant="primary" size="sm" @click="isCreateModalOpen = true">
        <template #prefix><AppIcon name="plus" :size="14" /></template>
        Create Project
      </BaseButton>
    </div>

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

    <!-- Projects Grid -->
    <div v-if="projectStore.filteredProjects.length > 0" class="projects-grid">
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
        <!-- Card Header -->
        <div class="project-card-header">
          <div class="project-avatar" :style="{ backgroundColor: getAvatarBgColor(project.key) }">
            {{ project.key.slice(0, 3) }}
          </div>

          <div class="project-title-group">
            <div class="title-key-row">
              <h3 class="project-name">{{ project.name }}</h3>
              <span class="project-key mono">{{ project.key }}</span>
            </div>
            <span class="project-lead-subtext text-muted">
              Lead: {{ project.lead.name }}
            </span>
          </div>

          <BaseBadge :variant="project.status === 'active' ? 'success' : 'neutral'" size="sm">
            {{ project.status === 'active' ? 'Active' : 'Planning' }}
          </BaseBadge>
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
            <span class="stat-num mono">{{ project.members.length }}</span>
            <span class="stat-lbl">Members</span>
          </div>
          <div class="project-stat" title="Workspace Progress">
            <span class="stat-num mono">{{ getProjectProgress(project.key) }}%</span>
            <span class="stat-lbl">Progress</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State when filter or search returns 0 results -->
    <div v-else class="empty-projects-card">
      <div class="empty-icon-wrap">
        <AppIcon name="search" :size="24" />
      </div>
      <h3 class="empty-title">No projects match your filter</h3>
      <p class="empty-desc text-secondary">
        We couldn't find any projects matching "<strong>{{ projectStore.searchQuery }}</strong>".
      </p>
      <div class="empty-actions">
        <BaseButton variant="secondary" size="sm" @click="resetFilters">
          Reset Search & Filters
        </BaseButton>
        <BaseButton variant="primary" size="sm" @click="isCreateModalOpen = true">
          <template #prefix><AppIcon name="plus" :size="14" /></template>
          Create Project
        </BaseButton>
      </div>
    </div>

    <!-- Create Project Modal -->
    <CreateProjectModal
      :modelValue="isCreateModalOpen"
      @update:modelValue="isCreateModalOpen = $event"
      @created="handleProjectCreated"
    />
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  width: 100%;
  min-width: 0;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
  width: 100%;
  min-width: 0;
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

/* Toast */
.feedback-toast {
  position: fixed;
  top: calc(var(--header-height) + 20px);
  right: 28px;
  z-index: var(--z-toast);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-lg);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.2), 0 4px 12px -2px rgba(0, 0, 0, 0.12);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  min-width: 280px;
  max-width: 480px;
  pointer-events: auto;
}

.toast-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--text-primary);
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

.toast-close {
  color: var(--text-muted);
  font-size: var(--text-sm);
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-fast);
}

.toast-close:hover {
  color: var(--text-primary);
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

/* Toolbar */
.projects-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.search-box-wrapper {
  max-width: 380px;
  width: 100%;
}

.filter-chips {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 2px;
}

.filter-chip {
  padding: 4px var(--space-3);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.filter-chip:hover {
  color: var(--text-primary);
}

.filter-chip.is-active {
  background-color: var(--bg-surface-elevated);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

/* Grid */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-5);
  width: 100%;
  min-width: 0;
}

.project-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  cursor: pointer;
  outline: none;
  min-width: 0;
  box-sizing: border-box;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
}

.project-card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.project-card:focus-visible {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 2px var(--border-focus);
}

.project-card-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

.project-avatar {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  color: #FFFFFF;
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.project-title-group {
  flex: 1;
  min-width: 0;
}

.title-key-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.project-name {
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.project-key {
  font-size: 11px;
  padding: 1px 5px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xs);
  color: var(--text-muted);
}

.project-lead-subtext {
  font-size: 11px;
  display: block;
  margin-top: 2px;
}

.project-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-normal);
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sprint-info-badge {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  font-size: var(--text-xs);
}

.sprint-icon {
  font-size: 13px;
}

.sprint-name {
  flex: 1;
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.sprint-progress-pill {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: var(--radius-xs);
  background-color: var(--badge-primary-bg);
  color: var(--badge-primary-text);
  border: 1px solid var(--badge-primary-border);
}

.sprint-info-badge.is-backlog .sprint-name {
  color: var(--text-muted);
}

.project-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-subtle);
}

.project-stat {
  display: flex;
  flex-direction: column;
}

.stat-num {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.stat-lbl {
  font-size: 10px;
  color: var(--text-muted);
}

/* Empty State */
.empty-projects-card {
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

.empty-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 50%;
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
}

.empty-desc {
  font-size: var(--text-sm);
  max-width: 420px;
}

.empty-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
