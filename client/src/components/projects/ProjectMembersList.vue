<script setup>
import { ref } from 'vue';
import { useTicketStore } from '@/stores/ticket.store';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AddMemberModal from './AddMemberModal.vue';
import MemberDetailDrawer from '@/components/team/MemberDetailDrawer.vue';
import RemoveMemberModal from '@/components/team/RemoveMemberModal.vue';
import TicketDetailDrawer from '@/components/tickets/TicketDetailDrawer.vue';

const props = defineProps({
  project: {
    type: Object,
    required: true
  },
  showAddButton: {
    type: Boolean,
    default: true
  }
});

const ticketStore = useTicketStore();

const isAddModalOpen = ref(false);
const isRemoveModalOpen = ref(false);
const isDetailDrawerOpen = ref(false);
const selectedMember = ref(null);
const toastMessage = ref('');

function getMemberOpenTickets(memberId, memberName) {
  return ticketStore.allTickets.filter(
    (t) =>
      t.projectKey.toUpperCase() === props.project.key.toUpperCase() &&
      (t.assignee?.id === memberId || t.assignee?.name === memberName) &&
      t.status !== 'Done'
  );
}

function getMemberUtilization(member) {
  const openList = getMemberOpenTickets(member.id, member.name);
  const pts = openList.reduce((sum, t) => sum + (Number(t.storyPoints) || 0), 0);
  const cap = member.capacity || 20;
  return cap > 0 ? Math.round((pts / cap) * 100) : 0;
}

function handleMemberAdded(member) {
  toastMessage.value = `Added ${member.name} as ${member.role}`;
  setTimeout(() => {
    toastMessage.value = '';
  }, 3500);
}

function openMemberDetail(member) {
  selectedMember.value = member;
  isDetailDrawerOpen.value = true;
}

function openRemoveModal(member) {
  selectedMember.value = member;
  isDetailDrawerOpen.value = false;
  isRemoveModalOpen.value = true;
}

function handleMemberRemoved({ member, reassignedCount }) {
  toastMessage.value = reassignedCount > 0
    ? `Removed ${member.name} (${reassignedCount} open tickets reassigned)`
    : `Removed ${member.name} from project`;
  setTimeout(() => {
    toastMessage.value = '';
  }, 3500);
}

function getRoleBadgeVariant(role) {
  if (!role) return 'neutral';
  if (role.includes('Admin') || role.includes('Lead')) return 'purple';
  if (role.includes('Developer')) return 'primary';
  if (role.includes('DevOps')) return 'info';
  if (role.includes('QA')) return 'warning';
  return 'neutral';
}
</script>

<template>
  <div class="members-component">
    <div class="members-header">
      <div class="header-left">
        <h4 class="members-title">Team Members ({{ project.members.length }})</h4>
        <span class="text-muted members-subtext">Assigned developers, reviewers, and project leads</span>
      </div>

      <BaseButton
        v-if="showAddButton"
        variant="outline"
        size="xs"
        @click="isAddModalOpen = true"
      >
        <template #prefix><AppIcon name="plus" :size="12" /></template>
        Add Member
      </BaseButton>
    </div>

    <!-- Fixed Overlay Toast -->
    <Transition name="toast">
      <div v-if="toastMessage" class="member-toast-overlay">
        <div class="toast-check-badge">✓</div>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    <div class="members-grid">
      <div
        v-for="member in project.members"
        :key="member.id"
        class="member-card"
        @click="openMemberDetail(member)"
      >
        <div class="member-avatar" :class="{ 'is-admin': (member.role || '').includes('Admin') }">
          {{ member.avatar }}
        </div>

        <div class="member-meta">
          <div class="member-name-row">
            <span class="member-name">{{ member.name }}</span>
            <BaseBadge :variant="getRoleBadgeVariant(member.role)" size="xs">
              {{ member.role }}
            </BaseBadge>
          </div>
          <span class="member-email text-muted truncate">{{ member.email }}</span>
        </div>

        <div class="member-stats">
          <div class="stat-pill" title="Assigned in-flight tickets in this project">
            <span class="stat-icon">🏷️</span>
            <span class="stat-text mono">{{ getMemberOpenTickets(member.id, member.name).length }} open</span>
          </div>

          <div class="workload-bar-wrap" :title="`Capacity Utilization: ${getMemberUtilization(member)}%`">
            <div class="workload-track">
              <div
                class="workload-fill"
                :class="{
                  'fill-danger': getMemberUtilization(member) > 100,
                  'fill-warning': getMemberUtilization(member) >= 70 && getMemberUtilization(member) <= 100
                }"
                :style="{ width: `${Math.min(100, getMemberUtilization(member))}%` }"
              ></div>
            </div>
            <span class="workload-label">{{ getMemberUtilization(member) }}%</span>
          </div>
        </div>

        <button
          type="button"
          class="btn-remove-icon"
          title="Remove from project"
          @click.stop="openRemoveModal(member)"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Add Member Modal -->
    <AddMemberModal
      :modelValue="isAddModalOpen"
      @update:modelValue="isAddModalOpen = $event"
      :projectKey="project.key"
      @added="handleMemberAdded"
    />

    <!-- Member Detail Drawer -->
    <MemberDetailDrawer
      :modelValue="isDetailDrawerOpen"
      @update:modelValue="isDetailDrawerOpen = $event"
      :member="selectedMember"
      :projectKey="project.key"
      @remove="openRemoveModal"
      @close="isDetailDrawerOpen = false"
    />

    <!-- Safe Remove Member Modal -->
    <RemoveMemberModal
      :modelValue="isRemoveModalOpen"
      @update:modelValue="isRemoveModalOpen = $event"
      :member="selectedMember"
      :projectKey="project.key"
      @removed="handleMemberRemoved"
      @close="isRemoveModalOpen = false"
    />

    <!-- Universal Ticket Detail Drawer -->
    <TicketDetailDrawer />
  </div>
</template>

<style scoped>
.members-component {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.members-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.members-title {
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.members-subtext {
  font-size: var(--text-xs);
  display: block;
}

/* Toast Overlay */
.member-toast-overlay {
  position: fixed;
  top: calc(var(--header-height) + 20px);
  right: 28px;
  z-index: var(--z-toast);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 12px 20px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.2);
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.toast-check-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: var(--badge-success-bg);
  color: var(--badge-success-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-3);
}

.member-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  position: relative;
  transition: all var(--transition-fast);
}

.member-card:hover {
  border-color: var(--border-default);
  transform: translateY(-1px);
}

.member-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background-color: var(--color-primary-600);
  color: #FFFFFF;
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.member-avatar.is-admin {
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
}

.member-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.member-name-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.member-name {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.member-email {
  font-size: 11px;
}

.member-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-1);
  flex-shrink: 0;
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--text-muted);
}

.workload-bar-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}

.workload-track {
  width: 42px;
  height: 4px;
  background-color: var(--border-default);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.workload-fill {
  height: 100%;
  background-color: var(--color-primary-500);
  border-radius: var(--radius-full);
  transition: width var(--transition-fast);
}

.workload-fill.fill-warning { background-color: var(--color-warning-500); }
.workload-fill.fill-danger { background-color: var(--color-danger-500); }

.workload-label {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-muted);
}

.btn-remove-icon {
  position: absolute;
  top: 4px;
  right: 6px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 10px;
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--transition-fast), color var(--transition-fast);
  padding: 2px 4px;
}

.member-card:hover .btn-remove-icon {
  opacity: 0.6;
}

.btn-remove-icon:hover {
  opacity: 1 !important;
  color: var(--color-danger-500);
}

/* Toast Transition */
.toast-enter-active,
.toast-leave-active {
  transition: all var(--transition-fast);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
