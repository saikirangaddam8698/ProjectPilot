<script setup>
import { ref } from 'vue';
import { useProjectAnalytics } from '@/composables/useProjectAnalytics';
import KpiMetricCard from '@/components/analytics/KpiMetricCard.vue';
import VelocityChart from '@/components/analytics/VelocityChart.vue';
import BurndownChart from '@/components/analytics/BurndownChart.vue';
import DistributionChart from '@/components/analytics/DistributionChart.vue';
import TeamWorkloadList from '@/components/analytics/TeamWorkloadList.vue';
import ProjectRisksList from '@/components/analytics/ProjectRisksList.vue';
import AnalyticsFilterBar from '@/components/analytics/AnalyticsFilterBar.vue';
import TicketDetailDrawer from '@/components/tickets/TicketDetailDrawer.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const projectScope = ref('all');
const sprintScope = ref('all');

const {
  kpis,
  availableSprints,
  statusDistribution,
  priorityDistribution,
  typeDistribution,
  teamWorkload,
  projectRisks,
  velocityHistory,
  burndownData,
  healthSummary
} = useProjectAnalytics(projectScope, sprintScope);

function resetFilters() {
  projectScope.value = 'all';
  sprintScope.value = 'all';
}
</script>

<template>
  <div class="page-container">
    <!-- Page Header Area -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Analytics & Intelligence</h2>
        <p class="page-subtitle">Cross-workspace velocity trends, sprint burndown, team capacity, and automated risk triage.</p>
      </div>

      <div class="page-actions">
        <BaseButton variant="outline" size="sm" to="/sprints">
          <template #prefix><AppIcon name="sprints" :size="14" /></template>
          Sprints Hub
        </BaseButton>
        <BaseButton variant="outline" size="sm" to="/tickets">
          <template #prefix><AppIcon name="tickets" :size="14" /></template>
          All Tickets
        </BaseButton>
      </div>
    </div>

    <!-- Filter Bar -->
    <AnalyticsFilterBar
      :projectScope="projectScope"
      :sprintScope="sprintScope"
      :availableSprints="availableSprints"
      :showProjectSelect="true"
      @update:projectScope="projectScope = $event"
      @update:sprintScope="sprintScope = $event"
      @reset="resetFilters"
    />

    <!-- Health Summary Banner -->
    <div class="health-summary-banner" :class="`health-${healthSummary.status}`">
      <div class="health-meta-left">
        <div class="health-status-badge">
          <span class="health-dot"></span>
          <strong>{{ healthSummary.statusText }}</strong>
        </div>
        <p class="health-summary-text">
          <strong>{{ healthSummary.projectName }}</strong> delivery is pacing at <strong>{{ kpis.deliveryRate }}% completion</strong>
          with <strong>{{ kpis.openCount }} open issues</strong> and <strong>{{ kpis.riskCount }} active risks</strong> across active milestones.
        </p>
      </div>

      <div class="health-actions-right">
        <span class="text-xs text-muted">
          {{ kpis.completedPoints }} / {{ kpis.totalPoints }} Story Points Delivered
        </span>
      </div>
    </div>

    <!-- Top KPI Cards Row -->
    <div class="kpi-grid">
      <KpiMetricCard
        label="Delivery Rate"
        :value="`${kpis.deliveryRate}%`"
        :subtext="`${kpis.completedPoints} of ${kpis.totalPoints} pts resolved`"
        badgeText="Delivery Rate"
        badgeVariant="primary"
        icon="analytics"
        :isHighlight="true"
      />

      <KpiMetricCard
        label="Open Tickets"
        :value="kpis.openCount"
        :subtext="`${kpis.doneCount} resolved / ${kpis.totalCount} total`"
        badgeText="Backlog & Active"
        badgeVariant="neutral"
        icon="tickets"
      />

      <KpiMetricCard
        label="Active Sprints"
        :value="`${kpis.activeSprintProgress}%`"
        :subtext="`${kpis.activeSprintCompleted} of ${kpis.activeSprintCommitted} pts delivered`"
        :badgeText="kpis.activeSprintProgress >= 50 ? 'On Track' : 'In Progress'"
        :badgeVariant="kpis.activeSprintProgress >= 50 ? 'success' : 'warning'"
        icon="sprints"
      />

      <KpiMetricCard
        label="Average Velocity"
        :value="`${kpis.avgVelocity} pts`"
        subtext="Mean points per sprint cadence"
        badgeText="Historical Avg"
        badgeVariant="neutral"
        icon="my-work"
      />

      <KpiMetricCard
        label="Identified Risks"
        :value="kpis.riskCount"
        :subtext="kpis.riskCount > 0 ? 'Requires team triage' : 'No blockers found'"
        :badgeText="kpis.riskCount > 0 ? `${kpis.riskCount} Urgent/Due` : 'Clear'"
        :badgeVariant="kpis.riskCount > 0 ? 'danger' : 'success'"
        icon="analytics"
      />
    </div>

    <!-- Main Visualizations Grid -->
    <div class="analytics-charts-grid">
      <!-- Left Column: Velocity & Distribution -->
      <div class="charts-column">
        <VelocityChart :velocityData="velocityHistory" />
        <DistributionChart
          :statusDistribution="statusDistribution"
          :priorityDistribution="priorityDistribution"
          :typeDistribution="typeDistribution"
        />
      </div>

      <!-- Right Column: Burndown & Team Workload -->
      <div class="charts-column">
        <BurndownChart :burndownData="burndownData" />
        <TeamWorkloadList :workload="teamWorkload" />
      </div>
    </div>

    <!-- Full-Width Project Risks Table -->
    <div class="risks-section-full">
      <ProjectRisksList :risks="projectRisks" />
    </div>

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

.health-summary-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  background-color: var(--bg-surface);
  flex-wrap: wrap;
}

.health-summary-banner.health-healthy {
  border-left: 4px solid var(--color-success-500);
}

.health-summary-banner.health-at-risk {
  border-left: 4px solid var(--color-warning-500);
}

.health-summary-banner.health-critical {
  border-left: 4px solid var(--color-danger-500);
}

.health-meta-left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex: 1;
  flex-wrap: wrap;
}

.health-status-badge {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  background-color: var(--bg-surface-elevated);
  font-size: var(--text-xs);
  border: 1px solid var(--border-default);
}

.health-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.health-healthy .health-dot { background-color: var(--color-success-500); }
.health-at-risk .health-dot { background-color: var(--color-warning-500); }
.health-critical .health-dot { background-color: var(--color-danger-500); }

.health-summary-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.health-actions-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
}

.analytics-charts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-5);
}

.charts-column {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.risks-section-full {
  width: 100%;
}

@media (max-width: 1024px) {
  .analytics-charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
