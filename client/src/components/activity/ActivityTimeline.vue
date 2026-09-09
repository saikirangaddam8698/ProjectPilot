<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTicketStore } from '@/stores/ticket.store';
import AppIcon from '@/components/ui/AppIcon.vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';

const props = defineProps({
  activities: {
    type: Array,
    required: true
  },
  projectKey: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['open-member']);

const router = useRouter();
const ticketStore = useTicketStore();

function formatTimeAgo(isoString) {
  if (!isoString) return 'Just now';
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  if (diffSec < 172800) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function handleActivityClick(act) {
  if (act.type === 'ticket' || act.targetType === 'ticket') {
    if (act.targetKey) {
      ticketStore.openTicketDetail(act.targetKey);
    }
  } else if (act.type === 'sprint' || act.targetType === 'sprint') {
    const pkey = act.projectKey || props.projectKey;
    if (pkey) {
      router.push(`/projects/${pkey}/sprints`);
    } else {
      router.push('/sprints');
    }
  } else if (act.type === 'team' || act.targetType === 'member') {
    emit('open-member', { id: act.targetId, name: act.targetTitle, avatar: act.targetKey });
  }
}

function getEventIcon(type) {
  if (type === 'ticket') return 'tickets';
  if (type === 'sprint') return 'sprints';
  if (type === 'team') return 'team';
  if (type === 'project') return 'projects';
  return 'analytics';
}

function getTypeBadgeVariant(type) {
  if (type === 'ticket') return 'primary';
  if (type === 'sprint') return 'purple';
  if (type === 'team') return 'success';
  if (type === 'project') return 'warning';
  return 'neutral';
}
</script>

<template>
  <div class="activity-timeline-container">
    <div v-if="activities.length === 0" class="empty-timeline text-muted">
      <AppIcon name="analytics" :size="28" />
      <h4 class="empty-title">No Activity Recorded</h4>
      <p class="empty-desc">Events will be automatically recorded here when tickets are created, sprints are updated, or team members are assigned.</p>
    </div>

    <div v-else class="timeline-list">
      <div
        v-for="act in activities"
        :key="act.id"
        class="timeline-item"
        :class="{ 'is-clickable': act.targetKey || act.type === 'ticket' || act.type === 'sprint' }"
        @click="handleActivityClick(act)"
      >
        <!-- Left Spine: Actor Avatar & Icon Badge -->
        <div class="timeline-spine">
          <div class="actor-avatar" :title="act.actor?.name || 'User'">
            {{ act.actor?.avatar || act.actor?.name?.slice(0, 2)?.toUpperCase() || 'U' }}
          </div>
          <div class="spine-line"></div>
        </div>

        <!-- Right Content Card -->
        <div class="timeline-content-card">
          <div class="content-header">
            <div class="actor-meta-row">
              <strong class="actor-name">{{ act.actor?.name || 'System User' }}</strong>
              <BaseBadge :variant="getTypeBadgeVariant(act.type)" size="xs">
                {{ act.type }}
              </BaseBadge>
              <span v-if="act.projectKey" class="project-tag-pill mono">
                {{ act.projectKey }}
              </span>
            </div>

            <span class="activity-time text-muted">{{ formatTimeAgo(act.createdAt) }}</span>
          </div>

          <p class="activity-message">
            <span class="message-text">{{ act.message }}</span>
          </p>

          <div v-if="act.targetKey" class="target-link-row">
            <span class="target-badge mono">
              <AppIcon :name="getEventIcon(act.type)" :size="12" />
              <span>{{ act.targetKey }}</span>
              <span v-if="act.targetTitle && act.targetTitle !== act.targetKey" class="target-title-text truncate">
                — {{ act.targetTitle }}
              </span>
            </span>
            <span class="interactive-hint text-muted">Click to view →</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.activity-timeline-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.timeline-list {
  display: flex;
  flex-direction: column;
  position: relative;
}

.timeline-item {
  display: flex;
  gap: var(--space-4);
  position: relative;
  padding-bottom: var(--space-4);
  transition: transform var(--transition-fast);
}

.timeline-item.is-clickable {
  cursor: pointer;
}

.timeline-item.is-clickable:hover .timeline-content-card {
  border-color: var(--border-default);
  background-color: var(--bg-surface-elevated);
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-item:last-child .spine-line {
  display: none;
}

.timeline-spine {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 32px;
}

.actor-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--color-primary-600);
  color: #FFFFFF;
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  box-shadow: 0 0 0 3px var(--bg-surface);
}

.spine-line {
  width: 2px;
  background-color: var(--border-subtle);
  flex: 1;
  margin-top: 4px;
}

.timeline-content-card {
  flex: 1;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  transition: all var(--transition-fast);
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.actor-meta-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.actor-name {
  font-size: var(--text-xs);
  color: var(--text-primary);
}

.project-tag-pill {
  font-size: 10px;
  padding: 1px 5px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  color: var(--color-primary-500);
}

.activity-time {
  font-size: 11px;
  font-family: var(--font-mono);
}

.activity-message {
  font-size: var(--text-sm);
  color: var(--text-primary);
  line-height: 1.4;
}

.target-link-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding-top: var(--space-1);
  border-top: 1px solid var(--border-subtle);
}

.target-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary-500);
  background-color: var(--bg-surface-elevated);
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-default);
  max-width: 80%;
}

.target-title-text {
  font-weight: var(--font-weight-normal);
  color: var(--text-secondary);
}

.interactive-hint {
  font-size: 11px;
}

.empty-timeline {
  padding: var(--space-10) var(--space-5);
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

.empty-desc {
  font-size: var(--text-xs);
  max-width: 360px;
}
</style>
