/**
 * Task 17 — Conversation Service
 * Core business logic for persistent AI Conversations & Messages in ProjectPilot.
 * Coordinates conversation storage with AiAgentService execution, history context loading,
 * metadata extraction, and project RBAC security bounds.
 */
import { ConversationRepository } from '../repositories/conversation.repository.js';
import { ProjectRepository } from '../repositories/project.repository.js';
import { AiAgentService } from './ai.service.js';
import { ApiError } from '../utils/apiError.js';

export class ConversationService {
  /**
   * Helper: Resolve project key to DB project record and verify membership
   */
  static async resolveProjectAndVerifyAccess(projectKey, user) {
    if (!projectKey) {
      throw ApiError.badRequest('projectKey is required');
    }

    const pKey = projectKey.toUpperCase();
    const project = await ProjectRepository.findByKey(pKey);

    if (!project) {
      throw ApiError.notFound(`Project '${pKey}' not found`);
    }

    // Global ADMIN has access to all projects; otherwise verify project membership
    if (user?.role !== 'ADMIN') {
      const isMember = project.members?.some((m) => m.memberId === user?.memberId);
      if (!isMember) {
        throw ApiError.forbidden(`User is not a member of project '${pKey}'`);
      }
    }

    return project;
  }

  /**
   * List conversations for a project
   */
  static async listConversations({ projectKey, user }) {
    const project = await this.resolveProjectAndVerifyAccess(projectKey, user);

    const conversations = await ConversationRepository.findConversationsByProject({
      projectId: project.id,
      userId: user?.id
    });

    return conversations.map((c) => ({
      id: c.id,
      projectId: c.projectId,
      projectKey: project.key,
      title: c.title,
      messageCount: c._count?.messages || 0,
      lastMessageAt: c.messages?.[0]?.createdAt || c.updatedAt,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }));
  }

  /**
   * Create a new conversation
   */
  static async createConversation({ projectKey, user, title, initialMessage }) {
    const project = await this.resolveProjectAndVerifyAccess(projectKey, user);

    // Deterministic title fallback if not explicitly provided
    let convTitle = title ? title.trim() : null;
    if (!convTitle && initialMessage && initialMessage.trim()) {
      convTitle = this.generateTitleFromMessage(initialMessage);
    }
    if (!convTitle) {
      convTitle = 'New AI Conversation';
    }

    const conversation = await ConversationRepository.createConversation({
      projectId: project.id,
      createdById: user?.id || null,
      title: convTitle.slice(0, 80)
    });

    let assistantResponse = null;

    // If initialMessage is provided, send it immediately
    if (initialMessage && initialMessage.trim()) {
      assistantResponse = await this.sendMessage({
        projectKey: project.key,
        conversationId: conversation.id,
        user,
        message: initialMessage.trim()
      });
    }

    const updatedConv = await ConversationRepository.findConversationById({
      conversationId: conversation.id,
      projectId: project.id
    });

    return {
      id: updatedConv.id,
      projectId: updatedConv.projectId,
      projectKey: project.key,
      title: updatedConv.title,
      createdAt: updatedConv.createdAt,
      updatedAt: updatedConv.updatedAt,
      messages: (updatedConv.messages || []).map(this.formatMessage),
      latestResponse: assistantResponse
    };
  }

  /**
   * Get single conversation details with messages
   */
  static async getConversation({ projectKey, conversationId, user }) {
    const project = await this.resolveProjectAndVerifyAccess(projectKey, user);

    const conversation = await ConversationRepository.findConversationById({
      conversationId,
      projectId: project.id
    });

    if (!conversation) {
      throw ApiError.notFound(`Conversation '${conversationId}' not found in project '${project.key}'`);
    }

    return {
      id: conversation.id,
      projectId: conversation.projectId,
      projectKey: project.key,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: (conversation.messages || []).map(this.formatMessage)
    };
  }

  /**
   * Delete a conversation
   */
  static async deleteConversation({ projectKey, conversationId, user }) {
    const project = await this.resolveProjectAndVerifyAccess(projectKey, user);

    const existing = await ConversationRepository.findConversationById({
      conversationId,
      projectId: project.id
    });

    if (!existing) {
      throw ApiError.notFound(`Conversation '${conversationId}' not found in project '${project.key}'`);
    }

    await ConversationRepository.deleteConversation({
      conversationId,
      projectId: project.id
    });

    return { success: true, conversationId };
  }

  /**
   * Send a message within an existing conversation
   */
  static async sendMessage({ projectKey, conversationId, user, message, requestId }) {
    if (!message || !message.trim()) {
      throw ApiError.badRequest('message cannot be empty');
    }

    const project = await this.resolveProjectAndVerifyAccess(projectKey, user);

    const conversation = await ConversationRepository.findConversationById({
      conversationId,
      projectId: project.id
    });

    if (!conversation) {
      throw ApiError.notFound(`Conversation '${conversationId}' not found in project '${project.key}'`);
    }

    // 1. Persist user message turn
    const userMessage = await ConversationRepository.createMessage({
      conversationId: conversation.id,
      role: 'user',
      content: message.trim()
    });

    // 2. Load recent messages for history context (bounded to latest 20 messages)
    const recentMessages = await ConversationRepository.getRecentMessages({
      conversationId: conversation.id,
      limit: 20
    });

    // Convert stored messages to history format excluding the very last user message just appended
    const history = recentMessages
      .slice(0, -1)
      .map((m) => ({
        role: m.role,
        content: m.content
      }));

    // 3. Run AI Agent through AiAgentService with context history
    const aiResponse = await AiAgentService.chat({
      projectKey: project.key,
      message: message.trim(),
      history,
      user,
      requestId
    });

    // 4. Persist assistant response turn with safe metadata
    const assistantMetadata = {
      executedTools: aiResponse.executedTools || [],
      sources: aiResponse.sources || [],
      analysis: aiResponse.analysis || null,
      grounded: Boolean(aiResponse.grounded),
      agentRounds: aiResponse.agentRounds || 1,
      requestId: aiResponse.requestId || requestId || null,
      model: aiResponse.model || null,
      usage: aiResponse.usage || null
    };

    const assistantMessage = await ConversationRepository.createMessage({
      conversationId: conversation.id,
      role: 'assistant',
      content: aiResponse.message,
      metadata: assistantMetadata
    });

    // 5. Update title if conversation title is default and this is early turn
    if (conversation.title === 'New AI Conversation' && conversation.messages.length <= 2) {
      const autoTitle = this.generateTitleFromMessage(message.trim());
      await ConversationRepository.updateConversation(conversation.id, {
        title: autoTitle
      });
    }

    return {
      conversationId: conversation.id,
      projectKey: project.key,
      message: aiResponse.message,
      userMessage: this.formatMessage(userMessage),
      assistantMessage: this.formatMessage(assistantMessage),
      model: aiResponse.model,
      usage: aiResponse.usage,
      agentRounds: aiResponse.agentRounds,
      executedTools: aiResponse.executedTools,
      sources: aiResponse.sources,
      analysis: aiResponse.analysis,
      requestId: aiResponse.requestId,
      grounded: aiResponse.grounded
    };
  }

  /**
   * Helper: Deterministically generate conversation title from first user message
   */
  static generateTitleFromMessage(msgStr) {
    if (!msgStr) return 'New AI Conversation';
    const cleanStr = msgStr.trim().replace(/^["']|["']$/g, '');
    if (cleanStr.length <= 40) return cleanStr;
    return `${cleanStr.slice(0, 37)}...`;
  }

  /**
   * Format message object safely for responses
   */
  static formatMessage(msg) {
    if (!msg) return null;
    const meta = typeof msg.metadata === 'object' && msg.metadata ? msg.metadata : {};
    return {
      id: msg.id,
      conversationId: msg.conversationId,
      role: msg.role,
      content: msg.content,
      executedTools: meta.executedTools || [],
      sources: meta.sources || [],
      analysis: meta.analysis || null,
      grounded: Boolean(meta.grounded),
      agentRounds: meta.agentRounds || null,
      requestId: meta.requestId || null,
      createdAt: msg.createdAt
    };
  }
}
