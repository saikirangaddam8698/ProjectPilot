/**
 * Task 19 — RAG Query Processor
 * Lightweight, deterministic pre-processor for semantic RAG search queries.
 * Normalizes text, cleans noise/punctuation, and neutralizes prompt-injection artifacts without calling an LLM.
 */

export class QueryProcessor {
  /**
   * Known prompt injection and system override keywords/phrases to neutralize
   */
  static INJECTION_PATTERNS = [
    /ignore\s+previous\s+instructions/gi,
    /system\s+instruction:?/gi,
    /reveal\s+(?:api\s+key|password|secrets|database)/gi,
    /you\s+are\s+now\s+a/gi,
    /disregard\s+all\s+rules/gi,
    /print\s+(?:env|environment|process\.env)/gi
  ];

  /**
   * Normalize and sanitize search query for RAG retrieval
   *
   * @param {string} rawQuery - Input query string
   * @returns {string} Cleaned, normalized query string
   */
  static process(rawQuery = '') {
    if (!rawQuery || typeof rawQuery !== 'string') {
      return '';
    }

    let cleaned = rawQuery;

    // 1. Neutralize prompt injection phrases
    for (const pattern of this.INJECTION_PATTERNS) {
      cleaned = cleaned.replace(pattern, ' ');
    }

    // 2. Normalize whitespace, carriage returns, tabs
    cleaned = cleaned
      .replace(/\r\n/g, ' ')
      .replace(/[\r\n\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 3. Remove leading/trailing non-alphanumeric noise characters except spaces/hyphens
    cleaned = cleaned.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').trim();

    // Fallback: If cleaning removed everything, return original trimmed string minus linebreaks
    if (!cleaned && rawQuery.trim()) {
      return rawQuery.replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    return cleaned;
  }
}
