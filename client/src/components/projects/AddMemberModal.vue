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
  },
  projectKey: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'added', 'close']);

const projectStore = useProjectStore();

const roleOptions = [
  { value: 'Project Admin', label: 'Project Admin (Full Control)' },
  { value: 'Senior Developer', label: 'Senior Developer' },
  { value: 'Developer', label: 'Developer' },
  { value: 'DevOps Engineer', label: 'DevOps Engineer' },
  { value: 'QA Lead', label: 'QA Lead' },
  { value: 'Viewer', label: 'Viewer (Read Only)' }
];

const form = ref({
  name: '',
  email: '',
  role: 'Developer'
});

const errors = ref({
  name: '',
  email: ''
});

function validate() {
  let valid = true;
  if (!form.value.name.trim()) {
    errors.value.name = 'Member name is required.';
    valid = false;
  } else {
    errors.value.name = '';
  }

  if (!form.value.email.trim()) {
    errors.value.email = 'Email address is required.';
    valid = false;
  } else if (!form.value.email.includes('@')) {
    errors.value.email = 'Please enter a valid email address.';
    valid = false;
  } else {
    errors.value.email = '';
  }

  return valid;
}

const isSubmitting = ref(false);

async function handleSubmit() {
  if (!validate()) return;

  isSubmitting.value = true;
  try {
    const added = await projectStore.addMemberToProject(props.projectKey, {
      name: form.value.name,
      email: form.value.email,
      role: form.value.role
    });

    emit('added', added);
    handleClose();
  } catch (err) {
    console.error('Failed to add member:', err);
  } finally {
    isSubmitting.value = false;
  }
}

function handleClose() {
  form.value = { name: '', email: '', role: 'Developer' };
  errors.value = { name: '', email: '' };
  emit('update:modelValue', false);
  emit('close');
}
</script>

<template>
  <BaseModal
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    @close="handleClose"
    size="sm"
    title="Add Team Member"
    description="Assign a new team member to this project workspace."
  >
    <form @submit.prevent="handleSubmit" class="add-member-form">
      <div class="form-group">
        <label for="member-name" class="form-label required">Full Name</label>
        <BaseInput
          id="member-name"
          v-model="form.name"
          placeholder="e.g. Jordan Lee"
          :error="errors.name"
          autocomplete="off"
        />
      </div>

      <div class="form-group">
        <label for="member-email" class="form-label required">Email Address</label>
        <BaseInput
          id="member-email"
          v-model="form.email"
          type="email"
          placeholder="e.g. jordan.l@projectpilot.dev"
          :error="errors.email"
          autocomplete="off"
        />
      </div>

      <div class="form-group">
        <label for="member-role" class="form-label">Project Role</label>
        <BaseSelect
          id="member-role"
          v-model="form.role"
          :options="roleOptions"
          size="md"
        />
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
        {{ isSubmitting ? 'Adding Member...' : 'Add Member' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.add-member-form {
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

.form-select {
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
}

.form-select:focus {
  border-color: var(--border-focus);
}
</style>
