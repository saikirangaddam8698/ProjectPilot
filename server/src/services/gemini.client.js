/**
 * Gemini Client Service Wrapper
 * Wraps @google/genai SDK with secure configuration, timeout protection,
 * transient error retries with exponential backoff, error normalization, and test mock support.
 */
import { GoogleGenAI } from '@google/genai';
import { config } from '../config/index.js';
import { ApiError } from '../utils/apiError.js';

let mockClient = null;

export class GeminiClient {
  /**
   * Set a mock client for automated testing
   * @param {object|null} mock
   */
  static setMock(mock) {
    mockClient = mock;
  }

  /**
   * Get configured Gemini client instance
   */
  static getClient() {
    if (mockClient) {
      return mockClient;
    }

    if (!config.ai.geminiApiKey) {
      throw ApiError.serviceUnavailable(
        'Gemini AI service is not configured. Please set GEMINI_API_KEY in the server environment.'
      );
    }

    return new GoogleGenAI({ apiKey: config.ai.geminiApiKey });
  }

  /**
   * Helper to execute promise with timeout handling
   * @param {Promise} promise
   * @param {number} timeoutMs
   * @returns {Promise}
   */
  static async withTimeout(promise, timeoutMs) {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(ApiError.serviceUnavailable(`Gemini API request timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      return result;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Generate content using Gemini model with timeout and retry protection
   * @param {object} params
   * @param {string} [params.systemInstruction]
   * @param {Array<object>} params.contents
   * @param {string} [params.model]
   * @param {Array<object>} [params.tools]
   * @returns {Promise<object>} Normalized response { text, functionCalls, candidateContent, model, usage }
   */
  static async generateContent({ systemInstruction, contents, model = null, tools = null }) {
    const selectedModel = model || config.ai.geminiModel || 'gemini-3.6-flash';
    const hardeningConfig = config.ai.hardening || {};
    const timeoutMs = hardeningConfig.GEMINI_TIMEOUT_MS || 15000;
    const maxRetries = hardeningConfig.MAX_RETRIES ?? 2;
    const baseDelayMs = hardeningConfig.RETRY_DELAY_MS || 200;

    let attempt = 0;
    let lastError = null;

    while (attempt <= maxRetries) {
      attempt++;
      try {
        const generateConfig = {
          temperature: 0.2
        };

        if (systemInstruction) {
          generateConfig.systemInstruction = systemInstruction;
        }

        if (tools && Array.isArray(tools) && tools.length > 0) {
          generateConfig.tools = tools;
        }

        let response;
        if (mockClient && typeof mockClient.generateContent === 'function') {
          response = await this.withTimeout(
            mockClient.generateContent({ systemInstruction, contents, model: selectedModel, tools }),
            timeoutMs
          );
        } else {
          response = await this.withTimeout(
            ai.models.generateContent({
              model: selectedModel,
              contents,
              config: generateConfig
            }),
            timeoutMs
          );
        }

        const text = response.text || '';
        const rawCalls = response.functionCalls || [];

        // Sanitize functionCalls: keep only valid objects with string name
        const functionCalls = rawCalls.filter(call => call && typeof call === 'object' && typeof call.name === 'string' && call.name.trim().length > 0);

        const candidateContent = response.candidates?.[0]?.content || null;
        const usageMetadata = response.usageMetadata || null;

        const usage = usageMetadata
          ? {
              promptTokens: usageMetadata.promptTokenCount || null,
              candidatesTokens: usageMetadata.candidatesTokenCount || null,
              totalTokens: usageMetadata.totalTokenCount || null
            }
          : (response.usage || null);

        return {
          text,
          functionCalls,
          candidateContent,
          model: selectedModel,
          usage
        };
      } catch (error) {
        lastError = error;

        const status = error?.status || error?.statusCode || 500;
        const message = error?.message || '';

        // Check if error is retryable (503, 429, timeout, network error)
        const isRetryable =
          status === 503 ||
          status === 429 ||
          message.includes('timed out') ||
          message.includes('ETIMEDOUT') ||
          message.includes('ECONNRESET') ||
          message.includes('high demand') ||
          message.includes('RESOURCE_EXHAUSTED');

        if (isRetryable && attempt <= maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt - 1);
          await new Promise(res => setTimeout(res, delay));
          continue;
        }

        // Standard error normalization if max retries exceeded or error not retryable
        if (error instanceof ApiError) {
          throw error;
        }

        if (status === 429 || message.includes('RESOURCE_EXHAUSTED') || message.includes('rate limit')) {
          throw ApiError.tooManyRequests('Gemini AI quota or rate limit exceeded. Please try again later.');
        }

        if (status === 400 || message.includes('INVALID_ARGUMENT')) {
          throw ApiError.badRequest(`Invalid request to Gemini AI: ${message}`);
        }

        if (message.includes('API key not valid') || message.includes('API_KEY_INVALID')) {
          throw ApiError.serviceUnavailable('Invalid Gemini API Key configured on server.');
        }

        if (message.includes('timed out')) {
          throw ApiError.serviceUnavailable(`Gemini API call timed out: ${message}`);
        }

        throw ApiError.internal(`AI Generation error: ${message}`);
      }
    }

    throw lastError || ApiError.internal('Gemini API call failed after retries.');
  }
}
