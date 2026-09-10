<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { useProjectStore } from '@/stores/project.store';
import { useTicketStore } from '@/stores/ticket.store';
import { useUiStore } from '@/stores/ui.store';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppLogo from '@/components/ui/AppLogo.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const projectStore = useProjectStore();
const ticketStore = useTicketStore();
const uiStore = useUiStore();

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
    name: 'Samir Khan',
    role: 'PROJECT_MANAGER',
    badge: 'Scrum Master & PM',
    email: 'samir.k@projectpilot.dev',
    avatar: 'SK',
    desc: 'Sprint planning, capacity & agile delivery lead'
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
    name: 'Marcus Vance',
    role: 'DEVELOPER',
    badge: 'Frontend Developer',
    email: 'marcus.v@projectpilot.dev',
    avatar: 'MV',
    desc: 'Assigned to MOBILE platform'
  },
  {
    name: 'Rachel Chen',
    role: 'QA',
    badge: 'QA & Test Engineer',
    email: 'rachel.c@projectpilot.dev',
    avatar: 'RC',
    desc: 'Bug reporting, reopen tickets, add comments & reassign'
  },
  {
    name: 'Priya Patel',
    role: 'VIEWER',
    badge: 'Product Auditor (Viewer)',
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
      uiStore.openSidebar();
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
    <!-- Atmospheric photographic workspace background matching reference -->
    <div class="login-bg-photo" aria-hidden="true"></div>

    <!-- Soft dark and ambient gradient overlays -->
    <div class="login-bg-overlay" aria-hidden="true"></div>
    <div class="login-bg-glows" aria-hidden="true">
      <div class="glow-orb glow-cyan"></div>
      <div class="glow-orb glow-indigo"></div>
      <div class="glow-orb glow-purple"></div>
    </div>

    <!-- Viewport Container -->
    <div class="login-viewport">
      <!-- ── Top Global Header ── -->
      <header class="login-header">
        <div class="header-brand">
          <AppLogo size="md" :show-text="true" :show-tagline="false" text-color="#ffffff" />
        </div>

        <nav class="header-nav-decor" aria-hidden="true">
          <span class="nav-item">Plan</span>
          <span class="nav-item">Build</span>
          <span class="nav-item">Ship</span>
          <span class="nav-item nav-active">
            Smarter
            <span class="nav-bar-indicator"></span>
          </span>
        </nav>
      </header>

      <!-- ── Main Hero Composition ── -->
      <div class="login-main-stage">
        <!-- ── Left Product Marketing & Capabilities Section ── -->
        <section class="hero-left">
          <!-- Small Uppercase Category Tag -->
          <div class="hero-eyebrow">
            <span class="eyebrow-text">YOUR AI-POWERED PROJECT WORKSPACE</span>
          </div>

          <!-- Main Hero Headline -->
          <h1 class="hero-headline">
            AI-powered project intelligence for modern
            <span class="headline-gradient">engineering teams.</span>
          </h1>

          <!-- Hero Supporting Description -->
          <p class="hero-subline">
            Manage projects, tickets, sprints and engineering knowledge with an AI copilot that understands your workspace.
          </p>

          <!-- 3 Floating Glass Feature Cards -->
          <div class="feature-glass-stack">
            <!-- Feature 1: AI Project Intelligence -->
            <div class="glass-feature-card">
              <div class="feature-icon-wrapper icon-purple">
                <AppIcon name="cpu" :size="18" />
              </div>
              <div class="feature-text-group">
                <h2 class="feature-title">AI Project Intelligence</h2>
                <p class="feature-desc">Natural language queries for sprint progress, ticket inspection, and project risks.</p>
              </div>
            </div>

            <!-- Feature 2: RAG-powered Project Knowledge -->
            <div class="glass-feature-card">
              <div class="feature-icon-wrapper icon-blue">
                <AppIcon name="knowledge" :size="18" />
              </div>
              <div class="feature-text-group">
                <h2 class="feature-title">RAG-powered Project Knowledge</h2>
                <p class="feature-desc">Semantic vector search across architecture docs, runbooks, and company specs.</p>
              </div>
            </div>

            <!-- Feature 3: Agile Planning & Analytics -->
            <div class="glass-feature-card">
              <div class="feature-icon-wrapper icon-violet">
                <AppIcon name="analytics" :size="18" />
              </div>
              <div class="feature-text-group">
                <h2 class="feature-title">Agile Planning & Analytics</h2>
                <p class="feature-desc">Burndown velocity, dynamic capacity utilization, and RBAC project security.</p>
              </div>
            </div>
          </div>

          <!-- Trust Badge & Quote Section -->
          <div class="hero-footer-row">
            <!-- Security trust badge -->
            <div class="trust-badge">
              <span class="trust-dot-pulse" aria-hidden="true">
                <span class="pulse-ring"></span>
                <span class="pulse-core"></span>
              </span>
              <span class="trust-label">End-to-end encrypted workspace access</span>
            </div>

            <!-- Inspirational Bottom Quote -->
            <div class="hero-quote-block" aria-hidden="true">
              <div class="quote-line-accent"></div>
              <div class="quote-content">
                <span class="quote-phrase">"From ideas to impact, together."</span>
                <span class="quote-source">ProjectPilot</span>
              </div>
            </div>
          </div>
        </section>

        <!-- ── Right Glass Login Card Section ── -->
        <main class="hero-right">
          <!-- Primary Glass Login Card -->
          <div class="glass-login-card">
            <!-- Card Head -->
            <div class="card-head">
              <h2 class="signin-title">Sign in to ProjectPilot</h2>
              <p class="signin-subtitle">Access your workspace and continue where your engineering team left off.</p>
            </div>

            <!-- Error Banner -->
            <div v-if="errorMessage" class="error-banner" role="alert" aria-live="assertive">
              <AppIcon name="alert-triangle" :size="15" class="error-icon" />
              <span class="error-text">{{ errorMessage }}</span>
            </div>

            <!-- Authentication Form -->
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

            <!-- DEMO MODE Section -->
            <div v-if="showDemoAccounts" class="demo-section">
              <div class="demo-header-divider">
                <div class="divider-line"></div>
                <div class="demo-badge-container">
                  <span class="demo-pill-badge">DEMO MODE</span>
                </div>
                <div class="divider-line"></div>
              </div>

              <p class="demo-intro-text">Explore ProjectPilot using a preconfigured role</p>

              <div class="demo-accounts-list">
                <button
                  v-for="acc in DEMO_ACCOUNTS"
                  :key="acc.email"
                  type="button"
                  class="demo-user-card"
                  :class="{ active: email === acc.email }"
                  :disabled="isSubmitting"
                  @click="selectDemoAccount(acc)"
                >
                  <div class="user-avatar" :class="acc.role.toLowerCase()">
                    {{ acc.avatar }}
                  </div>
                  <div class="user-details">
                    <div class="user-top-row">
                      <span class="user-name">{{ acc.name }}</span>
                      <span class="user-role-badge" :class="acc.role.toLowerCase()">{{ acc.badge }}</span>
                    </div>
                    <span class="user-description">{{ acc.desc }}</span>
                  </div>
                </button>
              </div>
            </div>

            <!-- Secure Access Footer -->
            <footer class="card-secure-footer">
              <span class="secure-text">
                <AppIcon name="lock" :size="12" class="secure-icon" />
                Secure workspace access
              </span>
            </footer>
          </div>
        </main>
      </div>

      <!-- ── Decorative Right Edge Slogan & Bottom Accent ── -->
      <aside class="right-vertical-slogan" aria-hidden="true">
        <div class="slogan-content">
          <span class="slogan-word">Better</span>
          <span class="slogan-word">Projects</span>
          <span class="slogan-word">Happier</span>
          <span class="slogan-word">Teams</span>
          <span class="slogan-accent-bar"></span>
        </div>
      </aside>

      <!-- ── Bottom Brand Pillars Footer ── -->
      <footer class="login-bottom-pillars" aria-hidden="true">
        <div class="pillars-row">
          <span>PROJECTS</span>
          <span class="pillar-bullet">•</span>
          <span>PEOPLE</span>
          <span class="pillar-bullet">•</span>
          <span>PROGRESS</span>
          <span class="pillar-bullet">•</span>
          <span class="pillar-ai">WITH AI</span>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* ==========================================================================
   Page Shell & Background Atmosphere
   ========================================================================== */
.login-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
  background-color: #060911;
  color: #f3f4f6;
  font-family: var(--font-sans);
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* Photorealistic developer workstation background */
.login-bg-photo {
  position: fixed;
  inset: 0;
  background-image: url('/login_bg.jpg');
  background-size: cover;
  background-position: center 30%;
  background-repeat: no-repeat;
  pointer-events: none;
  z-index: 0;
  transform: scale(1.02);
  filter: brightness(0.82) contrast(1.06);
}

/* Layered subtle dark vignette and soft gradient overlay */
.login-bg-overlay {
  position: fixed;
  inset: 0;
  background: 
    radial-gradient(ellipse at 80% 45%, rgba(99, 102, 241, 0.12) 0%, transparent 60%),
    radial-gradient(ellipse at 15% 35%, rgba(56, 189, 248, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 85%, rgba(15, 23, 42, 0.7) 0%, transparent 70%),
    linear-gradient(180deg, rgba(6, 9, 17, 0.42) 0%, rgba(6, 9, 17, 0.6) 50%, rgba(6, 9, 17, 0.78) 100%);
  pointer-events: none;
  z-index: 1;
}

/* Soft ambient atmospheric glow spheres */
.login-bg-glows {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.35;
}

.glow-cyan {
  top: 15%;
  right: 12%;
  width: 460px;
  height: 460px;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, rgba(56, 189, 248, 0) 70%);
}

.glow-indigo {
  top: 40%;
  right: 25%;
  width: 520px;
  height: 520px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.32) 0%, rgba(99, 102, 241, 0) 70%);
}

.glow-purple {
  bottom: 5%;
  left: 10%;
  width: 500px;
  height: 400px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.18) 0%, rgba(139, 92, 246, 0) 70%);
}

/* ==========================================================================
   Viewport Container
   ========================================================================== */
.login-viewport {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: var(--space-6) var(--space-8);
  box-sizing: border-box;
}

/* ==========================================================================
   Header Section
   ========================================================================== */
.login-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-bottom: var(--space-4);
  z-index: 10;
}

.header-brand {
  display: flex;
  align-items: center;
}

.header-brand :deep(.logo-title) {
  color: #ffffff !important;
  font-weight: 700;
  letter-spacing: -0.025em;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.75);
}

/* Decorative navigation items at upper-right */
.header-nav-decor {
  display: none;
  align-items: center;
  gap: var(--space-6);
  font-size: var(--text-sm);
  color: #94a3b8;
  font-weight: var(--font-weight-medium);
  letter-spacing: -0.01em;
  padding-right: var(--space-4);
}

.nav-item {
  color: #94a3b8;
  transition: color var(--transition-fast);
}

.nav-item.nav-active {
  color: #f8fafc;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.nav-bar-indicator {
  display: inline-block;
  width: 18px;
  height: 2.5px;
  background: linear-gradient(90deg, #6366f1, #818cf8);
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.6);
}

/* ==========================================================================
   Main Stage (Hero Left + Login Card Right)
   ========================================================================== */
.login-main-stage {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr;
  align-items: center;
  gap: var(--space-8);
  margin-top: auto;
  margin-bottom: auto;
  padding: var(--space-4) 0;
  width: 100%;
}

@media (min-width: 1024px) {
  .header-nav-decor {
    display: flex;
  }

  .login-main-stage {
    grid-template-columns: 1.15fr 0.95fr;
    gap: var(--space-10);
    padding: var(--space-2) var(--space-2);
  }
}

@media (min-width: 1280px) {
  .login-main-stage {
    grid-template-columns: 1.25fr 1fr;
    gap: var(--space-12);
    padding: var(--space-4) var(--space-6);
  }
}

/* ==========================================================================
   Left Hero Section
   ========================================================================== */
.hero-left {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 580px;
  animation: heroFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes heroFadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
}

.eyebrow-text {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  background: linear-gradient(90deg, #a5b4fc 0%, #38bdf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
}

.hero-headline {
  font-size: 2.25rem;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.18;
  letter-spacing: -0.035em;
  margin: 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

@media (min-width: 1280px) {
  .hero-headline {
    font-size: 2.55rem;
  }
}

.headline-gradient {
  background: linear-gradient(135deg, #a5b4fc 0%, #818cf8 35%, #38bdf8 70%, #22d3ee 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}

.hero-subline {
  font-size: var(--text-base);
  color: #94a3b8;
  line-height: 1.6;
  margin: 0;
  max-width: 520px;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
}

/* ─── 3 Floating Glass Feature Cards ─── */
.feature-glass-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.glass-feature-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: 14px 18px;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
              background-color 0.2s ease,
              border-color 0.2s ease,
              box-shadow 0.2s ease;
}

.glass-feature-card:hover {
  transform: translateX(4px);
  background: rgba(20, 30, 52, 0.58);
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 10px 36px rgba(0, 0, 0, 0.35), 0 0 20px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.feature-icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform var(--transition-fast);
}

.glass-feature-card:hover .feature-icon-wrapper {
  transform: scale(1.05);
}

.icon-purple {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(79, 70, 229, 0.15));
  border: 1px solid rgba(99, 102, 241, 0.35);
  color: #c7d2fe;
  box-shadow: 0 0 14px rgba(99, 102, 241, 0.25);
}

.icon-blue {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.22), rgba(14, 165, 233, 0.12));
  border: 1px solid rgba(56, 189, 248, 0.35);
  color: #7dd3fc;
  box-shadow: 0 0 14px rgba(56, 189, 248, 0.22);
}

.icon-violet {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.22), rgba(139, 92, 246, 0.14));
  border: 1px solid rgba(168, 85, 247, 0.35);
  color: #d8b4fe;
  box-shadow: 0 0 14px rgba(168, 85, 247, 0.22);
}

.feature-text-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.feature-title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: #f1f5f9;
  line-height: 1.3;
  margin: 0;
}

.feature-desc {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.45;
  margin: 0;
}

/* ─── Hero Footer (Trust + Quote) ─── */
.hero-footer-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-2);
}

.trust-badge {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

.trust-dot-pulse {
  position: relative;
  width: 8px;
  height: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pulse-ring {
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background-color: rgba(16, 185, 129, 0.35);
  animation: pulseDot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.pulse-core {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #10b981;
  box-shadow: 0 0 8px #10b981;
}

@keyframes pulseDot {
  0%, 100% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.6);
    opacity: 0.15;
  }
}

.hero-quote-block {
  display: flex;
  align-items: stretch;
  gap: var(--space-3);
  margin-top: var(--space-1);
}

.quote-line-accent {
  width: 2.5px;
  background: linear-gradient(180deg, #6366f1 0%, rgba(99, 102, 241, 0.2) 100%);
  border-radius: 2px;
  flex-shrink: 0;
}

.quote-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quote-phrase {
  font-size: 12.5px;
  font-style: italic;
  color: #cbd5e1;
}

.quote-source {
  font-size: 11px;
  font-weight: 600;
  color: #818cf8;
  letter-spacing: -0.01em;
}

/* ==========================================================================
   Right Glass Login Card
   ========================================================================== */
.hero-right {
  display: flex;
  justify-content: center;
  width: 100%;
  animation: cardFadeIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (min-width: 1024px) {
  .hero-right {
    justify-content: flex-end;
  }
}

.glass-login-card {
  position: relative;
  width: 100%;
  max-width: 420px;
  background: rgba(14, 20, 34, 0.72);
  backdrop-filter: blur(28px) saturate(190%);
  -webkit-backdrop-filter: blur(28px) saturate(190%);
  border: 1px solid rgba(147, 197, 253, 0.22);
  border-radius: 24px;
  box-shadow:
    0 0 60px -15px rgba(56, 189, 248, 0.24),
    0 25px 60px -15px rgba(0, 0, 0, 0.85),
    inset 0 1px 1px 0 rgba(255, 255, 255, 0.25);
  padding: 34px 32px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  z-index: 5;
}

/* Card Header */
.card-head {
  margin-bottom: var(--space-5);
  text-align: left;
}

.signin-title {
  font-size: 1.55rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.025em;
  margin: 0 0 6px 0;
  line-height: 1.2;
}

.signin-subtitle {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
  line-height: 1.5;
}

/* ─── Error Alert Banner ─── */
.error-banner {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: 10px 12px;
  background-color: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: var(--radius-md);
  color: #fca5a5;
  font-size: 12.5px;
  margin-bottom: var(--space-4);
  line-height: 1.4;
  backdrop-filter: blur(8px);
}

.error-icon {
  flex-shrink: 0;
  margin-top: 1px;
  color: #ef4444;
}

.error-text {
  font-weight: 500;
}

/* ─── Form Inputs ─── */
.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 10.5px;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  color: #64748b;
  pointer-events: none;
  flex-shrink: 0;
  transition: color var(--transition-fast);
}

.form-input {
  width: 100%;
  height: 44px;
  padding: 0 var(--space-3) 0 40px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  color: #f8fafc;
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  transition: border-color var(--transition-fast),
              box-shadow var(--transition-fast),
              background-color var(--transition-fast);
  box-sizing: border-box;
}

.form-input::placeholder {
  color: #64748b;
  opacity: 0.85;
}

.input-wrapper:focus-within .input-icon {
  color: #818cf8;
}

.form-input:focus {
  outline: none;
  border-color: rgba(99, 102, 241, 0.8);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.22), 0 0 15px rgba(99, 102, 241, 0.2);
  background: rgba(15, 23, 42, 0.8);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ─── Submit Button ─── */
.submit-btn {
  width: 100%;
  height: 44px;
  margin-top: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%);
  color: #ffffff;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: -0.01em;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(79, 70, 229, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25);
  transition: transform var(--transition-fast),
              box-shadow var(--transition-fast),
              filter var(--transition-fast);
  position: relative;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(79, 70, 229, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.35);
  filter: brightness(1.05);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(79, 70, 229, 0.4);
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

/* ==========================================================================
   Demo Mode Section
   ========================================================================== */
.demo-section {
  padding-top: var(--space-4);
  display: flex;
  flex-direction: column;
}

.demo-header-divider {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: 6px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);
}

.demo-pill-badge {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  background: rgba(245, 158, 11, 0.08);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 4px;
  font-size: 10px;
  font-family: var(--font-mono);
  font-weight: 700;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.demo-intro-text {
  font-size: 11.5px;
  color: #94a3b8;
  text-align: center;
  margin: 0 0 10px 0;
  line-height: 1.4;
}

.demo-accounts-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.demo-user-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 7px 11px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 9px;
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-fast);
  width: 100%;
  font-family: var(--font-sans);
  box-sizing: border-box;
}

.demo-user-card:hover:not(:disabled) {
  border-color: rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.07);
  transform: translateY(-1px);
}

.demo-user-card.active {
  border-color: rgba(99, 102, 241, 0.55);
  background: rgba(99, 102, 241, 0.12);
  box-shadow: 0 0 14px rgba(99, 102, 241, 0.22);
}

.demo-user-card:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 10.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: var(--font-sans);
  letter-spacing: -0.02em;
}

.user-avatar.admin {
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.35);
}

.user-avatar.developer {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.35);
}

.user-avatar.project_manager {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.35);
}

.user-avatar.qa {
  background: rgba(244, 63, 94, 0.2);
  color: #fb7185;
  border: 1px solid rgba(244, 63, 94, 0.35);
}

.user-avatar.viewer {
  background: rgba(168, 85, 247, 0.18);
  color: #c084fc;
  border: 1px solid rgba(168, 85, 247, 0.32);
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}

.user-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.user-name {
  font-size: 12.5px;
  font-weight: 600;
  color: #f1f5f9;
  white-space: nowrap;
}

.user-role-badge {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  flex-shrink: 0;
}

.user-role-badge.admin {
  background: rgba(99, 102, 241, 0.18);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.3);
}

.user-role-badge.developer {
  background: rgba(16, 185, 129, 0.16);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.user-role-badge.project_manager {
  background: rgba(245, 158, 11, 0.16);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.user-role-badge.qa {
  background: rgba(244, 63, 94, 0.16);
  color: #fb7185;
  border: 1px solid rgba(244, 63, 94, 0.35);
  box-shadow: 0 0 8px rgba(244, 63, 94, 0.15);
}

.user-role-badge.viewer {
  background: rgba(148, 163, 184, 0.15);
  color: #cbd5e1;
  border: 1px solid rgba(148, 163, 184, 0.28);
}

.user-description {
  font-size: 11px;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

/* ─── Card Secure Footer ─── */
.card-secure-footer {
  margin-top: var(--space-4);
  display: flex;
  justify-content: center;
}

.secure-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
}

.secure-icon {
  color: #64748b;
}

/* ==========================================================================
   Decorative Elements (Right Edge Slogan & Bottom Pillars)
   ========================================================================== */
.right-vertical-slogan {
  display: none;
  position: fixed;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 10;
}

@media (min-width: 1400px) {
  .right-vertical-slogan {
    display: block;
  }
}

.slogan-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.2);
  font-weight: 600;
  letter-spacing: 0.05em;
  text-align: center;
}

.slogan-accent-bar {
  width: 14px;
  height: 2px;
  background: #6366f1;
  margin-top: 8px;
  border-radius: 1px;
  opacity: 0.6;
}

.login-bottom-pillars {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  padding-top: var(--space-4);
  z-index: 10;
}

.pillars-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: rgba(255, 255, 255, 0.25);
}

.pillar-bullet {
  color: rgba(255, 255, 255, 0.15);
}

.pillar-ai {
  color: rgba(99, 102, 241, 0.6);
  font-weight: 700;
}

/* ==========================================================================
   Responsive Adaptations
   ========================================================================== */
@media (max-width: 1023px) {
  .login-viewport {
    padding: var(--space-4) var(--space-4);
  }

  .login-bg-overlay {
    background: 
      radial-gradient(ellipse at 50% 50%, rgba(6, 9, 17, 0.85) 0%, rgba(6, 9, 17, 0.94) 100%);
  }

  .hero-left {
    max-width: 100%;
    text-align: center;
    align-items: center;
  }

  .hero-headline {
    font-size: 1.85rem;
  }

  .hero-subline {
    text-align: center;
  }

  .feature-glass-stack {
    width: 100%;
    max-width: 480px;
    text-align: left;
  }

  .hero-footer-row {
    align-items: center;
  }

  .hero-quote-block {
    display: none;
  }

  .glass-login-card {
    max-width: 440px;
    margin: 0 auto;
  }

  .login-bottom-pillars {
    justify-content: center;
    padding-bottom: var(--space-2);
  }
}

@media (max-width: 640px) {
  .login-viewport {
    padding: var(--space-3) var(--space-3);
  }

  .hero-headline {
    font-size: 1.55rem;
  }

  .glass-login-card {
    padding: 24px 18px;
    border-radius: 18px;
  }

  .feature-glass-card {
    padding: 10px 14px;
  }

  .signin-title {
    font-size: 1.35rem;
  }
}

/* Accessibility: Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .hero-left,
  .hero-right,
  .pulse-ring,
  .glass-feature-card,
  .submit-btn {
    animation: none !important;
    transition: none !important;
  }
}
</style>
