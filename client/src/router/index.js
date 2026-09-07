import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import AppLayout from '@/layouts/AppLayout.vue';

// Top-level lazy-loaded pages
const LoginPage = () => import('@/pages/LoginPage.vue');
const DashboardPage = () => import('@/pages/DashboardPage.vue');
const ProjectsPage = () => import('@/pages/ProjectsPage.vue');
const MyWorkPage = () => import('@/pages/MyWorkPage.vue');
const TicketsPage = () => import('@/pages/TicketsPage.vue');
const SprintsPage = () => import('@/pages/SprintsPage.vue');
const TeamPage = () => import('@/pages/TeamPage.vue');
const AnalyticsPage = () => import('@/pages/AnalyticsPage.vue');
const AIAssistantPage = () => import('@/pages/AIAssistantPage.vue');
const KnowledgePage = () => import('@/pages/KnowledgePage.vue');
const SettingsPage = () => import('@/pages/SettingsPage.vue');

// Project Workspace Nested Views
const ProjectWorkspace = () => import('@/pages/projects/ProjectWorkspace.vue');
const ProjectOverviewPage = () => import('@/pages/projects/ProjectOverviewPage.vue');
const ProjectBoardPage = () => import('@/pages/projects/ProjectBoardPage.vue');
const ProjectTicketsPage = () => import('@/pages/projects/ProjectTicketsPage.vue');
const ProjectBacklogPage = () => import('@/pages/projects/ProjectBacklogPage.vue');
const ProjectSprintsPage = () => import('@/pages/projects/ProjectSprintsPage.vue');
const ProjectAnalyticsPage = () => import('@/pages/projects/ProjectAnalyticsPage.vue');
const ProjectActivityPage = () => import('@/pages/projects/ProjectActivityPage.vue');
const ProjectSectionPlaceholder = () => import('@/pages/projects/ProjectSectionPlaceholder.vue');

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { title: 'Sign In', isPublic: true }
  },
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: DashboardPage,
        meta: { title: 'Dashboard' }
      },
      {
        path: 'projects',
        name: 'Projects',
        component: ProjectsPage,
        meta: { title: 'Projects' }
      },
      {
        path: 'projects/:projectKey',
        component: ProjectWorkspace,
        children: [
          {
            path: '',
            redirect: (to) => `/projects/${to.params.projectKey}/overview`
          },
          {
            path: 'overview',
            name: 'ProjectOverview',
            component: ProjectOverviewPage,
            meta: { title: 'Project Overview' }
          },
          {
            path: 'board',
            name: 'ProjectBoard',
            component: ProjectBoardPage,
            meta: { title: 'Kanban Board', section: 'Board' }
          },
          {
            path: 'backlog',
            name: 'ProjectBacklog',
            component: ProjectBacklogPage,
            meta: { title: 'Project Backlog', section: 'Backlog' }
          },
          {
            path: 'tickets',
            name: 'ProjectTickets',
            component: ProjectTicketsPage,
            meta: { title: 'Project Tickets', section: 'Tickets' }
          },
          {
            path: 'sprints',
            name: 'ProjectSprints',
            component: ProjectSprintsPage,
            meta: { title: 'Project Sprints', section: 'Sprints' }
          },
          {
            path: 'analytics',
            name: 'ProjectAnalytics',
            component: ProjectAnalyticsPage,
            meta: { title: 'Project Analytics', section: 'Analytics' }
          },
          {
            path: 'knowledge',
            name: 'ProjectKnowledge',
            component: KnowledgePage,
            meta: { title: 'Project Knowledge Base', section: 'Knowledge' }
          },
          {
            path: 'activity',
            name: 'ProjectActivity',
            component: ProjectActivityPage,
            meta: { title: 'Project Activity', section: 'Activity' }
          },
          {
            path: 'settings',
            name: 'ProjectSettings',
            component: ProjectSectionPlaceholder,
            meta: { title: 'Project Settings', section: 'Settings', roles: ['ADMIN', 'PROJECT_MANAGER'] }
          }
        ]
      },
      {
        path: 'my-work',
        name: 'MyWork',
        component: MyWorkPage,
        meta: { title: 'My Work' }
      },
      {
        path: 'tickets',
        name: 'Tickets',
        component: TicketsPage,
        meta: { title: 'Tickets & Board' }
      },
      {
        path: 'sprints',
        name: 'Sprints',
        component: SprintsPage,
        meta: { title: 'Sprints & Delivery' }
      },
      {
        path: 'team',
        name: 'Team',
        component: TeamPage,
        meta: { title: 'Team & Permissions' }
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: AnalyticsPage,
        meta: { title: 'Analytics & Insights' }
      },
      {
        path: 'ai',
        name: 'AIAssistant',
        component: AIAssistantPage,
        meta: { title: 'AI Project Assistant' }
      },
      {
        path: 'knowledge',
        name: 'Knowledge',
        component: KnowledgePage,
        meta: { title: 'Knowledge Base' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: SettingsPage,
        meta: { title: 'Settings', roles: ['ADMIN'] }
      }
    ]
  },
  {
    // Catch-all route redirecting back to dashboard
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0 };
  }
});

import { useUiStore } from '@/stores/ui.store';

// Authentication & Navigation Guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  const uiStore = useUiStore();

  // Set navigation state
  uiStore.setNavigating(true);

  // Check auth if not initialized yet
  if (!authStore.isInitialized) {
    await authStore.checkAuth();
  }

  const isPublicRoute = to.meta?.isPublic === true;

  if (to.name === 'Login' && authStore.isAuthenticated) {
    // Already logged in, redirect away from login
    return next({ path: '/dashboard' });
  }

  if (!isPublicRoute && !authStore.isAuthenticated) {
    // Unauthenticated user trying to access protected route
    return next({
      path: '/login',
      query: { redirect: to.fullPath !== '/dashboard' ? to.fullPath : undefined }
    });
  }

  // RBAC Route Permission Check
  if (to.meta?.roles && Array.isArray(to.meta.roles)) {
    const userRole = authStore.globalRole || 'VIEWER';
    if (!to.meta.roles.includes(userRole)) {
      uiStore.setNavigating(false);
      authStore.showAccessDenied({
        title: 'Page Access Restricted',
        message: `You are not authorized to access ${to.meta.title || 'this page'}. Your current role (${userRole}) does not have sufficient permissions.`,
        requiredRole: to.meta.roles.join(' or '),
        action: `Navigate to ${to.path}`
      });

      if (from.name && from.path !== to.path) {
        return next(false);
      }
      return next({ path: '/dashboard' });
    }
  }

  next();
});

// Update document title dynamically based on route metadata and active project
router.afterEach((to) => {
  const uiStore = useUiStore();
  uiStore.setNavigating(false);

  const projectKey = to.params?.projectKey;
  const pageTitle = to.meta?.title;

  if (projectKey && pageTitle) {
    document.title = `${projectKey} • ${pageTitle} — ProjectPilot`;
  } else if (pageTitle) {
    document.title = `${pageTitle} — ProjectPilot`;
  } else {
    document.title = 'ProjectPilot — AI-Powered Project Intelligence';
  }
});

router.onError(() => {
  const uiStore = useUiStore();
  uiStore.setNavigating(false);
});

export default router;
