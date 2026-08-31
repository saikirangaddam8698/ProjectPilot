<script setup>
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import BaseInput from '@/components/ui/BaseInput.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="ai-title-row">
          <h2 class="page-title">AI Project Assistant</h2>
          <BaseBadge variant="purple" size="md">Gemini Copilot</BaseBadge>
        </div>
        <p class="page-subtitle">Context-aware conversational agent with read-only project tools and future RAG.</p>
      </div>
      <div class="page-actions">
        <BaseButton variant="outline" size="sm">
          Clear Context
        </BaseButton>
      </div>
    </div>

    <!-- AI Chat Shell Preview -->
    <div class="ai-chat-card">
      <div class="chat-header">
        <div class="chat-meta">
          <span class="active-context-label">Active Context:</span>
          <BaseBadge variant="neutral" size="sm">Project: PILOT</BaseBadge>
          <BaseBadge variant="neutral" size="sm">Sprint: Sprint 24</BaseBadge>
          <BaseBadge variant="info" size="sm">4 Read-only Tools Active</BaseBadge>
        </div>
      </div>

      <div class="chat-messages-area">
        <!-- User Message -->
        <div class="message-row user-row">
          <div class="message-bubble user-bubble">
            Which tickets in Sprint 24 are at risk of missing the sprint delivery deadline?
          </div>
        </div>

        <!-- Assistant Message with Tool Execution Badge -->
        <div class="message-row assistant-row">
          <div class="assistant-avatar">
            <AppIcon name="ai" :size="16" />
          </div>
          <div class="message-content-group">
            <!-- Tool Execution Badge -->
            <div class="tool-call-pill">
              <span class="tool-icon">⚙</span>
              <span>Invoked <code>listSprintTickets(sprintId="sprint-24", status="in_progress")</code></span>
            </div>

            <div class="message-bubble assistant-bubble">
              <p>Based on the current velocity analysis and issue activity logs in <strong>Sprint 24</strong>:</p>
              <ul class="assistant-bullet-list">
                <li>
                  <code>PILOT-104</code> (<em>PostgreSQL connection pool exhaustion</em>) has been In Progress for 48h with 5 story points. This is currently blocking QA testing.
                </li>
                <li>
                  <code>PILOT-89</code> (<em>Kanban race condition</em>) is still in Backlog/Todo with 3 points remaining.
                </li>
              </ul>
              <p class="mt-2 text-secondary">
                Recommendation: Reallocate <code>PILOT-89</code> to Sprint 25 to protect the core release goal.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Input Area Placeholder -->
      <div class="chat-input-bar">
        <div class="quick-prompt-chips">
          <button class="prompt-chip">"Summarize Sprint 24 blockers"</button>
          <button class="prompt-chip">"What is our velocity trend?"</button>
          <button class="prompt-chip">"Generate sprint release notes"</button>
        </div>
        <div class="input-send-row">
          <BaseInput
            placeholder="Ask anything about your tickets, velocity, or engineering docs..."
            size="md"
          >
            <template #prefix>
              <AppIcon name="ai" :size="16" />
            </template>
          </BaseInput>
          <BaseButton variant="primary" size="md">
            Send
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
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
}

.page-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-1);
}

.page-actions {
  display: flex;
  align-items: center;
}

/* Chat Card */
.ai-chat-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  height: calc(100vh - 230px);
  min-height: 520px;
}

.chat-header {
  padding: var(--space-3) var(--space-5);
  border-bottom: 1px solid var(--border-subtle);
  background-color: var(--bg-surface-elevated);
}

.chat-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.active-context-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-weight: var(--font-weight-medium);
}

.chat-messages-area {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.message-row {
  display: flex;
  gap: var(--space-3);
  max-width: 80%;
}

.user-row {
  align-self: flex-end;
}

.user-bubble {
  background-color: var(--color-primary-600);
  color: #FFFFFF;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg) var(--radius-lg) 0 var(--radius-lg);
  font-size: var(--text-sm);
  line-height: var(--line-height-normal);
}

.assistant-row {
  align-self: flex-start;
}

.assistant-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message-content-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.tool-call-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 3px 8px;
  border-radius: var(--radius-xs);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-secondary);
  align-self: flex-start;
}

.tool-icon {
  color: var(--color-primary-400);
}

.assistant-bubble {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  padding: var(--space-4) var(--space-5);
  border-radius: 0 var(--radius-lg) var(--radius-lg) var(--radius-lg);
  font-size: var(--text-sm);
  line-height: var(--line-height-relaxed);
}

.assistant-bullet-list {
  margin-top: var(--space-2);
  margin-left: var(--space-4);
  list-style: disc;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.assistant-bubble code {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  background-color: var(--bg-surface);
  padding: 2px 4px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-default);
}

.chat-input-bar {
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--border-subtle);
  background-color: var(--bg-surface);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.quick-prompt-chips {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
}

.prompt-chip {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  padding: 4px var(--space-3);
  border-radius: var(--radius-full);
  cursor: pointer;
  white-space: nowrap;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.prompt-chip:hover {
  background-color: var(--bg-surface-hover);
  color: var(--text-primary);
}

.input-send-row {
  display: flex;
  gap: var(--space-3);
}

.input-send-row :deep(.input-wrapper) {
  flex: 1;
}
</style>
