<script setup>
import { onMounted, watch } from 'vue';
import { initTheme } from '@/composables/useTheme';
import { useAuthStore } from '@/stores/auth.store';
import { useProjectStore } from '@/stores/project.store';
import { useTicketStore } from '@/stores/ticket.store';
import { useSprintStore } from '@/stores/sprint.store';
import { useActivityStore } from '@/stores/activity.store';

import { useUiStore } from '@/stores/ui.store';
import SessionExpiredModal from '@/components/ui/SessionExpiredModal.vue';
import AccessDeniedModal from '@/components/ui/AccessDeniedModal.vue';

const authStore = useAuthStore();
const uiStore = useUiStore();
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

// When user authenticates or session restores, fetch domain data and ensure sidebar is open
watch(
  () => authStore.isAuthenticated,
  (isAuth) => {
    if (isAuth) {
      uiStore.openSidebar();
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
    <!-- Top Route & Data Hydration Progress Loader Bar -->
    <div
      v-if="uiStore.isNavigating || uiStore.isAnyOperationRunning || projectStore.isLoading || ticketStore.isLoading || sprintStore.isLoading"
      class="top-progress-bar"
      role="progressbar"
      aria-label="Loading application operations"
    >
      <div class="progress-indicator"></div>
    </div>
    <RouterView />
    <SessionExpiredModal />
    <AccessDeniedModal />
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
  position: relative;
}

.top-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 999999;
  background-color: rgba(99, 102, 241, 0.15);
  overflow: hidden;
  pointer-events: none;
}

.progress-indicator {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #818cf8, #a5b4fc);
  animation: indeterminateProgress 1.2s infinite ease-in-out;
  transform-origin: 0% 50%;
}

@keyframes indeterminateProgress {
  0% {
    transform: translateX(-100%) scaleX(0.2);
  }
  50% {
    transform: translateX(0%) scaleX(0.5);
  }
  100% {
    transform: translateX(100%) scaleX(1);
  }
}
</style>
