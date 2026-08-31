<script setup>
import { ref, computed } from 'vue';
import { useActivityStore } from '@/stores/activity.store';
import ActivityTimeline from '@/components/activity/ActivityTimeline.vue';
import MemberDetailDrawer from '@/components/team/MemberDetailDrawer.vue';
import TicketDetailDrawer from '@/components/tickets/TicketDetailDrawer.vue';
import BaseInput from '@/components/ui/BaseInput.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
});

const activityStore = useActivityStore();

const typeFilter = ref('all'); // 'all' | 'ticket' | 'sprint' | 'team' | 'project'
const actorFilter = ref('all');
const searchQuery = ref('');

const selectedMember = ref(null);
const isMemberDrawerOpen = ref(false);

// Scoped project activities with strict isolation
const projectActivities = computed(() => {
  return activityStore.getActivitiesByProject(props.project.key, {
    type: typeFilter.value,
    actorId: actorFilter.value,
    query: searchQuery.value
  });
});

// Available actors who contributed to this project
const projectActors = computed(() => {
  const allInProject = activityStore.getActivitiesByProject(props.project.key);
  const actorMap = new Map();
  allInProject.forEach((a) => {
    if (a.actor && !actorMap.has(a.actor.id)) {
      actorMap.set(a.actor.id, a.actor);
    }
  });
  return Array.from(actorMap.values());
});

function handleOpenMember(memberSummary) {
  const fullMember = props.project.members.find((m) => m.id === memberSummary.id) || {
    id: memberSummary.id,
    name: memberSummary.name,
    avatar: memberSummary.avatar || 'AM',
    role: 'Contributor',
    capacity: 20
  };
  selectedMember.value = fullMember;
  isMemberDrawerOpen.value = true;
}

function resetFilters() {
  typeFilter.value = 'all';
  actorFilter.value = 'all';
  searchQuery.value = '';
}
</script>

<template>
  <div class="project-activity-page">
    <!-- Filter Toolbar -->
    <div class="activity-filter-bar">
      <div class="filter-controls-left">
        <!-- Event Type Pills -->
        <div class="type-filter-group">
          <button
            type="button"
            class="type-pill-btn"
            :class="{ 'is-active': typeFilter === 'all' }"
            @click="typeFilter = 'all'"
          >
            All Activity
          </button>
          <button
            type="button"
            class="type-pill-btn"
            :class="{ 'is-active': typeFilter === 'ticket' }"
            @click="typeFilter = 'ticket'"
          >
            <AppIcon name="tickets" :size="12" />
            Tickets
          </button>
          <button
            type="button"
            class="type-pill-btn"
            :class="{ 'is-active': typeFilter === 'sprint' }"
            @click="typeFilter = 'sprint'"
          >
            <AppIcon name="sprints" :size="12" />
            Sprints
          </button>
          <button
            type="button"
            class="type-pill-btn"
            :class="{ 'is-active': typeFilter === 'team' }"
            @click="typeFilter = 'team'"
          >
            <AppIcon name="team" :size="12" />
            Team
          </button>
        </div>

        <!-- Actor Filter -->
        <select v-if="projectActors.length > 0" v-model="actorFilter" class="filter-select">
          <option value="all">All Contributors</option>
          <option v-for="actor in projectActors" :key="actor.id" :value="actor.id">
            {{ actor.name }}
          </option>
        </select>

        <!-- Search Input -->
        <div class="search-input-wrap">
          <BaseInput
            v-model="searchQuery"
            placeholder="Search events..."
            size="sm"
          >
            <template #prefix><AppIcon name="search" :size="13" /></template>
          </BaseInput>
        </div>

        <!-- Reset Button -->
        <button
          v-if="typeFilter !== 'all' || actorFilter !== 'all' || searchQuery"
          type="button"
          class="reset-link-btn"
          @click="resetFilters"
        >
          Reset Filters
        </button>
      </div>

      <div class="filter-controls-right">
        <span class="live-event-badge">
          <span class="pulse-dot"></span>
          <span>{{ projectActivities.length }} Events Logged</span>
        </span>
      </div>
    </div>

    <!-- Main Timeline -->
    <div class="activity-timeline-card">
      <ActivityTimeline
        :activities="projectActivities"
        :projectKey="project.key"
        @open-member="handleOpenMember"
      />
    </div>

    <!-- Member Detail Drawer -->
    <MemberDetailDrawer
      :modelValue="isMemberDrawerOpen"
      @update:modelValue="isMemberDrawerOpen = $event"
      :member="selectedMember"
      :projectKey="project.key"
      @close="isMemberDrawerOpen = false"
    />

    <!-- Universal Ticket Detail Drawer -->
    <TicketDetailDrawer />
  </div>
</template>

<style scoped>
.project-activity-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
}

.activity-filter-bar {
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

.type-filter-group {
  display: flex;
  align-items: center;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 2px;
  gap: 2px;
}

.type-pill-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.type-pill-btn:hover {
  color: var(--text-primary);
}

.type-pill-btn.is-active {
  background-color: var(--bg-surface);
  color: var(--color-primary-500);
  box-shadow: var(--shadow-sm);
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
}

.search-input-wrap {
  width: 200px;
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

.live-event-badge {
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

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--color-success-500);
  box-shadow: 0 0 6px var(--color-success-500);
}

.activity-timeline-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}
</style>
