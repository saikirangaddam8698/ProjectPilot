/**
 * Task 14, Task 15, Task 16 & Task 17 — AI Assistant API Service
 * Handles AI chat requests and persistent project conversation endpoints.
 */
import { http } from './httpClient.js';

export const aiApi = {
  /**
   * Send a conversational chat message to Gemini AI (Backward-compatible)
   */
  sendChatMessage: (data) => http.post('/ai/chat', data),

  /**
   * List conversations for a project
   */
  listConversations: (projectKey) => http.get(`/projects/${projectKey}/conversations`),

  /**
   * Create a new persistent conversation
   */
  createConversation: (projectKey, data) => http.post(`/projects/${projectKey}/conversations`, data),

  /**
   * Get single conversation details with messages
   */
  getConversation: (projectKey, conversationId) => http.get(`/projects/${projectKey}/conversations/${conversationId}`),

  /**
   * Delete a conversation
   */
  deleteConversation: (projectKey, conversationId) => http.delete(`/projects/${projectKey}/conversations/${conversationId}`),

  /**
   * Send message within a persistent conversation
   */
  sendConversationMessage: (projectKey, conversationId, data) => http.post(`/projects/${projectKey}/conversations/${conversationId}/messages`, data)
};
