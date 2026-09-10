<script setup>
import { useTheme } from '@/composables/useTheme';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import BaseInput from '@/components/ui/BaseInput.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const { theme, isDark, setTheme } = useTheme();
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">Workspace Settings</h2>
        <p class="page-subtitle">Configure workspace preferences, AI models, and theme appearance.</p>
      </div>
      <BaseButton variant="primary" size="sm">
        Save Changes
      </BaseButton>
    </div>

    <!-- Settings Sections -->
    <div class="settings-sections">
      <!-- Section 1: Appearance & Theme -->
      <div class="settings-card">
        <div class="card-header">
          <h3 class="card-title">Appearance & Theme</h3>
          <span class="card-subtitle text-muted">Customize the interface color scheme and visual density</span>
        </div>
        <div class="card-body">
          <div class="theme-options-grid">
            <div
              class="theme-box"
              :class="{ 'is-selected': isDark }"
              @click="setTheme('dark')"
            >
              <div class="theme-preview dark-preview">
                <div class="preview-sidebar"></div>
                <div class="preview-content">
                  <div class="preview-line"></div>
                  <div class="preview-card"></div>
                </div>
              </div>
              <div class="theme-label">
                <span>Dark Theme</span>
                <BaseBadge v-if="isDark" variant="primary" size="sm">Active</BaseBadge>
              </div>
            </div>

            <div
              class="theme-box"
              :class="{ 'is-selected': !isDark }"
              @click="setTheme('light')"
            >
              <div class="theme-preview light-preview">
                <div class="preview-sidebar"></div>
                <div class="preview-content">
                  <div class="preview-line"></div>
                  <div class="preview-card"></div>
                </div>
              </div>
              <div class="theme-label">
                <span>Light Theme</span>
                <BaseBadge v-if="!isDark" variant="primary" size="sm">Active</BaseBadge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: AI & LLM Engine -->
      <div class="settings-card">
        <div class="card-header">
          <div class="header-with-badge">
            <h3 class="card-title">AI & Intelligence Engine</h3>
            <BaseBadge variant="purple" size="sm">Google Gemini</BaseBadge>
          </div>
          <span class="card-subtitle text-muted">Configure default model and tool execution permissions</span>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-label-col">
              <label class="form-label">Primary AI Model</label>
              <span class="form-sublabel text-muted">Core generative reasoning & tool execution engine</span>
            </div>
            <div class="model-status-wrapper">
              <span class="model-pill mono font-medium">Gemini 1.5 Pro / Flash</span>
              <BaseBadge variant="success" size="sm" dot>Operational</BaseBadge>
            </div>
          </div>

          <div class="form-row">
            <div class="form-label-col">
              <label class="form-label">Vector Search (pgvector)</label>
              <span class="form-sublabel text-muted">PostgreSQL semantic indexing & embeddings</span>
            </div>
            <div class="model-status-wrapper">
              <BaseBadge variant="success" size="sm" dot>Connected (768 dimensions)</BaseBadge>
            </div>
          </div>
        </div>
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

.settings-sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.settings-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
}

.card-header {
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border-subtle);
}

.header-with-badge {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.card-title {
  font-size: var(--text-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.card-subtitle {
  font-size: var(--text-xs);
  display: block;
  margin-top: 2px;
}

.card-body {
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* Theme Options */
.theme-options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 260px));
  gap: var(--space-4);
}

.theme-box {
  border: 2px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background-color: var(--bg-surface-elevated);
  transition: border-color var(--transition-fast);
}

.theme-box:hover {
  border-color: var(--border-strong);
}

.theme-box.is-selected {
  border-color: var(--color-primary-500);
}

.theme-preview {
  height: 100px;
  border-radius: var(--radius-md);
  display: flex;
  overflow: hidden;
  border: 1px solid var(--border-default);
}

.dark-preview {
  background-color: #0B0D10;
}
.dark-preview .preview-sidebar {
  width: 30%;
  background-color: #111418;
  border-right: 1px solid #1F242D;
}
.dark-preview .preview-content {
  flex: 1;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.dark-preview .preview-line {
  height: 8px;
  width: 50%;
  background-color: #2A313D;
  border-radius: 2px;
}
.dark-preview .preview-card {
  height: 40px;
  background-color: #171B21;
  border: 1px solid #2A313D;
  border-radius: 4px;
}

.light-preview {
  background-color: #F8FAFC;
}
.light-preview .preview-sidebar {
  width: 30%;
  background-color: #FFFFFF;
  border-right: 1px solid #E2E8F0;
}
.light-preview .preview-content {
  flex: 1;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.light-preview .preview-line {
  height: 8px;
  width: 50%;
  background-color: #CBD5E1;
  border-radius: 2px;
}
.light-preview .preview-card {
  height: 40px;
  background-color: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 4px;
}

.theme-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) 0;
}

.form-label {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.form-label-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.form-sublabel {
  font-size: var(--text-xs);
}

.model-status-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
  justify-content: flex-end;
}

.model-pill {
  font-size: var(--text-xs);
  color: var(--text-primary);
  background: var(--glass-bg-subtle, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--glass-border-subtle, rgba(255, 255, 255, 0.1));
  padding: 4px 10px;
  border-radius: var(--radius-md, 7px);
}
</style>
