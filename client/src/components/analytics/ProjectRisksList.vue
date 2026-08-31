<script setup>
import { useTicketStore } from '@/stores/ticket.store';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

defineProps({
  risks: {
    type: Array,
    required: true
  }
});

const ticketStore = useTicketStore();

function openTicket(ticketKey) {
  ticketStore.openTicketDetail(ticketKey);
}
</script>

<template>
  <div class="risks-card">
    <div class="card-header">
      <div class="header-left">
        <div class="icon-warning-wrap">
          <AppIcon name="analytics" :size="16" />
        </div>
        <div>
          <h3 class="card-title">Project Risks & Critical Blockers</h3>
          <p class="card-subtitle text-muted">Active tickets flagged by urgency priority, missed deadlines, or review bottlenecks</p>
        </div>
      </div>
      <BaseBadge
        :variant="risks.length > 0 ? 'danger' : 'success'"
        size="sm"
        dot
      >
        {{ risks.length > 0 ? `${risks.length} Active Risks` : '0 Risks Identified' }}
      </BaseBadge>
    </div>

    <!-- Empty State: Zero Risks -->
    <div v-if="risks.length === 0" class="empty-risks-state">
      <div class="empty-icon-circle">✓</div>
      <h4 class="empty-title">Clean Execution Pipeline</h4>
      <p class="empty-desc text-muted">
        No critical blockers, overdue deadlines, or high-priority bottlenecks detected in the current scope.
      </p>
    </div>

    <!-- Risks Table / List -->
    <div v-else class="risks-list">
      <div
        v-for="item in risks"
        :key="item.ticket.key"
        class="risk-row"
        @click="openTicket(item.ticket.key)"
      >
        <div class="risk-main-info">
          <div class="risk-badge-group">
            <BaseBadge
              :variant="item.severity === 'critical' ? 'danger' : item.severity === 'high' ? 'warning' : 'info'"
              size="sm"
            >
              {{ item.riskType }}
            </BaseBadge>
            <span class="ticket-key mono">{{ item.ticket.key }}</span>
          </div>

          <span class="ticket-title truncate">{{ item.ticket.title }}</span>
          <p class="risk-description text-muted truncate">{{ item.description }}</p>
        </div>

        <div class="risk-meta-col">
          <BaseBadge
            :variant="item.ticket.status === 'In Progress' ? 'info' : item.ticket.status === 'In Review' ? 'warning' : 'neutral'"
            size="sm"
            dot
          >
            {{ item.ticket.status }}
          </BaseBadge>
          <div v-if="item.ticket.assignee" class="assignee-pill" :title="item.ticket.assignee.name">
            <span class="assignee-avatar">{{ item.ticket.assignee.avatar }}</span>
            <span class="assignee-name truncate">{{ item.ticket.assignee.name }}</span>
          </div>
          <span class="view-arrow text-muted">→</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.risks-card {
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

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.icon-warning-wrap {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background-color: var(--badge-danger-bg);
  color: var(--badge-danger-text);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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

.risks-list {
  padding: var(--space-3) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.risk-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.risk-row:hover {
  border-color: var(--border-default);
  transform: translateX(2px);
}

.risk-main-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  flex: 1;
}

.risk-badge-group {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.ticket-key {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
}

.ticket-title {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.risk-description {
  font-size: 11px;
}

.risk-meta-col {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-shrink: 0;
}

.assignee-pill {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-full);
  padding: 2px var(--space-2);
  font-size: var(--text-xs);
  max-width: 140px;
}

.assignee-avatar {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: var(--color-primary-500);
  color: #ffffff;
  font-size: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-bold);
}

.assignee-name {
  color: var(--text-secondary);
}

.view-arrow {
  font-size: var(--text-sm);
}

.empty-risks-state {
  padding: var(--space-10) var(--space-5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--space-2);
}

.empty-icon-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--badge-success-bg);
  color: var(--badge-success-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: var(--font-weight-bold);
}

.empty-title {
  font-size: var(--text-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.empty-desc {
  font-size: var(--text-xs);
  max-width: 380px;
}

@media (max-width: 768px) {
  .risk-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .risk-meta-col {
    align-self: flex-end;
  }
}
</style>
