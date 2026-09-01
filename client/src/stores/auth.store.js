import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '../services/api/index.js';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const isLoading = ref(false);
  const error = ref(null);
  const isInitialized = ref(false);

  // Getters
  const isAuthenticated = computed(() => !!user.value);
  const currentUser = computed(() => user.value);
  const currentMember = computed(() => user.value?.member || null);
  const globalRole = computed(() => user.value?.role || 'GUEST');

  const isAdmin = computed(() => user.value?.role === 'ADMIN');
  const isProjectManager = computed(() => user.value?.role === 'ADMIN' || user.value?.role === 'PROJECT_MANAGER');
  const isDeveloper = computed(() => user.value?.role === 'ADMIN' || user.value?.role === 'PROJECT_MANAGER' || user.value?.role === 'DEVELOPER');
  const isViewer = computed(() => user.value?.role === 'VIEWER');

  const canCreateProject = computed(() => isAdmin.value || user.value?.role === 'PROJECT_MANAGER');
  const canDeleteProject = computed(() => isAdmin.value);
  const canManageWorkspaceMembers = computed(() => isAdmin.value);

  /**
   * Check if current user has view access to a given project
   */
  function hasProjectAccess(projectKey) {
    if (!projectKey) return false;
    if (isAdmin.value) return true;
    return (user.value?.projectKeys || []).includes(projectKey.toUpperCase());
  }

  /**
   * Check if current user has administrative rights in a given project
   */
  function canManageProject(projectKey) {
    if (!projectKey) return false;
    if (isAdmin.value) return true;
    const pm = (user.value?.projectMemberships || []).find(
      (p) => p.projectKey?.toUpperCase() === projectKey.toUpperCase()
    );
    return pm?.projectRole === 'Project Admin' || pm?.projectRole === 'Lead';
  }

  // Actions
  async function login({ email, password }) {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await authApi.login({ email, password });
      user.value = result?.user || null;
      isInitialized.value = true;
      return { success: true, user: user.value };
    } catch (err) {
      error.value = err.message || 'Failed to authenticate. Please check your credentials.';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    isLoading.value = true;
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout API call error:', err.message);
    } finally {
      user.value = null;
      error.value = null;
      isLoading.value = false;
    }
  }

  async function checkAuth() {
    isLoading.value = true;
    error.value = null;

    try {
      const profile = await authApi.getMe();
      user.value = profile || null;
      isInitialized.value = true;
      return !!user.value;
    } catch {
      user.value = null;
      isInitialized.value = true;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    user,
    isLoading,
    error,
    isInitialized,
    isAuthenticated,
    currentUser,
    currentMember,
    globalRole,
    isAdmin,
    isProjectManager,
    isDeveloper,
    isViewer,
    canCreateProject,
    canDeleteProject,
    canManageWorkspaceMembers,
    hasProjectAccess,
    canManageProject,
    login,
    logout,
    checkAuth
  };
});
