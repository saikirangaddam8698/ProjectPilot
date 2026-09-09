<script setup>
import AppShell from '@/components/layout/AppShell.vue';
</script>

<template>
  <AppShell>
    <div class="page-content-wrapper">
      <router-view v-slot="{ Component }">
        <Transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </router-view>
    </div>
  </AppShell>
</template>

<style scoped>
.page-content-wrapper {
  width: 100%;
}

/* Page Transition Effects */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 200ms var(--motion-spring, cubic-bezier(0.16, 1, 0.3, 1)),
              transform 200ms var(--motion-spring, cubic-bezier(0.16, 1, 0.3, 1));
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .page-fade-enter-active,
  .page-fade-leave-active {
    transition: none !important;
    transform: none !important;
  }
}
</style>
