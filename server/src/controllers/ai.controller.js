/**
 * Task 14, Task 15 & Task 16 — AI Controller
 * HTTP Request Handlers for Gemini AI endpoints with Request Correlation ID support.
 */
import { AiAgentService } from '../services/ai.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../utils/constants.js';

export class AiController {
  /**
   * Handle POST /api/v1/ai/chat
   */
  static async chat(req, res) {
    const { projectKey, message, history } = req.body;
    const user = req.user;
    const requestId = req.requestId;

    if (requestId) {
      res.setHeader('X-Request-Id', requestId);
    }

    const data = await AiAgentService.chat({
      projectKey,
      message,
      history,
      user,
      requestId
    });

    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'AI response generated',
      data
    });
  }

  /**
   * Handle GET /api/v1/ai/metrics
   */
  static async getMetrics(req, res) {
    const { AiMetrics } = await import('../services/ai/observability/aiMetrics.js');
    const metrics = AiMetrics.getSnapshot();
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'AI metrics retrieved successfully',
      data: metrics
    });
  }
}
