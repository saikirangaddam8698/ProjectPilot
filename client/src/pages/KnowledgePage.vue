<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useKnowledgeStore } from '@/stores/knowledge.store.js';
import { useProjectStore } from '@/stores/project.store.js';
import { useAuthStore } from '@/stores/auth.store.js';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import BaseModal from '@/components/ui/BaseModal.vue';
import BaseConfirmModal from '@/components/ui/BaseConfirmModal.vue';
import BaseSelect from '@/components/ui/BaseSelect.vue';

const knowledgeStore = useKnowledgeStore();
const projectStore = useProjectStore();
const authStore = useAuthStore();

// Local UI state
const selectedCategory = ref('ALL');
const searchInput = ref('');
const showEditorModal = ref(false);
const showDetailModal = ref(false);
const isEditing = ref(false);
const editingDocId = ref(null);
const fileInput = ref(null);
const isDeleteConfirmOpen = ref(false);
const docIdToDelete = ref(null);

const projectOptions = computed(() => {
  return projectStore.allProjects.map((p) => ({
    value: p.key,
    label: `${p.name} (${p.key})`
  }));
});

const docCategoryOptions = [
  { value: 'ARCHITECTURE', label: 'Architecture' },
  { value: 'API_SPEC', label: 'API Specification' },
  { value: 'RUNBOOK', label: 'Runbook' },
  { value: 'REQUIREMENTS', label: 'Requirements' },
  { value: 'TROUBLESHOOTING', label: 'Troubleshooting' },
  { value: 'GENERAL', label: 'General' }
];
const docTitleToDelete = ref('');

const selectedFileName = ref('');
const selectedFileSize = ref('');

// Form state for creating / editing
const docForm = ref({
  title: '',
  description: '',
  documentType: 'ARCHITECTURE',
  content: '',
  fileName: '',
  mimeType: 'text/plain',
  autoIndex: true
});

const formError = ref('');

const categories = [
  { key: 'ALL', label: 'All Docs' },
  { key: 'ARCHITECTURE', label: 'Architecture' },
  { key: 'API_SPEC', label: 'API Specs' },
  { key: 'RUNBOOK', label: 'Runbooks' },
  { key: 'REQUIREMENTS', label: 'Requirements' },
  { key: 'TROUBLESHOOTING', label: 'Troubleshooting' }
];

const currentProject = computed(() => {
  return projectStore.allProjects.find((p) => p.key === knowledgeStore.selectedProjectKey);
});

const filteredDocuments = computed(() => {
  if (selectedCategory.value === 'ALL') {
    return knowledgeStore.documents;
  }
  return knowledgeStore.documents.filter((d) => d.documentType === selectedCategory.value);
});

onMounted(async () => {
  if (projectStore.allProjects.length > 0 && !knowledgeStore.selectedProjectKey) {
    knowledgeStore.selectedProjectKey = projectStore.allProjects[0].key;
  }
  await knowledgeStore.fetchDocuments();
});

watch(
  () => projectStore.activeProjectKey,
  (newKey) => {
    if (newKey && newKey !== knowledgeStore.selectedProjectKey) {
      knowledgeStore.setSelectedProject(newKey);
    }
  }
);

function handleProjectChange(val) {
  const newKey = typeof val === 'object' && val?.target ? val.target.value : val;
  if (newKey) {
    knowledgeStore.setSelectedProject(newKey);
    projectStore.setActiveProjectKey(newKey);
  }
}

// Semantic Search handling
let searchTimeout = null;
function handleSearchInput(e) {
  const query = e.target.value;
  searchInput.value = query;

  clearTimeout(searchTimeout);
  if (!query.trim()) {
    knowledgeStore.clearSearch();
    return;
  }

  searchTimeout = setTimeout(() => {
    knowledgeStore.searchKnowledge(knowledgeStore.selectedProjectKey, query);
  }, 400);
}

function clearSearch() {
  searchInput.value = '';
  knowledgeStore.clearSearch();
}

// File Upload Selection Handler
function handleFileChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  selectedFileName.value = file.name;
  selectedFileSize.value = `${(file.size / 1024).toFixed(1)} KB`;
  docForm.value.fileName = file.name;
  docForm.value.mimeType = file.type || 'text/plain';

  if (!docForm.value.title.trim()) {
    docForm.value.title = file.name.replace(/\.[^/.]+$/, '');
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    docForm.value.content = e.target.result || '';
  };

  if (file.name.endsWith('.txt') || file.name.endsWith('.md') || file.type.startsWith('text/')) {
    reader.readAsText(file);
  } else {
    reader.readAsText(file); // Fallback text reader
  }
}

function clearSelectedFile() {
  selectedFileName.value = '';
  selectedFileSize.value = '';
  docForm.value.fileName = '';
  if (fileInput.value) fileInput.value.value = '';
}

// Editor Modal actions
function openCreateModal() {
  isEditing.value = false;
  editingDocId.value = null;
  formError.value = '';
  clearSelectedFile();
  docForm.value = {
    title: '',
    description: '',
    documentType: 'ARCHITECTURE',
    content: '',
    fileName: '',
    mimeType: 'text/plain',
    autoIndex: true
  };
  showEditorModal.value = true;
}

function openEditModal(doc) {
  isEditing.value = true;
  editingDocId.value = doc.id;
  formError.value = '';
  clearSelectedFile();
  docForm.value = {
    title: doc.title,
    description: doc.description || '',
    documentType: doc.documentType || 'GENERAL',
    content: doc.content || '',
    fileName: doc.fileName || '',
    mimeType: doc.mimeType || 'text/plain',
    autoIndex: true
  };
  showDetailModal.value = false;
  showEditorModal.value = true;
}

async function handleSaveDocument() {
  formError.value = '';
  if (!docForm.value.title.trim()) {
    formError.value = 'Document title is required.';
    return;
  }
  if (!docForm.value.content.trim()) {
    formError.value = 'Document content or file payload is required.';
    return;
  }

  try {
    let savedDoc;
    if (isEditing.value && editingDocId.value) {
      savedDoc = await knowledgeStore.updateDocument(
        knowledgeStore.selectedProjectKey,
        editingDocId.value,
        docForm.value
      );
    } else {
      savedDoc = await knowledgeStore.createDocument(
        knowledgeStore.selectedProjectKey,
        docForm.value
      );
    }

    showEditorModal.value = false;
    await knowledgeStore.fetchDocuments();
  } catch (err) {
    formError.value = err.message || 'Failed to save document.';
  }
}

// Detail Viewer Modal
async function openDetailModal(doc) {
  await knowledgeStore.getDocument(knowledgeStore.selectedProjectKey, doc.id);
  showDetailModal.value = true;
}

async function handleReindex(docId) {
  try {
    await knowledgeStore.reindexDocument(knowledgeStore.selectedProjectKey, docId);
  } catch {
    // Handled in store
  }
}

function promptDeleteDoc(docId, docTitle) {
  docIdToDelete.value = docId;
  docTitleToDelete.value = docTitle || 'this document';
  isDeleteConfirmOpen.value = true;
}

async function handleConfirmDelete() {
  if (!docIdToDelete.value) return;
  try {
    await knowledgeStore.deleteDocument(knowledgeStore.selectedProjectKey, docIdToDelete.value);
    showDetailModal.value = false;
  } catch (err) {
    console.error('Failed to delete document:', err);
  } finally {
    isDeleteConfirmOpen.value = false;
    docIdToDelete.value = null;
  }
}

function getDocumentTypeIcon(type) {
  switch (type) {
    case 'ARCHITECTURE': return '🏛️';
    case 'API_SPEC': return '🔌';
    case 'RUNBOOK': return '🛠️';
    case 'REQUIREMENTS': return '📋';
    case 'TROUBLESHOOTING': return '🩺';
    default: return '📄';
  }
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
</script>

<template>
  <div class="knowledge-page">
    <!-- Header with Workspace Selector & Actions -->
    <header class="page-header">
      <div class="header-main">
        <div class="header-title-group">
          <h1 class="page-title">Knowledge Base & RAG Pipeline</h1>
          <div class="badge-row">
            <span class="pgvector-badge">
              <span class="dot"></span>
              pgvector Vector Search
            </span>
            <BaseBadge variant="purple" size="sm">
              {{ knowledgeStore.readyCount }}/{{ knowledgeStore.documentCount }} Ready
            </BaseBadge>
          </div>
        </div>
        <p class="page-subtitle">
          Upload project specifications, architecture decision records, and runbooks into vector search.
        </p>
      </div>

      <div class="header-actions">
        <!-- Project Switcher -->
        <div class="project-selector-wrap">
          <label class="project-selector-label text-muted">Project:</label>
          <div class="selector-select-box">
            <BaseSelect
              :model-value="knowledgeStore.selectedProjectKey"
              :options="projectOptions"
              size="sm"
              @change="handleProjectChange"
              @update:model-value="handleProjectChange"
            />
          </div>
        </div>

        <div :title="authStore.isViewer ? 'Viewers cannot upload documents' : ''">
          <BaseButton
            variant="primary"
            size="sm"
            :disabled="authStore.isViewer"
            @click="openCreateModal"
          >
            <template #prefix><AppIcon name="plus" :size="14" /></template>
            Upload Document
          </BaseButton>
        </div>
      </div>
    </header>

    <!-- RAG Explanation / Learning Banner -->
    <div class="rag-learning-banner">
      <div class="rag-banner-icon">💡</div>
      <div class="rag-banner-text">
        <span class="rag-banner-title">RAG Retrieval Architecture</span>
        <p class="rag-banner-desc">
          Uploaded project documents are extracted, chunked into semantic sections, converted into 768-dim vector embeddings, and stored in PostgreSQL pgvector. When you ask the AI assistant questions, relevant chunks are retrieved as context — documents are <strong>never used to train the language model</strong>.
        </p>
      </div>
    </div>

    <!-- Semantic Search Bar -->
    <section class="search-section">
      <div class="search-bar-wrap">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          :value="searchInput"
          class="semantic-search-input"
          placeholder="Semantic vector search across project knowledge (e.g. 'JWT authentication cookies', 'pgvector indexing')..."
          @input="handleSearchInput"
        />
        <button
          v-if="searchInput"
          type="button"
          class="clear-search-btn"
          @click="clearSearch"
        >
          ✕
        </button>
      </div>

      <!-- Semantic Search Results Card -->
      <div v-if="knowledgeStore.hasSearchResults" class="search-results-panel">
        <div class="search-results-header">
          <span class="search-results-title">
            🎯 Found {{ knowledgeStore.searchResults.length }} high-relevance matches for "{{ knowledgeStore.searchQuery }}"
          </span>
          <button type="button" class="btn-text" @click="clearSearch">Dismiss</button>
        </div>

        <div class="search-results-list">
          <div
            v-for="(res, idx) in knowledgeStore.searchResults"
            :key="idx"
            class="search-result-item"
            @click="openDetailModal({ id: res.documentId })"
          >
            <div class="result-top-row">
              <div class="result-title-group">
                <span class="result-type-icon">{{ getDocumentTypeIcon(res.documentType) }}</span>
                <span class="result-doc-title font-medium">{{ res.documentTitle || res.title }}</span>
                <span class="similarity-score" :class="res.similarity >= 0.75 ? 'high-score' : 'med-score'">
                  {{ Math.round(res.similarity * 100) }}% Match
                </span>
              </div>
              <div class="result-meta-tags">
                <span v-if="res.section" class="meta-tag">Section: {{ res.section }}</span>
                <span v-if="res.page" class="meta-tag">Page: {{ res.page }}</span>
                <span v-if="res.source" class="meta-tag source-tag">Source: {{ res.source }}</span>
              </div>
            </div>
            <p class="result-excerpt">{{ res.content }}</p>
          </div>
        </div>
      </div>

      <!-- No Relevant Search Results State -->
      <div v-else-if="searchInput && !knowledgeStore.isSearching && knowledgeStore.searchQuery && !knowledgeStore.hasSearchResults" class="no-search-results-panel">
        <span class="no-result-icon">🔍</span>
        <div class="no-result-text">
          <span class="no-result-title">No relevant project documentation found</span>
          <p class="no-result-desc text-muted">
            No indexed documents matched "{{ knowledgeStore.searchQuery }}" above the 55% similarity threshold. Try rephrasing or searching with different keywords.
          </p>
        </div>
      </div>

      <!-- Searching Indicator -->
      <div v-if="knowledgeStore.isSearching" class="searching-state text-muted">
        <span class="spinner-dot"></span>
        Normalizing query, generating 768-dim embedding & querying pgvector index...
      </div>
    </section>

    <!-- Category Filter Tabs -->
    <nav class="category-nav">
      <button
        v-for="cat in categories"
        :key="cat.key"
        type="button"
        class="category-tab"
        :class="{ active: selectedCategory === cat.key }"
        @click="selectedCategory = cat.key"
      >
        {{ cat.label }}
        <span class="category-count">
          {{ cat.key === 'ALL' ? knowledgeStore.documents.length : knowledgeStore.documents.filter(d => d.documentType === cat.key).length }}
        </span>
      </button>
    </nav>

    <!-- Documents List / Grid -->
    <main class="documents-section">
      <!-- Loading Skeleton -->
      <div v-if="knowledgeStore.isLoading" class="docs-grid">
        <div v-for="n in 3" :key="n" class="doc-card skeleton-card">
          <div class="skeleton-header"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text short"></div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredDocuments.length === 0" class="empty-docs-state">
        <div class="empty-icon">📚</div>
        <h3 class="empty-title">No documents found</h3>
        <p class="empty-desc text-muted">
          {{ selectedCategory === 'ALL' ? `No knowledge base documents exist yet for ${currentProject?.name || 'this project'}.` : `No documents found under category "${selectedCategory}".` }}
        </p>
        <div :title="authStore.isViewer ? 'Viewers cannot upload documents' : ''">
          <BaseButton
            variant="primary"
            size="sm"
            :disabled="authStore.isViewer"
            @click="openCreateModal"
          >
            Upload First Document
          </BaseButton>
        </div>
      </div>

      <!-- Documents Grid -->
      <div v-else class="docs-grid">
        <article
          v-for="doc in filteredDocuments"
          :key="doc.id"
          class="doc-card"
          @click="openDetailModal(doc)"
        >
          <header class="doc-card-header">
            <span class="doc-icon">{{ getDocumentTypeIcon(doc.documentType) }}</span>
            <div class="doc-title-group">
              <h2 class="doc-title">{{ doc.title }}</h2>
              <span class="doc-meta text-muted">
                {{ doc.documentType }} • {{ doc._count?.chunks || doc.chunks?.length || 0 }} chunks • {{ formatDate(doc.updatedAt) }}
              </span>
            </div>
            <BaseBadge
              :variant="doc.status === 'READY' || doc.status === 'INDEXED' ? 'success' : doc.status === 'PROCESSING' ? 'warning' : doc.status === 'FAILED' ? 'danger' : 'neutral'"
              size="sm"
            >
              {{ doc.status === 'READY' || doc.status === 'INDEXED' ? '✓ Ready' : doc.status === 'PROCESSING' ? '⏳ Processing' : doc.status === 'FAILED' ? '✗ Failed' : doc.status }}
            </BaseBadge>
          </header>

          <p class="doc-excerpt">
            {{ doc.description || doc.content?.slice(0, 160) + '...' }}
          </p>

          <footer class="doc-card-footer">
            <span class="doc-author text-muted">
              By {{ doc.createdBy?.name || 'Project Team' }}
            </span>
            <div class="card-action-btns">
              <button
                v-if="doc.status === 'FAILED'"
                type="button"
                class="retry-btn"
                @click.stop="handleReindex(doc.id)"
              >
                Retry Ingestion
              </button>
              <button
                type="button"
                class="reindex-btn"
                :disabled="knowledgeStore.isIndexing"
                title="Re-index document into pgvector vector chunks"
                @click.stop="handleReindex(doc.id)"
              >
                ⚡ Re-index
              </button>
            </div>
          </footer>
        </article>
      </div>
    </main>

    <!-- Create / Upload Document Modal -->
    <BaseModal
      v-model="showEditorModal"
      :title="isEditing ? 'Edit Document' : 'Upload / Add Project Document'"
      description="Upload project specifications, architecture decision records, or runbooks into vector search."
      size="lg"
      @close="showEditorModal = false"
    >
      <div class="knowledge-modal-form">
        <div v-if="formError" class="form-alert error-alert">
          {{ formError }}
        </div>

        <!-- File Upload Dropzone -->
        <div class="file-upload-box" @click="$refs.fileInput.click()">
          <input
            ref="fileInput"
            type="file"
            accept=".pdf,.docx,.txt,.md,.markdown"
            class="hidden-file-input"
            @change="handleFileChange"
          />
          <div class="upload-box-content">
            <span class="upload-icon">📁</span>
            <span class="upload-title font-medium">Click to select document (PDF, DOCX, TXT, MD)</span>
            <span class="upload-hint text-muted">Or type/paste document content in the editor below</span>
          </div>
        </div>

        <div v-if="selectedFileName" class="uploaded-file-pill">
          <span>📄 <strong>{{ selectedFileName }}</strong> ({{ selectedFileSize }})</span>
          <button type="button" class="remove-file-btn btn-close-destructive" @click="clearSelectedFile">✕</button>
        </div>

        <div class="form-group margin-top">
          <label class="form-label required">Document Title *</label>
          <input
            v-model="docForm.title"
            type="text"
            class="form-input"
            placeholder="e.g. Authentication & RBAC Architecture Blueprint"
          />
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Document Category</label>
            <BaseSelect
              v-model="docForm.documentType"
              :options="docCategoryOptions"
              size="md"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Brief Summary</label>
            <input
              v-model="docForm.description"
              type="text"
              class="form-input"
              placeholder="High-level summary for team context..."
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label required">Document Content *</label>
          <textarea
            v-model="docForm.content"
            rows="10"
            class="form-input mono content-textarea"
            placeholder="# Heading 1&#10;&#10;Describe system architecture, API contracts, or runbooks here..."
          ></textarea>
        </div>
      </div>

      <template #footer>
        <BaseButton variant="close" size="sm" @click="showEditorModal = false">
          Cancel
        </BaseButton>
        <BaseButton
          variant="primary"
          size="sm"
          :loading="knowledgeStore.isSaving || knowledgeStore.isIndexing"
          @click="handleSaveDocument"
        >
          {{ isEditing ? 'Save Changes' : 'Ingest & Index Document' }}
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Document Detail / Viewer Modal -->
    <BaseModal
      v-model="showDetailModal"
      :title="knowledgeStore.activeDocument?.title || 'Document Detail'"
      :description="knowledgeStore.activeDocument ? `${knowledgeStore.activeDocument.documentType} • Updated ${formatDate(knowledgeStore.activeDocument.updatedAt)}` : ''"
      size="lg"
      @close="showDetailModal = false"
    >
      <div v-if="knowledgeStore.activeDocument" class="detail-content">
        <div v-if="knowledgeStore.activeDocument.description" class="detail-description text-secondary">
          {{ knowledgeStore.activeDocument.description }}
        </div>

        <!-- Chunks List -->
        <div class="chunks-section">
          <div class="chunks-header-row">
            <h3 class="chunks-heading font-medium">
              Vector Chunks ({{ knowledgeStore.activeDocument.chunks?.length || 0 }})
            </h3>
            <BaseBadge
              :variant="knowledgeStore.activeDocument.status === 'READY' || knowledgeStore.activeDocument.status === 'INDEXED' ? 'success' : 'neutral'"
              size="sm"
            >
              {{ knowledgeStore.activeDocument.status }}
            </BaseBadge>
          </div>
          <div class="chunks-list">
            <div
              v-for="chunk in knowledgeStore.activeDocument.chunks"
              :key="chunk.id"
              class="chunk-box"
            >
              <div class="chunk-box-header">
                <span class="chunk-index font-medium">Chunk #{{ chunk.chunkIndex + 1 }}</span>
                <span class="chunk-tokens mono text-muted">{{ chunk.tokenCount }} tokens</span>
              </div>
              <pre class="chunk-text mono">{{ chunk.content }}</pre>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <BaseButton variant="close" size="sm" @click="showDetailModal = false">
          Close
        </BaseButton>
        <div :title="authStore.isViewer ? 'Viewers cannot edit documents' : ''">
          <BaseButton
            variant="outline"
            size="sm"
            :disabled="authStore.isViewer"
            @click="openEditModal(knowledgeStore.activeDocument)"
          >
            Edit
          </BaseButton>
        </div>
        <div :title="authStore.isViewer ? 'Viewers cannot delete documents' : ''">
          <BaseButton
            variant="danger"
            size="sm"
            :disabled="authStore.isViewer"
            @click="promptDeleteDoc(knowledgeStore.activeDocument.id, knowledgeStore.activeDocument.title)"
          >
            <template #prefix><AppIcon name="trash" :size="13" /></template>
            Delete
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Delete Document Confirmation Modal -->
    <BaseConfirmModal
      v-model="isDeleteConfirmOpen"
      title="Delete Project Document"
      :message="`Are you sure you want to delete &quot;${docTitleToDelete}&quot;? All associated 768-dim vector embeddings and chunk indexes will be permanently removed.`"
      :itemName="docTitleToDelete"
      itemType="DOCUMENT"
      confirmText="Delete Document"
      @confirm="handleConfirmDelete"
      @cancel="isDeleteConfirmOpen = false"
    />
  </div>
</template>

<style scoped>
.knowledge-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.header-title-group {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-1);
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.badge-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pgvector-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-success, #22c55e);
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.25);
  border-radius: var(--radius-full);
  padding: 2px 8px;
}

.pgvector-badge .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.project-selector-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.selector-select-box {
  min-width: 220px;
}

.rag-learning-banner {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.12));
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: var(--radius-lg);
  padding: 12px 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.rag-banner-icon {
  font-size: 20px;
}

.rag-banner-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  display: block;
  margin-bottom: 2px;
}

.rag-banner-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

.search-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-bar-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  font-size: 14px;
}

.semantic-search-input {
  width: 100%;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  color: var(--text-primary);
  padding: 10px 36px 10px 36px;
  border-radius: var(--radius-md);
  font-size: 13px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.semantic-search-input:focus {
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  outline: none;
}

.clear-search-btn {
  position: absolute;
  right: 12px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
}

.search-results-panel {
  background: var(--bg-surface);
  border: 1px solid var(--brand-primary);
  border-radius: var(--radius-md);
  padding: 12px;
}

.search-results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.search-results-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--brand-primary);
}

.search-result-item {
  background: var(--bg-surface-hover, rgba(255, 255, 255, 0.03));
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.search-result-item:hover {
  background: rgba(99, 102, 241, 0.12);
}

.result-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.result-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.similarity-score {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.high-score {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.15);
}

.med-score {
  color: #eab308;
  background: rgba(234, 179, 8, 0.15);
}

.result-excerpt {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

.result-meta-tags {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 4px;
}

.meta-tag {
  font-size: 11px;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.05);
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid var(--border-subtle);
}

.source-tag {
  color: var(--brand-primary);
  border-color: rgba(99, 102, 241, 0.25);
}

.no-search-results-panel {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.no-result-icon {
  font-size: 20px;
}

.no-result-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  display: block;
  margin-bottom: 2px;
}

.no-result-desc {
  font-size: 12px;
  margin: 0;
  line-height: 1.4;
}

.category-nav {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.category-tab {
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  padding: 6px 12px;
  border-radius: var(--radius-full);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.category-tab.active {
  background: var(--brand-primary);
  color: #ffffff;
  border-color: var(--brand-primary);
}

.docs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.doc-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.doc-card:hover {
  transform: translateY(-2px);
  border-color: rgba(99, 102, 241, 0.4);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.doc-card-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}

.doc-icon {
  font-size: 20px;
}

.doc-title-group {
  flex: 1;
}

.doc-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 2px 0;
}

.doc-excerpt {
  font-size: 12.5px;
  color: var(--text-secondary);
  line-height: 1.4;
  margin-bottom: 12px;
}

.doc-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--border-subtle);
  padding-top: 10px;
}

.reindex-btn {
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: var(--brand-primary);
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s ease;
}

.reindex-btn:hover {
  background: rgba(99, 102, 241, 0.25);
}

.retry-btn {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  margin-right: 4px;
}

.file-upload-box {
  border: 2px dashed var(--border-default);
  border-radius: var(--radius-md);
  padding: 20px;
  text-align: center;
  cursor: pointer;
  background: var(--bg-surface-elevated, rgba(255, 255, 255, 0.02));
  transition: all 0.15s ease;
}

.file-upload-box:hover {
  background: rgba(99, 102, 241, 0.05);
  border-color: var(--brand-primary);
}

.hidden-file-input {
  display: none;
}

.upload-box-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.upload-icon {
  font-size: 24px;
}

.upload-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.uploaded-file-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #22c55e;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  margin-top: 8px;
}

.remove-file-btn {
  background: transparent;
  border: none;
  color: #ef4444;
  cursor: pointer;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.form-input {
  background: var(--bg-surface-elevated, var(--bg-surface));
  border: 1px solid var(--border-default);
  color: var(--text-primary);
  padding: 8px 10px;
  border-radius: var(--radius-md);
  font-size: 13px;
  transition: border-color 0.15s ease;
}

.form-input:focus {
  border-color: var(--brand-primary);
  outline: none;
}

.content-textarea {
  resize: vertical;
}

.form-alert {
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px;
}

.error-alert {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.chunks-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
}

.chunk-box {
  background: var(--bg-surface-elevated, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 8px 10px;
}

.chunk-box-header {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  margin-bottom: 4px;
}

.chunk-text {
  font-size: 11.5px;
  color: var(--text-secondary);
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
