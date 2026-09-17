import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';
import { AiAgentService } from '../services/ai.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../utils/constants.js';

const AVAILABLE_MODELS = [
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', label: 'Gemini 3.8 Flash (Latest & Recommended)', description: 'Fastest & latest generation with multi-turn tool reasoning' },
  { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', label: 'Gemini 3.7 Flash', description: 'Advanced flash speed and low latency' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', label: 'Gemini 3.6 Flash', description: 'Stable agile assistant model' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', label: 'Gemini 2.5 Flash', description: 'High throughput, responsive model' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', label: 'Gemini 2.5 Pro (High Reasoning)', description: 'Deep reasoning & complex code analysis' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', label: 'Gemini 1.5 Flash (Legacy)', description: 'Legacy flash model' }
];

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

  /**
   * Handle GET /api/v1/ai/config
   * Returns active model and list of selectable Gemini models
   */
  static async getConfig(req, res) {
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'AI configuration retrieved',
      data: {
        activeModel: config.ai.geminiModel,
        availableModels: AVAILABLE_MODELS,
        status: 'operational'
      }
    });
  }

  /**
   * Handle PATCH /api/v1/ai/config
   * Dynamically switches the active Gemini model for the application
   */
  static async updateConfig(req, res) {
    const { model } = req.body;
    if (!model || typeof model !== 'string') {
      return ApiResponse.error(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'A valid model identifier is required'
      });
    }

    config.ai.geminiModel = model;
    process.env.GEMINI_MODEL = model;

    // Persist to server/.env if available
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('GEMINI_MODEL=')) {
          envContent = envContent.replace(/GEMINI_MODEL=.*/, `GEMINI_MODEL=${model}`);
        } else {
          envContent += `\nGEMINI_MODEL=${model}`;
        }
        fs.writeFileSync(envPath, envContent, 'utf8');
      }
    } catch (e) {
      // Non-critical persistence failure; memory state is updated
    }

    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: `Active AI model updated to ${model}`,
      data: {
        activeModel: config.ai.geminiModel,
        availableModels: AVAILABLE_MODELS,
        status: 'operational'
      }
    });
  }
}
