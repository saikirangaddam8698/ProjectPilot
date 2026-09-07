# Knowledge Base & RAG Ingestion Pipeline Specification

## Overview
The ProjectPilot Knowledge Base utilizes a production Retrieval-Augmented Generation (RAG) pipeline to ingest, extract, chunk, embed, and semantically retrieve unstructured technical documentation.

## Ingestion Pipeline Steps (`DocumentIngestionService`)

### Step 1: Upload & File Validation
- **Supported Formats**: `PDF`, `DOCX`, `TXT`, `MD` (`text/markdown`, `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`).
- **File Size Cap**: Enforces a strict 10MB file limit prior to text extraction.
- **SHA-256 Checksum Calculation**: Calculates a SHA-256 hash of document payload to detect identical document uploads within the target project scope.

### Step 2: Text Extraction (`DocumentExtractor`)
- Extracts plain text content from uploaded file buffers based on MIME type.
- Strips malformed binary headers while preserving markdown section headings, lists, code snippets, and structural text.

### Step 3: Semantic Chunking (`DocumentChunker`)
- Splitting text into overlapping semantic chunks (~400–600 tokens per chunk).
- Preserves section headings (`## Section Title`), line numbers, page numbers, and source document metadata on each chunk.

### Step 4: Embedding Generation (`EmbeddingService`)
- Generates 768-dimensional dense vector embeddings for each chunk using Gemini Embedding API (`text-embedding-004`).
- Handles transient network retries and fallbacks gracefully.

### Step 5: pgvector PostgreSQL Indexing
- Stores chunk text, token counts, JSON metadata, and vector embeddings in the `DocumentChunk` table.
- Native PostgreSQL `vector(768)` column indexed using HNSW distance operator (`<=>`).

### Step 6: Status Lifecycle Management
- **`PROCESSING`**: Document is saved and actively undergoing extraction, chunking, and embedding.
- **`READY`**: Document indexing completed successfully and is available for semantic search.
- **`FAILED`**: Extraction or embedding error occurred; supports retry re-indexing without duplicate chunk creation.

## Advanced RAG Retrieval Pipeline (`KnowledgeSearchService`)
1. **Query Processor**: Cleans and normalizes user search query strings.
2. **Query Embedding**: Converts query into 768-dim vector embedding.
3. **Similarity Search**: Performs pgvector SQL cosine distance search filtered by project ID.
4. **Relevance Thresholding**: Filters out candidate chunks with similarity scores lower than `0.55`.
5. **Deduplication & Diversity**:
   - Reduces near-duplicate chunks with high string overlap.
   - Enforces document diversity cap (`MAX_CHUNKS_PER_DOC = 3`).
6. **Citation Grounding**: Returns structured search results including `documentTitle`, `section`, `source`, `similarity`, and `content` for UI citation badges.
