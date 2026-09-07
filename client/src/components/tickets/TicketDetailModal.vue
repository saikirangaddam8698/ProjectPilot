<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTicketStore } from '@/stores/ticket.store';
import { useProjectStore } from '@/stores/project.store';
import { useSprintStore } from '@/stores/sprint.store';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseInput from '@/components/ui/BaseInput.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const route = useRoute();
const router = useRouter();
const ticketStore = useTicketStore();
const projectStore = useProjectStore();
const sprintStore = useSprintStore();

const modalRef = ref(null);
const isMaximized = ref(false);

const isOpen = computed({
  get: () => !!ticketStore.activeTicketKey,
  set: (val) => {
    if (!val) closeModal();
  }
});

const ticket = computed(() => ticketStore.activeTicket);

const isEditingTitle = ref(false);
const editedTitle = ref('');
const isEditingDesc = ref(false);
const editedDesc = ref('');
const copiedToast = ref(false);

// Synchronize inline edit inputs when ticket changes
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

// Deep Link / URL Synchronization
watch(
  () => ticketStore.activeTicketKey,
  (newKey) => {
    if (newKey) {
      if (route.query.ticket !== newKey) {
        router.replace({ query: { ...route.query, ticket: newKey } });
      }
      document.body.style.overflow = 'hidden';
    } else {
      if (route.query.ticket) {
        const query = { ...route.query };
        delete query.ticket;
        router.replace({ query });
      }
      document.body.style.overflow = '';
      isMaximized.value = false;
    }
  }
);

watch(
  () => route.query.ticket,
  (ticketQueryKey) => {
    if (ticketQueryKey && ticketQueryKey !== ticketStore.activeTicketKey) {
      const found = ticketStore.getTicketByKey(ticketQueryKey);
      if (found) {
        ticketStore.openTicketDetail(ticketQueryKey);
      }
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

function toggleMaximize() {
  isMaximized.value = !isMaximized.value;
}

function closeModal() {
  ticketStore.closeTicketDetail();
}

function handleBackdropClick(event) {
  if (event.target === event.currentTarget) {
    closeModal();
  }
}

function handleKeyDown(event) {
  if (event.key === 'Escape' && isOpen.value) {
    closeModal();
  }
}

function openInNewTab() {
  if (!ticket.value) return;
  const canonicalUrl = `/projects/${ticket.value.projectKey}/tickets?ticket=${ticket.value.key}`;
  const fullUrl = `${window.location.origin}${canonicalUrl}`;
  window.open(fullUrl, '_blank');
}

function copyKey() {
  if (!ticket.value) return;
  navigator.clipboard.writeText(ticket.value.key);
  copiedToast.value = true;
  setTimeout(() => {
    copiedToast.value = false;
  }, 2000);
}

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

function deleteCurrentTicket() {
  if (!ticket.value) return;
  if (confirm(`Are you sure you want to delete ${ticket.value.key}?`)) {
    ticketStore.deleteTicket(ticket.value.key);
    closeModal();
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

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="isOpen && ticket"
        class="ticket-modal-overlay"
        role="dialog"
        aria-modal="true"
        :aria-label="`Ticket Detail ${ticket.key}`"
        @click="handleBackdropClick"
      >
        <div
          ref="modalRef"
          class="ticket-modal-container"
          :class="{ 'is-maximized': isMaximized }"
          @click.stop
        >
          <!-- Fixed Modal Header Bar -->
          <header class="modal-header">
            <div class="header-left">
              <span class="project-pill mono">{{ ticket.projectKey }}</span>
              <span class="key-pill mono font-semibold">{{ ticket.key }}</span>
              <BaseBadge :variant="getTypeBadgeVariant(ticket.type)" size="sm">
                {{ ticket.type }}
              </BaseBadge>
            </div>

            <div class="header-right-actions">
              <!-- Copy Key Action -->
              <button
                type="button"
                class="header-btn"
                :title="copiedToast ? 'Copied to clipboard!' : 'Copy ticket key'"
                @click="copyKey"
              >
                <AppIcon :name="copiedToast ? 'check' : 'my-work'" :size="15" />
                <span class="btn-text">{{ copiedToast ? 'Copied' : 'Copy Key' }}</span>
              </button>

              <!-- Open in New Tab Action -->
              <button
                type="button"
                class="header-btn"
                title="Open in new browser tab"
                @click="openInNewTab"
              >
                <AppIcon name="external-link" :size="15" />
                <span class="btn-text">Open Tab</span>
              </button>

              <!-- Maximize / Restore Toggle -->
              <button
                type="button"
                class="header-btn icon-only"
                :title="isMaximized ? 'Restore normal window' : 'Maximize window'"
                @click="toggleMaximize"
              >
                <AppIcon :name="isMaximized ? 'minimize-2' : 'maximize-2'" :size="15" />
              </button>

              <!-- Close Modal -->
              <button
                type="button"
                class="header-btn icon-only close-btn"
                title="Close (Esc)"
                @click="closeModal"
              >
                <AppIcon name="close" :size="16" />
              </button>
            </div>
          </header>

          <!-- Internal Scrollable Modal Body -->
          <div class="modal-scroll-area">
            <!-- Title Header -->
            <div class="title-section">
              <div v-if="!isEditingTitle" class="title-display" @click="isEditingTitle = true">
                <h2 class="ticket-title-text">{{ ticket.title }}</h2>
                <span class="edit-hint text-muted">Click title to edit</span>
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

            <!-- Two Column Jira Detail Layout -->
            <div class="modal-body-grid">
              <!-- Left Main Column (Description & Labels) -->
              <div class="main-body-col">
                <!-- Description Box -->
                <div class="desc-box">
                  <div class="desc-header">
                    <span class="section-label">Description</span>
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
                      rows="6"
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
                  <span class="section-label">Labels</span>
                  <div class="label-chips">
                    <span v-for="l in ticket.labels" :key="l" class="label-pill">
                      #{{ l }}
                    </span>
                  </div>
                </div>

                <!-- Activity Log / Metadata Note -->
                <div class="activity-note-box">
                  <span class="section-label">System Metadata</span>
                  <div class="metadata-rows">
                    <span class="meta-row-item">Created: {{ new Date(ticket.createdAt).toLocaleString() }}</span>
                    <span class="meta-row-item">Updated: {{ new Date(ticket.updatedAt).toLocaleString() }}</span>
                  </div>
                </div>
              </div>

              <!-- Right Sidebar Meta Properties Column -->
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
                  <label class="meta-label">Reporter</label>
                  <div class="meta-static-user">
                    <span class="user-avatar-sm">{{ ticket.reporter?.avatar || 'AM' }}</span>
                    <span class="user-name-text">{{ ticket.reporter?.name || 'Alex Morgan' }}</span>
                  </div>
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

          <!-- Fixed Modal Footer -->
          <footer class="modal-footer">
            <BaseButton variant="ghost" size="xs" class="text-danger" @click="deleteCurrentTicket">
              Delete Ticket
            </BaseButton>
            <BaseButton variant="secondary" size="sm" @click="closeModal">
              Close
            </BaseButton>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ticket-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background-color: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  box-sizing: border-box;
}

.ticket-modal-container {
  width: 100%;
  max-width: 980px;
  height: 88vh;
  max-height: 840px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.25s ease-in-out;
  box-sizing: border-box;
}

.ticket-modal-container.is-maximized {
  max-width: 98vw;
  height: 94vh;
  max-height: 96vh;
  border-radius: var(--radius-lg);
}

/* Header Bar */
.modal-header {
  height: 54px;
  padding: 0 var(--space-6);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--bg-surface-elevated);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.project-pill {
  font-size: 11px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  padding: 2px 7px;
  border-radius: var(--radius-xs);
  color: var(--text-muted);
}

.key-pill {
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.header-right-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.header-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  height: 30px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background-color: var(--bg-surface);
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.header-btn:hover {
  background-color: var(--bg-surface-hover);
  color: var(--text-primary);
  border-color: var(--border-strong);
}

.header-btn.icon-only {
  width: 30px;
  padding: 0;
  justify-content: center;
}

.header-btn.close-btn:hover {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--color-danger-500);
  border-color: var(--color-danger-500);
}

.btn-text {
  font-size: 11px;
}

/* Scroll Area */
.modal-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* Title Section */
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
  background-color: var(--bg-surface-elevated);
  border-color: var(--border-default);
}

.ticket-title-text {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  line-height: 1.3;
}

.edit-hint {
  font-size: 11px;
  display: block;
  margin-top: 4px;
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
  margin-top: var(--space-1);
}

/* Modal Body Grid */
.modal-body-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}

@media (min-width: 768px) {
  .modal-body-grid {
    grid-template-columns: 1fr 280px;
  }
}

.main-body-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.desc-box {
  background-color: var(--bg-surface-elevated);
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

.section-label {
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.desc-edit-link {
  font-size: 11px;
  cursor: pointer;
  background: none;
  border: none;
}

.desc-edit-link:hover {
  color: var(--text-primary);
}

.desc-content {
  cursor: pointer;
  min-height: 60px;
}

.desc-text {
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--text-primary);
  white-space: pre-wrap;
}

.empty-desc {
  font-size: var(--text-xs);
  font-style: italic;
}

.desc-textarea {
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
}

.desc-textarea:focus {
  border-color: var(--color-primary-500);
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
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  padding: 2px 7px;
  border-radius: var(--radius-xs);
  color: var(--text-secondary);
}

.activity-note-box {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-subtle);
}

.metadata-rows {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-row-item {
  font-size: 11px;
  color: var(--text-muted);
}

/* Right Meta Sidebar */
.meta-sidebar-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  height: fit-content;
}

.meta-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: var(--font-weight-medium);
}

.meta-select {
  height: 34px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 0 var(--space-3);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  outline: none;
  cursor: pointer;
  transition: border-color var(--transition-fast);
}

.meta-select:focus {
  border-color: var(--color-primary-500);
}

.meta-static-user {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 4px 0;
}

.user-avatar-sm {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background-color: var(--border-default);
  color: var(--text-primary);
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-name-text {
  font-size: var(--text-xs);
  color: var(--text-primary);
}

.meta-static-val {
  font-size: var(--text-xs);
  color: var(--text-primary);
  padding: 4px 0;
}

/* Modal Footer */
.modal-footer {
  height: 52px;
  padding: 0 var(--space-6);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--bg-surface-elevated);
  flex-shrink: 0;
}

.text-danger {
  color: var(--color-danger-500);
}
.text-danger:hover {
  color: var(--color-danger-600);
}

/* Animations */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>
