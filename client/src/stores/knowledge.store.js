/**
 * Task 13, Task 15, Task 16 & Task 18 — Knowledge Base Pinia Store
 * Manages project documentation state, file ingestion pipeline, re-indexing, and semantic search.
 */
import { defineStore } from 'pinia';
import { knowledgeApi } from '../services/api/knowledge.api.js';
import { useUiStore } from './ui.store.js';

export const useKnowledgeStore = defineStore('knowledge', {
  state: () => ({
    documents: [],
    activeDocument: null,
    selectedProjectKey: 'PILOT',
    searchResults: [],
    searchQuery: '',
    isLoading: false,
    isSearching: false,
    isIndexing: false,
    isSaving: false,
    error: null
  }),

  getters: {
    documentCount: (state) => state.documents.length,
    readyCount: (state) => state.documents.filter((d) => d.status === 'READY' || d.status === 'INDEXED').length,
    processingCount: (state) => state.documents.filter((d) => d.status === 'PROCESSING' || d.status === 'DRAFT').length,
    failedCount: (state) => state.documents.filter((d) => d.status === 'FAILED').length,
    hasSearchResults: (state) => state.searchResults.length > 0
  },

  actions: {
    /**
     * Set active project key and fetch documents
     */
    async setSelectedProject(projectKey) {
      if (this.selectedProjectKey === projectKey && this.documents.length > 0) {
        return;
      }
      this.selectedProjectKey = projectKey;
      this.searchResults = [];
      this.searchQuery = '';
      this.activeDocument = null;
      await this.fetchDocuments(projectKey);
    },

    /**
     * Fetch all documents for a project
     */
    async fetchDocuments(projectKey = this.selectedProjectKey) {
      if (!projectKey) return;
      this.isLoading = true;
      this.error = null;

      try {
        const res = await knowledgeApi.listDocuments(projectKey);
        this.documents = res.data || [];
      } catch (err) {
        this.error = err.message || 'Failed to fetch knowledge base documents.';
        this.documents = [];
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Fetch single document with chunk details
     */
    async getDocument(projectKey = this.selectedProjectKey, documentId) {
      if (!documentId) return null;
      this.isLoading = true;
      this.error = null;

      try {
        const res = await knowledgeApi.getDocument(projectKey, documentId);
        this.activeDocument = res.data;
        return res.data;
      } catch (err) {
        this.error = err.message || 'Failed to load document details.';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Create or upload a new document
     */
    async createDocument(projectKey = this.selectedProjectKey, data) {
      this.isSaving = true;
      this.error = null;
      const uiStore = useUiStore();
      uiStore.startOperation('doc-create', 'Uploading & Indexing Document...');

      try {
        const res = await knowledgeApi.createDocument(projectKey, data);
        const newDoc = res.data;
        this.documents.unshift(newDoc);
        this.activeDocument = newDoc;
        return newDoc;
      } catch (err) {
        this.error = err.message || 'Failed to ingest document.';
        throw err;
      } finally {
        this.isSaving = false;
        uiStore.endOperation('doc-create');
      }
    },

    /**
     * Update an existing document
     */
    async updateDocument(projectKey = this.selectedProjectKey, documentId, data) {
      this.isSaving = true;
      this.error = null;
      const uiStore = useUiStore();
      uiStore.startOperation('doc-update', 'Updating Document...');

      try {
        const res = await knowledgeApi.updateDocument(projectKey, documentId, data);
        const updated = res.data;

        const idx = this.documents.findIndex((d) => d.id === documentId);
        if (idx !== -1) {
          this.documents[idx] = { ...this.documents[idx], ...updated };
        }
        if (this.activeDocument?.id === documentId) {
          this.activeDocument = { ...this.activeDocument, ...updated };
        }

        return updated;
      } catch (err) {
        this.error = err.message || 'Failed to update document.';
        throw err;
      } finally {
        this.isSaving = false;
        uiStore.endOperation('doc-update');
      }
    },

    /**
     * Delete a document
     */
    async deleteDocument(projectKey = this.selectedProjectKey, documentId) {
      this.error = null;
      const uiStore = useUiStore();
      uiStore.startOperation('doc-delete', 'Deleting Document...');
      try {
        await knowledgeApi.deleteDocument(projectKey, documentId);
        this.documents = this.documents.filter((d) => d.id !== documentId);
        if (this.activeDocument?.id === documentId) {
          this.activeDocument = null;
        }
      } catch (err) {
        this.error = err.message || 'Failed to delete document.';
        throw err;
      } finally {
        uiStore.endOperation('doc-delete');
      }
    },

    /**
     * Trigger document re-indexing
     */
    async reindexDocument(projectKey = this.selectedProjectKey, documentId) {
      this.isIndexing = true;
      this.error = null;
      const uiStore = useUiStore();
      uiStore.startOperation('doc-reindex', 'Re-indexing Document into Vector Store...');

      try {
        const res = await knowledgeApi.reindexDocument(projectKey, documentId);
        const idxInfo = res.data;

        const idx = this.documents.findIndex((d) => d.id === documentId);
        if (idx !== -1) {
          this.documents[idx].status = 'READY';
        }
        if (this.activeDocument?.id === documentId) {
          this.activeDocument.status = 'READY';
        }

        await this.fetchDocuments(projectKey);
        return idxInfo;
      } catch (err) {
        this.error = err.message || 'Re-indexing failed.';
        throw err;
      } finally {
        this.isIndexing = false;
        uiStore.endOperation('doc-reindex');
      }
    },

    /**
     * Perform semantic vector similarity search
     */
    async searchKnowledge(projectKey = this.selectedProjectKey, query, limit = 5) {
      if (!query || !query.trim()) {
        this.clearSearch();
        return;
      }

      this.isSearching = true;
      this.searchQuery = query.trim();
      this.error = null;

      try {
        const res = await knowledgeApi.searchKnowledge(projectKey, {
          query: this.searchQuery,
          limit
        });
        this.searchResults = res.data?.results || [];
        return this.searchResults;
      } catch (err) {
        this.error = err.message || 'Semantic search failed.';
        this.searchResults = [];
      } finally {
        this.isSearching = false;
      }
    },

    /**
     * Clear active search results
     */
    clearSearch() {
      this.searchResults = [];
      this.searchQuery = '';
    }
  }
});
