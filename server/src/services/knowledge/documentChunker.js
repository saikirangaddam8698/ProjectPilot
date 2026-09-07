/**
 * Task 18 — Document Chunker Service
 * Converts normalized document text into structured semantic chunks with metadata (section, page, source).
 */
import { ChunkingService } from './chunking.service.js';

export class DocumentChunker {
  /**
   * Split document text into structured chunks with overlap and section metadata
   *
   * @param {string} content - Extracted text content
   * @param {object} [options]
   * @param {string} [options.documentTitle=''] - Title of original document
   * @param {string} [options.fileName=''] - File name of original document
   * @param {number} [options.maxChunkSize=700] - Max characters per chunk
   * @param {number} [options.overlapSize=100] - Character overlap
   * @returns {Array<{ chunkIndex: number, content: string, tokenCount: number, metadata: object }>}
   */
  static chunk(content, options = {}) {
    if (!content || typeof content !== 'string' || !content.trim()) {
      return [];
    }

    const {
      documentTitle = 'Project Document',
      fileName = 'document.txt',
      maxChunkSize = 700,
      overlapSize = 100
    } = options;

    const baseChunks = ChunkingService.splitIntoChunks(content, {
      maxChunkSize,
      overlapSize,
      documentTitle
    });

    return baseChunks.map((c) => {
      // Extract section title from chunk if it starts with a heading
      const headingMatch = c.content.match(/^(#{1,4}\s+[^\n]+)/);
      const sectionName = headingMatch
        ? headingMatch[1].replace(/^#{1,4}\s+/, '').trim()
        : 'General Content';

      return {
        chunkIndex: c.chunkIndex,
        content: c.content,
        tokenCount: c.tokenCount,
        metadata: {
          section: sectionName,
          source: fileName || documentTitle,
          page: Math.floor(c.chunkIndex / 3) + 1
        }
      };
    });
  }
}
