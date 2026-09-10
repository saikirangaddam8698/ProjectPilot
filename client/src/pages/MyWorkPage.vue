<script setup>
import { computed } from 'vue';
import { useTicketStore } from '@/stores/ticket.store';
import { useAuthStore } from '@/stores/auth.store';
import { useProjectStore } from '@/stores/project.store';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import TicketDetailDrawer from '@/components/tickets/TicketDetailDrawer.vue';
import CreateTicketModal from '@/components/tickets/CreateTicketModal.vue';

const authStore = useAuthStore();
const ticketStore = useTicketStore();
const projectStore = useProjectStore();

const defaultProjectKey = computed(() => {
  return projectStore.activeProject?.key || projectStore.allProjects[0]?.key || 'PILOT';
});

// Filter tickets assigned to current authenticated user
const myTickets = computed(() => {
  const currentUserName = authStore.user?.name?.toLowerCase();
  const currentUserId = authStore.user?.id;
  const currentMemberId = authStore.user?.memberId;
  const currentUserEmail = authStore.user?.email?.toLowerCase();

  return ticketStore.allTickets.filter((t) => {
    if (!t.assignee) return false;
    const aName = t.assignee.name?.toLowerCase();
    const aId = t.assignee.id;
    const aEmail = t.assignee.email?.toLowerCase();

    if (currentUserId && (aId === currentUserId || aId === currentMemberId)) return true;
    if (currentUserName && aName === currentUserName) return true;
    if (currentUserEmail && aEmail === currentUserEmail) return true;

    // Fallback if demo default Alex Morgan
    return aName === 'alex morgan' || aId === 'm-1';
  });
});

const inReviewCount = computed(() => {
  return myTickets.value.filter((t) => t.status === 'In Review').length;
});

const inProgressCount = computed(() => {
  return myTickets.value.filter((t) => t.status === 'In Progress').length;
});

function openTicket(key) {
  ticketStore.openTicketDetail(key);
}

function getTypeBadgeVariant(type) {
  if (type === 'Bug') return 'danger';
  if (type === 'Story') return 'primary';
  if (type === 'Epic') return 'purple';
  return 'neutral';
}

function getStatusBadgeVariant(status) {
  if (status === 'Done') return 'success';
  if (status === 'In Review') return 'warning';
  if (status === 'In Progress') return 'info';
  return 'neutral';
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">My Work</h2>
        <p class="page-subtitle">Assigned development tasks, active code reviews, and priority items.</p>
      </div>

      <div class="page-header-actions">
        <div class="header-filters">
          <BaseBadge variant="primary" size="md">{{ myTickets.length }} Assigned</BaseBadge>
          <BaseBadge v-if="inReviewCount > 0" variant="warning" size="md">{{ inReviewCount }} In Review</BaseBadge>
        </div>
        <BaseButton variant="primary" size="sm" @click="ticketStore.openCreateModal(defaultProjectKey)">
          <template #prefix><AppIcon name="plus" :size="14" /></template>
          Create Ticket
        </BaseButton>
      </div>
    </div>

    <!-- Assigned Work Table -->
    <div class="work-section">
      <div class="section-header">
        <h3 class="section-title">Assigned to Me ({{ myTickets.length }})</h3>
        <span class="text-muted text-xs">Click any ticket to view details or change status</span>
      </div>

      <div v-if="myTickets.length > 0" class="work-list">
        <div
          v-for="ticket in myTickets"
          :key="ticket.key"
          class="work-item"
          @click="openTicket(ticket.key)"
        >
          <BaseBadge :variant="getTypeBadgeVariant(ticket.type)" size="sm">
            {{ ticket.type }}
          </BaseBadge>
          <span class="work-key mono">{{ ticket.key }}</span>
          <span class="work-title truncate font-medium">{{ ticket.title }}</span>
          <BaseBadge :variant="getStatusBadgeVariant(ticket.status)" size="sm" dot>
            {{ ticket.status }}
          </BaseBadge>
          <span class="work-points mono text-muted">{{ ticket.storyPoints }} pts</span>
          <span class="work-sprint text-muted truncate">{{ ticket.sprint || 'Backlog' }}</span>
        </div>
      </div>

      <div v-else class="empty-work-state text-muted">
        No tickets currently assigned to your account.
      </div>
    </div>

    <!-- Ticket Detail Drawer & Create Modal -->
    <TicketDetailDrawer />
    <CreateTicketModal
      :modelValue="ticketStore.isCreateModalOpen"
      :projectKey="defaultProjectKey"
    />
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

.page-header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.header-filters {
  display: flex;
  gap: var(--space-2);
}

.work-section {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border-subtle);
}

.section-title {
  font-size: var(--text-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.work-list {
  display: flex;
  flex-direction: column;
}

.work-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  border-bottom: 1px solid var(--border-subtle);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.work-item:last-child {
  border-bottom: none;
}

.work-item:hover {
  background-color: var(--bg-surface-hover);
}

.work-key {
  font-size: var(--text-xs);
  color: var(--text-muted);
  width: 75px;
  flex-shrink: 0;
}

.work-title {
  flex: 1;
  color: var(--text-primary);
}

.work-points {
  font-size: var(--text-xs);
}

.work-sprint {
  font-size: var(--text-xs);
  max-width: 140px;
}

.empty-work-state {
  text-align: center;
  padding: var(--space-8);
  font-size: var(--text-sm);
}
</style>
