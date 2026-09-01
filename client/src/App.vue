<script setup>
import { onMounted } from 'vue';
import { initTheme } from '@/composables/useTheme';

onMounted(() => {
  initTheme();
});
</script>

<template>
  <div id="projectpilot-root">
    <RouterView />
  </div>
</template>

<style>
#projectpilot-root {
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-app);
  overflow: hidden;
}
</style>
