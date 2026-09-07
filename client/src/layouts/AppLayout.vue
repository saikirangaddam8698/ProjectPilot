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
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
