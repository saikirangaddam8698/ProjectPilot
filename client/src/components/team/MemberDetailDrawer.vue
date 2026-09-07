<script setup>
import { computed } from 'vue';
import { useTicketStore } from '@/stores/ticket.store';
import BaseModal from '@/components/ui/BaseModal.vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
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
    default: '' // empty means global workspace view
  }
});

const emit = defineEmits(['update:modelValue', 'close', 'remove']);

const ticketStore = useTicketStore();

// Live assigned tickets for this member
const assignedTickets = computed(() => {
  if (!props.member) return [];
  let list = ticketStore.allTickets.filter(
    (t) => t.assignee?.id === props.member.id || t.assignee?.name === props.member.name
  );

  if (props.projectKey) {
    list = list.filter((t) => t.projectKey.toUpperCase() === props.projectKey.toUpperCase());
  }

  return list;
});

const openTickets = computed(() => {
  return assignedTickets.value.filter((t) => t.status !== 'Done');
});

const doneTickets = computed(() => {
  return assignedTickets.value.filter((t) => t.status === 'Done');
});

const assignedPoints = computed(() => {
  return openTickets.value.reduce((sum, t) => sum + (Number(t.storyPoints) || 0), 0);
});

const completedPoints = computed(() => {
  return doneTickets.value.reduce((sum, t) => sum + (Number(t.storyPoints) || 0), 0);
});

// Capacity & Utilization
const capacity = computed(() => {
  return props.member?.capacity || 20;
});

const utilizationPct = computed(() => {
  if (capacity.value === 0) return 0;
  return Math.round((assignedPoints.value / capacity.value) * 100);
});

const capacityState = computed(() => {
  if (utilizationPct.value > 100) return { label: 'Over Capacity', variant: 'danger' };
  if (utilizationPct.value >= 70) return { label: 'Near Capacity', variant: 'warning' };
  return { label: 'Available Capacity', variant: 'success' };
});

function getRoleBadgeVariant(role) {
  if (!role) return 'neutral';
  if (role.includes('Admin') || role.includes('Lead')) return 'purple';
  if (role.includes('Developer')) return 'primary';
  if (role.includes('DevOps')) return 'info';
  if (role.includes('QA')) return 'warning';
  return 'neutral';
}

function getStatusBadgeVariant(status) {
  if (status === 'Active') return 'success';
  if (status === 'Away') return 'warning';
  return 'neutral';
}

function openTicket(key) {
  ticketStore.openTicketDetail(key);
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
    size="lg"
  >
    <template #header>
      <div v-if="member" class="profile-modal-header">
        <div class="avatar-large-wrap">
          <div class="avatar-large" :class="{ 'is-admin': (member.role || '').includes('Admin') }">
            {{ member.avatar }}
          </div>
          <span class="status-indicator-dot" :class="`status-${(member.status || 'Active').toLowerCase()}`"></span>
        </div>

        <div class="member-header-meta">
          <div class="name-badge-row">
            <h3 class="member-full-name">{{ member.name }}</h3>
            <BaseBadge :variant="getRoleBadgeVariant(member.role)" size="sm">
              {{ member.role }}
            </BaseBadge>
            <BaseBadge :variant="getStatusBadgeVariant(member.status)" size="sm" dot>
              {{ member.status || 'Active' }}
            </BaseBadge>
          </div>

          <div class="member-submeta-row">
            <span class="member-email text-muted">{{ member.email }}</span>
            <span class="meta-dot text-muted">•</span>
            <span class="member-dept text-muted">{{ member.department || 'Core Engineering' }}</span>
          </div>
        </div>
      </div>
    </template>

    <div v-if="member" class="modal-profile-body">
      <!-- Capacity & Workload Meter -->
      <div class="capacity-section">
        <div class="capacity-header">
          <div class="capacity-title-wrap">
            <AppIcon name="analytics" :size="15" />
            <span class="capacity-title">Capacity Utilization</span>
          </div>
          <BaseBadge :variant="capacityState.variant" size="sm">
            {{ capacityState.label }} ({{ utilizationPct }}%)
          </BaseBadge>
        </div>

        <div class="capacity-bar-track">
          <div
            class="capacity-bar-fill"
            :class="`fill-${capacityState.variant}`"
            :style="{ width: `${Math.min(100, utilizationPct)}%` }"
          ></div>
        </div>

        <div class="capacity-stats-row">
          <span>
            <strong>{{ assignedPoints }}</strong> in-flight pts / <strong>{{ capacity }}</strong> pt target capacity
          </span>
          <span class="text-muted">
            {{ completedPoints }} pts delivered
          </span>
        </div>
      </div>

      <!-- Skills & Workspaces 2-Column Row -->
      <div class="info-columns-row">
        <!-- Skills Section -->
        <div v-if="member.skills && member.skills.length > 0" class="section-group flex-1">
          <h4 class="section-label">Technical Skills & Expertise</h4>
          <div class="skills-tags-wrap">
            <span v-for="skill in member.skills" :key="skill" class="skill-tag">
              {{ skill }}
            </span>
          </div>
        </div>

        <!-- Assigned Projects -->
        <div v-if="member.projectKeys && member.projectKeys.length > 0" class="section-group flex-1">
          <h4 class="section-label">Assigned Workspaces</h4>
          <div class="projects-tags-wrap">
            <span v-for="pkey in member.projectKeys" :key="pkey" class="project-tag mono">
              <AppIcon name="projects" :size="12" />
              {{ pkey }}
            </span>
          </div>
        </div>
      </div>

      <!-- Assigned Tickets Section -->
      <div class="section-group">
        <div class="section-header-row">
          <h4 class="section-label">
            Assigned Work ({{ assignedTickets.length }} tickets)
          </h4>
          <span class="text-xs text-muted">
            {{ openTickets.length }} open • {{ doneTickets.length }} completed
          </span>
        </div>

        <div v-if="assignedTickets.length === 0" class="empty-tickets-box text-muted">
          <AppIcon name="tickets" :size="20" />
          <span>No tickets currently assigned to {{ member.name }}.</span>
        </div>

        <div v-else class="assigned-tickets-grid">
          <div
            v-for="ticket in assignedTickets"
            :key="ticket.key"
            class="assigned-ticket-item"
            @click="openTicket(ticket.key)"
          >
            <div class="ticket-top-row">
              <span class="ticket-key mono">{{ ticket.key }}</span>
              <BaseBadge
                :variant="ticket.status === 'Done' ? 'success' : ticket.status === 'In Progress' ? 'info' : 'neutral'"
                size="xs"
              >
                {{ ticket.status }}
              </BaseBadge>
            </div>

            <span class="ticket-title-text truncate">{{ ticket.title }}</span>

            <div class="ticket-bottom-row">
              <span class="ticket-sprint text-muted truncate">
                {{ ticket.sprint || 'Product Backlog' }}
              </span>
              <span class="ticket-pts mono">
                {{ ticket.storyPoints || 0 }} pts
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer-actions">
        <BaseButton
          v-if="projectKey"
          variant="outline"
          size="sm"
          class="btn-remove-member"
          @click="$emit('remove', member)"
        >
          Remove from {{ projectKey }}
        </BaseButton>
        <div v-else></div>
        <BaseButton variant="primary" size="sm" @click="handleClose">
          Done
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.profile-modal-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  width: 100%;
}

.avatar-large-wrap {
  position: relative;
  flex-shrink: 0;
}

.avatar-large {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-primary-600);
  color: #FFFFFF;
  font-size: var(--text-md);
  font-weight: var(--font-weight-bold);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-large.is-admin {
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
}

.status-indicator-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 2px solid var(--bg-surface-elevated);
}

.status-indicator-dot.status-active { background-color: var(--color-success-500); }
.status-indicator-dot.status-away { background-color: var(--color-warning-500); }
.status-indicator-dot.status-offline { background-color: var(--text-muted); }

.member-header-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow: hidden;
  flex: 1;
}

.name-badge-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.member-full-name {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
}

.member-submeta-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
}

.meta-dot {
  opacity: 0.6;
}

.modal-profile-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

/* Capacity Section */
.capacity-section {
  padding: var(--space-4);
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.capacity-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.capacity-title-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.capacity-bar-track {
  height: 8px;
  background-color: var(--bg-surface-elevated);
  border-radius: var(--radius-full);
  overflow: hidden;
  border: 1px solid var(--border-subtle);
}

.capacity-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--transition-base);
}

.capacity-bar-fill.fill-success { background-color: var(--color-success-500); }
.capacity-bar-fill.fill-warning { background-color: var(--color-warning-500); }
.capacity-bar-fill.fill-danger { background-color: var(--color-danger-500); }

.capacity-stats-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

/* 2-Column Info Row */
.info-columns-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-4);
}

/* Section Groups */
.section-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.section-label {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0;
}

.section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.skills-tags-wrap,
.projects-tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.skill-tag {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  color: var(--text-primary);
}

.project-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  color: var(--color-primary-400);
}

/* Assigned Tickets Grid */
.assigned-tickets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-3);
  max-height: 280px;
  overflow-y: auto;
  padding-right: 2px;
}

.assigned-ticket-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--space-3);
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.assigned-ticket-item:hover {
  border-color: var(--border-strong);
  background-color: var(--bg-surface-hover);
  transform: translateY(-1px);
}

.ticket-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ticket-key {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary-400);
}

.ticket-title-text {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.ticket-bottom-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
}

.ticket-pts {
  font-weight: var(--font-weight-semibold);
  color: var(--text-muted);
}

.empty-tickets-box {
  padding: var(--space-6);
  background-color: var(--bg-surface);
  border: 1px dashed var(--border-default);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  text-align: center;
  font-size: var(--text-xs);
}

.modal-footer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.btn-remove-member {
  color: var(--color-danger-500);
  border-color: var(--color-danger-300);
}

.btn-remove-member:hover {
  background-color: var(--badge-danger-bg);
}
</style>
