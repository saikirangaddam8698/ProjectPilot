<script setup>
import { ref, computed } from 'vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const props = defineProps({
  burndownData: {
    type: Object,
    default: null
  }
});

const hoveredPoint = ref(null);

// Chart dimensions
const chartWidth = 500;
const chartHeight = 180;
const padLeft = 40;
const padRight = 20;
const padTop = 20;
const padBottom = 25;

const plotWidth = chartWidth - padLeft - padRight;
const plotHeight = chartHeight - padTop - padBottom;

const maxPoints = computed(() => {
  if (!props.burndownData) return 40;
  return Math.max(30, Math.ceil(props.burndownData.committedPoints / 10) * 10);
});

function getX(day) {
  const totalDays = props.burndownData?.totalDays || 14;
  return padLeft + (day / totalDays) * plotWidth;
}

function getY(points) {
  const ratio = Math.max(0, points) / maxPoints.value;
  return padTop + (1 - ratio) * plotHeight;
}

// SVG Points string for Ideal Trajectory line
const idealPointsAttr = computed(() => {
  if (!props.burndownData?.idealTrajectory) return '';
  return props.burndownData.idealTrajectory
    .map((p) => `${getX(p.day)},${getY(p.points)}`)
    .join(' ');
});

// SVG Points string for Actual Trajectory line
const actualPointsAttr = computed(() => {
  if (!props.burndownData?.actualTrajectory) return '';
  return props.burndownData.actualTrajectory
    .map((p) => `${getX(p.day)},${getY(p.points)}`)
    .join(' ');
});

// Today's current live point coordinate
const currentCoord = computed(() => {
  if (!props.burndownData) return null;
  const day = props.burndownData.elapsedDays;
  const points = props.burndownData.remainingPoints;
  return {
    x: getX(day),
    y: getY(points),
    day,
    points
  };
});
</script>

<template>
  <div class="burndown-card">
    <div class="card-header">
      <div>
        <div class="title-row">
          <h3 class="card-title">{{ burndownData?.sprintName || 'Active Sprint' }} Burndown</h3>
          <BaseBadge
            v-if="burndownData"
            :variant="burndownData.isOnTrack ? 'success' : 'warning'"
            size="sm"
            dot
          >
            {{ burndownData.statusLabel }}
          </BaseBadge>
        </div>
        <p class="card-subtitle text-muted">
          {{ burndownData ? `Day ${burndownData.elapsedDays} of ${burndownData.totalDays} • ${burndownData.remainingDays} days remaining` : 'Story point burn rate against timeframe' }}
        </p>
      </div>

      <div v-if="burndownData" class="sprint-remaining-badge">
        <span class="pts-number">{{ burndownData.remainingPoints }}</span>
        <span class="pts-unit text-muted">pts left</span>
      </div>
    </div>

    <div v-if="!burndownData" class="empty-burndown-state text-muted">
      <AppIcon name="sprints" :size="24" />
      <span>No active sprint currently running for this project scope.</span>
    </div>

    <div v-else class="chart-content-wrap">
      <div class="svg-container">
        <svg viewBox="0 0 500 180" class="burndown-svg" preserveAspectRatio="none">
          <!-- Y-Axis Grid Lines -->
          <g class="grid-lines">
            <line :x1="padLeft" :y1="getY(maxPoints)" :x2="chartWidth - padRight" :y2="getY(maxPoints)" stroke="var(--border-subtle)" stroke-dasharray="3" />
            <text :x="padLeft - 8" :y="getY(maxPoints) + 4" class="axis-label" text-anchor="end">{{ maxPoints }}</text>

            <line :x1="padLeft" :y1="getY(maxPoints / 2)" :x2="chartWidth - padRight" :y2="getY(maxPoints / 2)" stroke="var(--border-subtle)" stroke-dasharray="3" />
            <text :x="padLeft - 8" :y="getY(maxPoints / 2) + 4" class="axis-label" text-anchor="end">{{ Math.round(maxPoints / 2) }}</text>

            <line :x1="padLeft" :y1="getY(0)" :x2="chartWidth - padRight" :y2="getY(0)" stroke="var(--border-default)" />
            <text :x="padLeft - 8" :y="getY(0) + 4" class="axis-label" text-anchor="end">0</text>
          </g>

          <!-- Today Vertical Indicator -->
          <g v-if="currentCoord" class="today-marker">
            <line
              :x1="currentCoord.x"
              :y1="padTop"
              :x2="currentCoord.x"
              :y2="chartHeight - padBottom"
              stroke="var(--color-primary-300)"
              stroke-width="1.5"
              stroke-dasharray="2"
            />
            <text :x="currentCoord.x" :y="padTop - 6" class="today-text" text-anchor="middle">Today</text>
          </g>

          <!-- Ideal Trajectory Line -->
          <polyline
            :points="idealPointsAttr"
            fill="none"
            stroke="var(--text-muted)"
            stroke-width="1.5"
            stroke-dasharray="4"
          />

          <!-- Actual Burndown Line -->
          <polyline
            :points="actualPointsAttr"
            fill="none"
            stroke="var(--color-primary-500)"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <!-- Interactive Data Points along Actual Line -->
          <g v-for="point in burndownData.actualTrajectory" :key="point.day" class="data-point-group">
            <circle
              :cx="getX(point.day)"
              :cy="getY(point.points)"
              r="4"
              class="data-circle"
              :class="{ 'is-today': point.day === burndownData.elapsedDays }"
              @mouseenter="hoveredPoint = point"
              @mouseleave="hoveredPoint = null"
            />
          </g>

          <!-- X-Axis Milestone Labels -->
          <g class="x-axis-labels">
            <text :x="getX(0)" :y="chartHeight - 6" class="axis-label" text-anchor="middle">Day 0</text>
            <text :x="getX(7)" :y="chartHeight - 6" class="axis-label" text-anchor="middle">Day 7</text>
            <text :x="getX(14)" :y="chartHeight - 6" class="axis-label" text-anchor="middle">Day 14 (End)</text>
          </g>
        </svg>
      </div>

      <!-- Hover Tooltip -->
      <div v-if="hoveredPoint" class="point-tooltip-panel">
        <span>Day {{ hoveredPoint.day }}:</span>
        <strong class="text-primary">{{ hoveredPoint.points }} story points remaining</strong>
        <span v-if="hoveredPoint.day === burndownData.elapsedDays" class="today-badge">(Current Store State)</span>
      </div>

      <!-- Footer & Context Info -->
      <div class="chart-footer">
        <div class="legend-items">
          <span class="legend-item"><span class="legend-dot actual"></span> Actual Story Points</span>
          <span class="legend-item"><span class="legend-dot ideal"></span> Ideal Guideline</span>
        </div>
        <span class="chart-note text-muted">
          Current point derived from live ticket store • Baseline slope from sprint cadence
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.burndown-card {
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

.title-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
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

.sprint-remaining-badge {
  display: flex;
  align-items: baseline;
  gap: 4px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-md);
}

.pts-number {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary-500);
}

.pts-unit {
  font-size: var(--text-xs);
}

.chart-content-wrap {
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.svg-container {
  width: 100%;
  height: 200px;
}

.burndown-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.axis-label {
  font-size: 10px;
  font-family: var(--font-mono);
  fill: var(--text-muted);
}

.today-text {
  font-size: 9px;
  font-family: var(--font-mono);
  fill: var(--color-primary-500);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
}

.data-circle {
  fill: var(--color-primary-500);
  stroke: var(--bg-surface);
  stroke-width: 2;
  cursor: pointer;
  transition: transform var(--transition-fast), r var(--transition-fast);
}

.data-circle:hover {
  r: 6;
  fill: var(--color-primary-400);
}

.data-circle.is-today {
  fill: var(--color-primary-600);
  stroke: var(--color-primary-200);
  stroke-width: 2.5;
  r: 5.5;
}

.point-tooltip-panel {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
  font-size: var(--text-xs);
  align-self: flex-start;
}

.today-badge {
  color: var(--text-muted);
  font-size: 11px;
}

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
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-secondary);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-dot.actual {
  background-color: var(--color-primary-500);
}

.legend-dot.ideal {
  background-color: var(--text-muted);
}

.chart-note {
  font-size: 11px;
}

.empty-burndown-state {
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
