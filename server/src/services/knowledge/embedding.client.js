/**
 * Embedding Client Service Wrapper
 * Wraps @google/genai SDK to generate 768-dimensional vector embeddings
 * with error handling and test mock support
 */
import { GoogleGenAI } from '@google/genai';
import { config } from '../../config/index.js';
import { ApiError } from '../../utils/apiError.js';

let mockEmbeddingClient = null;

export class EmbeddingClient {
  /**
   * Set a mock client for deterministic unit testing
   * @param {object|null} mock
   */
  static setMock(mock) {
    mockEmbeddingClient = mock;
  }

  /**
   * Get configured client instance
   */
  static getClient() {
    if (mockEmbeddingClient) {
      return mockEmbeddingClient;
    }

    if (!config.ai.geminiApiKey) {
      throw ApiError.serviceUnavailable(
        'Gemini AI service is not configured for embeddings. Please set GEMINI_API_KEY in server environment.'
      );
    }

    return new GoogleGenAI({ apiKey: config.ai.geminiApiKey });
  }

  /**
   * Generate vector embedding for a given text
   * @param {string} text - Input text
   * @param {number} [dimensions=768] - Output vector dimensionality
   * @returns {Promise<Array<number>>} Vector embedding array
   */
  static async embedText(text, dimensions = 768) {
    if (!text || typeof text !== 'string' || !text.trim()) {
      throw ApiError.badRequest('Text is required to generate vector embedding.');
    }

    const model = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';

    try {
      // Test mock support
      if (mockEmbeddingClient && typeof mockEmbeddingClient.embedText === 'function') {
        return await mockEmbeddingClient.embedText(text, dimensions);
      }

      const ai = this.getClient();
      const res = await ai.models.embedContent({
        model,
        contents: text.trim(),
        config: {
          outputDimensionality: dimensions
        }
      });

      const values = res.embeddings?.[0]?.values || res.embedding?.values;
      if (!values || !Array.isArray(values) || values.length === 0) {
        throw ApiError.internal('Gemini embedding response did not contain vector values.');
      }

      return values;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      const status = error?.status || error?.statusCode || 500;
      const message = error?.message || 'Embedding generation failed';

      if (status === 429 || message.includes('RESOURCE_EXHAUSTED') || message.includes('rate limit')) {
        throw ApiError.tooManyRequests('Gemini embedding rate limit exceeded. Please try again later.');
      }

      if (message.includes('API key not valid') || message.includes('API_KEY_INVALID')) {
        throw ApiError.serviceUnavailable('Invalid Gemini API key configured for embeddings.');
      }

      throw ApiError.internal(`Embedding error: ${message}`);
    }
  }

  /**
   * Generate embeddings in batch for multiple chunks
   * @param {Array<string>} textList
   * @param {number} [dimensions=768]
   * @returns {Promise<Array<Array<number>>>}
   */
  static async embedBatch(textList, dimensions = 768) {
    if (!Array.isArray(textList) || textList.length === 0) {
      return [];
    }

    // Process sequentially or in small parallel batches to respect rate limits
    const results = [];
    for (const text of textList) {
      const vector = await this.embedText(text, dimensions);
      results.push(vector);
    }
    return results;
  }
}
