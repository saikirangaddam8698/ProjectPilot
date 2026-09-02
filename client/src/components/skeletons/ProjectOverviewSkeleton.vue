<script setup>
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue';
import KpiSkeleton from './KpiSkeleton.vue';
</script>

<template>
  <div class="overview-skeleton-container" aria-label="Loading project overview" aria-busy="true">
    <!-- Hero Banner Skeleton -->
    <div class="hero-skeleton-card">
      <div class="hero-top-row">
        <div class="hero-title-group">
          <BaseSkeleton width="44px" height="44px" rounded="lg" />
          <div class="hero-text-meta">
            <BaseSkeleton width="220px" height="22px" rounded="sm" />
            <BaseSkeleton width="120px" height="13px" rounded="xs" />
          </div>
        </div>
        <div class="hero-badges">
          <BaseSkeleton width="80px" height="24px" rounded="full" />
          <BaseSkeleton width="90px" height="24px" rounded="full" />
        </div>
      </div>
      <div class="hero-desc-skeleton">
        <BaseSkeleton width="85%" height="14px" rounded="xs" />
        <BaseSkeleton width="60%" height="14px" rounded="xs" />
      </div>
    </div>

    <!-- 4-Card KPI Metrics Grid -->
    <KpiSkeleton :count="4" />

    <!-- Split Grid: Active Sprint Widget (2 cols) + Team & Activity (1 col) -->
    <div class="overview-split-grid">
      <!-- Left Column: Active Sprint & Health details -->
      <div class="left-split-column">
        <div class="widget-skeleton-card">
          <div class="widget-header-skeleton">
            <BaseSkeleton width="140px" height="18px" rounded="sm" />
            <BaseSkeleton width="60px" height="20px" rounded="full" />
          </div>
          <BaseSkeleton width="100%" height="70px" rounded="md" />
          <div class="mini-metrics-row">
            <BaseSkeleton width="22%" height="45px" rounded="md" />
            <BaseSkeleton width="22%" height="45px" rounded="md" />
            <BaseSkeleton width="22%" height="45px" rounded="md" />
            <BaseSkeleton width="22%" height="45px" rounded="md" />
          </div>
        </div>

        <div class="widget-skeleton-card">
          <div class="widget-header-skeleton">
            <BaseSkeleton width="120px" height="18px" rounded="sm" />
            <BaseSkeleton width="40px" height="18px" rounded="xs" />
          </div>
          <BaseSkeleton width="100%" height="120px" rounded="md" />
        </div>
      </div>

      <!-- Right Column: Team Roster & Recent Activity -->
      <div class="right-split-column">
        <div class="widget-skeleton-card">
          <div class="widget-header-skeleton">
            <BaseSkeleton width="100px" height="18px" rounded="sm" />
            <BaseSkeleton width="30px" height="18px" rounded="full" />
          </div>
          <div class="team-roster-skeleton">
            <div v-for="m in 4" :key="m" class="team-member-item-skeleton">
              <BaseSkeleton width="32px" height="32px" rounded="full" />
              <div class="member-meta-skeleton">
                <BaseSkeleton width="100px" height="14px" rounded="xs" />
                <BaseSkeleton width="70px" height="11px" rounded="xs" />
              </div>
            </div>
          </div>
        </div>

        <div class="widget-skeleton-card">
          <div class="widget-header-skeleton">
            <BaseSkeleton width="110px" height="18px" rounded="sm" />
          </div>
          <div class="activity-feed-mini-skeleton">
            <div v-for="a in 3" :key="a" class="activity-mini-item">
              <BaseSkeleton width="20px" height="20px" rounded="full" />
              <div class="activity-mini-text">
                <BaseSkeleton width="100%" height="12px" rounded="xs" />
                <BaseSkeleton width="60px" height="10px" rounded="xs" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overview-skeleton-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  width: 100%;
}

.hero-skeleton-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.hero-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hero-title-group {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.hero-text-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.hero-badges {
  display: flex;
  gap: var(--space-2);
}

.hero-desc-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.overview-split-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-6);
}

.left-split-column,
.right-split-column {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.widget-skeleton-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.widget-header-skeleton {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mini-metrics-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
}

.team-roster-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.team-member-item-skeleton {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.member-meta-skeleton {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.activity-feed-mini-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.activity-mini-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
}

.activity-mini-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
}

@media (max-width: 1024px) {
  .overview-split-grid {
    grid-template-columns: 1fr;
  }
}
</style>
