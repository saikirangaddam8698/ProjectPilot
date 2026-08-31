<script setup>
import { ref, computed, watch } from 'vue';
import { useTicketStore } from '@/stores/ticket.store';
import { useProjectStore } from '@/stores/project.store';
import { useSprintStore } from '@/stores/sprint.store';
import BaseDrawer from '@/components/ui/BaseDrawer.vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const ticketStore = useTicketStore();
const projectStore = useProjectStore();
const sprintStore = useSprintStore();

const isOpen = computed({
  get: () => !!ticketStore.activeTicketKey,
  set: (val) => {
    if (!val) ticketStore.closeTicketDetail();
  }
});

const ticket = computed(() => ticketStore.activeTicket);

const isEditingTitle = ref(false);
const editedTitle = ref('');
const isEditingDesc = ref(false);
const editedDesc = ref('');
const copiedToast = ref(false);

watch(
  () => ticket.value,
  (t) => {
    if (t) {
      editedTitle.value = t.title;
      editedDesc.value = t.description || '';
      isEditingTitle.value = false;
      isEditingDesc.value = false;
    }
  },
  { immediate: true }
);

const project = computed(() => {
  if (!ticket.value) return null;
  return projectStore.getProjectByKey(ticket.value.projectKey);
});

const availableMembers = computed(() => {
  return project.value?.members || [];
});

const availableSprints = computed(() => {
  if (!ticket.value) return [];
  return sprintStore.getSprintsByProject(ticket.value.projectKey).filter((s) => s.status !== 'completed');
});

function handleSprintChange(event) {
  if (!ticket.value) return;
  const newSprintId = event.target.value;
  if (newSprintId === 'backlog') {
    ticketStore.removeTicketFromSprint(ticket.value.key);
  } else {
    const s = sprintStore.getSprintById(newSprintId);
    ticketStore.assignTicketToSprint(ticket.value.key, newSprintId, s?.name);
  }
}

function handleStatusChange(newStatus) {
  if (!ticket.value) return;
  ticketStore.updateTicketStatus(ticket.value.key, newStatus);
}

function handlePriorityChange(newPriority) {
  if (!ticket.value) return;
  ticketStore.updateTicketPriority(ticket.value.key, newPriority);
}

function handleAssigneeChange(event) {
  if (!ticket.value) return;
  const memberId = event.target.value;
  const member = availableMembers.value.find((m) => m.id === memberId);
  if (member) {
    ticketStore.updateTicketAssignee(ticket.value.key, {
      id: member.id,
      name: member.name,
      avatar: member.avatar,
      role: member.role
    });
  }
}

function saveTitle() {
  if (!editedTitle.value.trim() || !ticket.value) return;
  ticketStore.updateTicket(ticket.value.key, { title: editedTitle.value.trim() });
  isEditingTitle.value = false;
}

function saveDesc() {
  if (!ticket.value) return;
  ticketStore.updateTicket(ticket.value.key, { description: editedDesc.value.trim() });
  isEditingDesc.value = false;
}

function copyKey() {
  if (!ticket.value) return;
  navigator.clipboard.writeText(ticket.value.key);
  copiedToast.value = true;
  setTimeout(() => {
    copiedToast.value = false;
  }, 2000);
}

function deleteCurrentTicket() {
  if (!ticket.value) return;
  if (confirm(`Are you sure you want to delete ${ticket.value.key}?`)) {
    ticketStore.deleteTicket(ticket.value.key);
  }
}

function getTypeBadgeVariant(type) {
  if (type === 'Bug') return 'danger';
  if (type === 'Story') return 'primary';
  if (type === 'Epic') return 'purple';
  return 'neutral';
}

function getPriorityBadgeVariant(p) {
  if (p === 'Urgent') return 'danger';
  if (p === 'High') return 'warning';
  if (p === 'Medium') return 'info';
  return 'neutral';
}
</script>

<template>
  <BaseDrawer
    v-model="isOpen"
    side="right"
    width="520px"
    :hideClose="false"
  >
    <template #header>
      <div v-if="ticket" class="drawer-header-custom">
        <div class="header-left-chips">
          <span class="project-pill mono">{{ ticket.projectKey }}</span>
          <span class="key-pill mono font-semibold">{{ ticket.key }}</span>
          <BaseBadge :variant="getTypeBadgeVariant(ticket.type)" size="sm">
            {{ ticket.type }}
          </BaseBadge>
        </div>

        <div class="header-right-actions">
          <button
            type="button"
            class="action-icon-btn"
            :title="copiedToast ? 'Copied to clipboard!' : 'Copy ticket key'"
            @click="copyKey"
          >
            <AppIcon :name="copiedToast ? 'check' : 'my-work'" :size="14" />
          </button>
        </div>
      </div>
    </template>

    <div v-if="ticket" class="ticket-drawer-content">
      <!-- Title Section -->
      <div class="title-section">
        <div v-if="!isEditingTitle" class="title-display" @click="isEditingTitle = true">
          <h3 class="ticket-title-text">{{ ticket.title }}</h3>
          <span class="edit-hint text-muted">Click to edit</span>
        </div>
        <div v-else class="title-edit-form">
          <BaseInput
            v-model="editedTitle"
            size="md"
            @keydown.enter="saveTitle"
            @keydown.esc="isEditingTitle = false"
            autocomplete="off"
          />
          <div class="edit-actions">
            <BaseButton variant="primary" size="xs" @click="saveTitle">Save</BaseButton>
            <BaseButton variant="ghost" size="xs" @click="isEditingTitle = false">Cancel</BaseButton>
          </div>
        </div>
      </div>

      <!-- Two Column Meta & Description Area -->
      <div class="drawer-body-grid">
        <!-- Main Body: Description & Details -->
        <div class="main-body-col">
          <!-- Description Box -->
          <div class="desc-box">
            <div class="desc-header">
              <span class="desc-label">Description</span>
              <button
                v-if="!isEditingDesc"
                type="button"
                class="desc-edit-link text-muted"
                @click="isEditingDesc = true"
              >
                Edit
              </button>
            </div>

            <div v-if="!isEditingDesc" class="desc-content" @click="isEditingDesc = true">
              <p v-if="ticket.description" class="desc-text">{{ ticket.description }}</p>
              <p v-else class="text-muted empty-desc">No description provided. Click to add details...</p>
            </div>
            <div v-else class="desc-edit-form">
              <textarea
                v-model="editedDesc"
                rows="5"
                class="desc-textarea"
                placeholder="Add context, acceptance criteria, technical details..."
              ></textarea>
              <div class="edit-actions">
                <BaseButton variant="primary" size="xs" @click="saveDesc">Save</BaseButton>
                <BaseButton variant="ghost" size="xs" @click="isEditingDesc = false">Cancel</BaseButton>
              </div>
            </div>
          </div>

          <!-- Labels -->
          <div v-if="ticket.labels && ticket.labels.length" class="labels-box">
            <span class="desc-label">Labels</span>
            <div class="label-chips">
              <span v-for="l in ticket.labels" :key="l" class="label-pill">
                #{{ l }}
              </span>
            </div>
          </div>
        </div>

        <!-- Meta Properties Sidebar Panel -->
        <div class="meta-sidebar-col">
          <div class="meta-field">
            <label class="meta-label">Status</label>
            <select
              :value="ticket.status"
              class="meta-select"
              @change="handleStatusChange($event.target.value)"
            >
              <option value="Backlog">Backlog</option>
              <option value="Todo">Todo</option>
              <option value="In Progress">In Progress</option>
              <option value="In Review">In Review</option>
              <option value="Done">Done</option>
            </select>
          </div>

          <div class="meta-field">
            <label class="meta-label">Priority</label>
            <select
              :value="ticket.priority"
              class="meta-select"
              @change="handlePriorityChange($event.target.value)"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent (Blocker)</option>
            </select>
          </div>

          <div class="meta-field">
            <label class="meta-label">Assignee</label>
            <select
              :value="ticket.assignee?.id"
              class="meta-select"
              @change="handleAssigneeChange"
            >
              <option v-for="m in availableMembers" :key="m.id" :value="m.id">
                {{ m.name }}
              </option>
            </select>
          </div>

          <div class="meta-field">
            <label class="meta-label">Story Points</label>
            <select
              :value="ticket.storyPoints"
              class="meta-select"
              @change="ticketStore.updateTicket(ticket.key, { storyPoints: Number($event.target.value) })"
            >
              <option :value="0">0 pts</option>
              <option :value="1">1 pt</option>
              <option :value="2">2 pts</option>
              <option :value="3">3 pts</option>
              <option :value="5">5 pts</option>
              <option :value="8">8 pts</option>
              <option :value="13">13 pts</option>
            </select>
          </div>

          <div class="meta-field">
            <label class="meta-label">Sprint</label>
            <select
              :value="ticket.sprintId || 'backlog'"
              class="meta-select"
              @change="handleSprintChange"
            >
              <option value="backlog">Backlog (Unassigned)</option>
              <option
                v-for="s in availableSprints"
                :key="s.id"
                :value="s.id"
              >
                {{ s.name.split('—')[0].trim() }}
              </option>
            </select>
          </div>

          <div class="meta-field">
            <label class="meta-label">Due Date</label>
            <span class="meta-static-val">{{ ticket.dueDate || 'No date set' }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div v-if="ticket" class="drawer-footer-actions">
        <BaseButton variant="ghost" size="xs" class="text-danger" @click="deleteCurrentTicket">
          Delete Ticket
        </BaseButton>
        <BaseButton variant="secondary" size="sm" @click="ticketStore.closeTicketDetail">
          Close
        </BaseButton>
      </div>
    </template>
  </BaseDrawer>
</template>

<style scoped>
.drawer-header-custom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.header-left-chips {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.project-pill {
  font-size: 11px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  padding: 1px 6px;
  border-radius: var(--radius-xs);
  color: var(--text-muted);
}

.key-pill {
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.action-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.action-icon-btn:hover {
  background-color: var(--bg-surface-hover);
  color: var(--text-primary);
}

.ticket-drawer-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.title-display {
  cursor: pointer;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  transition: background-color var(--transition-fast), border-color var(--transition-fast);
}

.title-display:hover {
  background-color: var(--bg-surface);
  border-color: var(--border-default);
}

.ticket-title-text {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  line-height: var(--line-height-tight);
}

.edit-hint {
  font-size: 10px;
  display: block;
  margin-top: 2px;
}

.title-edit-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.edit-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.drawer-body-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.main-body-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.desc-box {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.desc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.desc-label {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.desc-edit-link {
  font-size: 11px;
}

.desc-edit-link:hover {
  color: var(--text-primary);
}

.desc-content {
  cursor: pointer;
  min-height: 48px;
}

.desc-text {
  font-size: var(--text-sm);
  line-height: var(--line-height-relaxed);
  color: var(--text-primary);
  white-space: pre-wrap;
}

.empty-desc {
  font-size: var(--text-xs);
  font-style: italic;
}

.desc-textarea {
  width: 100%;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  outline: none;
  resize: vertical;
}

.desc-textarea:focus {
  border-color: var(--border-focus);
}

/* Labels */
.labels-box {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.label-chips {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-wrap: wrap;
}

.label-pill {
  font-family: var(--font-mono);
  font-size: 11px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  color: var(--text-secondary);
}

/* Sidebar meta */
.meta-sidebar-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  padding: var(--space-4);
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.meta-field {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.meta-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: var(--font-weight-medium);
}

.meta-select {
  height: 32px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  padding: 0 var(--space-2);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  outline: none;
  cursor: pointer;
}

.meta-select:focus {
  border-color: var(--border-focus);
}

.meta-static-val {
  font-size: var(--text-xs);
  color: var(--text-primary);
  padding: 6px 0;
}

.drawer-footer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.text-danger {
  color: var(--color-danger-500);
}
.text-danger:hover {
  color: var(--color-danger-600);
}
</style>
