/**
 * Task 19 — Centralized RAG Retrieval Configuration
 * Defines parameters for similarity thresholding, deduplication, Top-K limits, and context sizing.
 */
export const RAG_CONFIG = {
  /**
   * Default number of top relevant chunks to retrieve for LLM context
   */
  TOP_K: 5,

  /**
   * Maximum allowed Top-K override
   */
  MAX_TOP_K: 10,

  /**
   * Minimum cosine similarity threshold (0.0 to 1.0).
   * Chunks with similarity score below this threshold are filtered out as low-relevance noise.
   */
  MIN_SIMILARITY: 0.55,

  /**
   * Maximum chunks passed into LLM prompt context
   */
  MAX_CONTEXT_CHUNKS: 5,

  /**
   * Maximum total characters passed into LLM prompt context to prevent context window bloat
   */
  MAX_CONTEXT_CHARACTERS: 4000,

  /**
   * Cosine / text similarity threshold above which chunks are considered near-duplicates (0.0 to 1.0)
   */
  DEDUPLICATION_SIMILARITY_THRESHOLD: 0.92,

  /**
   * Maximum number of chunks allowed per document to maintain document-level diversity
   */
  MAX_CHUNKS_PER_DOC: 3
};
