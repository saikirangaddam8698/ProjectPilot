<script setup>
import { useUiStore } from '@/stores/ui.store';
import AppShell from '@/components/layout/AppShell.vue';
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue';

const uiStore = useUiStore();
</script>

<template>
  <AppShell>
    <!-- Consistent 1-second Skeleton UI loader on route changes / initial load -->
    <Transition name="page-fade" mode="out-in">
      <div v-if="uiStore.isPageLoading" key="skeleton" class="page-skeleton-container" aria-hidden="true">
        <div class="skeleton-header">
          <BaseSkeleton type="text" width="260px" height="28px" />
          <BaseSkeleton type="text" width="400px" height="16px" />
        </div>
        <div class="skeleton-cards-grid">
          <BaseSkeleton type="rect" height="110px" />
          <BaseSkeleton type="rect" height="110px" />
          <BaseSkeleton type="rect" height="110px" />
          <BaseSkeleton type="rect" height="110px" />
        </div>
        <div class="skeleton-content-block">
          <BaseSkeleton type="rect" height="380px" />
        </div>
      </div>

      <div v-else key="content" class="page-content-wrapper">
        <router-view v-slot="{ Component }">
          <template v-if="Component">
            <Suspense>
              <component :is="Component" />
              <template #fallback>
                <div class="page-skeleton-container">
                  <div class="skeleton-header">
                    <BaseSkeleton type="text" width="260px" height="28px" />
                    <BaseSkeleton type="text" width="400px" height="16px" />
                  </div>
                  <div class="skeleton-cards-grid">
                    <BaseSkeleton type="rect" height="110px" />
                    <BaseSkeleton type="rect" height="110px" />
                    <BaseSkeleton type="rect" height="110px" />
                    <BaseSkeleton type="rect" height="110px" />
                  </div>
                  <BaseSkeleton type="rect" height="380px" />
                </div>
              </template>
            </Suspense>
          </template>
        </router-view>
      </div>
    </Transition>
  </AppShell>
</template>

<style scoped>
.page-skeleton-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
  padding: var(--space-2) 0;
  animation: fadeIn 0.2s ease-in-out;
}

.skeleton-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.skeleton-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-4);
}

.skeleton-content-block {
  width: 100%;
}

.page-content-wrapper {
  width: 100%;
}

/* Page Transition Effects */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
