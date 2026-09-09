<script setup>
import { ref } from 'vue';
import { useProjectStore } from '@/stores/project.store';
import BaseModal from '@/components/ui/BaseModal.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseInput from '@/components/ui/BaseInput.vue';
import BaseSelect from '@/components/ui/BaseSelect.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'invited', 'close']);

const projectStore = useProjectStore();

const roleOptions = [
  { value: 'Project Admin', label: 'Project Admin' },
  { value: 'Senior Developer', label: 'Senior Developer' },
  { value: 'Developer', label: 'Developer' },
  { value: 'DevOps Lead', label: 'DevOps Lead' },
  { value: 'DevOps Engineer', label: 'DevOps Engineer' },
  { value: 'AI / ML Engineer', label: 'AI / ML Engineer' },
  { value: 'QA Lead', label: 'QA Lead' },
  { value: 'Viewer', label: 'Viewer' }
];

const statusOptions = [
  { value: 'Active', label: 'Active' },
  { value: 'Away', label: 'Away' },
  { value: 'Offline', label: 'Offline' }
];

const form = ref({
  name: '',
  email: '',
  role: 'Developer',
  department: 'Engineering',
  status: 'Active',
  capacity: 20,
  selectedProjects: ['PILOT']
});

const errors = ref({
  name: '',
  email: ''
});

function validate() {
  let valid = true;
  if (!form.value.name.trim()) {
    errors.value.name = 'Full name is required.';
    valid = false;
  } else {
    errors.value.name = '';
  }

  if (!form.value.email.trim()) {
    errors.value.email = 'Email is required.';
    valid = false;
  } else if (!form.value.email.includes('@')) {
    errors.value.email = 'Please provide a valid email address.';
    valid = false;
  } else {
    errors.value.email = '';
  }

  return valid;
}

function handleSubmit() {
  if (!validate()) return;

  const targetProjects = form.value.selectedProjects.length > 0
    ? form.value.selectedProjects
    : ['PILOT'];

  let createdMember = null;

  targetProjects.forEach((pkey) => {
    createdMember = projectStore.addMemberToProject(pkey, {
      name: form.value.name,
      email: form.value.email,
      role: form.value.role,
      department: form.value.department,
      status: form.value.status,
      capacity: Number(form.value.capacity) || 20
    });
  });

  emit('invited', createdMember);
  handleClose();
}

function handleClose() {
  form.value = {
    name: '',
    email: '',
    role: 'Developer',
    department: 'Engineering',
    status: 'Active',
    capacity: 20,
    selectedProjects: ['PILOT']
  };
  errors.value = { name: '', email: '' };
  emit('update:modelValue', false);
  emit('close');
}

function toggleProject(key) {
  const idx = form.value.selectedProjects.indexOf(key);
  if (idx === -1) {
    form.value.selectedProjects.push(key);
  } else {
    form.value.selectedProjects.splice(idx, 1);
  }
}
</script>

<template>
  <BaseModal
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    @close="handleClose"
    size="md"
    title="Invite Team Member"
    description="Invite a new contributor and assign them to workspace projects."
  >
    <form @submit.prevent="handleSubmit" class="invite-form">
      <div class="form-row">
        <div class="form-group flex-1">
          <label for="invite-name" class="form-label required">Full Name</label>
          <BaseInput
            id="invite-name"
            v-model="form.name"
            placeholder="e.g. Marcus Vance"
            :error="errors.name"
            autocomplete="off"
          />
        </div>

        <div class="form-group flex-1">
          <label for="invite-email" class="form-label required">Email Address</label>
          <BaseInput
            id="invite-email"
            v-model="form.email"
            type="email"
            placeholder="e.g. marcus.v@projectpilot.dev"
            :error="errors.email"
            autocomplete="off"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group flex-1">
          <label for="invite-role" class="form-label">Role</label>
          <BaseSelect
            id="invite-role"
            v-model="form.role"
            :options="roleOptions"
            size="md"
          />
        </div>

        <div class="form-group flex-1">
          <label for="invite-dept" class="form-label">Department</label>
          <input
            id="invite-dept"
            v-model="form.department"
            class="form-input-text"
            placeholder="e.g. Core Engineering"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group flex-1">
          <label for="invite-capacity" class="form-label">Weekly Point Target</label>
          <input
            id="invite-capacity"
            v-model="form.capacity"
            type="number"
            min="5"
            max="60"
            class="form-input-text"
          />
        </div>

        <div class="form-group flex-1">
          <label for="invite-status" class="form-label">Initial Status</label>
          <BaseSelect
            id="invite-status"
            v-model="form.status"
            :options="statusOptions"
            size="md"
          />
        </div>
      </div>

      <!-- Project Workspace Assignment -->
      <div class="form-group">
        <label class="form-label">Assign to Projects</label>
        <div class="project-checkbox-grid">
          <div
            v-for="p in projectStore.allProjects"
            :key="p.id"
            class="project-check-pill"
            :class="{ 'is-selected': form.selectedProjects.includes(p.key) }"
            @click="toggleProject(p.key)"
          >
            <span class="mono font-bold">{{ p.key }}</span>
            <span class="truncate">{{ p.name }}</span>
            <span v-if="form.selectedProjects.includes(p.key)" class="check-icon">✓</span>
          </div>
        </div>
      </div>
    </form>

    <template #footer>
      <BaseButton variant="close" size="md" @click="handleClose">
        Cancel
      </BaseButton>
      <BaseButton variant="primary" size="md" @click="handleSubmit">
        Send Invitation
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.invite-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-row {
  display: flex;
  gap: var(--space-3);
}

.flex-1 {
  flex: 1;
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

.form-select,
.form-input-text {
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
}

.form-select:focus,
.form-input-text:focus {
  border-color: var(--border-focus);
}

.project-checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-2);
}

.project-check-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.project-check-pill:hover {
  border-color: var(--border-default);
}

.project-check-pill.is-selected {
  border-color: var(--color-primary-500);
  background-color: var(--bg-surface-active);
  color: var(--color-primary-500);
}

.check-icon {
  font-weight: var(--font-weight-bold);
}
</style>
