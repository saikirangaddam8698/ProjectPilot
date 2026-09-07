/**
 * Task 14, Task 15, Task 16 & Task 17 — Pinia AI Store
 * Manages persistent conversation history, active conversation state,
 * agent activity indicators, and grounded intelligence metadata.
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { aiApi } from '@/services/api/ai.api';

const ACTIVITY_PHASES = [
  'Analyzing your request…',
  'Checking project data…',
  'Reviewing findings…',
  'Synthesizing findings…'
];

export const useAiStore = defineStore('ai', () => {
  // ── State ──────────────────────────────────────────────
  const selectedProjectKey = ref('PILOT');
  const conversations = ref([]);
  const activeConversationId = ref(null);
  const messages = ref([]);
  const isGenerating = ref(false);
  const isLoadingConversations = ref(false);
  const isLoadingConversation = ref(false);
  const error = ref(null);
  const agentActivity = ref(null);

  // ── Getters ────────────────────────────────────────────
  const hasMessages = computed(() => messages.value.length > 0);
  const lastMessage = computed(() => messages.value[messages.value.length - 1] || null);
  const activeConversation = computed(() =>
    conversations.value.find((c) => c.id === activeConversationId.value) || null
  );

  // ── Activity Cycling ───────────────────────────────────
  let activityTimer = null;

  function startActivityCycle() {
    let phase = 0;
    agentActivity.value = ACTIVITY_PHASES[0];
    activityTimer = setInterval(() => {
      phase = (phase + 1) % ACTIVITY_PHASES.length;
      agentActivity.value = ACTIVITY_PHASES[phase];
    }, 2200);
  }

  function stopActivityCycle() {
    if (activityTimer) {
      clearInterval(activityTimer);
      activityTimer = null;
    }
    agentActivity.value = null;
  }

  // ── Actions ────────────────────────────────────────────
  function setProject(projectKey) {
    if (projectKey && selectedProjectKey.value !== projectKey) {
      selectedProjectKey.value = projectKey.toUpperCase();
      activeConversationId.value = null;
      messages.value = [];
      error.value = null;
      fetchConversations();
    }
  }

  function clearConversation() {
    activeConversationId.value = null;
    messages.value = [];
    error.value = null;
    stopActivityCycle();
  }

  /**
   * Fetch conversation list for current project
   */
  async function fetchConversations(projectKey = selectedProjectKey.value) {
    if (!projectKey) return;
    isLoadingConversations.value = true;
    try {
      const response = await aiApi.listConversations(projectKey);
      const data = response?.data || response || [];
      conversations.value = Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      isLoadingConversations.value = false;
    }
  }

  /**
   * Start a new conversation or select existing
   */
  async function createNewConversation(initialMessageText = null) {
    error.value = null;
    try {
      const response = await aiApi.createConversation(selectedProjectKey.value, {
        initialMessage: initialMessageText || undefined
      });
      const data = response?.data || response || {};

      if (data.id) {
        activeConversationId.value = data.id;
        messages.value = data.messages || [];
        await fetchConversations();
        return data;
      }
    } catch (err) {
      error.value = err.message || 'Failed to create conversation.';
    }
    return null;
  }

  /**
   * Load messages for an existing conversation
   */
  async function selectConversation(conversationId) {
    if (!conversationId) return;
    activeConversationId.value = conversationId;
    isLoadingConversation.value = true;
    error.value = null;

    try {
      const response = await aiApi.getConversation(selectedProjectKey.value, conversationId);
      const data = response?.data || response || {};
      messages.value = data.messages || [];
    } catch (err) {
      error.value = err.message || 'Failed to load conversation messages.';
    } finally {
      isLoadingConversation.value = false;
    }
  }

  /**
   * Delete a conversation
   */
  async function deleteConversation(conversationId) {
    if (!conversationId) return;
    try {
      await aiApi.deleteConversation(selectedProjectKey.value, conversationId);
      conversations.value = conversations.value.filter((c) => c.id !== conversationId);
      if (activeConversationId.value === conversationId) {
        clearConversation();
      }
      return true;
    } catch (err) {
      error.value = err.message || 'Failed to delete conversation.';
      return false;
    }
  }

  /**
   * Send a chat message (creates persistent conversation if none active)
   */
  async function sendMessage(text) {
    const trimmed = (text || '').trim();
    if (!trimmed || isGenerating.value) return false;

    error.value = null;

    // If no active conversation, create one first
    if (!activeConversationId.value) {
      const newConv = await createNewConversation(trimmed);
      return Boolean(newConv);
    }

    // Append optimistic user message
    const tempUserMsgId = `temp-user-${Date.now()}`;
    messages.value.push({
      id: tempUserMsgId,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString()
    });

    isGenerating.value = true;
    startActivityCycle();

    try {
      const response = await aiApi.sendConversationMessage(
        selectedProjectKey.value,
        activeConversationId.value,
        { message: trimmed }
      );

      const responseData = response?.data || response || {};

      // Replace temp user message and append assistant message
      if (responseData.userMessage) {
        const tempIdx = messages.value.findIndex((m) => m.id === tempUserMsgId);
        if (tempIdx !== -1) {
          messages.value[tempIdx] = responseData.userMessage;
        }
      }

      if (responseData.assistantMessage) {
        messages.value.push(responseData.assistantMessage);
      } else {
        messages.value.push({
          id: `msg-ai-${Date.now()}`,
          role: 'assistant',
          content: responseData.message || 'No response generated.',
          projectKey: selectedProjectKey.value,
          executedTools: responseData.executedTools || [],
          sources: responseData.sources || [],
          analysis: responseData.analysis || null,
          requestId: responseData.requestId || null,
          grounded: Boolean(responseData.grounded),
          agentRounds: responseData.agentRounds || null,
          createdAt: new Date().toISOString()
        });
      }

      // Refresh conversation list titles/timestamps
      fetchConversations();
      return true;
    } catch (err) {
      error.value = err.message || 'Failed to generate AI response. Please try again.';
      return false;
    } finally {
      isGenerating.value = false;
      stopActivityCycle();
    }
  }

  async function retryLastMessage() {
    const lastUserMsg = [...messages.value].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      await sendMessage(lastUserMsg.content);
    }
  }

  return {
    selectedProjectKey,
    conversations,
    activeConversationId,
    activeConversation,
    messages,
    isGenerating,
    isLoadingConversations,
    isLoadingConversation,
    error,
    agentActivity,
    hasMessages,
    lastMessage,
    setProject,
    clearConversation,
    fetchConversations,
    createNewConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
    retryLastMessage
  };
});
