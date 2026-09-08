<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { useProjectStore } from '@/stores/project.store';
import { useTicketStore } from '@/stores/ticket.store';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppLogo from '@/components/ui/AppLogo.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const projectStore = useProjectStore();
const ticketStore = useTicketStore();

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
      projectStore.fetchProjects();
      ticketStore.fetchTickets();
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
    <!-- Ambient subtle background layers -->
    <div class="login-bg-grid" aria-hidden="true"></div>
    <div class="login-bg-glow" aria-hidden="true"></div>

    <div class="login-container">
      <div class="login-composition">

        <!-- ── Left Product Section (desktop only) ── -->
        <aside class="login-left" aria-hidden="true">
          <div class="left-inner">

            <!-- Brand Header -->
            <div class="left-brand">
              <AppLogo size="lg" :show-text="true" :show-tagline="false" />
            </div>

            <!-- Main Headline & Subtitle -->
            <div class="left-headline-group">
              <h1 class="left-headline">
                AI-powered project intelligence for modern engineering teams.
              </h1>
              <p class="left-subline">
                Manage projects, tickets, sprints and engineering knowledge with an AI copilot that understands your workspace.
              </p>
            </div>

            <!-- Feature Cards -->
            <div class="left-capabilities">
              <!-- Feature 1: AI Project Intelligence -->
              <div class="capability-card">
                <div class="cap-icon-box">
                  <AppIcon name="cpu" :size="17" />
                </div>
                <div class="cap-content">
                  <span class="cap-title">AI Project Intelligence</span>
                  <span class="cap-desc">Natural language queries for sprint progress, ticket inspection, and project risks.</span>
                </div>
              </div>

              <!-- Feature 2: RAG-powered Project Knowledge -->
              <div class="capability-card">
                <div class="cap-icon-box">
                  <AppIcon name="knowledge" :size="17" />
                </div>
                <div class="cap-content">
                  <span class="cap-title">RAG-powered Project Knowledge</span>
                  <span class="cap-desc">Semantic vector search across architecture docs, runbooks, and company specs.</span>
                </div>
              </div>

              <!-- Feature 3: Agile Planning & Analytics -->
              <div class="capability-card">
                <div class="cap-icon-box">
                  <AppIcon name="analytics" :size="17" />
                </div>
                <div class="cap-content">
                  <span class="cap-title">Agile Planning & Analytics</span>
                  <span class="cap-desc">Burndown velocity, dynamic capacity utilization, and RBAC project security.</span>
                </div>
              </div>
            </div>

            <!-- Subtle Trust Badge -->
            <div class="left-trust">
              <span class="trust-dot"></span>
              <span class="trust-text">End-to-end encrypted workspace access</span>
            </div>

          </div>
        </aside>

        <!-- ── Right Sign-in Section ── -->
        <main class="login-right">
          <!-- Mobile top brand (visible on tablet / mobile when left panel stacks/hides) -->
          <div class="mobile-brand">
            <AppLogo size="md" :show-text="true" :show-tagline="false" />
          </div>

          <div class="login-card">
            <!-- Card Header -->
            <div class="card-head">
              <h2 class="signin-title">Sign in to ProjectPilot</h2>
              <p class="signin-subtitle">Access your workspace and continue where your engineering team left off.</p>
            </div>

            <!-- Error Banner -->
            <div v-if="errorMessage" class="error-banner" role="alert" aria-live="assertive">
              <AppIcon name="alert-triangle" :size="15" class="error-icon" />
              <span class="error-text">{{ errorMessage }}</span>
            </div>

            <!-- Login Form -->
            <form
              id="login-form"
              class="login-form"
              :aria-busy="isSubmitting"
              @submit.prevent="handleLogin"
            >
              <div class="form-group">
                <label for="email" class="form-label">EMAIL ADDRESS</label>
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
                <label for="password" class="form-label">PASSWORD</label>
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
                  {{ isSubmitting ? 'Signing in…' : 'Sign In to Workspace' }}
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
                  <div class="demo-avatar" :class="acc.role.toLowerCase()">
                    {{ acc.avatar }}
                  </div>
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

            <!-- Footer -->
            <footer class="login-footer">
              <span class="footer-lock">
                <AppIcon name="lock" :size="12" />
                Secure workspace access
              </span>
            </footer>

          </div>
        </main>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* ─── Page Shell & Viewport Background ─── */
.login-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-app);
  padding: var(--space-8) var(--space-4);
  box-sizing: border-box;
  overflow-y: auto;
}

/* Very subtle background ambient grid pattern */
.login-bg-grid {
  position: fixed;
  inset: 0;
  background-image: 
    linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 32px 32px;
  pointer-events: none;
  z-index: 0;
}

/* Subtle top-center radial gradient aura */
.login-bg-glow {
  position: fixed;
  top: -150px;
  left: 50%;
  transform: translateX(-50%);
  width: 800px;
  height: 500px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.07) 0%, rgba(99, 102, 241, 0) 70%);
  pointer-events: none;
  z-index: 0;
}

/* ─── Container ─── */
.login-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1060px;
  margin: auto;
}

/* ─── Composition wrapper (two columns) ─── */
.login-composition {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg), 0 0 0 1px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: pageEnter 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes pageEnter {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.995);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ─── Desktop Two-Column Layout (>= 1024px) ─── */
@media (min-width: 1024px) {
  .login-composition {
    grid-template-columns: 1.12fr 1fr;
    min-height: 600px;
  }

  .mobile-brand {
    display: none !important;
  }
}

/* ─── Left Product Panel ─── */
.login-left {
  display: none;
  background: linear-gradient(165deg, #0d1117 0%, #10141d 50%, #0a0d14 100%);
  border-right: 1px solid var(--border-subtle);
  padding: var(--space-10) var(--space-8);
  position: relative;
  overflow: hidden;
}

/* Left panel decorative subtle ambient glow */
.login-left::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    radial-gradient(circle at 15% 15%, rgba(99, 102, 241, 0.07) 0%, transparent 45%),
    radial-gradient(circle at 85% 85%, rgba(79, 70, 229, 0.05) 0%, transparent 45%);
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
  gap: var(--space-6);
}

.left-brand {
  margin-bottom: var(--space-2);
}

.left-headline-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.left-headline {
  font-size: 1.45rem;
  font-weight: var(--font-weight-bold);
  color: #f3f4f6;
  line-height: 1.3;
  letter-spacing: -0.025em;
  margin: 0;
}

.left-subline {
  font-size: var(--text-sm);
  color: #9ca3af;
  line-height: 1.55;
  margin: 0;
}

/* ─── Left Feature Cards ─── */
.left-capabilities {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-1);
}

.capability-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.025);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: all var(--transition-fast);
}

.capability-card:hover {
  background: rgba(99, 102, 241, 0.05);
  border-color: rgba(99, 102, 241, 0.25);
  transform: translateX(3px);
}

.cap-icon-box {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: rgba(99, 102, 241, 0.12);
  border: 1px solid rgba(99, 102, 241, 0.22);
  color: #a5b4fc;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}

.capability-card:hover .cap-icon-box {
  border-color: rgba(99, 102, 241, 0.4);
  color: #c7d2fe;
}

.cap-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.cap-title {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: #e5e7eb;
  line-height: 1.3;
}

.cap-desc {
  font-size: var(--text-xs);
  color: #838e9e;
  line-height: 1.45;
}

/* Left Trust Bar */
.left-trust {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: #6b7280;
  margin-top: var(--space-2);
}

.trust-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  flex-shrink: 0;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.45);
}

.trust-text {
  font-weight: var(--font-weight-medium);
  letter-spacing: -0.01em;
}

/* ─── Right Sign-in Panel ─── */
.login-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-6);
  background-color: var(--bg-surface);
}

@media (min-width: 1024px) {
  .login-right {
    padding: var(--space-10) var(--space-10);
  }
}

/* Mobile Brand Header */
.mobile-brand {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-5);
}

/* ─── Login Card Form Container ─── */
.login-card {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
}

/* Card Header */
.card-head {
  margin-bottom: var(--space-6);
  text-align: left;
}

.signin-title {
  font-size: 1.35rem;
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.025em;
  margin: 0 0 var(--space-2) 0;
  line-height: 1.25;
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
  padding: var(--space-3) var(--space-3);
  background-color: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: var(--radius-md);
  color: var(--color-danger-500);
  font-size: var(--text-sm);
  margin-bottom: var(--space-4);
  line-height: 1.4;
}

.error-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.error-text {
  font-weight: var(--font-weight-medium);
}

/* ─── Form Inputs ─── */
.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 11px;
  font-weight: var(--font-weight-bold);
  color: var(--text-muted);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  color: var(--text-muted);
  pointer-events: none;
  flex-shrink: 0;
  transition: color var(--transition-fast);
}

.form-input {
  width: 100%;
  height: 40px;
  padding: 0 var(--space-3) 0 38px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast), background-color var(--transition-fast);
  box-sizing: border-box;
}

.form-input::placeholder {
  color: var(--text-muted);
  opacity: 0.7;
}

.input-wrapper:focus-within .input-icon {
  color: var(--color-primary-400);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  background-color: var(--bg-surface);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ─── Submit Button ─── */
.submit-btn {
  width: 100%;
  height: 40px;
  margin-top: var(--space-1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  background-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  letter-spacing: -0.01em;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15);
  position: relative;
}

.submit-btn:hover:not(:disabled) {
  background-color: var(--btn-primary-hover);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.btn-label {
  line-height: 1;
}

/* ─── Demo Mode Section ─── */
.demo-section {
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-subtle);
}

.demo-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}

.demo-divider-line {
  flex: 1;
  height: 1px;
  background: var(--border-subtle);
}

.demo-mode-pill {
  display: inline-flex;
  align-items: center;
  height: 19px;
  padding: 0 7px;
  background: rgba(245, 158, 11, 0.1);
  color: var(--color-warning-500);
  border: 1px solid rgba(245, 158, 11, 0.25);
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
  margin: 0 0 var(--space-3) 0;
  line-height: 1.4;
}

.demo-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.demo-account-btn {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 8px 10px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-fast);
  width: 100%;
  font-family: var(--font-sans);
}

.demo-account-btn:hover:not(:disabled) {
  border-color: var(--border-default);
  background-color: var(--bg-surface-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

.demo-account-btn.active {
  border-color: rgba(99, 102, 241, 0.5);
  background-color: rgba(99, 102, 241, 0.08);
  box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.25);
}

.demo-account-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.demo-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 11px;
  font-weight: var(--font-weight-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: var(--font-sans);
  letter-spacing: -0.02em;
}

.demo-avatar.admin {
  background: rgba(99, 102, 241, 0.15);
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
  background: rgba(148, 163, 184, 0.12);
  color: var(--text-secondary);
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.demo-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
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
  height: 17px;
  padding: 0 5px;
  border-radius: var(--radius-xs);
  font-size: 10px;
  font-weight: var(--font-weight-medium);
  line-height: 1;
  white-space: nowrap;
  flex-shrink: 0;
}

.demo-badge.admin {
  background: rgba(99, 102, 241, 0.12);
  color: var(--color-primary-400);
  border: 1px solid rgba(99, 102, 241, 0.25);
}

.demo-badge.developer {
  background: rgba(16, 185, 129, 0.12);
  color: var(--color-success-500);
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.demo-badge.project_manager {
  background: rgba(245, 158, 11, 0.12);
  color: var(--color-warning-500);
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.demo-badge.viewer {
  background: rgba(148, 163, 184, 0.12);
  color: var(--text-muted);
  border: 1px solid rgba(148, 163, 184, 0.2);
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
  margin-top: var(--space-4);
  display: flex;
  justify-content: center;
}

.footer-lock {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-muted);
  font-weight: var(--font-weight-medium);
}

/* ─── Light Theme Refinements ─── */
:root[data-theme='light'] .login-composition,
.light .login-composition {
  background: #ffffff;
  border-color: var(--border-default);
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04);
}

:root[data-theme='light'] .login-bg-grid,
.light .login-bg-grid {
  background-image: 
    linear-gradient(to right, rgba(0, 0, 0, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
}

:root[data-theme='light'] .login-left,
.light .login-left {
  background: linear-gradient(165deg, #f8fafc 0%, #f1f5f9 50%, #f8fafc 100%);
  border-right-color: var(--border-subtle);
}

:root[data-theme='light'] .left-headline,
.light .left-headline {
  color: var(--text-primary);
}

:root[data-theme='light'] .left-subline,
.light .left-subline {
  color: var(--text-secondary);
}

:root[data-theme='light'] .capability-card,
.light .capability-card {
  background: #ffffff;
  border-color: var(--border-subtle);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

:root[data-theme='light'] .capability-card:hover,
.light .capability-card:hover {
  background: #fdfdfd;
  border-color: var(--color-primary-300);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.08);
}

:root[data-theme='light'] .cap-title,
.light .cap-title {
  color: var(--text-primary);
}

:root[data-theme='light'] .cap-desc,
.light .cap-desc {
  color: var(--text-secondary);
}

:root[data-theme='light'] .cap-icon-box,
.light .cap-icon-box {
  background: rgba(99, 102, 241, 0.08);
  border-color: rgba(99, 102, 241, 0.2);
  color: var(--color-primary-600);
}

/* ─── Tablet Layout (768px – 1023px) ─── */
@media (min-width: 768px) and (max-width: 1023px) {
  .login-page {
    padding: var(--space-8) var(--space-4);
    align-items: center;
  }

  .login-container {
    max-width: 480px;
  }

  .login-right {
    padding: var(--space-8) var(--space-8);
  }
}

/* ─── Mobile Layout (< 768px) ─── */
@media (max-width: 767px) {
  .login-page {
    padding: var(--space-4);
    align-items: flex-start;
  }

  .login-container {
    max-width: 100%;
  }

  .login-composition {
    border-radius: var(--radius-lg);
  }

  .login-right {
    padding: var(--space-6) var(--space-4);
  }

  .signin-title {
    font-size: 1.2rem;
  }

  .signin-subtitle {
    font-size: var(--text-xs);
  }
}

/* ─── Short Viewport Safety (< 650px height) ─── */
@media (max-height: 650px) {
  .login-page {
    align-items: flex-start;
    padding-top: var(--space-4);
    padding-bottom: var(--space-4);
  }
}
</style>
