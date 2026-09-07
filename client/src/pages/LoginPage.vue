<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppLogo from '@/components/ui/AppLogo.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const isSubmitting = ref(false);
const errorMessage = ref('');

/**
 * Demo accounts quick-switcher visibility logic
 * Rendered in local development/demo environments, hidden in production.
 */
const showDemoAccounts = computed(() => {
  if (import.meta.env.VITE_ENABLE_DEMO_ACCOUNTS === 'false') {
    return false;
  }
  return import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_ACCOUNTS === 'true';
});

const DEMO_ACCOUNTS = [
  {
    name: 'Alex Morgan',
    role: 'ADMIN',
    badge: 'Workspace Admin',
    email: 'alex.m@projectpilot.dev',
    avatar: 'AM',
    desc: 'Full workspace & project administration'
  },
  {
    name: 'Jane Doe',
    role: 'DEVELOPER',
    badge: 'Senior Developer',
    email: 'jane.d@projectpilot.dev',
    avatar: 'JD',
    desc: 'Backlog, tickets, board delivery'
  },
  {
    name: 'Samir Khan',
    role: 'PROJECT_MANAGER',
    badge: 'DevOps & PM',
    email: 'samir.k@projectpilot.dev',
    avatar: 'SK',
    desc: 'Sprint planning & infrastructure lead'
  },
  {
    name: 'Priya Patel',
    role: 'VIEWER',
    badge: 'QA & Viewer',
    email: 'priya.p@projectpilot.dev',
    avatar: 'PP',
    desc: 'Read-only tickets & metrics verification'
  }
];

function selectDemoAccount(account) {
  email.value = account.email;
  password.value = 'PilotPass123!';
  errorMessage.value = '';
}

async function handleLogin() {
  if (!email.value.trim() || !password.value) {
    errorMessage.value = 'Please enter both your email and password.';
    return;
  }

  errorMessage.value = '';
  isSubmitting.value = true;

  try {
    const res = await authStore.login({
      email: email.value.trim(),
      password: password.value
    });

    if (res.success) {
      const redirectPath = route.query.redirect || '/dashboard';
      router.push(redirectPath);
    } else {
      errorMessage.value = res.error || 'Authentication failed. Please check your credentials.';
    }
  } catch (err) {
    errorMessage.value = err.message || 'An unexpected error occurred during login.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-composition">

      <!-- ── Left Product Section (desktop only) ── -->
      <aside class="login-left" aria-hidden="true">
        <div class="left-inner">

          <!-- Brand -->
          <div class="left-brand">
            <AppLogo size="lg" :show-text="true" :show-tagline="false" />
          </div>

          <!-- Headline -->
          <div class="left-headline-group">
            <h1 class="left-headline">
              AI-powered project intelligence for modern engineering teams.
            </h1>
            <p class="left-subline">
              Manage projects, tickets, sprints and engineering knowledge with an AI copilot that understands your workspace.
            </p>
          </div>

          <!-- Capability Rows -->
          <div class="left-capabilities">
            <div class="capability-row">
              <div class="cap-icon">
                <AppIcon name="cpu" :size="16" />
              </div>
              <div class="cap-text">
                <span class="cap-title">AI Project Intelligence</span>
                <span class="cap-desc">Natural language queries for sprint progress, ticket inspection, and project risks.</span>
              </div>
            </div>

            <div class="capability-row">
              <div class="cap-icon">
                <AppIcon name="knowledge" :size="16" />
              </div>
              <div class="cap-text">
                <span class="cap-title">RAG-powered Project Knowledge</span>
                <span class="cap-desc">Semantic vector search across architecture docs, runbooks, and company specs.</span>
              </div>
            </div>

            <div class="capability-row">
              <div class="cap-icon">
                <AppIcon name="analytics" :size="16" />
              </div>
              <div class="cap-text">
                <span class="cap-title">Agile Planning & Analytics</span>
                <span class="cap-desc">Burndown velocity, dynamic capacity utilization, and RBAC project security.</span>
              </div>
            </div>
          </div>

          <!-- Subtle trust strip -->
          <div class="left-trust">
            <span class="trust-dot"></span>
            <span>End-to-end encrypted workspace access</span>
          </div>
        </div>
      </aside>

      <!-- ── Right Sign-in Section ── -->
      <main class="login-right">
        <!-- Mobile top brand (shown only when left panel is hidden) -->
        <div class="mobile-brand">
          <AppLogo size="md" :show-text="true" :show-tagline="false" />
        </div>

        <div class="login-card">
          <!-- Card Head -->
          <div class="card-head">
            <h2 class="signin-title">Sign in to ProjectPilot</h2>
            <p class="signin-subtitle">Access your workspace and continue where your engineering team left off.</p>
          </div>

          <!-- Error Banner -->
          <div v-if="errorMessage" class="error-banner" role="alert" aria-live="assertive">
            <AppIcon name="alert-triangle" :size="14" class="error-icon" />
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Login Form -->
          <form
            id="login-form"
            class="login-form"
            :aria-busy="isSubmitting"
            @submit.prevent="handleLogin"
          >
            <div class="form-group">
              <label for="email" class="form-label">Email address</label>
              <div class="input-wrapper">
                <AppIcon name="mail" :size="15" class="input-icon" />
                <input
                  id="email"
                  v-model="email"
                  type="email"
                  required
                  autocomplete="email"
                  placeholder="name@company.com"
                  class="form-input"
                  :disabled="isSubmitting"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="password" class="form-label">Password</label>
              <div class="input-wrapper">
                <AppIcon name="lock" :size="15" class="input-icon" />
                <input
                  id="password"
                  v-model="password"
                  type="password"
                  required
                  autocomplete="current-password"
                  placeholder="••••••••••••"
                  class="form-input"
                  :disabled="isSubmitting"
                />
              </div>
            </div>

            <button
              type="submit"
              class="submit-btn"
              :disabled="isSubmitting"
              :aria-busy="isSubmitting"
              :aria-label="isSubmitting ? 'Signing into workspace, please wait' : 'Sign in to workspace'"
            >
              <span v-if="isSubmitting" class="btn-spinner" aria-hidden="true"></span>
              <span class="btn-label">
                {{ isSubmitting ? 'Signing into workspace…' : 'Sign In to Workspace' }}
              </span>
            </button>
          </form>

          <!-- Demo Mode Section -->
          <div v-if="showDemoAccounts" class="demo-section">
            <div class="demo-header">
              <div class="demo-divider-line"></div>
              <div class="demo-header-label">
                <span class="demo-mode-pill">DEMO MODE</span>
              </div>
              <div class="demo-divider-line"></div>
            </div>
            <p class="demo-intro">Explore ProjectPilot using a preconfigured role</p>

            <div class="demo-grid">
              <button
                v-for="acc in DEMO_ACCOUNTS"
                :key="acc.email"
                type="button"
                class="demo-account-btn"
                :class="{ active: email === acc.email }"
                :disabled="isSubmitting"
                @click="selectDemoAccount(acc)"
              >
                <div class="demo-avatar" :class="acc.role.toLowerCase()">{{ acc.avatar }}</div>
                <div class="demo-info">
                  <div class="demo-name-row">
                    <span class="demo-name">{{ acc.name }}</span>
                    <span class="demo-badge" :class="acc.role.toLowerCase()">{{ acc.badge }}</span>
                  </div>
                  <span class="demo-desc">{{ acc.desc }}</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <footer class="login-footer">
          <span class="footer-lock">
            <AppIcon name="lock" :size="11" />
            Secure workspace access
          </span>
        </footer>
      </main>

    </div>
  </div>
</template>

<style scoped>
/* ─── Page Shell ─── */
.login-page {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-app);
  padding: var(--space-6) var(--space-4);
  box-sizing: border-box;
  overflow-y: auto;
}

/* ─── Composition wrapper (two columns) ─── */
.login-composition {
  width: 100%;
  max-width: 1100px;
  display: grid;
  /* Mobile: single column (right only) */
  grid-template-columns: 1fr;
  gap: 0;
  margin: auto;
  animation: pageEnter 0.35s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes pageEnter {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ─── Desktop two-column layout (>= 1024px) ─── */
@media (min-width: 1024px) {
  .login-composition {
    grid-template-columns: 1fr 1fr;
    gap: 0;
    align-items: stretch;
    min-height: 580px;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-xl);
    overflow: hidden;
    box-shadow: var(--shadow-lg);
  }

  .mobile-brand {
    display: none !important;
  }
}

/* ─── Left Panel ─── */
.login-left {
  /* Hidden on mobile and small tablet — shown only >= 1024px */
  display: none;
  background: linear-gradient(145deg, #0f1118 0%, #111520 50%, #0d1017 100%);
  border-right: 1px solid var(--border-strong);
  padding: var(--space-10) var(--space-8);
  position: relative;
  overflow: hidden;
}

/* Subtle decorative mesh background */
.login-left::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(79, 70, 229, 0.06) 0%, transparent 50%);
  pointer-events: none;
}

/* Subtle grid pattern */
.login-left::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(99, 102, 241, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99, 102, 241, 0.04) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
}

@media (min-width: 1024px) {
  .login-left {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
}

.left-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.left-brand {
  /* AppLogo itself */
}

.left-headline-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.left-headline {
  font-size: 1.35rem;
  font-weight: var(--font-weight-bold);
  color: #f3f4f6;
  line-height: 1.3;
  letter-spacing: -0.025em;
  margin: 0;
}

.left-subline {
  font-size: var(--text-sm);
  color: #9ca3af;
  line-height: 1.6;
  margin: 0;
}

/* ─── Capability rows ─── */
.left-capabilities {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.capability-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid rgba(99, 102, 241, 0.15);
  background: rgba(99, 102, 241, 0.04);
  transition: border-color var(--transition-fast), background var(--transition-fast);
}

.capability-row:hover {
  border-color: rgba(99, 102, 241, 0.3);
  background: rgba(99, 102, 241, 0.08);
}

.cap-icon {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(79, 70, 229, 0.35));
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cap-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.cap-title {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: #e5e7eb;
  line-height: 1.2;
}

.cap-desc {
  font-size: var(--text-xs);
  color: #6b7280;
  line-height: 1.4;
}

/* Trust strip */
.left-trust {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 11px;
  color: #4b5563;
}

.trust-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  flex-shrink: 0;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
}

/* ─── Right Sign-in Panel ─── */
.login-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-6);
  background-color: var(--bg-surface);
  gap: var(--space-4);
}

@media (min-width: 1024px) {
  .login-right {
    padding: var(--space-10) var(--space-8);
  }
}

/* Mobile brand (only shown below 1024px) */
.mobile-brand {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-2);
}

/* ─── Login Card ─── */
.login-card {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ─── Card Header ─── */
.card-head {
  margin-bottom: var(--space-6);
}

.signin-title {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.02em;
  margin: 0 0 var(--space-2) 0;
  line-height: 1.2;
}

.signin-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

/* ─── Error Banner ─── */
.error-banner {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3);
  background-color: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: var(--radius-md);
  color: var(--color-danger-500);
  font-size: var(--text-sm);
  margin-bottom: var(--space-5);
  line-height: 1.4;
}

.error-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

/* ─── Form ─── */
.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-label {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  letter-spacing: 0.01em;
  text-transform: uppercase;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 11px;
  color: var(--text-muted);
  pointer-events: none;
  flex-shrink: 0;
}

.form-input {
  width: 100%;
  height: 40px;
  padding: 0 var(--space-3) 0 36px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  font-family: var(--font-sans);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast), background-color var(--transition-fast);
  box-sizing: border-box;
}

.form-input::placeholder {
  color: var(--text-muted);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
  background-color: var(--bg-surface);
}

.form-input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* ─── Submit Button ─── */
.submit-btn {
  width: 100%;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  background-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast);
  box-shadow: 0 1px 3px rgba(79, 70, 229, 0.3);
  position: relative;
}

.submit-btn:hover:not(:disabled) {
  background-color: var(--btn-primary-hover);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
}

.submit-btn:active:not(:disabled) {
  transform: scale(0.99);
}

.submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-spinner {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.btn-label {
  line-height: 1;
}

/* ─── Demo Section ─── */
.demo-section {
  padding-top: var(--space-5);
  border-top: 1px solid var(--border-strong);
}

.demo-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.demo-divider-line {
  flex: 1;
  height: 1px;
  background: var(--border-strong);
}

.demo-mode-pill {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 var(--space-2);
  background: rgba(245, 158, 11, 0.12);
  color: var(--color-warning-500);
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: var(--radius-xs);
  font-size: 10px;
  font-family: var(--font-mono);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.demo-intro {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-align: center;
  margin-bottom: var(--space-3);
  line-height: 1.4;
}

.demo-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.demo-account-btn {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  text-align: left;
  cursor: pointer;
  transition: border-color var(--transition-fast), background-color var(--transition-fast), box-shadow var(--transition-fast);
  width: 100%;
  font-family: var(--font-sans);
}

.demo-account-btn:hover:not(:disabled) {
  border-color: var(--color-primary-500);
  background-color: var(--bg-surface-hover);
  box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.12);
}

.demo-account-btn.active {
  border-color: var(--color-primary-500);
  background-color: rgba(99, 102, 241, 0.07);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
}

.demo-account-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.demo-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 11px;
  font-weight: var(--font-weight-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: var(--font-sans);
}

.demo-avatar.admin {
  background: rgba(99, 102, 241, 0.18);
  color: var(--color-primary-400);
  border: 1px solid rgba(99, 102, 241, 0.3);
}
.demo-avatar.developer {
  background: rgba(16, 185, 129, 0.15);
  color: var(--color-success-500);
  border: 1px solid rgba(16, 185, 129, 0.3);
}
.demo-avatar.project_manager {
  background: rgba(245, 158, 11, 0.15);
  color: var(--color-warning-500);
  border: 1px solid rgba(245, 158, 11, 0.3);
}
.demo-avatar.viewer {
  background: rgba(107, 114, 128, 0.12);
  color: var(--text-secondary);
  border: 1px solid var(--border-strong);
}

.demo-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.demo-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.demo-name {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  white-space: nowrap;
}

.demo-badge {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 6px;
  border-radius: var(--radius-xs);
  font-size: 10px;
  font-weight: var(--font-weight-medium);
  line-height: 1;
  white-space: nowrap;
  flex-shrink: 0;
}

.demo-badge.admin {
  background: rgba(99, 102, 241, 0.15);
  color: var(--color-primary-400);
}
.demo-badge.developer {
  background: rgba(16, 185, 129, 0.15);
  color: var(--color-success-500);
}
.demo-badge.project_manager {
  background: rgba(245, 158, 11, 0.15);
  color: var(--color-warning-500);
}
.demo-badge.viewer {
  background: rgba(107, 114, 128, 0.12);
  color: var(--text-muted);
}

.demo-desc {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

/* ─── Footer ─── */
.login-footer {
  margin-top: var(--space-2);
}

.footer-lock {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-muted);
}

/* ─── Dark theme border boosts ─── */
/* Inputs */
:root[data-theme='dark'] .form-input,
.dark .form-input {
  border-color: #505d70;
}

/* Login composition outer border */
@media (min-width: 1024px) {
  :root[data-theme='dark'] .login-composition,
  .dark .login-composition {
    border-color: #505d70;
  }
}

/* Left panel separator */
:root[data-theme='dark'] .login-left,
.dark .login-left {
  border-right-color: #505d70;
}

/* Demo section top border */
:root[data-theme='dark'] .demo-section,
.dark .demo-section {
  border-top-color: #505d70;
}

/* Demo divider lines */
:root[data-theme='dark'] .demo-divider-line,
.dark .demo-divider-line {
  background: #505d70;
}

/* Demo account buttons */
:root[data-theme='dark'] .demo-account-btn,
.dark .demo-account-btn {
  border-color: #505d70;
}

:root[data-theme='dark'] .demo-account-btn:hover:not(:disabled),
.dark .demo-account-btn:hover:not(:disabled) {
  border-color: var(--color-primary-500);
}

/* Mobile/tablet login-right card border */
@media (max-width: 1023px) {
  :root[data-theme='dark'] .login-right,
  .dark .login-right {
    border-color: #505d70;
  }
}

/* ─── Light theme overrides ─── */
:root[data-theme='light'] .login-left,
.light .login-left {
  background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 50%, #f8fafc 100%);
  border-right-color: var(--border-strong);
}

:root[data-theme='light'] .login-left::before,
.light .login-left::before {
  background-image:
    radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.06) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(79, 70, 229, 0.04) 0%, transparent 50%);
}

:root[data-theme='light'] .login-left::after,
.light .login-left::after {
  background-image:
    linear-gradient(rgba(99, 102, 241, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99, 102, 241, 0.05) 1px, transparent 1px);
}

:root[data-theme='light'] .left-headline,
.light .left-headline {
  color: var(--text-primary);
}

:root[data-theme='light'] .left-subline,
.light .left-subline {
  color: var(--text-secondary);
}

:root[data-theme='light'] .cap-title,
.light .cap-title {
  color: var(--text-primary);
}

:root[data-theme='light'] .left-trust,
.light .left-trust {
  color: var(--text-muted);
}

:root[data-theme='light'] .capability-row,
.light .capability-row {
  border-color: var(--border-default);
  background: var(--bg-surface);
}

:root[data-theme='light'] .capability-row:hover,
.light .capability-row:hover {
  border-color: var(--color-primary-300);
  background: var(--bg-surface-elevated);
}

:root[data-theme='light'] .cap-icon,
.light .cap-icon {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(79, 70, 229, 0.18));
  border-color: rgba(99, 102, 241, 0.25);
  color: var(--color-primary-600);
}

/* ─── Responsive – Tablet (768px–1023px): stack, keep right only ─── */
@media (min-width: 768px) and (max-width: 1023px) {
  .login-page {
    align-items: flex-start;
    padding-top: var(--space-10);
    padding-bottom: var(--space-10);
  }

  .login-right {
    max-width: 460px;
    margin: 0 auto;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    width: 100%;
  }
}

/* ─── Mobile (< 768px) ─── */
@media (max-width: 767px) {
  .login-page {
    padding: var(--space-4);
    align-items: flex-start;
  }

  .login-right {
    width: 100%;
    padding: var(--space-6) var(--space-4);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
  }

  .signin-title {
    font-size: var(--text-lg);
  }

  .signin-subtitle {
    font-size: var(--text-xs);
  }
}

/* ─── Short viewport safety ─── */
@media (max-height: 640px) {
  .login-page {
    align-items: flex-start;
    padding-top: var(--space-4);
    padding-bottom: var(--space-4);
  }
}
</style>
