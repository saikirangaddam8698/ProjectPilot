/**
 * Task 17 — Conversation Controller
 * HTTP request handlers for persistent AI Conversation endpoints.
 */
import { ConversationService } from '../services/conversation.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../utils/constants.js';

export class ConversationController {
  /**
   * GET /api/v1/projects/:projectKey/conversations
   */
  static async listConversations(req, res) {
    const { projectKey } = req.params;
    const user = req.user;

    const data = await ConversationService.listConversations({
      projectKey,
      user
    });

    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Conversations retrieved',
      data
    });
  }

  /**
   * POST /api/v1/projects/:projectKey/conversations
   */
  static async createConversation(req, res) {
    const { projectKey } = req.params;
    const { title, initialMessage } = req.body;
    const user = req.user;

    const data = await ConversationService.createConversation({
      projectKey,
      user,
      title,
      initialMessage
    });

    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Conversation created',
      data
    });
  }

  /**
   * GET /api/v1/projects/:projectKey/conversations/:conversationId
   */
  static async getConversation(req, res) {
    const { projectKey, conversationId } = req.params;
    const user = req.user;

    const data = await ConversationService.getConversation({
      projectKey,
      conversationId,
      user
    });

    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Conversation details retrieved',
      data
    });
  }

  /**
   * DELETE /api/v1/projects/:projectKey/conversations/:conversationId
   */
  static async deleteConversation(req, res) {
    const { projectKey, conversationId } = req.params;
    const user = req.user;

    const data = await ConversationService.deleteConversation({
      projectKey,
      conversationId,
      user
    });

    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Conversation deleted',
      data
    });
  }

  /**
   * POST /api/v1/projects/:projectKey/conversations/:conversationId/messages
   */
  static async sendMessage(req, res) {
    const { projectKey, conversationId } = req.params;
    const { message } = req.body;
    const user = req.user;
    const requestId = req.requestId;

    if (requestId) {
      res.setHeader('X-Request-Id', requestId);
    }

    const data = await ConversationService.sendMessage({
      projectKey,
      conversationId,
      user,
      message,
      requestId
    });

    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Message sent and response generated',
      data
    });
  }
}
