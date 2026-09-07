<script setup>
import { ref, computed } from 'vue';
import { useProjectStore } from '@/stores/project.store';
import { useTicketStore } from '@/stores/ticket.store';
import { useAuthStore } from '@/stores/auth.store';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import BaseInput from '@/components/ui/BaseInput.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import KpiMetricCard from '@/components/analytics/KpiMetricCard.vue';
import KpiSkeleton from '@/components/skeletons/KpiSkeleton.vue';
import MemberGridSkeleton from '@/components/skeletons/MemberGridSkeleton.vue';
import ServiceUnavailableBanner from '@/components/ui/ServiceUnavailableBanner.vue';
import MemberDetailDrawer from '@/components/team/MemberDetailDrawer.vue';
import InviteMemberModal from '@/components/team/InviteMemberModal.vue';
import TicketDetailDrawer from '@/components/tickets/TicketDetailDrawer.vue';

const projectStore = useProjectStore();
const ticketStore = useTicketStore();
const authStore = useAuthStore();

const searchQuery = ref('');
const roleFilter = ref('all');
const statusFilter = ref('all');
const projectFilter = ref('all');

const selectedMember = ref(null);
const isMemberDrawerOpen = ref(false);
const isInviteModalOpen = ref(false);
const toastMessage = ref('');

function handleInviteClick() {
  if (!authStore.canManageWorkspaceMembers) {
    authStore.showAccessDenied({
      title: 'Operation Restricted',
      message: 'You are not authorized to invite new contributors. Only Workspace Admins can invite team members.',
      requiredRole: 'ADMIN',
      action: 'Invite Workspace Member'
    });
    return;
  }
  isInviteModalOpen.value = true;
}

const isInitialLoading = computed(() => {
  return projectStore.isLoading && projectStore.allWorkspaceMembers.length === 0;
});

// Aggregate all unique workspace members with live ticket data
const teamMembers = computed(() => {
  return projectStore.allWorkspaceMembers.map((member) => {
    // Tickets assigned to this member across all projects (or filtered by project)
    let assigned = ticketStore.allTickets.filter(
      (t) => t.assignee?.id === member.id || t.assignee?.name === member.name
    );

    if (projectFilter.value !== 'all') {
      assigned = assigned.filter((t) => t.projectKey.toUpperCase() === projectFilter.value.toUpperCase());
    }

    const openList = assigned.filter((t) => t.status !== 'Done');
    const doneList = assigned.filter((t) => t.status === 'Done');

    const inFlightPoints = openList.reduce((sum, t) => sum + (Number(t.storyPoints) || 0), 0);
    const completedPoints = doneList.reduce((sum, t) => sum + (Number(t.storyPoints) || 0), 0);
    const totalPoints = inFlightPoints + completedPoints;

    const capacity = member.capacity || 20;
    const utilization = capacity > 0 ? Math.round((inFlightPoints / capacity) * 100) : 0;

    let capacityStatus = 'available';
    let capacityBadgeVariant = 'success';
    let capacityLabel = 'Available';

    if (utilization > 100) {
      capacityStatus = 'over';
      capacityBadgeVariant = 'danger';
      capacityLabel = 'Over Capacity';
    } else if (utilization >= 70) {
      capacityStatus = 'near';
      capacityBadgeVariant = 'warning';
      capacityLabel = 'Near Capacity';
    }

    return {
      ...member,
      assignedCount: openList.length,
      doneCount: doneList.length,
      inFlightPoints,
      completedPoints,
      totalPoints,
      capacity,
      utilization,
      capacityStatus,
      capacityBadgeVariant,
      capacityLabel
    };
  });
});

// Filtered team members
const filteredMembers = computed(() => {
  return teamMembers.value.filter((m) => {
    const q = searchQuery.value.toLowerCase().trim();
    const matchesSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q) ||
      (m.department || '').toLowerCase().includes(q) ||
      (m.skills || []).some((s) => s.toLowerCase().includes(q));

    const matchesRole = roleFilter.value === 'all' || m.role === roleFilter.value;
    const matchesStatus = statusFilter.value === 'all' || m.status === statusFilter.value;
    const matchesProject =
      projectFilter.value === 'all' || (m.projectKeys || []).includes(projectFilter.value);

    return matchesSearch && matchesRole && matchesStatus && matchesProject;
  });
});

// Top Metrics
const totalMembersCount = computed(() => teamMembers.value.length);
const activeMembersCount = computed(
  () => teamMembers.value.filter((m) => m.status === 'Active').length
);
const overCapacityCount = computed(
  () => teamMembers.value.filter((m) => m.capacityStatus === 'over').length
);
const totalAssignedPoints = computed(() =>
  teamMembers.value.reduce((sum, m) => sum + m.inFlightPoints, 0)
);

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

function openMemberDetail(member) {
  selectedMember.value = member;
  isMemberDrawerOpen.value = true;
}

function handleMemberInvited(member) {
  toastMessage.value = `Successfully invited ${member?.name || 'new contributor'}!`;
  setTimeout(() => {
    toastMessage.value = '';
  }, 3500);
}

function resetFilters() {
  searchQuery.value = '';
  roleFilter.value = 'all';
  statusFilter.value = 'all';
  projectFilter.value = 'all';
}
</script>

<template>
  <div class="page-container">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Team Management</h2>
        <p class="page-subtitle">Manage workspace contributors, role permissions, project memberships, and capacity utilization.</p>
      </div>

      <div class="page-actions">
        <BaseButton variant="primary" size="md" @click="handleInviteClick">
          <template #prefix><AppIcon name="plus" :size="14" /></template>
          Invite Member
        </BaseButton>
      </div>
    </div>

    <!-- Service Unavailable Error Banner -->
    <ServiceUnavailableBanner
      v-if="projectStore.error && !isInitialLoading"
      :message="projectStore.error"
      @retry="projectStore.fetchProjects()"
    />

    <!-- Success Toast (Fixed Overlay) -->
    <Transition name="toast">
      <div v-if="toastMessage" class="team-toast-overlay">
        <div class="toast-icon-badge">✓</div>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    <!-- Top KPI Row (Skeleton vs Real) -->
    <KpiSkeleton v-if="isInitialLoading" :count="4" />
    <div v-else class="kpi-grid">
      <KpiMetricCard
        label="Total Members"
        :value="totalMembersCount"
        subtext="Across all engineering workspaces"
        badgeText="Directory"
        badgeVariant="primary"
        icon="team"
      />

      <KpiMetricCard
        label="Active Now"
        :value="activeMembersCount"
        :subtext="`${Math.round((activeMembersCount / Math.max(1, totalMembersCount)) * 100)}% available for assignments`"
        badgeText="Online"
        badgeVariant="success"
        icon="check"
      />

      <KpiMetricCard
        label="In-Flight Points"
        :value="`${totalAssignedPoints} pts`"
        subtext="Assigned across active sprints & backlog"
        badgeText="Workload"
        badgeVariant="neutral"
        icon="tickets"
      />

      <KpiMetricCard
        label="Capacity Alert"
        :value="overCapacityCount"
        :subtext="overCapacityCount > 0 ? 'Members exceeding point target' : 'All members within safe capacity'"
        :badgeText="overCapacityCount > 0 ? `${overCapacityCount} Overload` : 'Optimal'"
        :badgeVariant="overCapacityCount > 0 ? 'danger' : 'success'"
        icon="analytics"
      />
    </div>

    <!-- Filter Toolbar -->
    <div class="team-filter-bar">
      <div class="filter-controls-left">
        <!-- Search Input -->
        <div class="search-input-wrap">
          <BaseInput
            v-model="searchQuery"
            placeholder="Search by name, role, email, skill..."
            size="sm"
          >
            <template #prefix><AppIcon name="search" :size="14" /></template>
          </BaseInput>
        </div>

        <!-- Role Filter -->
        <select v-model="roleFilter" class="filter-select">
          <option value="all">All Roles</option>
          <option value="Project Admin">Project Admin</option>
          <option value="Senior Developer">Senior Developer</option>
          <option value="Developer">Developer</option>
          <option value="DevOps Lead">DevOps Lead</option>
          <option value="DevOps Engineer">DevOps Engineer</option>
          <option value="Frontend Engineer">Frontend Engineer</option>
          <option value="AI / ML Engineer">AI / ML Engineer</option>
          <option value="QA Lead">QA Lead</option>
          <option value="Viewer">Viewer</option>
        </select>

        <!-- Status Filter -->
        <select v-model="statusFilter" class="filter-select">
          <option value="all">All Statuses</option>
          <option value="Active">Active Only</option>
          <option value="Away">Away</option>
          <option value="Offline">Offline</option>
        </select>

        <!-- Project Filter -->
        <select v-model="projectFilter" class="filter-select">
          <option value="all">All Projects</option>
          <option
            v-for="p in projectStore.allProjects"
            :key="p.id"
            :value="p.key"
          >
            {{ p.name }} ({{ p.key }})
          </option>
        </select>

        <!-- Reset Button -->
        <button
          v-if="searchQuery || roleFilter !== 'all' || statusFilter !== 'all' || projectFilter !== 'all'"
          type="button"
          class="reset-link-btn"
          @click="resetFilters"
        >
          Reset Filters
        </button>
      </div>

      <div class="filter-controls-right">
        <span class="results-count-text text-muted">
          Showing <strong>{{ filteredMembers.length }}</strong> of {{ totalMembersCount }} members
        </span>
      </div>
    </div>

    <!-- Skeleton vs Loaded Table Card -->
    <MemberGridSkeleton v-if="isInitialLoading" :count="6" />

    <div v-else class="team-table-card">
      <div v-if="filteredMembers.length === 0" class="empty-team-state text-muted">
        <AppIcon name="team" :size="28" />
        <h4 class="empty-title">No matching team members found</h4>
        <p class="empty-subtitle">Try adjusting your search query, role filters, or workspace selections.</p>
        <BaseButton variant="outline" size="sm" @click="resetFilters">
          Clear Filters
        </BaseButton>
      </div>

      <div v-else class="members-table-wrapper">
        <table class="members-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Role</th>
              <th>Status</th>
              <th>Assigned Projects</th>
              <th>In-Flight Work</th>
              <th>Capacity Utilization</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="member in filteredMembers"
              :key="member.id"
              class="member-row"
              @click="openMemberDetail(member)"
            >
              <!-- Member Profile -->
              <td>
                <div class="member-profile-cell">
                  <div class="avatar-cell-wrap">
                    <div class="member-avatar" :class="{ 'is-admin': (member.role || '').includes('Admin') }">
                      {{ member.avatar }}
                    </div>
                    <span class="status-dot-mini" :class="`status-${(member.status || 'Active').toLowerCase()}`"></span>
                  </div>
                  <div class="member-text-meta">
                    <div class="member-name">{{ member.name }}</div>
                    <div class="member-email text-muted">{{ member.email }}</div>
                  </div>
                </div>
              </td>

              <!-- Role -->
              <td>
                <BaseBadge :variant="getRoleBadgeVariant(member.role)" size="sm">
                  {{ member.role }}
                </BaseBadge>
              </td>

              <!-- Status -->
              <td>
                <BaseBadge :variant="getStatusBadgeVariant(member.status)" size="sm" dot>
                  {{ member.status || 'Active' }}
                </BaseBadge>
              </td>

              <!-- Projects -->
              <td>
                <div class="projects-badge-list">
                  <span
                    v-for="pkey in member.projectKeys"
                    :key="pkey"
                    class="project-key-tag mono"
                  >
                    {{ pkey }}
                  </span>
                </div>
              </td>

              <!-- In-Flight Work -->
              <td>
                <div class="workload-stats-cell">
                  <span class="points-val"><strong>{{ member.inFlightPoints }}</strong> pts</span>
                  <span class="tickets-val text-muted">({{ member.assignedCount }} open)</span>
                </div>
              </td>

              <!-- Capacity Utilization -->
              <td>
                <div class="capacity-cell-wrap">
                  <div class="capacity-meta-row">
                    <span class="cap-number text-xs">{{ member.utilization }}%</span>
                    <BaseBadge :variant="member.capacityBadgeVariant" size="xs">
                      {{ member.capacityLabel }}
                    </BaseBadge>
                  </div>
                  <div class="capacity-mini-track">
                    <div
                      class="capacity-mini-fill"
                      :class="`fill-${member.capacityBadgeVariant}`"
                      :style="{ width: `${Math.min(100, member.utilization)}%` }"
                    ></div>
                  </div>
                </div>
              </td>

              <!-- Actions -->
              <td class="text-right" @click.stop>
                <BaseButton variant="outline" size="xs" @click="openMemberDetail(member)">
                  View Profile →
                </BaseButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Reusable Member Detail Drawer -->
    <MemberDetailDrawer
      :modelValue="isMemberDrawerOpen"
      @update:modelValue="isMemberDrawerOpen = $event"
      :member="selectedMember"
      @close="isMemberDrawerOpen = false"
    />

    <!-- Invite Member Modal -->
    <InviteMemberModal
      :modelValue="isInviteModalOpen"
      @update:modelValue="isInviteModalOpen = $event"
      @invited="handleMemberInvited"
      @close="isInviteModalOpen = false"
    />

    <!-- Universal Ticket Detail Drawer -->
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
  gap: var(--space-2);
}

/* Toast Overlay */
.team-toast-overlay {
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

.toast-icon-badge {
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

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
}

/* Filter Bar */
.team-filter-bar {
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

.filter-controls-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
  flex: 1;
}

.search-input-wrap {
  width: 260px;
}

.filter-select {
  height: 32px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  padding: 0 var(--space-3);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  outline: none;
  cursor: pointer;
  transition: border-color var(--transition-fast);
}

.filter-select:focus {
  border-color: var(--border-focus);
}

.reset-link-btn {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-decoration: underline;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
}

.reset-link-btn:hover {
  color: var(--text-primary);
}

.results-count-text {
  font-size: var(--text-xs);
}

/* Table Card */
.team-table-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.members-table-wrapper {
  overflow-x: auto;
}

.members-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: var(--text-sm);
}

.members-table th {
  padding: var(--space-3) var(--space-5);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background-color: var(--bg-surface-elevated);
  border-bottom: 1px solid var(--border-subtle);
}

.members-table td {
  padding: var(--space-3) var(--space-5);
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
  vertical-align: middle;
}

.members-table tr:last-child td {
  border-bottom: none;
}

.member-row {
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.member-row:hover {
  background-color: var(--bg-surface-hover);
}

.member-profile-cell {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.avatar-cell-wrap {
  position: relative;
  flex-shrink: 0;
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
}

.member-avatar.is-admin {
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
}

.status-dot-mini {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--bg-surface);
}

.status-dot-mini.status-active { background-color: var(--color-success-500); }
.status-dot-mini.status-away { background-color: var(--color-warning-500); }
.status-dot-mini.status-offline { background-color: var(--text-muted); }

.member-text-meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.member-name {
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.member-email {
  font-size: 11px;
}

.projects-badge-list {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-wrap: wrap;
}

.project-key-tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  color: var(--color-primary-500);
}

.workload-stats-cell {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.points-val {
  font-size: var(--text-sm);
}

.tickets-val {
  font-size: 11px;
}

/* Capacity Mini Meter */
.capacity-cell-wrap {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 140px;
}

.capacity-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.capacity-mini-track {
  height: 5px;
  background-color: var(--bg-surface-elevated);
  border-radius: var(--radius-full);
  overflow: hidden;
  border: 1px solid var(--border-subtle);
}

.capacity-mini-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--transition-base);
}

.capacity-mini-fill.fill-success { background-color: var(--color-success-500); }
.capacity-mini-fill.fill-warning { background-color: var(--color-warning-500); }
.capacity-mini-fill.fill-danger { background-color: var(--color-danger-500); }

.empty-team-state {
  padding: var(--space-12) var(--space-5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--space-2);
}

.empty-title {
  font-size: var(--text-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.empty-subtitle {
  font-size: var(--text-xs);
  max-width: 380px;
}

.text-right {
  text-align: right;
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
