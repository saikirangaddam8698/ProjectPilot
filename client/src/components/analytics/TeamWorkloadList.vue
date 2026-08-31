<script setup>
import AppIcon from '@/components/ui/AppIcon.vue';

defineProps({
  workload: {
    type: Array,
    required: true
  }
});

function getAvatarColor(index) {
  const colors = ['#4F46E5', '#0284C7', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];
  return colors[index % colors.length];
}
</script>

<template>
  <div class="workload-card">
    <div class="card-header">
      <div>
        <h3 class="card-title">Team Workload & Capacity</h3>
        <p class="card-subtitle text-muted">Assigned story points and ticket balance across team contributors</p>
      </div>
      <span class="text-muted text-xs">{{ workload.length }} Assigned Members</span>
    </div>

    <div v-if="workload.length === 0" class="empty-workload-state text-muted">
      <AppIcon name="team" :size="24" />
      <span>No team members currently assigned to tickets in this scope.</span>
    </div>

    <div v-else class="workload-list">
      <div
        v-for="(member, idx) in workload"
        :key="member.id"
        class="member-workload-row"
      >
        <!-- Member Profile -->
        <div class="member-profile">
          <div class="avatar-circle" :style="{ backgroundColor: getAvatarColor(idx) }">
            {{ member.avatar }}
          </div>
          <div class="member-meta">
            <span class="member-name">{{ member.name }}</span>
            <span class="member-role text-muted">{{ member.role }}</span>
          </div>
        </div>

        <!-- Progress Bar & Points Summary -->
        <div class="workload-progress-col">
          <div class="progress-meta-row">
            <span class="points-summary">
              <strong>{{ member.completedPoints }}</strong> / {{ member.totalPoints }} pts completed
              <span class="ticket-count-text text-muted">({{ member.assignedTickets }} tickets)</span>
            </span>
            <span class="workload-share-badge">
              {{ member.workloadPercentage }}% of scope
            </span>
          </div>

          <div class="progress-bar-track">
            <div
              class="progress-bar-fill"
              :style="{
                width: `${member.totalPoints > 0 ? Math.round((member.completedPoints / member.totalPoints) * 100) : 0}%`,
                backgroundColor: getAvatarColor(idx)
              }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.workload-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border-subtle);
  gap: var(--space-3);
  flex-wrap: wrap;
}

.card-title {
  font-size: var(--text-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.card-subtitle {
  font-size: var(--text-xs);
  margin-top: 2px;
}

.workload-list {
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.member-workload-row {
  display: grid;
  grid-template-columns: 200px 1fr;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast);
}

.member-workload-row:hover {
  border-color: var(--border-default);
}

.member-profile {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  color: #ffffff;
  font-size: var(--text-xs);
  font-weight: var(--font-weight-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.member-meta {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.member-name {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-role {
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.workload-progress-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.progress-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--text-xs);
}

.points-summary {
  color: var(--text-primary);
}

.ticket-count-text {
  font-size: 11px;
}

.workload-share-badge {
  font-size: 11px;
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}

.progress-bar-track {
  height: 6px;
  background-color: var(--bg-surface);
  border-radius: var(--radius-full);
  overflow: hidden;
  border: 1px solid var(--border-subtle);
}

.progress-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--transition-base);
}

.empty-workload-state {
  padding: var(--space-10) var(--space-5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  text-align: center;
  font-size: var(--text-sm);
}

@media (max-width: 640px) {
  .member-workload-row {
    grid-template-columns: 1fr;
    gap: var(--space-2);
  }
}
</style>
