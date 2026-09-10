import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Centralized Role-Based Access Control (RBAC) composable.
 * 
 * Defines standard permission checks and user-facing denial reasons with
 * Liquid Glass tooltip feedback across the entire application.
 */
export function usePermissions() {
  const authStore = useAuthStore();

  const user = computed(() => authStore.user);
  const globalRole = computed(() => authStore.globalRole);
  const isAdmin = computed(() => authStore.isAdmin);
  const isProjectManager = computed(() => authStore.isProjectManager);
  const isDeveloper = computed(() => authStore.isDeveloper);
  const isViewer = computed(() => authStore.isViewer);

  /**
   * Evaluates permission for a specific action and returns an object:
   * { allowed: Boolean, reason: String }
   */
  function checkPermission(action, context = {}) {
    const projectKey = context.projectKey || '';

    switch (action) {
      // 1. Projects
      case 'create_project': {
        const allowed = isAdmin.value || user.value?.role === 'PROJECT_MANAGER';
        return {
          allowed,
          reason: allowed ? '' : 'Access denied — Workspace Admin or Project Manager required'
        };
      }

      case 'delete_project': {
        const allowed = isAdmin.value;
        return {
          allowed,
          reason: allowed ? '' : 'Access denied — Workspace Admin only'
        };
      }

      case 'manage_project': {
        const allowed = authStore.canManageProject(projectKey);
        return {
          allowed,
          reason: allowed ? '' : 'Access denied — Workspace Admin or Project Lead required'
        };
      }

      // 2. Tickets
      case 'create_ticket': {
        const allowed = !isViewer.value;
        return {
          allowed,
          reason: allowed ? '' : 'Access denied — Contributor or Developer role required (Viewers are read-only)'
        };
      }

      case 'edit_ticket': {
        const allowed = !isViewer.value;
        return {
          allowed,
          reason: allowed ? '' : 'Access denied — Viewers cannot edit tickets'
        };
      }

      case 'delete_ticket': {
        const allowed = isAdmin.value || isProjectManager.value;
        return {
          allowed,
          reason: allowed ? '' : 'Access denied — Admin or Project Manager required'
        };
      }

      // 3. Sprints
      case 'start_sprint': {
        const allowed = authStore.canManageProject(projectKey);
        return {
          allowed,
          reason: allowed ? '' : 'Access denied — Project Admin or Manager required to start sprints'
        };
      }

      case 'complete_sprint': {
        const allowed = authStore.canManageProject(projectKey);
        return {
          allowed,
          reason: allowed ? '' : 'Access denied — Project Admin or Manager required to complete sprints'
        };
      }

      case 'create_sprint':
      case 'plan_sprint': {
        const allowed = authStore.canManageProject(projectKey);
        return {
          allowed,
          reason: allowed ? '' : 'Access denied — Project Admin or Manager required to plan sprints'
        };
      }

      case 'edit_sprint': {
        const allowed = authStore.canManageProject(projectKey);
        return {
          allowed,
          reason: allowed ? '' : 'Access denied — Project Admin or Manager required to edit sprint settings'
        };
      }

      case 'delete_sprint': {
        const allowed = authStore.canManageProject(projectKey);
        return {
          allowed,
          reason: allowed ? '' : 'Access denied — Project Admin or Manager required to delete sprints'
        };
      }

      // 4. Team & Members
      case 'invite_member':
      case 'manage_workspace_members': {
        const allowed = isAdmin.value;
        return {
          allowed,
          reason: allowed ? '' : 'Access denied — Workspace Admin only'
        };
      }

      case 'add_project_member':
      case 'remove_project_member': {
        const allowed = authStore.canManageProject(projectKey);
        return {
          allowed,
          reason: allowed ? '' : 'Access denied — Project Admin or Lead required'
        };
      }

      // 5. Knowledge & Documents
      case 'upload_document':
      case 'create_document':
      case 'edit_document': {
        const allowed = !isViewer.value;
        return {
          allowed,
          reason: allowed ? '' : 'Access denied — Viewers cannot upload or edit documents'
        };
      }

      case 'delete_document': {
        const allowed = isAdmin.value || isProjectManager.value;
        return {
          allowed,
          reason: allowed ? '' : 'Access denied — Admin or Project Manager required'
        };
      }

      // 6. Settings & Administration
      case 'admin_settings': {
        const allowed = isAdmin.value;
        return {
          allowed,
          reason: allowed ? '' : 'Access denied — Workspace Admin only'
        };
      }

      default: {
        const allowed = !isViewer.value;
        return {
          allowed,
          reason: allowed ? '' : 'Access denied — Insufficient permissions'
        };
      }
    }
  }

  return {
    user,
    globalRole,
    isAdmin,
    isProjectManager,
    isDeveloper,
    isViewer,
    checkPermission
  };
}
