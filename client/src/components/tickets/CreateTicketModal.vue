<script setup>
import { ref, watch, computed } from 'vue';
import { useProjectStore } from '@/stores/project.store';
import { useTicketStore } from '@/stores/ticket.store';
import { useSprintStore } from '@/stores/sprint.store';
import BaseModal from '@/components/ui/BaseModal.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseInput from '@/components/ui/BaseInput.vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';

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

const emit = defineEmits(['update:modelValue', 'created', 'close']);

const projectStore = useProjectStore();
const ticketStore = useTicketStore();
const sprintStore = useSprintStore();

const selectedProjectKey = ref('PILOT');
const form = ref({
  title: '',
  description: '',
  type: 'Task',
  priority: 'Medium',
  status: 'Todo',
  assigneeId: '',
  sprintId: 'backlog',
  storyPoints: 3,
  labels: '',
  dueDate: ''
});

const errors = ref({
  title: '',
  project: ''
});

const isSubmitting = ref(false);

// Active project object
const currentProject = computed(() => {
  return projectStore.getProjectByKey(selectedProjectKey.value) || projectStore.allProjects[0];
});

// Available assignees based on selected project
const projectMembers = computed(() => {
  return currentProject.value?.members || [];
});

// Available sprints for selected project
const availableProjectSprints = computed(() => {
  return sprintStore.getSprintsByProject(selectedProjectKey.value).filter((s) => s.status !== 'completed');
});

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      const defaultKey = projectStore.activeProject?.key || projectStore.allProjects[0]?.key || 'PILOT';
      const candidateKey = props.projectKey || ticketStore.createModalProjectKey || defaultKey;
      const isCandidateAccessible = projectStore.allProjects.some((p) => p.key.toUpperCase() === candidateKey.toUpperCase());
      const targetKey = isCandidateAccessible ? candidateKey : defaultKey;
      selectedProjectKey.value = targetKey;

      const project = projectStore.getProjectByKey(targetKey);
      const defaultAssigneeId = project?.members?.[0]?.id || '';
      const activeSprint = sprintStore.getActiveSprint(targetKey);

      form.value = {
        title: '',
        description: '',
        type: 'Task',
        priority: 'Medium',
        status: 'Todo',
        assigneeId: defaultAssigneeId,
        sprintId: activeSprint ? activeSprint.id : 'backlog',
        storyPoints: 3,
        labels: '',
        dueDate: ''
      };
      errors.value = { title: '', project: '' };
    }
  },
  { immediate: true }
);

function validate() {
  let valid = true;
  if (!form.value.title.trim()) {
    errors.value.title = 'Ticket title is required.';
    valid = false;
  } else if (form.value.title.trim().length < 3) {
    errors.value.title = 'Title must be at least 3 characters.';
    valid = false;
  } else {
    errors.value.title = '';
  }

  if (!selectedProjectKey.value) {
    errors.value.project = 'Project is required.';
    valid = false;
  } else {
    errors.value.project = '';
  }

  return valid;
}

function handleSubmit() {
  if (!validate()) return;

  isSubmitting.value = true;
  try {
    const assigneeObj = projectMembers.value.find((m) => m.id === form.value.assigneeId) || {
      id: 'm-1',
      name: 'Alex Morgan',
      avatar: 'AM',
      role: 'Project Admin'
    };

    const selectedSprint = form.value.sprintId !== 'backlog'
      ? sprintStore.getSprintById(form.value.sprintId)
      : null;

    const newTicket = ticketStore.createTicket({
      projectKey: selectedProjectKey.value,
      title: form.value.title,
      description: form.value.description,
      type: form.value.type,
      priority: form.value.priority,
      status: form.value.status,
      assignee: assigneeObj,
      sprintId: selectedSprint ? selectedSprint.id : null,
      sprint: selectedSprint ? selectedSprint.name : 'Backlog',
      storyPoints: Number(form.value.storyPoints) || 0,
      labels: form.value.labels,
      dueDate: form.value.dueDate || null
    });

    emit('created', newTicket);
    handleClose();
  } catch (err) {
    console.error('Error creating ticket:', err);
  } finally {
    isSubmitting.value = false;
  }
}

function handleClose() {
  emit('update:modelValue', false);
  ticketStore.closeCreateModal();
  emit('close');
}
</script>

<template>
  <BaseModal
    :modelValue="modelValue || ticketStore.isCreateModalOpen"
    @update:modelValue="handleClose"
    @close="handleClose"
    size="lg"
    title="Create Ticket"
    description="Create a task, story, or bug in the selected project workspace."
  >
    <form @submit.prevent="handleSubmit" class="create-ticket-form">
      <!-- Project Selection & Issue Type Row -->
      <div class="form-row-dual">
        <div class="form-group">
          <label for="ticket-project" class="form-label required">Target Project Workspace</label>
          <select id="ticket-project" v-model="selectedProjectKey" class="form-select">
            <option
              v-for="p in projectStore.allProjects"
              :key="p.id"
              :value="p.key"
            >
              {{ p.name }} ({{ p.key }})
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="ticket-type" class="form-label required">Issue Type</label>
          <select id="ticket-type" v-model="form.type" class="form-select">
            <option value="Task">Task</option>
            <option value="Story">Story / Feature</option>
            <option value="Bug">Bug / Defect</option>
            <option value="Epic">Epic</option>
          </select>
        </div>
      </div>

      <!-- Ticket Title -->
      <div class="form-group">
        <label for="ticket-title" class="form-label required">Title / Summary</label>
        <BaseInput
          id="ticket-title"
          v-model="form.title"
          placeholder="e.g. Implement pgvector cosine similarity search query"
          :error="errors.title"
          autocomplete="off"
        />
      </div>

      <!-- Description -->
      <div class="form-group">
        <label for="ticket-desc" class="form-label">Description</label>
        <textarea
          id="ticket-desc"
          v-model="form.description"
          rows="4"
          class="form-textarea"
          placeholder="Provide technical context, acceptance criteria, or steps to reproduce..."
        ></textarea>
      </div>

      <!-- Status & Priority Row -->
      <div class="form-row-triple">
        <div class="form-group">
          <label for="ticket-status" class="form-label">Initial Status</label>
          <select id="ticket-status" v-model="form.status" class="form-select">
            <option value="Backlog">Backlog</option>
            <option value="Todo">Todo</option>
            <option value="In Progress">In Progress</option>
            <option value="In Review">In Review</option>
            <option value="Done">Done</option>
          </select>
        </div>

        <div class="form-group">
          <label for="ticket-priority" class="form-label">Priority</label>
          <select id="ticket-priority" v-model="form.priority" class="form-select">
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent (Blocker)</option>
          </select>
        </div>

        <div class="form-group">
          <label for="ticket-points" class="form-label">Story Points</label>
          <select id="ticket-points" v-model="form.storyPoints" class="form-select">
            <option :value="1">1 pt</option>
            <option :value="2">2 pts</option>
            <option :value="3">3 pts</option>
            <option :value="5">5 pts</option>
            <option :value="8">8 pts</option>
            <option :value="13">13 pts</option>
          </select>
        </div>
      </div>

      <!-- Assignee & Sprint Row -->
      <div class="form-row-dual">
        <div class="form-group">
          <label for="ticket-assignee" class="form-label">Assignee</label>
          <select id="ticket-assignee" v-model="form.assigneeId" class="form-select">
            <option v-for="m in projectMembers" :key="m.id" :value="m.id">
              {{ m.name }} ({{ m.role }})
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="ticket-sprint" class="form-label">Sprint Target</label>
          <select id="ticket-sprint" v-model="form.sprintId" class="form-select">
            <option value="backlog">Product Backlog (Unassigned)</option>
            <option
              v-for="s in availableProjectSprints"
              :key="s.id"
              :value="s.id"
            >
              {{ s.name }} ({{ s.status }})
            </option>
          </select>
        </div>
      </div>

      <!-- Labels & Due Date Row -->
      <div class="form-row-dual">
        <div class="form-group">
          <label for="ticket-labels" class="form-label">Labels (comma separated)</label>
          <BaseInput
            id="ticket-labels"
            v-model="form.labels"
            placeholder="e.g. backend, database, perf"
          />
        </div>

        <div class="form-group">
          <label for="ticket-due" class="form-label">Target Due Date</label>
          <input
            id="ticket-due"
            type="date"
            v-model="form.dueDate"
            class="form-date-input"
          />
        </div>
      </div>
    </form>

    <template #footer>
      <BaseButton variant="ghost" size="md" @click="handleClose">
        Cancel
      </BaseButton>
      <BaseButton
        variant="primary"
        size="md"
        :loading="isSubmitting"
        @click="handleSubmit"
      >
        Create Ticket
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.create-ticket-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
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

.form-row-triple {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-4);
}

.form-select,
.form-date-input {
  height: 36px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 0 var(--space-3);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  outline: none;
  cursor: pointer;
  transition: border-color var(--transition-fast);
  width: 100%;
}

.form-select:focus,
.form-date-input:focus {
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

@media (max-width: 640px) {
  .form-row-dual,
  .form-row-triple {
    grid-template-columns: 1fr;
  }
}
</style>
