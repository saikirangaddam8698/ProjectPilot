<script setup>
import { ref, computed } from 'vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const props = defineProps({
  velocityData: {
    type: Array,
    required: true
  }
});

const hoveredSprint = ref(null);

// Determine max value for Y-axis scaling (minimum 50 pts)
const maxPoints = computed(() => {
  if (!props.velocityData || props.velocityData.length === 0) return 50;
  const maxInList = Math.max(
    ...props.velocityData.map((d) => Math.max(d.committedPoints || 0, d.completedPoints || 0, d.capacity || 0))
  );
  return Math.max(45, Math.ceil(maxInList / 10) * 10);
});

// SVG dimensions & grid
const chartHeight = 215;
const chartPaddingTop = 20;
const chartPaddingBottom = 55;
const usableHeight = chartHeight - chartPaddingTop - chartPaddingBottom;

function getY(val) {
  const ratio = (val || 0) / maxPoints.value;
  return chartPaddingTop + (1 - ratio) * usableHeight;
}

function getBarHeight(val) {
  const ratio = (val || 0) / maxPoints.value;
  return Math.max(2, ratio * usableHeight);
}

function formatSprintLabel(name) {
  if (!name) return '';
  return name
    .replace(/Sprint\s+/i, 'S')
    .replace(/^Infrastructure\b/i, 'INF')
    .replace(/^Mobile\b/i, 'MOB');
}

// Average completed velocity calculation
const avgVelocity = computed(() => {
  const completed = props.velocityData.filter((d) => d.status === 'completed' || d.status === 'active');
  if (completed.length === 0) return 0;
  const sum = completed.reduce((acc, d) => acc + (d.completedPoints || 0), 0);
  return Math.round(sum / completed.length);
});
</script>

<template>
  <div class="velocity-card">
    <div class="card-header">
      <div>
        <h3 class="card-title">Sprint Velocity & Delivery Cadence</h3>
        <p class="card-subtitle text-muted">Committed story points vs delivered outcomes across sprint cadences</p>
      </div>
      <div class="header-badges">
        <BaseBadge variant="primary" size="sm">
          Avg {{ avgVelocity }} pts / sprint
        </BaseBadge>
      </div>
    </div>

    <div v-if="velocityData.length === 0" class="empty-chart-state text-muted">
      <AppIcon name="analytics" :size="24" />
      <span>No sprint velocity data available for this scope.</span>
    </div>

    <div v-else class="chart-content-wrap">
      <!-- SVG Bar Chart -->
      <div class="svg-container">
        <svg viewBox="0 0 580 215" class="velocity-svg" preserveAspectRatio="none">
          <!-- Y-Axis Grid Lines -->
          <g class="grid-lines">
            <line x1="40" :y1="getY(maxPoints)" x2="560" :y2="getY(maxPoints)" stroke="var(--border-subtle)" stroke-dasharray="3" />
            <text x="32" :y="getY(maxPoints) + 4" class="axis-label" text-anchor="end">{{ maxPoints }}</text>

            <line x1="40" :y1="getY(maxPoints / 2)" x2="560" :y2="getY(maxPoints / 2)" stroke="var(--border-subtle)" stroke-dasharray="3" />
            <text x="32" :y="getY(maxPoints / 2) + 4" class="axis-label" text-anchor="end">{{ Math.round(maxPoints / 2) }}</text>

            <line x1="40" :y1="getY(0)" x2="560" :y2="getY(0)" stroke="var(--border-default)" />
            <text x="32" :y="getY(0) + 4" class="axis-label" text-anchor="end">0</text>
          </g>

          <!-- Sprint Bar Groups -->
          <g v-for="(sprint, index) in velocityData" :key="sprint.id" class="bar-group">
            <!-- Calculate X offset dynamically based on array length -->
            <g
              :transform="`translate(${55 + index * ((500) / Math.max(1, velocityData.length))}, 0)`"
              class="sprint-column-group"
              @mouseenter="hoveredSprint = sprint"
              @mouseleave="hoveredSprint = null"
            >
              <!-- Hover area trigger background -->
              <rect
                x="-15"
                :y="chartPaddingTop"
                width="70"
                :height="usableHeight"
                fill="transparent"
                class="hover-hitbox"
              />

              <!-- Capacity guideline dashed line for this sprint -->
              <line
                x1="-4"
                :y1="getY(sprint.capacity)"
                x2="44"
                :y2="getY(sprint.capacity)"
                stroke="var(--color-warning-500)"
                stroke-width="1.5"
                stroke-dasharray="2"
              />

              <!-- Committed Points Bar (Left) -->
              <rect
                x="0"
                :y="getY(sprint.committedPoints)"
                width="18"
                :height="getBarHeight(sprint.committedPoints)"
                rx="3"
                class="bar-committed"
                :class="{ 'is-active': sprint.status === 'active' }"
              />

              <!-- Completed Points Bar (Right) -->
              <rect
                x="22"
                :y="getY(sprint.completedPoints)"
                width="18"
                :height="getBarHeight(sprint.completedPoints)"
                rx="3"
                class="bar-completed"
                :class="{ 'is-active': sprint.status === 'active' }"
              />

              <!-- X-Axis Label: Angled to prevent overlap and compact -->
              <text
                x="24"
                :y="chartHeight - 34"
                class="sprint-x-label"
                :class="{ 'is-current': sprint.status === 'active' }"
                text-anchor="end"
                :transform="`rotate(-28, 24, ${chartHeight - 34})`"
              >
                {{ formatSprintLabel(sprint.name) }}
              </text>
            </g>
          </g>
        </svg>
      </div>

      <!-- Interactive Hover Tooltip Box -->
      <div v-if="hoveredSprint" class="chart-tooltip-panel">
        <div class="tooltip-header">
          <strong>{{ hoveredSprint.fullName || hoveredSprint.name }}</strong>
          <BaseBadge
            :variant="hoveredSprint.status === 'active' ? 'primary' : hoveredSprint.status === 'completed' ? 'success' : 'neutral'"
            size="sm"
          >
            {{ hoveredSprint.status }}
          </BaseBadge>
        </div>
        <div class="tooltip-metrics">
          <div class="metric-row">
            <span class="dot committed-dot"></span>
            <span>Committed:</span>
            <strong>{{ hoveredSprint.committedPoints }} pts</strong>
          </div>
          <div class="metric-row">
            <span class="dot completed-dot"></span>
            <span>Delivered:</span>
            <strong>{{ hoveredSprint.completedPoints }} pts</strong>
          </div>
          <div class="metric-row">
            <span class="dot capacity-dot"></span>
            <span>Capacity Target:</span>
            <strong>{{ hoveredSprint.capacity }} pts</strong>
          </div>
          <div class="metric-row rate-row">
            <span>Delivery Rate:</span>
            <strong class="text-primary">
              {{ hoveredSprint.committedPoints > 0 ? Math.round((hoveredSprint.completedPoints / hoveredSprint.committedPoints) * 100) : 0 }}%
            </strong>
          </div>
        </div>
      </div>

      <!-- Chart Legend & Note -->
      <div class="chart-footer">
        <div class="legend-items">
          <span class="legend-item"><span class="legend-swatch committed"></span> Committed Points</span>
          <span class="legend-item"><span class="legend-swatch completed"></span> Completed Points</span>
          <span class="legend-item"><span class="legend-line capacity"></span> Capacity Target</span>
        </div>
        <span class="legend-note text-muted">
          Active sprint metrics derived live from store • Hover bars for breakdown
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.velocity-card {
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

.chart-content-wrap {
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  position: relative;
}

.svg-container {
  width: 100%;
  height: 225px;
}

.velocity-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.axis-label {
  font-size: 10px;
  font-family: var(--font-mono);
  fill: var(--text-muted);
}

.sprint-x-label {
  font-size: 11px;
  font-family: var(--font-mono);
  fill: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.sprint-x-label.is-current {
  fill: var(--color-primary-500);
  font-weight: var(--font-weight-bold);
}

.hover-hitbox {
  cursor: pointer;
}

.bar-committed {
  fill: var(--bg-surface-active);
  stroke: var(--border-default);
  stroke-width: 1;
  transition: fill var(--transition-fast), transform var(--transition-fast);
}

.bar-committed.is-active {
  fill: var(--color-primary-300);
  stroke: var(--color-primary-400);
}

.bar-completed {
  fill: var(--color-success-500);
  transition: fill var(--transition-fast);
}

.bar-completed.is-active {
  fill: var(--color-primary-500);
}

.sprint-column-group:hover .bar-committed {
  fill: var(--color-primary-400);
}

.sprint-column-group:hover .bar-completed {
  fill: var(--color-success-600);
}

/* Tooltip Panel */
.chart-tooltip-panel {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-lg);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-xs);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.tooltip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border-subtle);
}

.tooltip-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: var(--space-2);
}

.metric-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.rate-row {
  font-weight: var(--font-weight-semibold);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.committed-dot { background-color: var(--color-primary-300); }
.completed-dot { background-color: var(--color-success-500); }
.capacity-dot { background-color: var(--color-warning-500); }

/* Chart Footer */
.chart-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding-top: var(--space-2);
  border-top: 1px solid var(--border-subtle);
  font-size: var(--text-xs);
  flex-wrap: wrap;
}

.legend-items {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-secondary);
}

.legend-swatch {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-swatch.committed {
  background-color: var(--bg-surface-active);
  border: 1px solid var(--border-default);
}

.legend-swatch.completed {
  background-color: var(--color-success-500);
}

.legend-line.capacity {
  width: 16px;
  height: 0;
  border-top: 2px dashed var(--color-warning-500);
}

.legend-note {
  font-size: 11px;
}

.empty-chart-state {
  padding: var(--space-10) var(--space-5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  text-align: center;
  font-size: var(--text-sm);
}
</style>
