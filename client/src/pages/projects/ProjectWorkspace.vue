<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectStore } from '@/stores/project.store';
import { useTicketStore } from '@/stores/ticket.store';
import { useSprintStore } from '@/stores/sprint.store';
import { useAuthStore } from '@/stores/auth.store';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import BaseConfirmModal from '@/components/ui/BaseConfirmModal.vue';
import RbacActionWrapper from '@/components/ui/RbacActionWrapper.vue';
import ProjectNotFound from './ProjectNotFound.vue';

const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();
const ticketStore = useTicketStore();
const sprintStore = useSprintStore();
const authStore = useAuthStore();

const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);

async function handleConfirmDelete() {
  if (!project.value) return;
  isDeleting.value = true;
  try {
    const success = await projectStore.deleteProject(project.value.key);
    if (success) {
      router.push('/projects');
    }
  } catch (err) {
    console.error('Failed to delete project:', err);
  } finally {
    isDeleting.value = false;
    isDeleteModalOpen.value = false;
  }
}

const projectKey = computed(() => route.params.projectKey);
const project = computed(() => projectStore.getProjectByKey(projectKey.value));

watch(projectKey, (newKey) => {
  if (newKey) {
    projectStore.setActiveProjectKey(newKey);
  }
}, { immediate: true });

onMounted(() => {
  if (projectKey.value) {
    projectStore.setActiveProjectKey(projectKey.value);
  }
});

const PROJECT_TABS = [
  { id: 'overview', name: 'Overview', icon: 'dashboard', pathSuffix: 'overview' },
  { id: 'board', name: 'Board', icon: 'tickets', pathSuffix: 'board' },
  { id: 'backlog', name: 'Backlog', icon: 'my-work', pathSuffix: 'backlog' },
  { id: 'tickets', name: 'Tickets', icon: 'tickets', pathSuffix: 'tickets' },
  { id: 'sprints', name: 'Sprints', icon: 'sprints', pathSuffix: 'sprints' },
  { id: 'analytics', name: 'Analytics', icon: 'analytics', pathSuffix: 'analytics' },
  { id: 'knowledge', name: 'Knowledge', icon: 'knowledge', pathSuffix: 'knowledge' },
  { id: 'activity', name: 'Activity', icon: 'my-work', pathSuffix: 'activity' },
  { id: 'settings', name: 'Settings', icon: 'settings', pathSuffix: 'settings' }
];

const visibleTabs = computed(() => {
  return PROJECT_TABS.filter((tab) => {
    // Only admins or project managers can access project settings
    if (tab.id === 'settings') {
      return authStore.isAdmin || authStore.isProjectManager;
    }
    // Only admins or project managers can access project knowledge base
    if (tab.id === 'knowledge') {
      return authStore.isAdmin || authStore.isProjectManager;
    }
    return true;
  });
});

function isTabActive(tabSuffix) {
  const currentPath = route.path;
  return currentPath.endsWith(`/${tabSuffix}`) || (tabSuffix === 'overview' && currentPath === `/projects/${projectKey.value}`);
}

function getAvatarBgColor(key) {
  if (key === 'PILOT') return '#4F46E5';
  if (key === 'INFRA') return '#0284C7';
  if (key === 'MOBILE') return '#8B5CF6';
  return '#10B981';
}
</script>

<template>
  <div class="project-workspace-page">
    <div v-if="!project">
      <ProjectNotFound />
    </div>

    <div v-else class="workspace-container">
      <!-- Breadcrumb & Workspace Header -->
      <div class="workspace-header-card">
        <div class="header-nav-top">
          <router-link to="/projects" class="back-link">
            <AppIcon name="chevron-left" :size="14" />
            <span>All Projects</span>
          </router-link>
        </div>

        <div class="project-identity-row">
          <div class="identity-left">
            <div class="project-icon-badge" :style="{ backgroundColor: getAvatarBgColor(project.key) }">
              {{ project.key.slice(0, 3) }}
            </div>

            <div class="identity-text">
              <div class="name-badge-row">
                <h2 class="project-title">{{ project.name }}</h2>
                <span class="project-key-tag mono">{{ project.key }}</span>
                <BaseBadge :variant="project.status === 'active' ? 'success' : 'neutral'" size="sm">
                  {{ project.status === 'active' ? 'Active Sprint' : 'Planning' }}
                </BaseBadge>
              </div>
              <p class="project-desc">{{ project.description }}</p>
            </div>
          </div>

          <div class="identity-right">
            <!-- Project Lead -->
            <div class="meta-pill" title="Project Lead">
              <div class="meta-avatar">{{ project.lead.avatar }}</div>
              <div class="meta-info">
                <span class="meta-name">{{ project.lead.name }}</span>
                <span class="meta-label text-muted">Project Lead</span>
              </div>
            </div>

            <!-- Member Stack -->
            <div class="member-avatar-stack" :title="`${project.members.length} active project members`">
              <div
                v-for="(member, idx) in project.members.slice(0, 4)"
                :key="member.id"
                class="stacked-avatar"
                :style="{ zIndex: 10 - idx }"
              >
                {{ member.avatar }}
              </div>
              <div v-if="project.members.length > 4" class="stacked-avatar overflow-count">
                +{{ project.members.length - 4 }}
              </div>
            </div>

            <!-- Delete Workspace Option for Admin -->
            <RbacActionWrapper action="delete_project">
              <template #default="{ disabled }">
                <button
                  type="button"
                  class="workspace-delete-btn btn-close-destructive"
                  :disabled="disabled"
                  :class="{ 'btn-disabled': disabled }"
                  aria-label="Delete project workspace"
                  @click="isDeleteModalOpen = true"
                >
                  <AppIcon name="trash" :size="14" />
                </button>
              </template>
            </RbacActionWrapper>
          </div>
        </div>

        <!-- Tab Navigation Bar -->
        <nav class="project-tabs-nav" aria-label="Project Sections">
          <router-link
            v-for="tab in visibleTabs"
            :key="tab.id"
            :to="`/projects/${project.key}/${tab.pathSuffix}`"
            class="tab-link"
            :class="{ 'is-active': isTabActive(tab.pathSuffix) }"
          >
            <AppIcon :name="tab.icon" :size="15" />
            <span>{{ tab.name }}</span>
            <span v-if="tab.id === 'tickets'" class="tab-count-badge">
              {{ ticketStore.getTicketsByProject(project.key).length }}
            </span>
            <span v-else-if="tab.id === 'backlog'" class="tab-count-badge">
              {{ ticketStore.getBacklogTickets(project.key).length }}
            </span>
            <span v-else-if="tab.id === 'sprints'" class="tab-count-badge">
              {{ sprintStore.getSprintsByProject(project.key).length }}
            </span>
          </router-link>
        </nav>
      </div>

      <!-- Nested Project Route View -->
      <div class="workspace-body">
        <router-view :project="project" />
      </div>
    </div>

    <!-- Delete Project Workspace Confirmation Modal -->
    <BaseConfirmModal
      v-model="isDeleteModalOpen"
      title="Delete Project Workspace"
      :message="`Are you sure you want to delete the project workspace &quot;${project?.name}&quot;? All associated tickets, sprints, and documentation will be permanently removed.`"
      :itemName="project ? `${project.name} (${project.key})` : ''"
      itemType="PROJECT"
      :confirmText="isDeleting ? 'Deleting Workspace...' : 'Delete Workspace'"
      :loading="isDeleting"
      @confirm="handleConfirmDelete"
      @cancel="isDeleteModalOpen = false"
    />
  </div>
</template>

<style scoped>
.workspace-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
  min-width: 0;
}

.workspace-header-card {
  background-color: var(--glass-bg-elevated);
  backdrop-filter: var(--glass-blur-lg);
  -webkit-backdrop-filter: var(--glass-blur-lg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.header-nav-top {
  padding: var(--space-3) var(--space-5) 0 var(--space-5);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-weight: var(--font-weight-medium);
  transition: color var(--transition-fast);
}

.back-link:hover {
  color: var(--color-primary-400);
}

.project-identity-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  gap: var(--space-4);
  flex-wrap: wrap;
}

.identity-left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex: 1;
  min-width: 280px;
}

.project-icon-badge {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  color: #FFFFFF;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.identity-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.name-badge-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.project-title {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.project-key-tag {
  font-size: 11px;
  padding: 1px 6px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xs);
  color: var(--text-muted);
}

.project-desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-normal);
}

.identity-right {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.meta-pill {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 4px var(--space-3);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
}

.meta-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background-color: var(--color-primary-600);
  color: #FFFFFF;
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  justify-content: center;
}

.meta-info {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.meta-name {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.meta-label {
  font-size: 10px;
}

.member-avatar-stack {
  display: flex;
  align-items: center;
}

.stacked-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: var(--bg-surface-active);
  border: 2px solid var(--bg-surface);
  color: var(--text-primary);
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: -8px;
}

.stacked-avatar:first-child {
  margin-left: 0;
}

.stacked-avatar.overflow-count {
  background-color: var(--badge-neutral-bg);
  color: var(--text-secondary);
  font-size: 10px;
}

.workspace-delete-btn {
  margin-left: var(--space-2);
}

/* Tabs Navigation - Liquid Glass Capsule Slider */
.project-tabs-nav {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px var(--space-5);
  border-top: 1px solid var(--glass-border-subtle);
  background-color: var(--glass-bg-subtle);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  overflow-x: auto;
}

.tab-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 7px 15px;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  border-radius: 8px;
  border: 1px solid transparent;
  white-space: nowrap;
  transition: all var(--motion-fast, 140ms cubic-bezier(0.16, 1, 0.3, 1));
}

.tab-link:hover {
  color: var(--text-primary);
  background-color: var(--bg-surface-hover);
  border-color: var(--glass-border-subtle);
}

.tab-link.is-active {
  background: var(--glass-active-bg);
  color: var(--text-primary);
  font-weight: 600;
  border-color: var(--glass-border-active);
  box-shadow: var(--glass-active-glow), inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.tab-count-badge {
  font-family: var(--font-mono);
  font-size: 10.5px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  padding: 2px 7.5px;
  min-width: 20px;
  line-height: 1.2;
  border-radius: var(--radius-full);
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.tab-link.is-active .tab-count-badge {
  background-color: rgba(99, 102, 241, 0.22);
  border-color: rgba(99, 102, 241, 0.45);
  color: var(--color-primary-400);
}

.workspace-body {
  margin-top: var(--space-2);
  width: 100%;
  min-width: 0;
}

@media (max-width: 768px) {
  .identity-right {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
