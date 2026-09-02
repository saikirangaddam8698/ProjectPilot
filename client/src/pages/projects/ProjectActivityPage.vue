<script setup>
import { ref, computed } from 'vue';
import { useActivityStore } from '@/stores/activity.store';
import ActivityTimeline from '@/components/activity/ActivityTimeline.vue';
import ActivityFeedSkeleton from '@/components/skeletons/ActivityFeedSkeleton.vue';
import ServiceUnavailableBanner from '@/components/ui/ServiceUnavailableBanner.vue';
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

const isInitialLoading = computed(() => {
  return activityStore.isLoading && activityStore.allActivities.length === 0;
});

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

function handleRetry() {
  activityStore.fetchActivities();
}

function resetFilters() {
  typeFilter.value = 'all';
  actorFilter.value = 'all';
  searchQuery.value = '';
}
</script>

<template>
  <div class="project-activity-page">
    <!-- Service Unavailable Error Banner -->
    <ServiceUnavailableBanner
      v-if="activityStore.error && !isInitialLoading"
      :message="activityStore.error"
      @retry="handleRetry"
    />

    <!-- Activity Toolbar / Filters -->
    <div class="activity-toolbar">
      <div class="search-box">
        <BaseInput
          v-model="searchQuery"
          placeholder="Search activity audit logs..."
          size="sm"
        >
          <template #prefix><AppIcon name="search" :size="14" /></template>
        </BaseInput>
      </div>

      <div class="filters-row">
        <!-- Event Type Filter -->
        <select v-model="typeFilter" class="filter-select">
          <option value="all">All Events</option>
          <option value="ticket">Ticket Changes</option>
          <option value="sprint">Sprint Cycles</option>
          <option value="team">Team Allocation</option>
          <option value="project">Project Updates</option>
        </select>

        <!-- Contributor Filter -->
        <select v-model="actorFilter" class="filter-select">
          <option value="all">All Contributors</option>
          <option
            v-for="actor in projectActors"
            :key="actor.id"
            :value="actor.id"
          >
            {{ actor.name }}
          </option>
        </select>

        <button
          v-if="typeFilter !== 'all' || actorFilter !== 'all' || searchQuery"
          type="button"
          class="reset-btn"
          @click="resetFilters"
        >
          Reset Filters
        </button>
      </div>
    </div>

    <!-- Skeleton Loader for Initial Load -->
    <ActivityFeedSkeleton v-if="isInitialLoading" :count="6" />

    <!-- Timeline Component -->
    <div v-else-if="projectActivities.length > 0" class="timeline-wrapper">
      <ActivityTimeline
        :activities="projectActivities"
        @open-member="handleOpenMember"
      />
    </div>

    <!-- Empty State -->
    <div v-else-if="!isInitialLoading && !activityStore.error" class="empty-state">
      <div class="empty-icon-wrap">
        <AppIcon name="activity" :size="32" />
      </div>
      <h3 class="empty-title">No matching activity</h3>
      <p class="empty-desc">
        No logged activities match the selected event types or member filter.
      </p>
      <button type="button" class="empty-btn" @click="resetFilters">
        Clear All Filters
      </button>
    </div>

    <!-- Detail Drawers -->
    <MemberDetailDrawer
      :isOpen="isMemberDrawerOpen"
      :member="selectedMember"
      @close="isMemberDrawerOpen = false"
    />
    <TicketDetailDrawer />
  </div>
</template>

<style scoped>
.project-activity-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
}

.activity-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
  padding-bottom: var(--space-2);
}

.search-box {
  width: 280px;
}

.filters-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.filter-select {
  height: 32px;
  padding: 0 var(--space-3);
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-xs);
  outline: none;
  cursor: pointer;
  transition: border-color var(--transition-fast);
}

.filter-select:focus {
  border-color: var(--color-primary-500);
}

.reset-btn {
  background: none;
  border: none;
  color: var(--color-primary-400);
  font-size: var(--text-xs);
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
}

.reset-btn:hover {
  text-decoration: underline;
}

.timeline-wrapper {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12) var(--space-4);
  background-color: var(--bg-surface);
  border: 1px dashed var(--border-default);
  border-radius: var(--radius-lg);
  text-align: center;
  gap: var(--space-3);
}

.empty-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background-color: var(--bg-surface-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.empty-title {
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.empty-desc {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  max-width: 320px;
  margin: 0;
}

.empty-btn {
  font-size: var(--text-xs);
  color: var(--color-primary-400);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
}
</style>
