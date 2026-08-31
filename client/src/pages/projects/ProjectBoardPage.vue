<script setup>
import KanbanBoard from '@/components/tickets/KanbanBoard.vue';

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
});
</script>

<template>
  <div class="project-board-page">
    <KanbanBoard :projectKey="project.key" />
  </div>
</template>

<style scoped>
.project-board-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
}
</style>
