import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useTicketStore } from './ticket.store.js';
import { useActivityStore } from './activity.store.js';
import { useAuthStore } from './auth.store.js';
import { useUiStore } from './ui.store.js';
import { sprintsApi } from '../services/api/index.js';

const INITIAL_SPRINTS = [
  // PILOT Sprints
  {
    id: 'sprint-pilot-23',
    projectKey: 'PILOT',
    name: 'Sprint 23 — Foundation & Tokens',
    goal: 'Establish token architecture, light/dark theme variables, and core UI primitives.',
    status: 'completed',
    startDate: '2026-08-10',
    endDate: '2026-08-24',
    capacity: 35,
    createdAt: '2026-08-08T09:00:00.000Z',
    completedAt: '2026-08-24T18:00:00.000Z'
  },
  {
    id: 'sprint-pilot-24',
    projectKey: 'PILOT',
    name: 'Sprint 24 — AI Intelligence Core',
    goal: 'Ship Gemini streaming assistant tools and stabilize project infrastructure.',
    status: 'active',
    startDate: '2026-08-24',
    endDate: '2026-09-07',
    capacity: 40,
    createdAt: '2026-08-20T09:00:00.000Z',
    completedAt: null
  },
  {
    id: 'sprint-pilot-25',
    projectKey: 'PILOT',
    name: 'Sprint 25 — Security & Workspaces',
    goal: 'Implement multi-tenant role permissions and database seed automation.',
    status: 'planned',
    startDate: '2026-09-08',
    endDate: '2026-09-22',
    capacity: 30,
    createdAt: '2026-08-28T10:00:00.000Z',
    completedAt: null
  },

  // INFRA Sprints
  {
    id: 'sprint-infra-11',
    projectKey: 'INFRA',
    name: 'Infra Sprint 11 — Observability',
    goal: 'Set up Prometheus and Grafana alerts for memory usage and high latency.',
    status: 'completed',
    startDate: '2026-08-11',
    endDate: '2026-08-25',
    capacity: 20,
    createdAt: '2026-08-10T08:00:00.000Z',
    completedAt: '2026-08-25T17:00:00.000Z'
  },
  {
    id: 'sprint-infra-12',
    projectKey: 'INFRA',
    name: 'Infra Sprint 12 — Cloud & TLS',
    goal: 'Provision staging Kubernetes GPU nodes and automate TLS rotation on ingress.',
    status: 'active',
    startDate: '2026-08-25',
    endDate: '2026-09-08',
    capacity: 25,
    createdAt: '2026-08-22T09:00:00.000Z',
    completedAt: null
  },

  // MOBILE Sprints
  {
    id: 'sprint-mob-5',
    projectKey: 'MOBILE',
    name: 'Mobile Sprint 5 — UI Polishing',
    goal: 'Fix splash screen layout jitter and biometric authentication setup.',
    status: 'completed',
    startDate: '2026-08-10',
    endDate: '2026-08-24',
    capacity: 15,
    createdAt: '2026-08-08T10:00:00.000Z',
    completedAt: '2026-08-24T16:00:00.000Z'
  },
  {
    id: 'sprint-mob-6',
    projectKey: 'MOBILE',
    name: 'Mobile Sprint 6 — Offline Mode',
    goal: 'Deliver SQLite local cache synchronization and push notification handlers.',
    status: 'active',
    startDate: '2026-08-24',
    endDate: '2026-09-07',
    capacity: 20,
    createdAt: '2026-08-21T11:00:00.000Z',
    completedAt: null
  }
];

export const useSprintStore = defineStore('sprint', () => {
  const sprints = ref([...INITIAL_SPRINTS]);
  const isCreateModalOpen = ref(false);
  const createModalProjectKey = ref('PILOT');
  const editingSprint = ref(null);
  const completingSprintId = ref(null);
  const isLoading = ref(false);
  const error = ref(null);
  const isInitialized = ref(false);
  const pendingSprintIds = ref(new Set());

  function isSprintPending(id) {
    if (!id) return false;
    return pendingSprintIds.value.has(String(id));
  }

  function setSprintPending(id, isPending) {
    if (!id) return;
    const clean = String(id);
    const updated = new Set(pendingSprintIds.value);
    if (isPending) updated.add(clean);
    else updated.delete(clean);
    pendingSprintIds.value = updated;
  }

  const rawSprints = computed(() => sprints.value);

  // Accessible sprints scoped to the logged-in user (or all sprints if ADMIN)
  const allSprints = computed(() => {
    const authStore = useAuthStore();
    const currentUser = authStore.user;
    if (!currentUser || authStore.isAdmin) {
      return sprints.value;
    }
    const userKeys = (currentUser.projectKeys || []).map((k) => k.toUpperCase());
    return sprints.value.filter((s) => s.projectKey && userKeys.includes(s.projectKey.toUpperCase()));
  });

  // Async API Actions
  async function fetchSprints(params = {}) {
    isLoading.value = true;
    error.value = null;
    try {
      const fetched = await sprintsApi.getAll(params);
      if (Array.isArray(fetched) && fetched.length > 0) {
        sprints.value = fetched;
      }
      isInitialized.value = true;
    } catch (err) {
      console.warn('Could not load sprints from API, using cached data:', err.message);
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  }

  function getSprintsByProject(projectKey) {
    if (!projectKey || projectKey === 'all') return allSprints.value;
    return allSprints.value.filter((s) => s.projectKey?.toUpperCase() === projectKey.toUpperCase());
  }

  function getSprintById(id) {
    if (!id) return null;
    return allSprints.value.find((s) => s.id === id) || null;
  }

  function getActiveSprint(projectKey) {
    const list = getSprintsByProject(projectKey);
    return list.find((s) => s.status === 'active') || null;
  }

  function getPlannedSprints(projectKey) {
    const list = getSprintsByProject(projectKey);
    return list.filter((s) => s.status === 'planned');
  }

  function getCompletedSprints(projectKey) {
    const list = getSprintsByProject(projectKey);
    return list.filter((s) => s.status === 'completed');
  }

  /**
   * Derives real-time sprint statistics directly from the Ticket Store
   */
  function getSprintStats(sprintId) {
    const sprint = getSprintById(sprintId);
    if (!sprint) {
      return {
        totalTickets: 0,
        openTickets: 0,
        doneTickets: 0,
        inProgressTickets: 0,
        inReviewTickets: 0,
        todoTickets: 0,
        backlogTickets: 0,
        committedPoints: 0,
        completedPoints: 0,
        remainingPoints: 0,
        progress: 0,
        capacity: 0,
        capacityState: 'under',
        daysRemaining: 0,
        isOverdue: false
      };
    }

    const ticketStore = useTicketStore();
    const sprintTickets = ticketStore.allTickets.filter((t) => t.sprintId === sprintId);

    const totalTickets = sprintTickets.length;
    const doneTickets = sprintTickets.filter((t) => t.status === 'Done').length;
    const inProgressTickets = sprintTickets.filter((t) => t.status === 'In Progress').length;
    const inReviewTickets = sprintTickets.filter((t) => t.status === 'In Review').length;
    const todoTickets = sprintTickets.filter((t) => t.status === 'Todo').length;
    const backlogTickets = sprintTickets.filter((t) => t.status === 'Backlog').length;
    const openTickets = totalTickets - doneTickets;

    const committedPoints = sprintTickets.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
    const completedPoints = sprintTickets
      .filter((t) => t.status === 'Done')
      .reduce((acc, t) => acc + (t.storyPoints || 0), 0);
    const remainingPoints = committedPoints - completedPoints;

    const progress = committedPoints > 0 ? Math.round((completedPoints / committedPoints) * 100) : 0;
    const capacity = sprint.capacity || 0;

    let capacityState = 'under';
    if (capacity > 0) {
      if (committedPoints > capacity) {
        capacityState = 'over';
      } else if (committedPoints >= capacity * 0.85) {
        capacityState = 'near';
      }
    }

    const now = new Date();
    const end = new Date(sprint.endDate);
    const diffTime = end.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const isOverdue = diffTime < 0 && sprint.status === 'active';

    return {
      totalTickets,
      openTickets,
      doneTickets,
      doneCount: doneTickets,
      inProgressTickets,
      inProgressCount: inProgressTickets,
      inReviewTickets,
      inReviewCount: inReviewTickets,
      reviewCount: inReviewTickets,
      todoTickets,
      todoCount: todoTickets + backlogTickets,
      backlogTickets,
      committedPoints,
      completedPoints,
      remainingPoints,
      progress,
      capacity,
      capacityState,
      daysRemaining,
      isOverdue
    };
  }

  // Actions
  function openCreateModal(prefillProjectKey = 'PILOT', sprintToEdit = null) {
    createModalProjectKey.value = prefillProjectKey || 'PILOT';
    editingSprint.value = sprintToEdit ? { ...sprintToEdit } : null;
    isCreateModalOpen.value = true;
  }

  function closeCreateModal() {
    isCreateModalOpen.value = false;
    editingSprint.value = null;
  }

  async function createSprint({
    projectKey,
    name,
    goal,
    startDate,
    endDate,
    capacity = 30
  }) {
    const formattedKey = projectKey.toUpperCase();
    const existingForProject = getSprintsByProject(formattedKey);
    const id = `sprint-${formattedKey.toLowerCase()}-${existingForProject.length + 10}`;

    const fallbackSprint = {
      id,
      projectKey: formattedKey,
      name: name.trim(),
      goal: goal ? goal.trim() : '',
      status: 'planned',
      startDate: startDate || new Date().toISOString().slice(0, 10),
      endDate: endDate || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      capacity: Number(capacity) || 30,
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    let newSprint = fallbackSprint;
    const uiStore = useUiStore();
    uiStore.startOperation('sprint-create', 'Creating Sprint...');

    try {
      const created = await sprintsApi.create({
        projectKey: formattedKey,
        name: name.trim(),
        goal,
        startDate,
        endDate,
        capacity: Number(capacity) || 30
      });
      if (created) newSprint = created;
    } catch (err) {
      console.warn('API create sprint failed, using local state:', err.message);
    } finally {
      uiStore.endOperation('sprint-create');
    }

    sprints.value.push(newSprint);

    try {
      const activityStore = useActivityStore();
      activityStore.recordActivity({
        projectKey: formattedKey,
        type: 'sprint',
        action: 'created',
        targetType: 'sprint',
        targetId: newSprint.id,
        targetKey: newSprint.name.split('—')[0].trim(),
        targetTitle: newSprint.name,
        message: `created planned sprint "${newSprint.name}" (${newSprint.capacity} pts target capacity)`,
        metadata: { capacity: newSprint.capacity }
      });
    } catch (e) {
      console.warn('Could not record activity:', e);
    }

    return newSprint;
  }

  async function updateSprint(sprintId, updates) {
    const sprint = getSprintById(sprintId);
    if (!sprint) return null;

    const uiStore = useUiStore();
    const opId = `sprint-update-${sprintId}`;
    const name = sprint.name ? sprint.name.split('—')[0].trim() : 'Sprint';
    uiStore.startOperation(opId, `Updating ${name}...`);
    setSprintPending(sprintId, true);

    Object.assign(sprint, updates);

    try {
      await sprintsApi.update(sprintId, updates);
    } catch (err) {
      console.warn('API update sprint failed, applied locally:', err.message);
    } finally {
      setSprintPending(sprintId, false);
      uiStore.endOperation(opId);
    }

    return sprint;
  }

  async function startSprint(sprintId) {
    const sprint = getSprintById(sprintId);
    if (!sprint) return { success: false, error: 'Sprint not found' };

    const currentActive = getActiveSprint(sprint.projectKey);
    if (currentActive && currentActive.id !== sprintId) {
      return {
        success: false,
        error: `Project ${sprint.projectKey} already has an active sprint ("${currentActive.name}"). Complete it first before starting a new sprint.`
      };
    }

    const uiStore = useUiStore();
    const opId = `sprint-start-${sprintId}`;
    const name = sprint.name ? sprint.name.split('—')[0].trim() : 'Sprint';
    uiStore.startOperation(opId, `Starting ${name}...`);
    setSprintPending(sprintId, true);

    sprint.status = 'active';

    try {
      await sprintsApi.start(sprintId);
    } catch (err) {
      console.warn('API start sprint failed, applied locally:', err.message);
    } finally {
      setSprintPending(sprintId, false);
      uiStore.endOperation(opId);
    }

    try {
      const activityStore = useActivityStore();
      activityStore.recordActivity({
        projectKey: sprint.projectKey,
        type: 'sprint',
        action: 'sprint_started',
        targetType: 'sprint',
        targetId: sprint.id,
        targetKey: sprint.name.split('—')[0].trim(),
        targetTitle: sprint.name,
        message: `started active sprint "${sprint.name}"`,
        metadata: { sprintId: sprint.id }
      });
    } catch (e) {
      console.warn('Could not record activity:', e);
    }

    return { success: true, sprint };
  }

  async function completeSprint(sprintId, { moveIncompleteTo = 'backlog' } = {}) {
    const sprint = getSprintById(sprintId);
    if (!sprint) return { success: false, error: 'Sprint not found' };

    const uiStore = useUiStore();
    const opId = `sprint-complete-${sprintId}`;
    const name = sprint.name ? sprint.name.split('—')[0].trim() : 'Sprint';
    uiStore.startOperation(opId, `Completing ${name}...`);
    setSprintPending(sprintId, true);

    const ticketStore = useTicketStore();
    const sprintTickets = ticketStore.allTickets.filter((t) => t.sprintId === sprintId);
    const incompleteTickets = sprintTickets.filter((t) => t.status !== 'Done');

    // Move incomplete tickets to selected target
    if (incompleteTickets.length > 0) {
      incompleteTickets.forEach((ticket) => {
        if (moveIncompleteTo === 'backlog' || !moveIncompleteTo) {
          ticketStore.removeTicketFromSprint(ticket.key);
        } else {
          ticketStore.assignTicketToSprint(ticket.key, moveIncompleteTo);
        }
      });
    }

    sprint.status = 'completed';
    sprint.completedAt = new Date().toISOString();

    try {
      await sprintsApi.complete(sprintId, { moveIncompleteTo });
    } catch (err) {
      console.warn('API complete sprint failed, applied locally:', err.message);
    } finally {
      setSprintPending(sprintId, false);
      uiStore.endOperation(opId);
    }

    try {
      const activityStore = useActivityStore();
      activityStore.recordActivity({
        projectKey: sprint.projectKey,
        type: 'sprint',
        action: 'sprint_completed',
        targetType: 'sprint',
        targetId: sprint.id,
        targetKey: sprint.name.split('—')[0].trim(),
        targetTitle: sprint.name,
        message: `completed sprint "${sprint.name}" (${sprintTickets.length - incompleteTickets.length} delivered)`,
        metadata: { sprintId: sprint.id }
      });
    } catch (e) {
      console.warn('Could not record activity:', e);
    }

    return { success: true, sprint, movedTicketsCount: incompleteTickets.length };
  }

  async function deleteSprint(sprintId) {
    const idx = sprints.value.findIndex((s) => s.id === sprintId);
    if (idx !== -1) {
      const uiStore = useUiStore();
      const opId = `sprint-delete-${sprintId}`;
      uiStore.startOperation(opId, 'Deleting Sprint...');
      setSprintPending(sprintId, true);

      const ticketStore = useTicketStore();
      const sprintTickets = ticketStore.allTickets.filter((t) => t.sprintId === sprintId);
      sprintTickets.forEach((t) => {
        ticketStore.removeTicketFromSprint(t.key);
      });

      sprints.value.splice(idx, 1);

      try {
        await sprintsApi.delete(sprintId);
      } catch (err) {
        console.warn('API delete sprint failed, applied locally:', err.message);
      } finally {
        setSprintPending(sprintId, false);
        uiStore.endOperation(opId);
      }

      return true;
    }
    return false;
  }

  return {
    sprints,
    isCreateModalOpen,
    createModalProjectKey,
    editingSprint,
    completingSprintId,
    isLoading,
    error,
    isInitialized,
    pendingSprintIds,
    isSprintPending,
    allSprints,
    fetchSprints,
    getSprintsByProject,
    getSprintById,
    getActiveSprint,
    getPlannedSprints,
    getCompletedSprints,
    getSprintStats,
    openCreateModal,
    closeCreateModal,
    createSprint,
    updateSprint,
    startSprint,
    completeSprint,
    deleteSprint
  };
});
