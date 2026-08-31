<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  statusDistribution: {
    type: Array,
    required: true
  },
  priorityDistribution: {
    type: Array,
    required: true
  },
  typeDistribution: {
    type: Array,
    required: true
  }
});

const activeDimension = ref('status'); // 'status' | 'priority' | 'type'
const metricMode = ref('count'); // 'count' | 'points'

const currentData = computed(() => {
  if (activeDimension.value === 'priority') return props.priorityDistribution;
  if (activeDimension.value === 'type') return props.typeDistribution;
  return props.statusDistribution;
});

const totalMetricValue = computed(() => {
  return currentData.value.reduce((acc, item) => {
    return acc + (metricMode.value === 'points' ? item.points : item.count);
  }, 0);
});

function getItemPercentage(item) {
  if (totalMetricValue.value === 0) return 0;
  const val = metricMode.value === 'points' ? item.points : item.count;
  return Math.round((val / totalMetricValue.value) * 100);
}
</script>

<template>
  <div class="distribution-card">
    <div class="card-header">
      <div>
        <h3 class="card-title">Ticket Workload Distribution</h3>
        <p class="card-subtitle text-muted">Breakdown across development statuses, urgency priorities, and issue categories</p>
      </div>

      <!-- Controls: Dimension tabs & Mode toggle -->
      <div class="header-controls">
        <div class="dimension-tabs">
          <button
            type="button"
            class="dim-tab-btn"
            :class="{ 'is-active': activeDimension === 'status' }"
            @click="activeDimension = 'status'"
          >
            Status
          </button>
          <button
            type="button"
            class="dim-tab-btn"
            :class="{ 'is-active': activeDimension === 'priority' }"
            @click="activeDimension = 'priority'"
          >
            Priority
          </button>
          <button
            type="button"
            class="dim-tab-btn"
            :class="{ 'is-active': activeDimension === 'type' }"
            @click="activeDimension = 'type'"
          >
            Type
          </button>
        </div>

        <div class="mode-toggle">
          <button
            type="button"
            class="mode-btn"
            :class="{ 'is-active': metricMode === 'count' }"
            @click="metricMode = 'count'"
            title="Display by ticket count"
          >
            Issues
          </button>
          <button
            type="button"
            class="mode-btn"
            :class="{ 'is-active': metricMode === 'points' }"
            @click="metricMode = 'points'"
            title="Display by story points"
          >
            Points
          </button>
        </div>
      </div>
    </div>

    <div class="card-body">
      <!-- Multi-Segment Visual Stack Bar -->
      <div class="segment-bar-wrap">
        <div class="segment-bar-track">
          <div
            v-for="item in currentData"
            :key="item.id"
            class="bar-segment"
            :style="{
              width: `${getItemPercentage(item)}%`,
              backgroundColor: item.color
            }"
            :title="`${item.label}: ${metricMode === 'points' ? item.points + ' pts' : item.count + ' tickets'} (${getItemPercentage(item)}%)`"
          ></div>
        </div>
      </div>

      <!-- Detail Legend List -->
      <div class="legend-grid">
        <div
          v-for="item in currentData"
          :key="item.id"
          class="legend-row"
        >
          <div class="legend-info">
            <span class="color-badge" :style="{ backgroundColor: item.color }"></span>
            <span class="item-name">{{ item.label }}</span>
          </div>

          <div class="legend-stats">
            <span class="item-val">
              {{ metricMode === 'points' ? `${item.points} pts` : `${item.count} issues` }}
            </span>
            <span class="item-pct text-muted">
              ({{ getItemPercentage(item) }}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.distribution-card {
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

.header-controls {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.dimension-tabs,
.mode-toggle {
  display: flex;
  align-items: center;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 2px;
}

.dim-tab-btn,
.mode-btn {
  padding: 3px var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  cursor: pointer;
}

.dim-tab-btn:hover,
.mode-btn:hover {
  color: var(--text-primary);
}

.dim-tab-btn.is-active,
.mode-btn.is-active {
  background-color: var(--bg-surface);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

.card-body {
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.segment-bar-wrap {
  width: 100%;
}

.segment-bar-track {
  height: 14px;
  border-radius: var(--radius-full);
  background-color: var(--bg-surface-elevated);
  overflow: hidden;
  display: flex;
  width: 100%;
}

.bar-segment {
  height: 100%;
  transition: width var(--transition-base);
}

.legend-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-3);
}

.legend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  font-size: var(--text-xs);
}

.legend-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.color-badge {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}

.item-name {
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.legend-stats {
  display: flex;
  align-items: center;
  gap: 4px;
}

.item-val {
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.item-pct {
  font-size: 11px;
}
</style>
