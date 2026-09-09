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
  const conversationsByProject = ref({});
  const historyLoadedByProject = ref({});
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
    if (!projectKey) return;
    const pKey = projectKey.toUpperCase();
    if (selectedProjectKey.value !== pKey) {
      selectedProjectKey.value = pKey;
      activeConversationId.value = null;
      messages.value = [];
      error.value = null;
      stopActivityCycle();

      // If conversations already cached for this project, restore them immediately with 0 network calls
      if (historyLoadedByProject.value[pKey]) {
        conversations.value = conversationsByProject.value[pKey] || [];
      } else {
        conversations.value = [];
        fetchConversations(pKey);
      }
    }
  }

  function clearConversation() {
    activeConversationId.value = null;
    messages.value = [];
    error.value = null;
    stopActivityCycle();
  }

  const fetchPromiseByProject = {};

  /**
   * Fetch conversation list for current project with in-flight request deduplication and caching
   */
  async function fetchConversations(projectKey = selectedProjectKey.value, force = false) {
    if (!projectKey) return [];
    const pKey = projectKey.toUpperCase();

    // 1. If already loaded for this project and not forced, return cached Pinia conversations
    if (!force && historyLoadedByProject.value[pKey]) {
      const cached = conversationsByProject.value[pKey] || [];
      if (selectedProjectKey.value.toUpperCase() === pKey) {
        conversations.value = cached;
      }
      return cached;
    }

    // 2. In-flight request deduplication per project key
    if (!force && fetchPromiseByProject[pKey]) {
      return fetchPromiseByProject[pKey];
    }

    isLoadingConversations.value = true;
    fetchPromiseByProject[pKey] = (async () => {
      try {
        const response = await aiApi.listConversations(pKey);
        const data = response?.data || response || [];
        const convList = Array.isArray(data) ? data : [];
        conversationsByProject.value[pKey] = convList;
        historyLoadedByProject.value[pKey] = true;
        if (selectedProjectKey.value.toUpperCase() === pKey) {
          conversations.value = convList;
        }
        return convList;
      } catch (err) {
        console.error(`Failed to fetch conversations for ${pKey}:`, err);
        return conversationsByProject.value[pKey] || [];
      } finally {
        isLoadingConversations.value = false;
        delete fetchPromiseByProject[pKey];
      }
    })();

    return fetchPromiseByProject[pKey];
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
        // Insert into local conversation list if not already present
        const existingIdx = conversations.value.findIndex((c) => c.id === data.id);
        if (existingIdx === -1) {
          const newConv = {
            id: data.id,
            projectId: data.projectId,
            projectKey: selectedProjectKey.value,
            title: data.title || 'New AI Conversation',
            messageCount: data.messages?.length || 0,
            lastMessageAt: new Date().toISOString(),
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          conversations.value.unshift(newConv);
          const pKey = selectedProjectKey.value.toUpperCase();
          if (!conversationsByProject.value[pKey]) conversationsByProject.value[pKey] = [];
          conversationsByProject.value[pKey].unshift(newConv);
        }
        return data;
      }
    } catch (err) {
      error.value = err.message || 'Failed to create conversation.';
    }
    return null;
  }

  /**
   * Load messages for an existing conversation (deduplicated: no refetch if already loaded)
   */
  async function selectConversation(conversationId, force = false) {
    if (!conversationId) return;
    if (!force && activeConversationId.value === conversationId && messages.value.length > 0) {
      return;
    }
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
      const pKey = selectedProjectKey.value.toUpperCase();
      if (conversationsByProject.value[pKey]) {
        conversationsByProject.value[pKey] = conversationsByProject.value[pKey].filter((c) => c.id !== conversationId);
      }
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
   * Send a chat message (optimistic UI update, creates persistent conversation if none active)
   */
  async function sendMessage(text) {
    const trimmed = (text || '').trim();
    if (!trimmed || isGenerating.value) return false;

    error.value = null;

    // 1. Immediately push optimistic user message to the UI
    const tempUserMsgId = `temp-user-${Date.now()}`;
    messages.value.push({
      id: tempUserMsgId,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString()
    });

    // 2. Immediately start generating animation and activity cycle
    isGenerating.value = true;
    startActivityCycle();

    try {
      // If no active conversation, create one with initial message
      if (!activeConversationId.value) {
        const response = await aiApi.createConversation(selectedProjectKey.value, {
          initialMessage: trimmed
        });
        const data = response?.data || response || {};

        if (data.id) {
          activeConversationId.value = data.id;
          if (Array.isArray(data.messages) && data.messages.length > 0) {
            messages.value = data.messages;
          }
          // Optimistically unshift into conversations list without an extra HTTP GET
          const existingIdx = conversations.value.findIndex((c) => c.id === data.id);
          if (existingIdx === -1) {
            const newConv = {
              id: data.id,
              projectId: data.projectId,
              projectKey: selectedProjectKey.value,
              title: data.title || trimmed.slice(0, 35),
              messageCount: data.messages?.length || 2,
              lastMessageAt: new Date().toISOString(),
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            conversations.value.unshift(newConv);
            const pKey = selectedProjectKey.value.toUpperCase();
            if (!conversationsByProject.value[pKey]) conversationsByProject.value[pKey] = [];
            conversationsByProject.value[pKey].unshift(newConv);
          }
          return true;
        } else {
          throw new Error('Failed to create new conversation session.');
        }
      }

      // Existing conversation: send message
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

      // Update active conversation in local list without an extra HTTP call
      const activeConv = conversations.value.find((c) => c.id === activeConversationId.value);
      if (activeConv) {
        activeConv.lastMessageAt = new Date().toISOString();
        activeConv.messageCount = messages.value.length;
      }
      const pKey = selectedProjectKey.value.toUpperCase();
      const cachedConv = conversationsByProject.value[pKey]?.find((c) => c.id === activeConversationId.value);
      if (cachedConv) {
        cachedConv.lastMessageAt = new Date().toISOString();
        cachedConv.messageCount = messages.value.length;
      }
      return true;
    } catch (err) {
      error.value = err.message || 'Failed to generate AI response. Please try again.';
      // If failed on new conversation with only the temp message, remove it or keep for retry
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
    historyLoadedByProject,
    conversationsByProject,
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
