<script setup>
import { onMounted, watch } from 'vue';
import { initTheme } from '@/composables/useTheme';
import { useAuthStore } from '@/stores/auth.store';
import { useProjectStore } from '@/stores/project.store';
import { useTicketStore } from '@/stores/ticket.store';
import { useSprintStore } from '@/stores/sprint.store';
import { useActivityStore } from '@/stores/activity.store';

const authStore = useAuthStore();
const projectStore = useProjectStore();
const ticketStore = useTicketStore();
const sprintStore = useSprintStore();
const activityStore = useActivityStore();

function loadDomainData() {
  projectStore.fetchProjects();
  ticketStore.fetchTickets();
  sprintStore.fetchSprints();
  activityStore.fetchActivities();
}

// When user authenticates or session restores, fetch domain data
watch(
  () => authStore.isAuthenticated,
  (isAuth) => {
    if (isAuth) {
      loadDomainData();
    }
  }
);

onMounted(async () => {
  initTheme();

  const isAuth = await authStore.checkAuth();
  if (isAuth) {
    loadDomainData();
  }
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
