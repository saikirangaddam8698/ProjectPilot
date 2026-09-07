/**
 * Semantic Chunking Service
 * Splits technical documents into semantic sections based on Markdown headings,
 * code blocks, and paragraphs, preserving context and metadata.
 */

export class ChunkingService {
  /**
   * Split document text into meaningful, context-preserving chunks
   * @param {string} content - Markdown or plain text document content
   * @param {object} [options]
   * @param {number} [options.maxChunkSize=600] - Maximum characters per chunk
   * @param {number} [options.overlapSize=80] - Overlap characters between split chunks
   * @param {string} [options.documentTitle=''] - Document title for context preservation
   * @returns {Array<{ chunkIndex: number, content: string, tokenCount: number }>}
   */
  static splitIntoChunks(content, options = {}) {
    if (!content || typeof content !== 'string' || !content.trim()) {
      return [];
    }

    const {
      maxChunkSize = 600,
      overlapSize = 80,
      documentTitle = ''
    } = options;

    const normalizedContent = content.replace(/\r\n/g, '\n').trim();

    // 1. Split into major sections by Markdown headings
    const sectionRegex = /(?=^#{1,4}\s+)/gm;
    const rawSections = normalizedContent.split(sectionRegex).filter((s) => s.trim().length > 0);

    const chunks = [];
    let currentHeading = documentTitle ? `[Doc: ${documentTitle}]` : '';

    for (const section of rawSections) {
      const trimmedSection = section.trim();

      // Extract heading line if section starts with one
      const headingMatch = trimmedSection.match(/^(#{1,4}\s+[^\n]+)/);
      if (headingMatch) {
        currentHeading = headingMatch[1].trim();
      }

      // If section fits in one chunk, use it directly
      if (trimmedSection.length <= maxChunkSize) {
        chunks.push(trimmedSection);
        continue;
      }

      // Split large section by paragraphs (double newlines)
      const paragraphs = trimmedSection.split(/\n\n+/).filter((p) => p.trim().length > 0);
      let currentBuffer = '';

      for (const para of paragraphs) {
        const trimmedPara = para.trim();

        if (!currentBuffer) {
          currentBuffer = trimmedPara;
        } else if ((currentBuffer.length + trimmedPara.length + 2) <= maxChunkSize) {
          currentBuffer += '\n\n' + trimmedPara;
        } else {
          chunks.push(currentBuffer);
          // Retain overlap if needed
          const overlap = currentBuffer.slice(-overlapSize);
          currentBuffer = (overlap ? overlap + '\n\n' : '') + trimmedPara;
        }
      }

      if (currentBuffer.trim().length > 0) {
        // If currentBuffer itself is still oversized, hard split by sentences/size
        if (currentBuffer.length > maxChunkSize) {
          const subChunks = this.splitOversizedText(currentBuffer, maxChunkSize, overlapSize);
          chunks.push(...subChunks);
        } else {
          chunks.push(currentBuffer.trim());
        }
      }
    }

    // 2. Format chunks with indices and estimated token counts
    return chunks.map((text, idx) => {
      const cleanText = text.trim();
      return {
        chunkIndex: idx,
        content: cleanText,
        tokenCount: Math.max(1, Math.ceil(cleanText.length / 4))
      };
    });
  }

  /**
   * Split an oversized paragraph by character size with overlap
   */
  static splitOversizedText(text, maxSize, overlap) {
    const result = [];
    let start = 0;

    while (start < text.length) {
      let end = start + maxSize;
      if (end >= text.length) {
        result.push(text.slice(start).trim());
        break;
      }

      // Try to break at a newline or space near the end
      const lastSpace = text.lastIndexOf(' ', end);
      if (lastSpace > start + (maxSize / 2)) {
        end = lastSpace;
      }

      result.push(text.slice(start, end).trim());
      start = Math.max(start + 1, end - overlap);
    }

    return result.filter((s) => s.length > 0);
  }
}
