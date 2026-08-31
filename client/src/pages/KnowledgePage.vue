<script setup>
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import BaseInput from '@/components/ui/BaseInput.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="header-badge-group">
          <h2 class="page-title">Knowledge Base & Docs</h2>
          <BaseBadge variant="info" size="md">RAG Indexed</BaseBadge>
        </div>
        <p class="page-subtitle">Project documentation, technical specifications, and architecture decision records.</p>
      </div>
      <BaseButton variant="primary" size="sm">
        <template #prefix><AppIcon name="plus" :size="14" /></template>
        New Document
      </BaseButton>
    </div>

    <!-- Search in Docs -->
    <div class="docs-search-bar">
      <BaseInput placeholder="Semantic search documentation with pgvector..." size="md">
        <template #prefix><AppIcon name="search" :size="16" /></template>
      </BaseInput>
    </div>

    <!-- Docs Tree / Cards -->
    <div class="docs-grid">
      <div class="doc-card">
        <div class="doc-card-header">
          <span class="doc-icon">📄</span>
          <div class="doc-title-group">
            <h3 class="doc-title">ProjectPilot System Architecture</h3>
            <span class="doc-meta text-muted">Updated 2 days ago by Alex Morgan • 18 chunks</span>
          </div>
          <BaseBadge variant="purple" size="sm">pgvector</BaseBadge>
        </div>
        <p class="doc-excerpt">
          Comprehensive blueprint describing the Vue 3 frontend shell, Node/Express backend, PostgreSQL schema, and Gemini tool calling pipeline.
        </p>
      </div>

      <div class="doc-card">
        <div class="doc-card-header">
          <span class="doc-icon">🔒</span>
          <div class="doc-title-group">
            <h3 class="doc-title">Security & RBAC Specifications</h3>
            <span class="doc-meta text-muted">Updated 4 days ago by Alex Morgan • 8 chunks</span>
          </div>
          <BaseBadge variant="purple" size="sm">pgvector</BaseBadge>
        </div>
        <p class="doc-excerpt">
          Role-based access matrix for Project Managers, Developers, and Viewers, including JWT session lifetime and tool execution permissions.
        </p>
      </div>

      <div class="doc-card">
        <div class="doc-card-header">
          <span class="doc-icon">🚀</span>
          <div class="doc-title-group">
            <h3 class="doc-title">Local Development & Deployment Guide</h3>
            <span class="doc-meta text-muted">Updated 1 week ago by Samir Khan • 12 chunks</span>
          </div>
          <BaseBadge variant="purple" size="sm">pgvector</BaseBadge>
        </div>
        <p class="doc-excerpt">
          Instructions for spinning up PostgreSQL with the pgvector extension, running database migrations, and configuring Gemini API keys.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.header-badge-group {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.page-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-1);
}

.docs-search-bar {
  max-width: 600px;
}

.docs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: var(--space-4);
}

.doc-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  cursor: pointer;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.doc-card:hover {
  border-color: var(--border-default);
  box-shadow: var(--shadow-sm);
}

.doc-card-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

.doc-icon {
  font-size: 20px;
}

.doc-title-group {
  flex: 1;
}

.doc-title {
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.doc-meta {
  font-size: var(--text-xs);
  display: block;
  margin-top: 2px;
}

.doc-excerpt {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-normal);
}
</style>
