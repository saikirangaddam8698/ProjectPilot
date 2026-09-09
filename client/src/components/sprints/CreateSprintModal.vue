<script setup>
import { ref, watch, computed } from 'vue';
import { useProjectStore } from '@/stores/project.store';
import { useSprintStore } from '@/stores/sprint.store';
import BaseModal from '@/components/ui/BaseModal.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseInput from '@/components/ui/BaseInput.vue';
import BaseSelect from '@/components/ui/BaseSelect.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  projectKey: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['update:modelValue', 'created', 'updated', 'close']);

const projectStore = useProjectStore();
const sprintStore = useSprintStore();

const projectOptions = computed(() => {
  return projectStore.allProjects.map((p) => ({
    value: p.key,
    label: `${p.name} (${p.key})`
  }));
});

const selectedProjectKey = ref('PILOT');
const form = ref({
  name: '',
  goal: '',
  startDate: '',
  endDate: '',
  capacity: 35
});

const errors = ref({
  name: '',
  goal: '',
  dates: '',
  project: ''
});

const isEditing = computed(() => !!sprintStore.editingSprint);

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      if (sprintStore.editingSprint) {
        const s = sprintStore.editingSprint;
        selectedProjectKey.value = s.projectKey;
        form.value = {
          name: s.name,
          goal: s.goal,
          startDate: s.startDate,
          endDate: s.endDate,
          capacity: s.capacity || 30
        };
      } else {
        const defaultKey = projectStore.activeProject?.key || projectStore.allProjects[0]?.key || 'PILOT';
        const candidateKey = props.projectKey || sprintStore.createModalProjectKey || defaultKey;
        const isCandidateAccessible = projectStore.allProjects.some((p) => p.key.toUpperCase() === candidateKey.toUpperCase());
        const targetKey = isCandidateAccessible ? candidateKey : defaultKey;
        selectedProjectKey.value = targetKey;
        const defaultStart = new Date().toISOString().slice(0, 10);
        const defaultEnd = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
        const existingCount = sprintStore.getSprintsByProject(targetKey).length;

        form.value = {
          name: `Sprint ${existingCount + 24}`,
          goal: '',
          startDate: defaultStart,
          endDate: defaultEnd,
          capacity: 35
        };
      }
      errors.value = { name: '', goal: '', dates: '', project: '' };
    }
  },
  { immediate: true }
);

function validate() {
  let valid = true;
  errors.value = { name: '', goal: '', dates: '', project: '' };

  if (!form.value.name.trim()) {
    errors.value.name = 'Sprint name is required.';
    valid = false;
  }

  if (!form.value.goal.trim()) {
    errors.value.goal = 'Sprint goal is required.';
    valid = false;
  }

  if (!form.value.startDate || !form.value.endDate) {
    errors.value.dates = 'Both start and end dates are required.';
    valid = false;
  } else if (new Date(form.value.endDate) <= new Date(form.value.startDate)) {
    errors.value.dates = 'End date must be after the start date.';
    valid = false;
  }

  if (!selectedProjectKey.value) {
    errors.value.project = 'Project workspace is required.';
    valid = false;
  }

  return valid;
}

const isSubmitting = ref(false);

async function handleSubmit() {
  if (!validate()) return;

  isSubmitting.value = true;
  try {
    if (isEditing.value) {
      const updated = await sprintStore.updateSprint(sprintStore.editingSprint.id, {
        name: form.value.name,
        goal: form.value.goal,
        startDate: form.value.startDate,
        endDate: form.value.endDate,
        capacity: Number(form.value.capacity) || 30
      });
      emit('updated', updated);
    } else {
      const newSprint = await sprintStore.createSprint({
        projectKey: selectedProjectKey.value,
        name: form.value.name,
        goal: form.value.goal,
        startDate: form.value.startDate,
        endDate: form.value.endDate,
        capacity: Number(form.value.capacity) || 30
      });
      emit('created', newSprint);
    }

    handleClose();
  } catch (err) {
    console.error('Error submitting sprint:', err);
  } finally {
    isSubmitting.value = false;
  }
}

function handleClose() {
  emit('update:modelValue', false);
  sprintStore.closeCreateModal();
  emit('close');
}
</script>

<template>
  <BaseModal
    :modelValue="modelValue || sprintStore.isCreateModalOpen"
    @update:modelValue="handleClose"
    @close="handleClose"
    size="md"
    :title="isEditing ? 'Edit Sprint' : 'Plan New Sprint'"
    :description="isEditing ? 'Update sprint parameters, timeframe, or point capacity.' : 'Configure an agile sprint cadence and delivery commitment.'"
  >
    <form @submit.prevent="handleSubmit" class="sprint-form">
      <!-- Project Selection (Disabled in edit mode) -->
      <div class="form-group">
        <label for="sprint-project" class="form-label required">Target Project Workspace</label>
        <BaseSelect
          id="sprint-project"
          v-model="selectedProjectKey"
          :options="projectOptions"
          :disabled="isEditing || !!projectKey"
          size="md"
        />
        <span v-if="errors.project" class="form-error">{{ errors.project }}</span>
      </div>

      <!-- Sprint Name -->
      <div class="form-group">
        <label for="sprint-name" class="form-label required">Sprint Name</label>
        <BaseInput
          id="sprint-name"
          v-model="form.name"
          placeholder="e.g. Sprint 25 — Security & Workspaces"
          :error="errors.name"
          autocomplete="off"
        />
      </div>

      <!-- Sprint Goal -->
      <div class="form-group">
        <label for="sprint-goal" class="form-label required">Sprint Goal</label>
        <textarea
          id="sprint-goal"
          v-model="form.goal"
          rows="3"
          class="form-textarea"
          :class="{ 'has-error': errors.goal }"
          placeholder="What is the primary deliverable or outcome for this sprint?"
        ></textarea>
        <span v-if="errors.goal" class="form-error">{{ errors.goal }}</span>
      </div>

      <!-- Date Range (Start & End) -->
      <div class="form-row-dual">
        <div class="form-group">
          <label for="sprint-start" class="form-label required">Start Date</label>
          <input
            id="sprint-start"
            type="date"
            v-model="form.startDate"
            class="form-date-input"
          />
        </div>

        <div class="form-group">
          <label for="sprint-end" class="form-label required">End Date</label>
          <input
            id="sprint-end"
            type="date"
            v-model="form.endDate"
            class="form-date-input"
          />
        </div>
      </div>
      <span v-if="errors.dates" class="form-error">{{ errors.dates }}</span>

      <!-- Story Point Capacity -->
      <div class="form-group">
        <label for="sprint-capacity" class="form-label">Story Point Capacity Target</label>
        <div class="capacity-input-row">
          <input
            id="sprint-capacity"
            type="number"
            min="1"
            max="200"
            v-model="form.capacity"
            class="form-capacity-input"
          />
          <span class="capacity-unit-text">story points committed capacity</span>
        </div>
      </div>
    </form>

    <template #footer>
      <BaseButton variant="close" size="md" @click="handleClose">
        Cancel
      </BaseButton>
      <BaseButton
        variant="primary"
        size="md"
        :loading="isSubmitting"
        @click="handleSubmit"
      >
        {{ isSubmitting ? (isEditing ? 'Updating Sprint...' : 'Creating Sprint...') : (isEditing ? 'Save Sprint Changes' : 'Create Sprint') }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.sprint-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.form-label {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.form-label.required::after {
  content: ' *';
  color: var(--color-danger-500);
}

.form-row-dual {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.form-select,
.form-date-input,
.form-capacity-input {
  height: 36px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 0 var(--space-3);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  outline: none;
  transition: border-color var(--transition-fast);
  width: 100%;
}

.form-capacity-input {
  width: 90px;
}

.capacity-input-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.capacity-unit-text {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.form-select:focus,
.form-date-input:focus,
.form-capacity-input:focus {
  border-color: var(--border-focus);
}

.form-textarea {
  width: 100%;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  outline: none;
  resize: vertical;
  transition: border-color var(--transition-fast);
}

.form-textarea:focus {
  border-color: var(--border-focus);
}

.form-textarea.has-error {
  border-color: var(--color-danger-500);
}

.form-error {
  font-size: var(--text-xs);
  color: var(--color-danger-500);
  margin-top: 2px;
}

@media (max-width: 640px) {
  .form-row-dual {
    grid-template-columns: 1fr;
  }
}
</style>
