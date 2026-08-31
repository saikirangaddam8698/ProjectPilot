<script setup>
import { useProjectStore } from '@/stores/project.store';
import AppIcon from '@/components/ui/AppIcon.vue';

const props = defineProps({
  projectScope: {
    type: String,
    default: 'all'
  },
  sprintScope: {
    type: String,
    default: 'all'
  },
  availableSprints: {
    type: Array,
    default: () => []
  },
  showProjectSelect: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:projectScope', 'update:sprintScope', 'reset']);

const projectStore = useProjectStore();

function handleProjectChange(e) {
  emit('update:projectScope', e.target.value);
  // Reset sprint to 'all' when switching project
  emit('update:sprintScope', 'all');
}

function handleSprintChange(e) {
  emit('update:sprintScope', e.target.value);
}
</script>

<template>
  <div class="analytics-filter-bar">
    <div class="filter-controls-left">
      <div class="filter-icon-label text-muted">
        <AppIcon name="analytics" :size="14" />
        <span>Filter Scope:</span>
      </div>

      <!-- Project Filter (for Global View) -->
      <div v-if="showProjectSelect" class="select-wrapper">
        <select
          :value="projectScope"
          class="filter-select"
          @change="handleProjectChange"
        >
          <option value="all">All Projects</option>
          <option
            v-for="p in projectStore.allProjects"
            :key="p.id"
            :value="p.key"
          >
            {{ p.name }} ({{ p.key }})
          </option>
        </select>
      </div>

      <!-- Sprint Scope Filter -->
      <div class="select-wrapper">
        <select
          :value="sprintScope"
          class="filter-select"
          @change="handleSprintChange"
        >
          <option value="all">All Sprints & Backlog</option>
          <option value="active">⚡ Active Sprint Only</option>
          <option value="backlog">📋 Product Backlog Only</option>
          <option
            v-for="s in availableSprints"
            :key="s.id"
            :value="s.id"
          >
            {{ s.name.split('—')[0].trim() }} ({{ s.status }})
          </option>
        </select>
      </div>

      <!-- Reset Filter Button -->
      <button
        v-if="(showProjectSelect && projectScope !== 'all') || sprintScope !== 'all'"
        type="button"
        class="reset-filters-btn"
        @click="emit('reset')"
      >
        Reset Filters
      </button>
    </div>

    <div class="filter-controls-right">
      <span class="live-indicator">
        <span class="live-pulse"></span>
        <span>Real-Time Sync</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.analytics-filter-bar {
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

.filter-icon-label {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
}

.select-wrapper {
  display: flex;
  align-items: center;
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

.reset-filters-btn {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-decoration: underline;
  cursor: pointer;
  transition: color var(--transition-fast);
  background: none;
  border: none;
  padding: 0;
}

.reset-filters-btn:hover {
  color: var(--text-primary);
}

.filter-controls-right {
  display: flex;
  align-items: center;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-secondary);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
}

.live-pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--color-success-500);
  box-shadow: 0 0 6px var(--color-success-500);
}
</style>
