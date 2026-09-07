/**
 * Tool: search_project_knowledge
 * Semantic knowledge search tool for ProjectPilot RAG architecture
 */
import { KnowledgeSearchService } from '../../knowledge/knowledgeSearch.service.js';

export const knowledgeSearchTool = {
  name: 'search_project_knowledge',
  description: 'Search architecture decision records, API specifications, technical designs, runbooks, and engineering documentation for this project.',
  parameters: {
    type: 'OBJECT',
    properties: {
      projectKey: {
        type: 'STRING',
        description: 'The uppercase project key (e.g. PILOT, INFRA, MOBILE).'
      },
      query: {
        type: 'STRING',
        description: 'Semantic search query for documentation (e.g., "authentication JWT architecture", "database connection pool", "deployment runbook").'
      },
      limit: {
        type: 'INTEGER',
        description: 'Maximum number of relevant excerpts to return (default 4, max 8).'
      }
    },
    required: ['projectKey', 'query']
  },

  async execute({ projectKey, query, limit = 4 }) {
    const key = projectKey.toUpperCase();
    const maxLimit = Math.min(Math.max(parseInt(limit, 10) || 4, 1), 8);

    const searchResult = await KnowledgeSearchService.searchKnowledge({
      projectKey: key,
      query,
      limit: maxLimit
    });

    const excerpts = (searchResult.results || []).map((r) => ({
      documentTitle: r.documentTitle,
      documentType: r.documentType,
      sectionIndex: r.chunkIndex,
      excerpt: r.content,
      similarityScore: r.similarity
    }));

    return {
      projectKey: key,
      query: searchResult.query,
      documentationResults: excerpts,
      count: excerpts.length
    };
  }
};
