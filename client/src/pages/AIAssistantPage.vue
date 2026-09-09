<script setup>
import { ref, computed, nextTick, watch, onMounted } from 'vue';
import { useAiStore } from '@/stores/ai.store';
import { useProjectStore } from '@/stores/project.store';
import { useAuthStore } from '@/stores/auth.store';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue';
import BaseSelect from '@/components/ui/BaseSelect.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import ChatThreadSkeleton from '@/components/skeletons/ChatThreadSkeleton.vue';
import { formatMessageContent } from '@/utils/formatMessage';

const aiStore = useAiStore();
const projectStore = useProjectStore();
const authStore = useAuthStore();

const promptInput = ref('');
const selectedQuickPrompt = ref('');
const messagesContainer = ref(null);

const currentProject = computed(() => {
  return (
    projectStore.getProjectByKey(aiStore.selectedProjectKey) ||
    projectStore.allProjects[0] ||
    null
  );
});

const projectOptions = computed(() => {
  return projectStore.allProjects.map((p) => ({
    value: p.key,
    label: `${p.name} (${p.key})`
  }));
});

const quickPrompts = [
  'How is authentication implemented in ProjectPilot?',
  'What does the architecture blueprint say about PostgreSQL pooling?',
  'Give me an executive summary of this project.',
  'Which tickets are currently high priority?',
  'How is the current sprint progressing?',
  'What changed recently in this project?'
];

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
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

watch(
  () => aiStore.messages.length,
  () => {
    scrollToBottom();
  }
);

watch(
  () => aiStore.isGenerating,
  (val) => {
    if (val) scrollToBottom();
  }
);

watch(
  () => authStore.currentUser?.id,
  (newUserId, oldUserId) => {
    // Only re-fetch if user changed while page is open (avoids duplicate fetch on initial mount)
    if (newUserId && oldUserId && newUserId !== oldUserId) {
      aiStore.clearConversation();
      aiStore.fetchConversations(undefined, true);
    }
  }
);

const isSidebarCollapsed = ref(false);

function handleNewChat() {
  aiStore.clearConversation();
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

onMounted(() => {
  if (projectStore.allProjects.length > 0 && !aiStore.selectedProjectKey) {
    aiStore.setProject(projectStore.allProjects[0].key);
  } else if (aiStore.selectedProjectKey) {
    aiStore.fetchConversations();
  }
  scrollToBottom();
});

function handleProjectChange(val) {
  const key = typeof val === 'object' && val?.target ? val.target.value : val;
  if (key) {
    aiStore.setProject(key);
  }
}

async function handleSend() {
  const text = promptInput.value.trim();
  if (!text || aiStore.isGenerating) return;

  promptInput.value = '';
  await aiStore.sendMessage(text);
  scrollToBottom();
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

function applyQuickPrompt(prompt) {
  selectedQuickPrompt.value = prompt;
  promptInput.value = prompt;
  handleSend();
}


</script>


<template>
  <div class="ai-page-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <div class="ai-title-row">
          <div class="ai-header-icon">
            <AppIcon name="ai" :size="20" />
          </div>
          <h2 class="page-title">AI Project Assistant</h2>
          <BaseBadge variant="purple" size="sm">Gemini 3.6 Flash</BaseBadge>
        </div>
        <p class="page-subtitle">
          Grounded, project-aware intelligence powered by Google Gemini and live PostgreSQL data.
        </p>
      </div>

      <div class="header-actions">
        <!-- Project Scope Dropdown -->
        <div class="project-selector-wrap">
          <span class="selector-label">Workspace:</span>
          <div class="selector-select-box">
            <BaseSelect
              :model-value="aiStore.selectedProjectKey"
              :options="projectOptions"
              size="sm"
              @change="handleProjectChange"
              @update:model-value="handleProjectChange"
            />
          </div>
        </div>

        <BaseButton
          v-if="aiStore.hasMessages"
          variant="outline"
          size="sm"
          @click="aiStore.clearConversation"
        >
          <template #prefix><AppIcon name="trash-2" :size="14" /></template>
          Clear Chat
        </BaseButton>
      </div>
    </div>

    <!-- Active Project Context Strip -->
    <div v-if="currentProject" class="context-strip">
      <div class="context-left">
        <span class="context-pill-label">Context:</span>
        <span class="context-item font-medium">{{ currentProject.name }} ({{ currentProject.key }})</span>
        <span class="context-divider">•</span>
        <span class="context-item text-secondary">Lead: {{ currentProject.lead?.name || 'Unassigned' }}</span>
        <span class="context-divider">•</span>
        <span class="context-item text-secondary">Status: {{ currentProject.status }}</span>
      </div>
      <div class="context-right">
        <BaseBadge variant="success" size="xs" dot>Live Database Synced</BaseBadge>
      </div>
    </div>

    <!-- Main AI Workspace Layout with Conversation Sidebar -->
    <div class="ai-workspace-layout">
      <!-- Conversation History Sidebar -->
      <div class="conv-sidebar" :class="{ 'is-collapsed': isSidebarCollapsed }">
        <div class="sidebar-action-row" :class="{ 'is-collapsed': isSidebarCollapsed }">
          <BaseButton
            v-if="!isSidebarCollapsed"
            variant="primary"
            size="sm"
            class="new-chat-btn"
            @click="handleNewChat"
          >
            <template #prefix><AppIcon name="plus" :size="14" /></template>
            New Chat
          </BaseButton>
          <button
            v-if="isSidebarCollapsed"
            class="sidebar-new-btn-icon"
            title="New Chat"
            @click="handleNewChat"
          >
            <AppIcon name="plus" :size="16" />
          </button>
          <button
            class="sidebar-toggle-btn"
            :title="isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'"
            @click="isSidebarCollapsed = !isSidebarCollapsed"
          >
            <AppIcon :name="isSidebarCollapsed ? 'chevron-right' : 'chevron-left'" :size="14" />
          </button>
        </div>

        <div v-if="!isSidebarCollapsed" class="sidebar-scroll-area">
          <div class="sidebar-heading">Conversations</div>

          <div v-if="aiStore.isLoadingConversations" class="sidebar-skeletons-list">
            <div v-for="n in 4" :key="n" class="sidebar-conv-skeleton">
              <BaseSkeleton width="85%" height="13px" rounded="xs" />
              <BaseSkeleton width="40%" height="10px" rounded="xs" />
            </div>
          </div>

          <div v-else-if="aiStore.conversations.length === 0" class="sidebar-empty-state">
            No saved conversations
          </div>

          <div v-else class="conv-list">
            <div
              v-for="conv in aiStore.conversations"
              :key="conv.id"
              class="conv-list-item"
              :class="{ active: aiStore.activeConversationId === conv.id }"
              @click="aiStore.selectConversation(conv.id)"
            >
              <div class="conv-item-text">
                <span class="conv-item-title">{{ conv.title }}</span>
                <span class="conv-item-date">{{ formatDate(conv.lastMessageAt) }}</span>
              </div>
              <button
                class="conv-item-delete"
                title="Delete Conversation"
                @click.stop="aiStore.deleteConversation(conv.id)"
              >
                <AppIcon name="trash-2" :size="12" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Chat Window Card -->
      <div class="ai-chat-card">
      <!-- Error Banner -->
      <div v-if="aiStore.error" class="ai-error-banner" role="alert">
        <div class="error-left">
          <AppIcon name="alert-circle" :size="16" />
          <span>{{ aiStore.error }}</span>
        </div>
        <BaseButton variant="ghost" size="xs" @click="aiStore.retryLastMessage">
          Retry
        </BaseButton>
      </div>

      <!-- Messages Thread Area -->
      <div ref="messagesContainer" class="chat-messages-area">
        <!-- Chat Loading Skeleton -->
        <ChatThreadSkeleton v-if="aiStore.isLoadingConversation" :count="2" />

        <!-- Empty State Welcome -->
        <div v-else-if="!aiStore.hasMessages && !aiStore.isGenerating" class="chat-welcome-state">
          <div class="welcome-icon-wrap">
            <AppIcon name="ai" :size="32" />
          </div>
          <h3 class="welcome-title">Ask ProjectPilot Copilot</h3>
          <p class="welcome-desc">
            I have full real-time awareness of tickets, active sprints, blockers, and member workload in
            <strong>{{ currentProject?.name || 'your workspace' }}</strong>.
          </p>

          <div class="welcome-prompt-cards">
            <button
              v-for="(prompt, idx) in quickPrompts"
              :key="idx"
              type="button"
              class="prompt-card-btn"
              :class="{ 'is-selected': selectedQuickPrompt === prompt && aiStore.isGenerating }"
              :disabled="aiStore.isGenerating"
              @click="applyQuickPrompt(prompt)"
            >
              <div class="prompt-card-icon">
                <span v-if="selectedQuickPrompt === prompt && aiStore.isGenerating">⏳</span>
                <span v-else>⚡</span>
              </div>
              <div class="prompt-card-text">{{ prompt }}</div>
            </button>
          </div>
        </div>

        <!-- Render Conversation Messages -->
        <template v-else>
          <div
            v-for="msg in aiStore.messages"
            :key="msg.id"
            class="message-row"
            :class="msg.role === 'user' ? 'user-row' : 'assistant-row'"
          >
            <!-- Avatar -->
            <div class="msg-avatar" :class="msg.role === 'user' ? 'user-avatar' : 'assistant-avatar'">
              <span v-if="msg.role === 'user'">
                {{ authStore.currentUser?.name?.slice(0, 2).toUpperCase() || 'ME' }}
              </span>
              <AppIcon v-else name="ai" :size="16" />
            </div>

            <!-- Content Bubble -->
            <div class="message-content-group">
              <div class="msg-author-row">
                <span class="author-name font-medium">
                  {{ msg.role === 'user' ? (authStore.currentUser?.name || 'You') : 'ProjectPilot Copilot' }}
                </span>
                <span v-if="msg.model" class="model-badge mono">{{ msg.model }}</span>
              </div>

              <div
                class="message-bubble"
                :class="msg.role === 'user' ? 'user-bubble' : 'assistant-bubble'"
                v-html="formatMessageContent(msg.content)"
              ></div>

              <!-- Structured Intelligence / Risk Analysis Card -->
              <div v-if="msg.analysis" class="intelligence-card">
                <div class="intelligence-header">
                  <div class="intelligence-title">
                    <span class="intelligence-icon">🛡️</span>
                    <span class="font-semibold uppercase tracking-wide">Project Intelligence</span>
                  </div>
                  <div class="intelligence-badges">
                    <span class="risk-type-chip">{{ (msg.analysis.type || 'analysis').replace('-', ' ') }}</span>
                    <span
                      class="severity-badge uppercase"
                      :class="`severity-${msg.analysis.severity || 'medium'}`"
                    >
                      {{ msg.analysis.severity }}
                    </span>
                    <span
                      v-if="msg.analysis.confidence"
                      class="confidence-badge uppercase"
                      :class="`confidence-${msg.analysis.confidence || 'medium'}`"
                    >
                      Confidence · {{ msg.analysis.confidence }}
                    </span>
                  </div>
                </div>

                <!-- Evidence Summary -->
                <div v-if="msg.analysis.evidenceSummary && msg.analysis.evidenceSummary.length > 0" class="intel-section">
                  <div class="intel-section-title">Evidence Summary</div>
                  <div class="evidence-summary-chips">
                    <span
                      v-for="(item, eIdx) in msg.analysis.evidenceSummary"
                      :key="eIdx"
                      class="evidence-chip-pill"
                      :title="item.description"
                    >
                      <span class="ev-type-icon">{{ getSourceTypeIcon(item.sourceType) }}</span>
                      <span class="ev-ref-text mono">{{ item.reference }}</span>
                    </span>
                  </div>
                </div>

                <!-- Findings List -->
                <div v-if="msg.analysis.findings && msg.analysis.findings.length > 0" class="intel-section">
                  <div class="intel-section-title">Findings</div>
                  <div v-for="(finding, fIdx) in msg.analysis.findings" :key="fIdx" class="intel-item">
                    <span class="intel-bullet">•</span>
                    <div class="intel-content">
                      <span class="intel-text">{{ finding.text }}</span>
                      <span v-if="finding.evidence && finding.evidence.length > 0" class="evidence-tags-inline">
                        <span v-for="ev in finding.evidence" :key="ev" class="evidence-tag mono">{{ ev }}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Recommendations List -->
                <div v-if="msg.analysis.recommendations && msg.analysis.recommendations.length > 0" class="intel-section">
                  <div class="intel-section-title">Recommendations</div>
                  <div v-for="(rec, rIdx) in msg.analysis.recommendations" :key="rIdx" class="intel-item">
                    <span class="intel-bullet rec-arrow">→</span>
                    <div class="intel-content">
                      <span class="intel-text">{{ rec.text }}</span>
                      <span v-if="rec.evidence && rec.evidence.length > 0" class="evidence-tags-inline">
                        <span v-for="ev in rec.evidence" :key="ev" class="evidence-tag mono">{{ ev }}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Citation Sources Pill -->
              <div v-if="msg.sources && msg.sources.length > 0" class="sources-pill-row">
                <span class="sources-title">
                  <span class="sources-icon">📚</span>
                  Sources:
                </span>
                <span
                  v-for="src in msg.sources"
                  :key="src.title || src"
                  class="source-item-chip"
                  :title="src.similarity ? `Relevance: ${Math.round(src.similarity * 100)}%` : ''"
                >
                  {{ src.title || src }}
                  <span v-if="src.similarity" class="source-similarity">{{ Math.round(src.similarity * 100) }}%</span>
                </span>
              </div>

              <!-- Used Tools Compact Row -->
              <div v-if="(msg.executedTools && msg.executedTools.length > 0) || msg.grounded" class="used-tools-row">
                <span v-if="msg.executedTools && msg.executedTools.length > 0" class="used-tools-label">Used:</span>
                <span
                  v-for="tool in msg.executedTools"
                  :key="tool.name"
                  class="used-tool-chip"
                >
                  ✓ {{ tool.label || tool.name }}
                </span>
                <span v-if="msg.grounded" class="grounded-status-chip">
                  ✓ Grounded Intelligence
                </span>
                <span v-if="msg.agentRounds" class="agent-rounds-badge">{{ msg.agentRounds }} round{{ msg.agentRounds > 1 ? 's' : '' }}</span>
              </div>

              <div v-if="msg.usage" class="msg-meta-row text-muted mono">
                <span>{{ msg.usage.totalTokens || 0 }} tokens</span>
              </div>
            </div>
          </div>

          <!-- Thinking / Pulsing Indicator -->
          <div v-if="aiStore.isGenerating" class="message-row assistant-row thinking-row">
            <div class="msg-avatar assistant-avatar pulse-avatar">
              <AppIcon name="ai" :size="16" />
            </div>
            <div class="message-content-group">
              <div class="msg-author-row">
                <span class="author-name font-medium">ProjectPilot Copilot</span>
                <span class="thinking-text text-secondary">{{ aiStore.agentActivity || 'Analyzing your request…' }}</span>
              </div>
              <div class="thinking-bubble">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Quick Prompt Suggestions (when conversation is active) -->
      <div v-if="aiStore.hasMessages" class="quick-prompt-chips">
        <button
          v-for="(prompt, idx) in quickPrompts"
          :key="idx"
          type="button"
          class="prompt-chip"
          :disabled="aiStore.isGenerating"
          @click="applyQuickPrompt(prompt)"
        >
          "{{ prompt }}"
        </button>
      </div>

      <!-- Chat Input Toolbar -->
      <div class="chat-input-bar">
        <div class="input-wrap">
          <textarea
            v-model="promptInput"
            rows="2"
            class="chat-textarea"
            :placeholder="`Ask Gemini anything about ${currentProject?.name || 'this project'}... (Enter to send, Shift+Enter for newline)`"
            :disabled="aiStore.isGenerating"
            @keydown="handleKeydown"
          ></textarea>
        </div>

        <div class="input-actions-bar">
          <span class="input-hint text-muted">Press Enter ↵ to send</span>
          <BaseButton
            variant="primary"
            size="sm"
            :disabled="!promptInput.trim() || aiStore.isGenerating"
            :loading="aiStore.isGenerating"
            @click="handleSend"
          >
            <template #prefix><AppIcon name="send" :size="14" /></template>
            Send
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<style scoped>
.ai-page-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  height: calc(100vh - 120px);
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.ai-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-1);
}

.ai-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--color-primary-500), #a855f7);
  color: #ffffff;
}

.page-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.project-selector-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.selector-select-box {
  min-width: 220px;
}

.selector-label {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}


/* Context Strip */
.context-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-4);
  background-color: var(--glass-bg-elevated);
  backdrop-filter: var(--glass-blur-sm);
  -webkit-backdrop-filter: var(--glass-blur-sm);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
}

.context-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.context-pill-label {
  color: var(--color-primary-400);
  font-weight: var(--font-weight-semibold);
}

.context-divider {
  color: var(--border-default);
}

/* AI Chat Card Shell */
.ai-chat-card {
  display: flex;
  flex-direction: column;
  flex: 1;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  min-height: 0;
}

.ai-error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-4);
  background-color: rgba(239, 68, 68, 0.1);
  border-bottom: 1px solid var(--color-danger-500);
  color: var(--color-danger-500);
  font-size: var(--text-xs);
}

.error-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* Messages Area */
.chat-messages-area {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

/* Welcome Empty State */
.chat-welcome-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin: auto;
  max-width: 580px;
  padding: var(--space-6) var(--space-4);
  gap: var(--space-3);
}

.welcome-icon-wrap {
  width: 54px;
  height: 54px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.2));
  color: #a855f7;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-2);
}

.welcome-title {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.welcome-desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0 0 var(--space-4) 0;
}

.welcome-prompt-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
  width: 100%;
}

.prompt-card-btn {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-xs);
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.prompt-card-btn:hover:not(:disabled) {
  border-color: var(--color-primary-500);
  background-color: var(--bg-surface-hover);
  transform: translateY(-1px);
}

.prompt-card-btn.is-selected {
  border-color: var(--color-primary-500);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(168, 85, 247, 0.15));
  box-shadow: 0 0 0 1px var(--color-primary-500), 0 4px 12px rgba(99, 102, 241, 0.2);
}

.prompt-card-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.prompt-card-icon {
  color: var(--color-primary-400);
  flex-shrink: 0;
}

/* Message Rows */
.message-row {
  display: flex;
  gap: var(--space-3);
  max-width: 85%;
}

.user-row {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.assistant-row {
  align-self: flex-start;
}

.msg-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
}

.user-avatar {
  background-color: var(--color-primary-600);
  color: #ffffff;
}

.assistant-avatar {
  background: linear-gradient(135deg, var(--color-primary-500), #a855f7);
  color: #ffffff;
}

.message-content-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.msg-author-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 11px;
}

.author-name {
  color: var(--text-secondary);
}

.model-badge {
  font-size: 10px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  padding: 1px 5px;
  border-radius: var(--radius-xs);
  color: var(--text-muted);
}

.executed-tools-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: var(--space-1) 0;
}

.tool-badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: 11px;
  background-color: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: var(--radius-full);
  color: var(--color-primary-400);
}

.tool-badge-pill .tool-icon {
  font-size: 10px;
}

.tool-badge-pill .tool-label {
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.tool-badge-pill .tool-name {
  font-size: 10px;
  opacity: 0.75;
}

.thinking-text {
  font-size: 11px;
  font-style: italic;
}

.message-bubble {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  line-height: 1.6;
  box-shadow: var(--shadow-sm);
}

.user-bubble {
  background-color: var(--color-primary-600);
  color: #ffffff;
  border-bottom-right-radius: var(--radius-xs);
}

.assistant-bubble {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  border-bottom-left-radius: var(--radius-xs);
}

.assistant-bubble :deep(p) {
  margin: 0 0 var(--space-2) 0;
}

.assistant-bubble :deep(p:last-child) {
  margin-bottom: 0;
}

.assistant-bubble :deep(.inline-code) {
  background-color: rgba(99, 102, 241, 0.12);
  color: var(--color-primary-400);
  padding: 1px 4px;
  border-radius: var(--radius-xs);
  font-family: var(--font-family-mono);
  font-size: 0.9em;
}

.assistant-bubble :deep(.chat-h3) {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: var(--space-3) 0 var(--space-1) 0;
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.assistant-bubble :deep(.chat-h3:first-child) {
  margin-top: 0;
}

.assistant-bubble :deep(.chat-h4) {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary-400);
  margin: var(--space-2) 0 var(--space-1) 0;
}

.assistant-bubble :deep(.chat-quote) {
  margin: var(--space-2) 0;
  padding: var(--space-2) var(--space-3);
  border-left: 3px solid var(--color-primary-500);
  background-color: rgba(99, 102, 241, 0.06);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  font-style: italic;
  color: var(--text-secondary);
}

.assistant-bubble :deep(.chat-ticket-ref) {
  display: inline-flex;
  align-items: center;
  padding: 1px 5px;
  background-color: rgba(99, 102, 241, 0.15);
  color: #818cf8;
  border-radius: var(--radius-xs);
  font-family: var(--font-family-mono);
  font-size: 0.85em;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.02em;
}

.assistant-bubble :deep(.chat-bullet-list) {
  margin: var(--space-2) 0;
  padding-left: var(--space-4);
}

.assistant-bubble :deep(li) {
  margin-bottom: var(--space-1);
  line-height: 1.5;
}


.msg-meta-row {
  font-size: 10px;
}

/* Citations & Source Badges */
.sources-pill-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-1);
  padding: 4px 10px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  width: fit-content;
  max-width: 100%;
}

.sources-title {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
}

.sources-icon {
  font-size: 11px;
}

.source-item-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 11px;
  background-color: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.25);
  color: #60a5fa;
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-medium);
}

/* Thinking Indicator */
.thinking-bubble {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: var(--space-3) var(--space-4);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  width: fit-content;
}

.typing-dot {
  width: 7px;
  height: 7px;
  background-color: var(--color-primary-400);
  border-radius: 50%;
  animation: typingBounce 1.4s infinite ease-in-out both;
}

.typing-dot:nth-child(1) {
  animation-delay: -0.32s;
}
.typing-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typingBounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Quick Prompt Chips */
.quick-prompt-chips {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-5);
  overflow-x: auto;
  border-top: 1px solid var(--border-subtle);
  background-color: var(--bg-surface-elevated);
}

.prompt-chip {
  white-space: nowrap;
  padding: 4px 10px;
  font-size: 11px;
  background-color: var(--glass-bg-subtle);
  border: 1px solid var(--glass-border-subtle);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--motion-fast, 140ms cubic-bezier(0.16, 1, 0.3, 1));
}

.prompt-chip:hover:not(:disabled) {
  border-color: var(--glass-border-active);
  color: var(--color-primary-400);
  background-color: var(--bg-surface-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.12);
}

/* Chat Input Bar */
.chat-input-bar {
  padding: var(--space-3) var(--space-5) var(--space-4);
  border-top: 1px solid var(--border-subtle);
  background-color: var(--glass-bg-nav);
  backdrop-filter: var(--glass-blur-sm);
  -webkit-backdrop-filter: var(--glass-blur-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.input-wrap {
  width: 100%;
}

.chat-textarea {
  width: 100%;
  padding: var(--space-3);
  background-color: var(--glass-bg-input);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: inherit;
  font-size: var(--text-sm);
  resize: none;
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.chat-textarea:focus {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.18);
}

.input-actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.input-hint {
  font-size: 11px;
}

/* Used Tools Row */
.used-tools-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-1);
  font-size: 11px;
}

.used-tools-label {
  color: var(--text-muted);
  font-weight: var(--font-weight-medium);
}

.used-tool-chip {
  color: var(--color-success-500, #22c55e);
  font-size: 11px;
  font-weight: var(--font-weight-medium);
}

.agent-rounds-badge {
  margin-left: auto;
  font-size: 10px;
  color: var(--text-muted);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  padding: 1px 6px;
  border-radius: var(--radius-full);
}

/* Source similarity percentage */
.source-similarity {
  margin-left: 3px;
  font-size: 10px;
  opacity: 0.7;
  font-weight: var(--font-weight-normal);
}

/* Project Intelligence Card */
.intelligence-card {
  margin-top: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.intelligence-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: var(--space-2);
}

.intelligence-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 11px;
  color: var(--text-primary);
}

.intelligence-icon {
  font-size: 13px;
}

.intelligence-badges {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.risk-type-chip {
  font-size: 10px;
  padding: 1px 6px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.severity-badge {
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  padding: 1px 7px;
  border-radius: var(--radius-xs);
  letter-spacing: 0.05em;
}

.severity-critical {
  background-color: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.severity-high {
  background-color: rgba(249, 115, 22, 0.15);
  color: #f97316;
  border: 1px solid rgba(249, 115, 22, 0.3);
}

.severity-medium {
  background-color: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.severity-low {
  background-color: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.confidence-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  letter-spacing: 0.05em;
}

.confidence-high {
  background-color: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.confidence-medium {
  background-color: rgba(99, 102, 241, 0.15);
  color: #818cf8;
  border: 1px solid rgba(99, 102, 241, 0.3);
}

.confidence-low {
  background-color: rgba(148, 163, 184, 0.15);
  color: #94a3b8;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.evidence-summary-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}

.evidence-chip-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  color: var(--text-primary);
}

.ev-type-icon {
  font-size: 11px;
}

.ev-ref-text {
  font-size: 11px;
  color: var(--color-primary-400, #818cf8);
}

.intel-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.intel-section-title {
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.intel-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: var(--text-xs);
  line-height: 1.5;
  color: var(--text-primary);
}

.intel-bullet {
  color: var(--color-primary-400);
  font-weight: bold;
}

.rec-arrow {
  color: var(--color-success-500, #22c55e);
}

.intel-content {
  display: inline;
}

.intel-text {
  margin-right: 6px;
}

.evidence-tags-inline {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 3px;
  vertical-align: middle;
}

.evidence-tag {
  font-size: 10px;
  padding: 0 4px;
  background-color: rgba(99, 102, 241, 0.12);
  color: var(--color-primary-400);
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: var(--radius-xs);
}

.grounded-status-chip {
  font-size: 10px;
  font-weight: var(--font-weight-medium);
  color: var(--color-success-500, #22c55e);
  background-color: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.25);
  border-radius: var(--radius-full);
  padding: 1px 7px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.ai-workspace-layout {
  display: flex;
  gap: 16px;
  min-height: 600px;
  align-items: stretch;
}

.conv-sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--bg-surface);
  border: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-lg, 8px);
  display: flex;
  flex-direction: column;
  padding: 12px;
  transition: all 0.2s ease-in-out;
}

.conv-sidebar.is-collapsed {
  width: 52px;
  padding: 12px 8px;
}

.sidebar-action-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.sidebar-action-row.is-collapsed {
  flex-direction: column;
  gap: 6px;
  align-items: center;
}

.new-chat-btn {
  flex: 1;
  justify-content: center;
}

.sidebar-new-btn-icon {
  background: var(--color-brand-600, #6366f1);
  border: none;
  color: #fff;
  border-radius: var(--radius-md, 6px);
  padding: 7px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  transition: background 0.15s ease;
}

.sidebar-new-btn-icon:hover {
  background: var(--color-brand-500, #7c3aed);
}

.sidebar-toggle-btn {
  background: transparent;
  border: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.1));
  color: var(--color-text-secondary, #94a3b8);
  border-radius: var(--radius-md, 6px);
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 100%;
}

.sidebar-action-row:not(.is-collapsed) .sidebar-toggle-btn {
  width: auto;
  flex-shrink: 0;
}

.sidebar-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  border-color: var(--color-brand-500, #6366f1);
}

.sidebar-scroll-area {
  flex: 1;
  overflow-y: auto;
}

.sidebar-heading {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary, #94a3b8);
  margin-bottom: 8px;
  padding: 0 4px;
}

.sidebar-loading-state,
.sidebar-empty-state {
  font-size: 12px;
  color: var(--color-text-muted, #64748b);
  padding: 12px 4px;
  text-align: center;
}

.sidebar-skeletons-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px;
}

.sidebar-conv-skeleton {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  border-radius: var(--radius-md, 6px);
  background-color: var(--bg-surface-elevated);
}

.conv-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.conv-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: var(--radius-md, 6px);
  cursor: pointer;
  transition: background 0.15s ease;
  border: 1px solid transparent;
}

.conv-list-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.conv-list-item.active {
  background: rgba(99, 102, 241, 0.12);
  border-color: rgba(99, 102, 241, 0.3);
}

.conv-item-text {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.conv-item-title {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-item-date {
  font-size: 10px;
  color: var(--color-text-muted, #64748b);
}

.conv-item-delete {
  background: transparent;
  border: none;
  color: var(--color-text-muted, #64748b);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.15s ease, color 0.15s ease;
}

.conv-list-item:hover .conv-item-delete {
  opacity: 1;
}

.conv-item-delete:hover {
  color: var(--color-danger-500, #ef4444);
  background: rgba(239, 68, 68, 0.1);
}

@media (max-width: 640px) {
  .welcome-prompt-cards {
    grid-template-columns: 1fr;
  }

  .message-row {
    max-width: 95%;
  }
}
</style>
