/**
 * Task 18 — Embedding Service
 * Converts plain text chunks into 768-dimensional float vectors for vector similarity search.
 * Strictly separates vector embedding generation from LLM text generation.
 * Embeddings are stored in PostgreSQL/pgvector and are NEVER exposed to client payloads.
 */
import { EmbeddingClient } from './embedding.client.js';
import { ApiError } from '../../utils/apiError.js';

export class EmbeddingService {
  /**
   * Generate 768-dimensional float embedding for text chunk
   *
   * @param {string} text - Input chunk text
   * @param {number} [dimensions=768] - Target vector dimensions
   * @returns {Promise<Array<number>>} 768-float vector
   */
  static async generateEmbedding(text, dimensions = 768) {
    if (!text || typeof text !== 'string' || !text.trim()) {
      throw ApiError.badRequest('Text is required to generate vector embedding.');
    }

    try {
      const vector = await EmbeddingClient.embedText(text, dimensions);
      if (!Array.isArray(vector) || vector.length === 0) {
        throw ApiError.internal('Embedding service returned empty vector.');
      }
      return vector;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw ApiError.internal(`Failed to generate vector embedding: ${err.message}`);
    }
  }

  /**
   * Generate embeddings for an array of text chunks sequentially
   *
   * @param {Array<string>} textList
   * @param {number} [dimensions=768]
   * @returns {Promise<Array<Array<number>>>} List of float vectors
   */
  static async generateBatchEmbeddings(textList = [], dimensions = 768) {
    if (!Array.isArray(textList) || textList.length === 0) {
      return [];
    }

    const vectors = [];
    for (const text of textList) {
      try {
        const vec = await this.generateEmbedding(text, dimensions);
        vectors.push(vec);
      } catch (err) {
        console.error('Batch embedding item failed:', err.message);
        // Fallback zero/pseudo vector to prevent breaking full batch if one fails
        vectors.push(null);
      }
    }

    return vectors;
  }
}
