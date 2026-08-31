<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
});

const route = useRoute();

const sectionName = computed(() => {
  return route.meta?.section || 'Workspace Section';
});

const sectionDescriptions = {
  Board: 'Interactive multi-column Kanban board for sprint execution with drag-and-drop ticket movement.',
  Backlog: 'Product backlog grooming, story point estimation, and sprint commitment management.',
  Tickets: 'Searchable, filterable list of all project tickets across epics, stories, bugs, and tasks.',
  Sprints: 'Historical sprint cadence velocity, active sprint burndown tracking, and completion workflows.',
  Analytics: 'Velocity trends, cumulative flow diagrams, and cycle time metrics for this project workspace.',
  Knowledge: 'Project documentation, architectural decision records (ADRs), and pgvector semantic search.',
  Activity: 'Field-level audit trail recording all ticket transitions, comments, and sprint changes.',
  Settings: 'Project configuration, project key prefix, member permissions, and tool integration policies.'
};

const description = computed(() => {
  return sectionDescriptions[sectionName.value] || 'Manage project items and settings.';
});
</script>

<template>
  <div class="placeholder-section-container">
    <div class="placeholder-header">
      <div>
        <div class="section-title-row">
          <h3 class="section-title">{{ project.name }} — {{ sectionName }}</h3>
          <BaseBadge variant="neutral" size="sm">Project Scoped: {{ project.key }}</BaseBadge>
        </div>
        <p class="section-desc">{{ description }}</p>
      </div>

      <div class="header-actions">
        <BaseButton variant="outline" size="sm" :to="`/projects/${project.key}/overview`">
          ← Back to Overview
        </BaseButton>
      </div>
    </div>

    <!-- Scoped Context Card -->
    <div class="placeholder-card">
      <div class="placeholder-icon-wrap">
        <AppIcon :name="sectionName === 'Board' ? 'tickets' : sectionName === 'Analytics' ? 'analytics' : sectionName === 'Knowledge' ? 'knowledge' : sectionName === 'Settings' ? 'settings' : 'projects'" :size="28" />
      </div>

      <h4 class="card-heading">{{ sectionName }} for {{ project.name }}</h4>
      <p class="card-text">
        This section is scoped to <strong>{{ project.key }}</strong> ({{ project.ticketCount }} tickets tracked across {{ project.members.length }} members).
      </p>

      <div class="roadmap-pill">
        <span class="roadmap-badge">Roadmap</span>
        <span class="text-secondary text-xs">Scheduled for implementation in upcoming project engineering tasks.</span>
      </div>

      <div class="quick-links">
        <BaseButton variant="secondary" size="sm" :to="`/projects/${project.key}/overview`">
          Go to Overview Dashboard
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.placeholder-section-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.placeholder-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  flex-wrap: wrap;
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.section-title {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.section-desc {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin-top: 2px;
}

.placeholder-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-10) var(--space-6);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-4);
}

.placeholder-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-lg);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary-400);
}

.card-heading {
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.card-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  max-width: 500px;
}

.roadmap-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 4px var(--space-3);
  border-radius: var(--radius-full);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
}

.roadmap-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  background-color: var(--color-primary-600);
  color: #FFFFFF;
  padding: 1px 5px;
  border-radius: var(--radius-xs);
}

.quick-links {
  margin-top: var(--space-2);
}
</style>
