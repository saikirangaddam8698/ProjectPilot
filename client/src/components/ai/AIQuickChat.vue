<script setup>
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAiStore } from '@/stores/ai.store';
import { useProjectStore } from '@/stores/project.store';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';
import { formatMessageContent } from '@/utils/formatMessage';
import AppIcon from '@/components/ui/AppIcon.vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import BaseButton from '@/components/ui/BaseButton.vue';

const route = useRoute();
const router = useRouter();
const aiStore = useAiStore();
const projectStore = useProjectStore();
const authStore = useAuthStore();
const uiStore = useUiStore();

const promptInput = ref('');
const messagesContainer = ref(null);
const textareaRef = ref(null);

const isOpen = computed(() => uiStore.isQuickChatOpen && !uiStore.isQuickChatMinimized);

// Suggested quick prompts tailored to agile workflows
const quickPrompts = [
  'Which tickets are at risk?',
  'What is blocking this sprint?',
  'Summarize sprint progress',
  'What changed recently?',
  'Find relevant project documentation'
];

// Derive active project context from route or aiStore
const currentProject = computed(() => {
  const routeProjKey = route.params.projectKey;
  if (routeProjKey) {
    return projectStore.getProjectByKey(routeProjKey);
  }
  return (
    projectStore.getProjectByKey(aiStore.selectedProjectKey) ||
    projectStore.allProjects[0] ||
    null
  );
});

const currentProjectName = computed(() => currentProject.value?.name || 'ProjectPilot Core');
const currentProjectKey = computed(() => currentProject.value?.key || aiStore.selectedProjectKey || 'PILOT');

// Context section identifier (e.g., Board, Sprints, Backlog, Dashboard)
const currentSection = computed(() => {
  const path = route.path || '';
  if (path.includes('/board')) return 'Board';
  if (path.includes('/backlog')) return 'Backlog';
  if (path.includes('/tickets')) return 'Tickets';
  if (path.includes('/sprints')) return 'Sprints';
  if (path.includes('/analytics')) return 'Analytics';
  if (path.includes('/activity')) return 'Activity';
  if (path.includes('/overview')) return 'Overview';
  if (path.includes('/dashboard')) return 'Dashboard';
  if (path.includes('/my-work')) return 'My Work';
  if (path.includes('/knowledge')) return 'Knowledge';
  if (path.includes('/team')) return 'Team';
  if (path.includes('/settings')) return 'Settings';
  return route.meta?.title || 'Workspace';
});

// Synchronize project key with aiStore when switching project routes
watch(
  () => route.params.projectKey,
  (newKey) => {
    if (newKey && newKey.toUpperCase() !== aiStore.selectedProjectKey) {
      aiStore.setProject(newKey);
    }
  },
  { immediate: true }
);

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

watch(
  () => aiStore.messages.length,
  () => {
    scrollToBottom();
  }
);

watch(
  () => aiStore.isGenerating,
  (generating) => {
    if (generating) scrollToBottom();
  }
);

watch(
  () => isOpen.value,
  (opened) => {
    if (opened) {
      scrollToBottom();
      nextTick(() => {
        if (textareaRef.value) textareaRef.value.focus();
      });
    }
  }
);

// Auto-grow textarea height
function adjustTextareaHeight() {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = 'auto';
  const newHeight = Math.min(el.scrollHeight, 120);
  el.style.height = `${Math.max(newHeight, 38)}px`;
}

function handleInput() {
  adjustTextareaHeight();
}

async function handleSend() {
  const text = promptInput.value.trim();
  if (!text || aiStore.isGenerating) return;

  promptInput.value = '';
  if (textareaRef.value) {
    textareaRef.value.style.height = '38px';
  }

  await aiStore.sendMessage(text);
  scrollToBottom();
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  } else if (e.key === 'Escape') {
    uiStore.closeQuickChat();
  }
}

function applyQuickPrompt(prompt) {
  promptInput.value = prompt;
  handleSend();
}

function handleGlobalKeydown(e) {
  if (e.key === 'Escape' && isOpen.value) {
    uiStore.closeQuickChat();
  }
}

function openFullAssistant() {
  // Seamless handoff to full /ai assistant page, preserving conversation
  uiStore.closeQuickChat();
  router.push('/ai');
}

function handleMinimize() {
  uiStore.minimizeQuickChat();
}

function handleClose() {
  uiStore.closeQuickChat();
}

function getSourceTypeIcon(type) {
  switch (type) {
    case 'ticket': return '🎫';
    case 'sprint': return '🏃';
    case 'knowledge': return '📚';
    case 'activity': return '⚡';
    default: return '📊';
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
});
</script>

<template>
  <Transition name="quick-chat-pop">
    <div
      v-if="isOpen"
      class="quick-chat-panel"
      role="dialog"
      aria-modal="false"
      aria-label="ProjectPilot AI Quick Chat"
      :aria-busy="aiStore.isGenerating"
    >
      <!-- Header Bar -->
      <header class="quick-chat-header">
        <div class="header-main-left">
          <div class="ai-spark-icon-wrap" aria-hidden="true">
            <AppIcon name="ai" :size="16" />
          </div>
          <div class="header-titles">
            <div class="title-badge-row">
              <span class="quick-chat-title">ProjectPilot AI</span>
              <BaseBadge variant="purple" size="xs">Gemini</BaseBadge>
            </div>
            <div class="context-breadcrumb mono" :title="`${currentProjectName} (${currentProjectKey}) • ${currentSection}`">
              <span class="proj-name-truncate">{{ currentProjectName }}</span>
              <span class="proj-key-tag">({{ currentProjectKey }})</span>
              <span class="sep">•</span>
              <span class="section-tag">{{ currentSection }}</span>
            </div>
          </div>
        </div>

        <div class="header-actions">
          <!-- Open Full Assistant -->
          <button
            type="button"
            class="header-icon-btn"
            title="Open Full AI Assistant"
            aria-label="Open Full AI Assistant"
            @click="openFullAssistant"
          >
            <AppIcon name="external-link" :size="15" />
          </button>

          <!-- Minimize -->
          <button
            type="button"
            class="header-icon-btn"
            title="Minimize Quick Chat"
            aria-label="Minimize Quick Chat"
            @click="handleMinimize"
          >
            <AppIcon name="minus" :size="15" />
          </button>

          <!-- Close with Destructive Hover Feedback -->
          <button
            type="button"
            class="header-icon-btn close-btn"
            title="Close Quick Chat"
            aria-label="Close Quick Chat"
            @click="handleClose"
          >
            <AppIcon name="close" :size="15" />
          </button>
        </div>
      </header>

      <!-- Chat Error Banner -->
      <div v-if="aiStore.error" class="chat-error-banner" role="alert">
        <div class="error-msg-wrap">
          <AppIcon name="alert-circle" :size="14" />
          <span class="error-text">{{ aiStore.error }}</span>
        </div>
        <button
          type="button"
          class="error-retry-btn"
          @click="aiStore.retryLastMessage"
        >
          Retry
        </button>
      </div>

      <!-- Messages Scroll Area -->
      <div ref="messagesContainer" class="quick-chat-body">
        <!-- Empty Welcome State -->
        <div v-if="!aiStore.hasMessages && !aiStore.isGenerating" class="chat-empty-state">
          <div class="empty-sparkle-avatar">
            <AppIcon name="ai" :size="24" />
          </div>
          <h3 class="empty-title">Ask ProjectPilot AI</h3>
          <p class="empty-subtitle">
            Real-time intelligence grounded in <strong>{{ currentProjectName }}</strong> tickets, sprints, and documentation.
          </p>

          <!-- Quick Suggestion Chips -->
          <div class="quick-prompt-list">
            <button
              v-for="(prompt, idx) in quickPrompts"
              :key="idx"
              type="button"
              class="quick-prompt-item"
              @click="applyQuickPrompt(prompt)"
            >
              <span class="prompt-icon">⚡</span>
              <span class="prompt-label">{{ prompt }}</span>
            </button>
          </div>
        </div>

        <!-- Render Messages -->
        <template v-else>
          <div
            v-for="msg in aiStore.messages"
            :key="msg.id"
            class="chat-msg-row"
            :class="msg.role === 'user' ? 'is-user' : 'is-assistant'"
          >
            <!-- Avatar -->
            <div class="chat-avatar" :class="msg.role === 'user' ? 'user-avatar' : 'ai-avatar'">
              <span v-if="msg.role === 'user'">
                {{ authStore.currentUser?.name?.slice(0, 2).toUpperCase() || 'ME' }}
              </span>
              <AppIcon v-else name="ai" :size="13" />
            </div>

            <div class="chat-msg-content-wrap">
              <!-- Author label -->
              <div class="msg-meta-header">
                <span class="msg-author">{{ msg.role === 'user' ? 'You' : 'ProjectPilot AI' }}</span>
              </div>

              <!-- Content Bubble -->
              <div
                class="chat-bubble"
                :class="msg.role === 'user' ? 'user-bubble' : 'ai-bubble'"
                v-html="formatMessageContent(msg.content)"
              ></div>

              <!-- Structured Evidence / Risk Analysis (Compact for Quick Chat) -->
              <div v-if="msg.analysis" class="compact-intel-box">
                <div class="intel-badge-row">
                  <span class="intel-tag">{{ (msg.analysis.type || 'analysis').replace('-', ' ') }}</span>
                  <span v-if="msg.analysis.severity" class="severity-pill" :class="`sev-${msg.analysis.severity}`">
                    {{ msg.analysis.severity }}
                  </span>
                </div>

                <div v-if="msg.analysis.evidenceSummary && msg.analysis.evidenceSummary.length > 0" class="evidence-chips">
                  <span
                    v-for="(ev, evIdx) in msg.analysis.evidenceSummary"
                    :key="evIdx"
                    class="ev-pill mono"
                    :title="ev.description"
                  >
                    {{ getSourceTypeIcon(ev.sourceType) }} {{ ev.reference }}
                  </span>
                </div>
              </div>

              <!-- Citations / Grounded Sources -->
              <div v-if="msg.sources && msg.sources.length > 0" class="sources-strip">
                <span class="sources-label">Sources:</span>
                <span
                  v-for="(src, sIdx) in msg.sources"
                  :key="sIdx"
                  class="source-tag truncate"
                  :title="src.title || src"
                >
                  {{ src.title || src }}
                </span>
              </div>

              <!-- Executed Tools Pill -->
              <div v-if="msg.executedTools && msg.executedTools.length > 0" class="executed-tools-strip">
                <span v-for="t in msg.executedTools" :key="t.name" class="tool-tag">
                  ✓ {{ t.label || t.name }}
                </span>
              </div>
            </div>
          </div>

          <!-- Thinking / Generating State -->
          <div v-if="aiStore.isGenerating" class="chat-msg-row is-assistant thinking-row">
            <div class="chat-avatar ai-avatar pulsing">
              <AppIcon name="ai" :size="13" />
            </div>
            <div class="chat-msg-content-wrap">
              <div class="msg-meta-header">
                <span class="msg-author">ProjectPilot AI</span>
                <span class="generating-phase-text">{{ aiStore.agentActivity || 'Analyzing your request…' }}</span>
              </div>
              <div class="thinking-bubble">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Footer Input Area -->
      <footer class="quick-chat-footer">
        <div class="input-container">
          <textarea
            ref="textareaRef"
            v-model="promptInput"
            class="chat-textarea"
            rows="1"
            placeholder="Ask about tickets, sprints, blockers…"
            :disabled="aiStore.isGenerating"
            aria-label="AI message input"
            @input="handleInput"
            @keydown="handleKeydown"
          ></textarea>

          <button
            type="button"
            class="send-btn"
            :disabled="!promptInput.trim() || aiStore.isGenerating"
            aria-label="Send message"
            :title="aiStore.isGenerating ? 'Generating response…' : 'Send message (Enter)'"
            @click="handleSend"
          >
            <AppIcon name="send" :size="15" />
          </button>
        </div>

        <div class="footer-hint-row">
          <span class="hint-text">Enter to send • Shift+Enter for new line</span>
          <button
            type="button"
            class="full-assistant-link"
            @click="openFullAssistant"
          >
            Open full Assistant →
          </button>
        </div>
      </footer>
    </div>
  </Transition>
</template>

<style scoped>
.quick-chat-panel {
  position: fixed;
  bottom: 84px;
  right: 24px;
  z-index: 46;
  width: 400px;
  height: 580px;
  max-height: calc(100vh - 110px);
  display: flex;
  flex-direction: column;
  background-color: var(--glass-bg-elevated, rgba(17, 20, 24, 0.94));
  border: 1px solid var(--glass-border-glow, rgba(147, 197, 253, 0.22));
  border-radius: var(--radius-xl, 18px);
  backdrop-filter: var(--glass-blur-lg, blur(24px));
  -webkit-backdrop-filter: var(--glass-blur-lg, blur(24px));
  box-shadow: 0 20px 48px -12px rgba(0, 0, 0, 0.65),
              0 0 0 1px rgba(255, 255, 255, 0.08) inset;
  overflow: hidden;
  box-sizing: border-box;
}

/* Header */
.quick-chat-header {
  height: 58px;
  padding: 0 var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  background-color: rgba(255, 255, 255, 0.02);
  flex-shrink: 0;
}

.header-main-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.ai-spark-icon-wrap {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md, 8px);
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.35);
}

.header-titles {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 1px;
}

.title-badge-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.quick-chat-title {
  font-size: var(--text-sm, 13px);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--text-primary, #f3f4f6);
  white-space: nowrap;
}

.context-breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-muted, #9ca3af);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.proj-name-truncate {
  max-width: 105px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.proj-key-tag {
  color: var(--color-primary-400, #818cf8);
}

.section-tag {
  color: var(--text-secondary, #d1d5db);
}

.sep {
  opacity: 0.5;
}

/* Header actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.header-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm, 6px);
  background-color: transparent;
  border: 1px solid transparent;
  color: var(--text-secondary, #9ca3af);
  cursor: pointer;
  transition: all 160ms ease;
}

.header-icon-btn:hover {
  background-color: var(--bg-surface-hover, rgba(255, 255, 255, 0.08));
  color: var(--text-primary, #ffffff);
  border-color: var(--border-subtle, rgba(255, 255, 255, 0.1));
}

.header-icon-btn.close-btn:hover {
  background-color: var(--btn-close-bg-hover, rgba(239, 68, 68, 0.20)) !important;
  color: var(--btn-close-color-hover, #ef4444) !important;
  border-color: var(--btn-close-border-hover, rgba(239, 68, 68, 0.50)) !important;
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.25);
}

.header-icon-btn.close-btn:hover svg {
  stroke: var(--btn-close-color-hover, #ef4444) !important;
}

.header-icon-btn.close-btn:active {
  background-color: var(--btn-close-bg-active, rgba(239, 68, 68, 0.35)) !important;
  color: var(--btn-close-color-active, #dc2626) !important;
  border-color: var(--btn-close-border-active, rgba(239, 68, 68, 0.70)) !important;
  box-shadow: 0 0 14px rgba(239, 68, 68, 0.40);
  transform: scale(0.92);
}

.header-icon-btn.close-btn:active svg {
  stroke: var(--btn-close-color-active, #dc2626) !important;
}

/* Error Banner */
.chat-error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-4);
  background-color: rgba(239, 68, 68, 0.1);
  border-bottom: 1px solid rgba(239, 68, 68, 0.25);
  font-size: var(--text-xs, 12px);
  color: #f87171;
  flex-shrink: 0;
}

.error-msg-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

.error-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.error-retry-btn {
  background: transparent;
  border: none;
  color: #f87171;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  padding: 0 4px;
}

/* Messages Body */
.quick-chat-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  scroll-behavior: smooth;
}

/* Empty State */
.chat-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-5) var(--space-2);
  margin: auto 0;
}

.empty-sparkle-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.2), rgba(124, 58, 237, 0.25));
  border: 1px solid rgba(99, 102, 241, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary-400, #818cf8);
  margin-bottom: var(--space-3);
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.25);
}

.empty-title {
  font-size: var(--text-base, 15px);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--text-primary, #f3f4f6);
  margin: 0 0 var(--space-1) 0;
}

.empty-subtitle {
  font-size: var(--text-xs, 12px);
  color: var(--text-muted, #9ca3af);
  line-height: var(--line-height-relaxed, 1.5);
  margin: 0 0 var(--space-4) 0;
  max-width: 320px;
}

.quick-prompt-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
}

.quick-prompt-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  border-radius: var(--radius-md, 8px);
  background-color: var(--glass-bg-subtle, rgba(255, 255, 255, 0.04));
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  color: var(--text-secondary, #d1d5db);
  font-size: var(--text-xs, 12px);
  cursor: pointer;
  transition: all 160ms ease;
}

.quick-prompt-item:hover {
  background-color: rgba(99, 102, 241, 0.12);
  border-color: rgba(99, 102, 241, 0.35);
  color: var(--text-primary, #ffffff);
  transform: translateX(2px);
}

.prompt-icon {
  font-size: 13px;
  flex-shrink: 0;
}

/* Chat Rows */
.chat-msg-row {
  display: flex;
  gap: var(--space-2);
  width: 100%;
}

.chat-msg-row.is-user {
  flex-direction: row-reverse;
}

.chat-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 2px;
}

.user-avatar {
  background-color: var(--color-primary-600, #4f46e5);
  color: #ffffff;
}

.ai-avatar {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: #ffffff;
}

.ai-avatar.pulsing {
  animation: subtlePulse 1.6s infinite ease-in-out;
}

.chat-msg-content-wrap {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-width: 82%;
}

.chat-msg-row.is-user .chat-msg-content-wrap {
  align-items: flex-end;
}

.msg-meta-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 11px;
  color: var(--text-muted, #9ca3af);
  padding: 0 4px;
}

.generating-phase-text {
  color: var(--color-primary-400, #818cf8);
  font-style: italic;
  font-size: 10px;
}

.chat-bubble {
  padding: 8px 12px;
  border-radius: var(--radius-lg, 12px);
  font-size: var(--text-xs, 12px);
  line-height: var(--line-height-relaxed, 1.5);
  word-break: break-word;
}

.user-bubble {
  background-color: var(--color-primary-600, #4f46e5);
  color: #ffffff;
  border-bottom-right-radius: 2px;
}

.ai-bubble {
  background-color: var(--bg-surface-elevated, rgba(23, 27, 33, 0.88));
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  color: var(--text-primary, #f3f4f6);
  border-bottom-left-radius: 2px;
}

/* Formatted message elements */
:deep(.chat-h3), :deep(.chat-h4) {
  font-size: 13px;
  font-weight: 600;
  margin: 6px 0 3px 0;
  color: var(--text-primary, #ffffff);
}

:deep(.chat-bullet-list) {
  margin: 4px 0;
  padding-left: 18px;
}

:deep(.chat-bullet-list li) {
  margin-bottom: 2px;
}

:deep(.inline-code) {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  background-color: rgba(0, 0, 0, 0.25);
  padding: 1px 4px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

:deep(.chat-ticket-ref) {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  font-weight: 600;
  color: var(--color-primary-400, #818cf8);
  background-color: rgba(99, 102, 241, 0.12);
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid rgba(99, 102, 241, 0.25);
}

:deep(.chat-quote) {
  border-left: 2px solid var(--color-primary-500, #6366f1);
  padding-left: 8px;
  margin: 4px 0;
  color: var(--text-secondary, #d1d5db);
  font-style: italic;
}

/* Compact Risk / Intel box */
.compact-intel-box {
  margin-top: 4px;
  padding: 6px 10px;
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-md, 8px);
  font-size: 11px;
}

.intel-badge-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.intel-tag {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 10px;
  color: var(--text-secondary, #9ca3af);
}

.severity-pill {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
}
.severity-pill.sev-high, .severity-pill.sev-critical {
  background-color: rgba(239, 68, 68, 0.2);
  color: #f87171;
}
.severity-pill.sev-medium {
  background-color: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}
.severity-pill.sev-low {
  background-color: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.evidence-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.ev-pill {
  font-size: 10px;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 1px 5px;
  border-radius: 4px;
  color: var(--text-secondary, #9ca3af);
}

/* Sources strip */
.sources-strip {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 3px;
  font-size: 10px;
}

.sources-label {
  color: var(--text-muted, #9ca3af);
}

.source-tag {
  background-color: rgba(14, 165, 233, 0.12);
  border: 1px solid rgba(14, 165, 233, 0.25);
  color: #38bdf8;
  padding: 1px 6px;
  border-radius: 4px;
  max-width: 160px;
}

/* Tools strip */
.executed-tools-strip {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.tool-tag {
  font-size: 10px;
  background-color: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  color: #34d399;
  padding: 1px 5px;
  border-radius: 4px;
}

/* Thinking bubble */
.thinking-bubble {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background-color: var(--bg-surface-elevated, rgba(23, 27, 33, 0.88));
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-lg, 12px);
  width: fit-content;
}

.thinking-bubble .dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: var(--color-primary-400, #818cf8);
  animation: typingBounce 1.2s infinite ease-in-out;
}

.thinking-bubble .dot:nth-child(2) { animation-delay: 0.2s; }
.thinking-bubble .dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingBounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40% { transform: translateY(-4px); opacity: 1; }
}

/* Footer Input Area */
.quick-chat-footer {
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  background-color: rgba(255, 255, 255, 0.02);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex-shrink: 0;
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
  background-color: var(--glass-bg-input, rgba(17, 20, 24, 0.65));
  border: 1px solid var(--border-default, rgba(255, 255, 255, 0.12));
  border-radius: var(--radius-lg, 12px);
  padding: 6px 8px 6px 12px;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.input-container:focus-within {
  border-color: var(--color-primary-500, #6366f1);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.25);
}

.chat-textarea {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary, #ffffff);
  font-family: var(--font-sans, inherit);
  font-size: var(--text-xs, 12px);
  line-height: var(--line-height-normal, 1.4);
  resize: none;
  outline: none;
  max-height: 120px;
  min-height: 22px;
  padding: 3px 0;
}

.chat-textarea::placeholder {
  color: var(--text-muted, #6b7280);
}

.send-btn {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-md, 8px);
  border: none;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 160ms ease;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #4338ca, #4f46e5);
  transform: scale(1.05);
}

.send-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: var(--bg-surface-elevated, rgba(255, 255, 255, 0.08));
  color: var(--text-muted, #6b7280);
}

.footer-hint-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10px;
  color: var(--text-muted, #6b7280);
  padding: 0 2px;
}

.full-assistant-link {
  background: transparent;
  border: none;
  color: var(--color-primary-400, #818cf8);
  cursor: pointer;
  padding: 0;
  font-size: 10px;
  font-weight: 500;
  transition: color 160ms ease;
}

.full-assistant-link:hover {
  color: #a5b4fc;
  text-decoration: underline;
}

/* Animations */
.quick-chat-pop-enter-active,
.quick-chat-pop-leave-active {
  transition: transform 220ms var(--motion-spring, cubic-bezier(0.16, 1, 0.3, 1)),
              opacity 200ms ease;
}

.quick-chat-pop-enter-from,
.quick-chat-pop-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.95);
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .quick-chat-panel {
    bottom: 0;
    right: 0;
    left: 0;
    width: 100%;
    height: 85vh;
    max-height: 85vh;
    border-radius: var(--radius-2xl, 20px) var(--radius-2xl, 20px) 0 0;
    box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.7);
  }

  .quick-chat-pop-enter-from,
  .quick-chat-pop-leave-to {
    transform: translateY(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .quick-chat-panel,
  .quick-chat-pop-enter-active,
  .quick-chat-pop-leave-active,
  .thinking-bubble .dot {
    animation: none !important;
    transition: none !important;
  }
}
</style>
