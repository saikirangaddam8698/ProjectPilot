<script setup>
import { ref, computed, onMounted } from 'vue';
import { useTheme } from '@/composables/useTheme';
import { useAiStore } from '@/stores/ai.store';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseBadge from '@/components/ui/BaseBadge.vue';
import BaseSelect from '@/components/ui/BaseSelect.vue';
import BaseInput from '@/components/ui/BaseInput.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const { theme, isDark, setTheme } = useTheme();
const aiStore = useAiStore();

const selectedModel = ref(aiStore.activeModel || 'gemini-3.8-flash');
const toastMessage = ref('');
const isSaving = ref(false);

onMounted(async () => {
  await aiStore.fetchConfig();
  if (aiStore.activeModel) {
    selectedModel.value = aiStore.activeModel;
  }
});

const modelOptions = computed(() => {
  return aiStore.availableModels.map((m) => ({
    value: m.id,
    label: m.label || m.name
  }));
});

async function handleSaveSettings() {
  isSaving.value = true;
  try {
    await aiStore.updateModel(selectedModel.value);
    const chosen = aiStore.availableModels.find((m) => m.id === selectedModel.value);
    toastMessage.value = `AI model set to ${chosen?.name || selectedModel.value}`;
    setTimeout(() => {
      toastMessage.value = '';
    }, 3500);
  } catch (err) {
    toastMessage.value = 'Failed to update AI model. Please try again.';
    setTimeout(() => {
      toastMessage.value = '';
    }, 3500);
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">Workspace Settings</h2>
        <p class="page-subtitle">Configure workspace preferences, AI models, and theme appearance.</p>
      </div>
      <BaseButton
        variant="primary"
        size="sm"
        :loading="isSaving"
        @click="handleSaveSettings"
      >
        <template #prefix><AppIcon name="check" :size="14" /></template>
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
              <div class="model-select-box">
                <BaseSelect
                  v-model="selectedModel"
                  :options="modelOptions"
                  size="sm"
                  menu-placement="top"
                  aria-label="Select Gemini Model"
                />
              </div>
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

    <!-- Feedback Toast -->
    <Transition name="toast">
      <div v-if="toastMessage" class="feedback-toast" role="status" aria-live="polite">
        <div class="toast-icon-wrap">
          <AppIcon name="check" :size="14" />
        </div>
        <span class="toast-text">{{ toastMessage }}</span>
      </div>
    </Transition>
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
  background-color: var(--glass-bg-card);
  backdrop-filter: var(--glass-blur-md);
  -webkit-backdrop-filter: var(--glass-blur-md);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-sm);
  overflow: visible;
  position: relative;
}

.card-header {
  padding: var(--space-4) var(--space-5);
  background-color: var(--glass-bg-elevated);
  border-bottom: 1px solid var(--glass-border-subtle);
  border-top-left-radius: calc(var(--radius-lg) - 1px);
  border-top-right-radius: calc(var(--radius-lg) - 1px);
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
  overflow: visible;
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
  position: relative;
  z-index: 50;
}

.model-select-box {
  min-width: 320px;
  position: relative;
  z-index: 60;
}

.model-pill {
  font-size: var(--text-xs);
  color: var(--text-primary);
  background: var(--glass-bg-subtle, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--glass-border-subtle, rgba(255, 255, 255, 0.1));
  padding: 4px 10px;
  border-radius: var(--radius-md, 7px);
}

.feedback-toast {
  position: fixed;
  bottom: var(--space-8);
  right: var(--space-8);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-surface-elevated, #171B21);
  border: 1px solid var(--border-default, #2A313D);
  border-radius: var(--radius-lg, 10px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
  z-index: 1000;
}

.toast-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.toast-text {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.toast-enter-active,
.toast-leave-active {
  transition: all var(--transition-fast, 150ms) ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
