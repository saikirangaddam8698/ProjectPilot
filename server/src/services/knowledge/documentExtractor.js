/**
 * Task 18 — Document Extractor Service
 * Extracts and normalizes text content from PDF, DOCX, TXT, and Markdown files.
 */
import { ApiError } from '../../utils/apiError.js';

export class DocumentExtractor {
  /**
   * Allowed MIME types and file extensions
   */
  static SUPPORTED_MIME_TYPES = new Set([
    'text/plain',
    'text/markdown',
    'text/x-markdown',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/json'
  ]);

  static SUPPORTED_EXTENSIONS = new Set(['.txt', '.md', '.markdown', '.pdf', '.docx', '.json']);

  /**
   * Extract plain text from file buffer or raw text string
   *
   * @param {object} params
   * @param {Buffer|string} [params.fileBuffer] - Raw file buffer or text string
   * @param {string} [params.textContent] - Explicit text content
   * @param {string} [params.fileName] - Original file name (e.g. "Spec.pdf")
   * @param {string} [params.mimeType] - MIME type (e.g. "application/pdf")
   * @returns {string} Normalized plain text content
   */
  static extract({ fileBuffer, textContent, fileName = '', mimeType = '' }) {
    // 1. Validate MIME type & file extension
    const ext = (fileName.match(/\.[0-9a-z]+$/i)?.[0] || '').toLowerCase();
    const normalizedMime = (mimeType || '').toLowerCase();

    if (normalizedMime && !this.SUPPORTED_MIME_TYPES.has(normalizedMime) && !this.SUPPORTED_EXTENSIONS.has(ext)) {
      throw ApiError.badRequest(`Unsupported MIME type or document format: "${mimeType || ext}". Supported formats are PDF, DOCX, TXT, and Markdown.`);
    }

    if (!fileBuffer && !textContent) {
      throw ApiError.badRequest('Document payload or file buffer is empty');
    }

    let extractedRaw = '';

    // 2. Direct string payload
    if (typeof textContent === 'string' && textContent.trim()) {
      extractedRaw = textContent;
    } else if (typeof fileBuffer === 'string') {
      extractedRaw = fileBuffer;
    } else if (Buffer.isBuffer(fileBuffer)) {
      // 3. Extract based on format/extension
      if (normalizedMime.includes('pdf') || ext === '.pdf') {
        extractedRaw = this.extractPdfText(fileBuffer);
      } else if (normalizedMime.includes('wordprocessingml') || normalizedMime.includes('msword') || ext === '.docx') {
        extractedRaw = this.extractDocxText(fileBuffer);
      } else {
        // Plain text / Markdown / UTF-8 fallback
        extractedRaw = fileBuffer.toString('utf8');
      }
    }

    // 4. Normalize text
    const normalized = this.normalizeText(extractedRaw);

    if (!normalized || normalized.trim().length === 0) {
      throw ApiError.badRequest('Document contains no extractable text content or file is corrupt/empty');
    }

    return normalized;
  }

  /**
   * Normalize whitespace, line breaks, and non-printable characters
   */
  static normalizeText(text = '') {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Extract plain text from PDF buffer
   */
  static extractPdfText(buffer) {
    try {
      const str = buffer.toString('latin1');

      // Extract text inside PDF stream...endstream blocks or Tj / TJ text instructions
      const textParts = [];

      // Extract Tj text objects: (Text) Tj
      const tjRegex = /\(([^()]*)\)\s*Tj/g;
      let match;
      while ((match = tjRegex.exec(str)) !== null) {
        if (match[1]) textParts.push(match[1]);
      }

      // Extract TJ array objects: [(Text1) -10 (Text2)] TJ
      const tjArrayRegex = /\[\s*(((?:\([^()]*\)\s*|-?\d+\s*)+))\s*\]\s*TJ/g;
      while ((match = tjArrayRegex.exec(str)) !== null) {
        const inner = match[1];
        const subMatches = inner.match(/\([^()]*\)/g) || [];
        for (const sub of subMatches) {
          textParts.push(sub.slice(1, -1));
        }
      }

      // Fallback: UTF-8 string regex for text lines
      if (textParts.length === 0) {
        const readable = buffer.toString('utf8');
        const textLines = readable.match(/[A-Za-z0-9\s.,;:!?#*()'"`\--]{10,}/g) || [];
        return textLines.join('\n');
      }

      return textParts.join(' ');
    } catch {
      throw ApiError.badRequest('Failed to extract text from PDF file. File may be encrypted or corrupted.');
    }
  }

  /**
   * Extract plain text from DOCX XML buffer
   */
  static extractDocxText(buffer) {
    try {
      const str = buffer.toString('utf8');

      // Extract XML <w:t> or <w:p> text nodes
      const textMatches = str.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || [];
      if (textMatches.length > 0) {
        return textMatches
          .map((m) => m.replace(/<[^>]+>/g, ''))
          .filter(Boolean)
          .join(' ');
      }

      // Fallback text regex
      const textLines = str.match(/[A-Za-z0-9\s.,;:!?#*()'"`\--]{10,}/g) || [];
      return textLines.join('\n');
    } catch {
      throw ApiError.badRequest('Failed to extract text from DOCX file. File may be corrupted.');
    }
  }
}
