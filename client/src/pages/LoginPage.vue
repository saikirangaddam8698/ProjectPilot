<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppLogo from '@/components/ui/AppLogo.vue';
import BaseButton from '@/components/ui/BaseButton.vue';

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
    <div class="login-container">
      <!-- Brand Header -->
      <div class="brand-header">
        <AppLogo size="lg" :show-text="true" :show-tagline="true" />
      </div>

      <!-- Main Login Card -->
      <div class="login-card">
        <div class="card-header">
          <h2 class="card-title">Sign in to your workspace</h2>
          <p class="card-subtitle">Enter your corporate credentials to access your projects and tickets.</p>
        </div>

        <!-- Error Notification -->
        <div v-if="errorMessage" class="error-banner" role="alert">
          <AppIcon name="alert-triangle" :size="16" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Login Form -->
        <form class="login-form" :aria-busy="isSubmitting" @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="email" class="form-label">Email Address</label>
            <div class="input-wrapper">
              <AppIcon name="mail" :size="16" class="input-icon" />
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
            <div class="label-row">
              <label for="password" class="form-label">Password</label>
            </div>
            <div class="input-wrapper">
              <AppIcon name="lock" :size="16" class="input-icon" />
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

          <BaseButton
            type="submit"
            variant="primary"
            class="submit-btn"
            :loading="isSubmitting"
          >
            {{ isSubmitting ? 'Signing into workspace...' : 'Sign In to Workspace' }}
          </BaseButton>
        </form>

        <!-- Demo Accounts Quick Switcher (Development Only) -->
        <div v-if="showDemoAccounts" class="demo-section">
          <div class="demo-divider">
            <span class="divider-text">Quick Demo Accounts</span>
          </div>

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
              <div class="demo-avatar">{{ acc.avatar }}</div>
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

      <!-- Footer Info -->
      <footer class="login-footer">
        <span>ProjectPilot v1.0 • Enterprise Agile Intelligence</span>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background-color: var(--bg-app);
  padding: var(--space-6) var(--space-4);
  overflow-y: auto;
}

.login-container {
  width: 100%;
  max-width: 460px;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  margin: auto 0;
  padding: var(--space-2) 0;
}

/* Brand Header */
.brand-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  text-align: center;
}

.logo-mark {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500));
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
}

.brand-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.brand-title {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.2;
}

.brand-tagline {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin: 0;
}

/* Main Card */
.login-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
}

.card-header {
  margin-bottom: var(--space-5);
}

.card-title {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-1) 0;
}

.card-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

/* Error Banner */
.error-banner {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--color-danger-500);
  border-radius: var(--radius-md);
  color: var(--color-danger-500);
  font-size: var(--text-sm);
  margin-bottom: var(--space-4);
}

/* Form Styles */
.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-label {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.password-hint {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: var(--space-3);
  color: var(--text-muted);
  pointer-events: none;
}

.form-input {
  width: 100%;
  height: 38px;
  padding: 0 var(--space-3) 0 34px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.submit-btn {
  width: 100%;
  height: 40px;
  margin-top: var(--space-2);
  justify-content: center;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
}

.button-loading-wrap {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

/* Demo Accounts Switcher */
.demo-section {
  margin-top: var(--space-6);
}

.demo-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin-bottom: var(--space-4);
}

.demo-divider::before,
.demo-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--border-subtle);
}

.divider-text {
  padding: 0 var(--space-3);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  font-weight: var(--font-weight-medium);
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
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.demo-account-btn:hover {
  border-color: var(--border-strong);
  background-color: var(--bg-surface-hover);
}

.demo-account-btn.active {
  border-color: var(--color-primary-500);
  background-color: rgba(99, 102, 241, 0.05);
}

.demo-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: var(--border-default);
  color: var(--text-primary);
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.demo-info {
  display: flex;
  flex-direction: column;
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
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.demo-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: var(--radius-xs);
  font-weight: var(--font-weight-medium);
}

.demo-badge.admin {
  background-color: rgba(99, 102, 241, 0.15);
  color: var(--color-primary-400);
}

.demo-badge.developer {
  background-color: rgba(16, 185, 129, 0.15);
  color: var(--color-success-500);
}

.demo-badge.project_manager {
  background-color: rgba(245, 158, 11, 0.15);
  color: var(--color-warning-500);
}

.demo-badge.viewer {
  background-color: rgba(107, 114, 128, 0.15);
  color: var(--text-muted);
}

.demo-desc {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Footer */
.login-footer {
  text-align: center;
  font-size: 11px;
  color: var(--text-muted);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
