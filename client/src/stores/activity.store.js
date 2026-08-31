import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const CURRENT_DEMO_USER = {
  id: 'm-1',
  name: 'Alex Morgan',
  avatar: 'AM',
  email: 'alex.m@projectpilot.dev',
  role: 'Project Admin'
};

const INITIAL_ACTIVITIES = [
  // PILOT Project Activities
  {
    id: 'act-pilot-1',
    projectKey: 'PILOT',
    actorId: 'm-1',
    actor: { id: 'm-1', name: 'Alex Morgan', avatar: 'AM', role: 'Project Admin' },
    type: 'ticket',
    action: 'status_changed',
    targetType: 'ticket',
    targetId: 't-pilot-98',
    targetKey: 'PILOT-98',
    targetTitle: 'Streaming SSE handler for Gemini Assistant chat responses',
    message: 'moved PILOT-98 from In Progress to In Review',
    metadata: { fromStatus: 'In Progress', toStatus: 'In Review', storyPoints: 8 },
    createdAt: '2026-08-30T09:40:00.000Z'
  },
  {
    id: 'act-pilot-2',
    projectKey: 'PILOT',
    actorId: 'm-2',
    actor: { id: 'm-2', name: 'Jane Doe', avatar: 'JD', role: 'Senior Developer' },
    type: 'ticket',
    action: 'priority_changed',
    targetType: 'ticket',
    targetId: 't-pilot-104',
    targetKey: 'PILOT-104',
    targetTitle: 'PostgreSQL connection pool exhaustion under load',
    message: 'escalated PILOT-104 priority to Urgent (Blocker)',
    metadata: { fromPriority: 'High', toPriority: 'Urgent', storyPoints: 5 },
    createdAt: '2026-08-30T09:15:00.000Z'
  },
  {
    id: 'act-pilot-3',
    projectKey: 'PILOT',
    actorId: 'm-1',
    actor: { id: 'm-1', name: 'Alex Morgan', avatar: 'AM', role: 'Project Admin' },
    type: 'sprint',
    action: 'sprint_started',
    targetType: 'sprint',
    targetId: 'sprint-pilot-24',
    targetKey: 'Sprint 24',
    targetTitle: 'Sprint 24 — AI Intelligence Core',
    message: 'started Sprint 24 — AI Intelligence Core (40 pts capacity)',
    metadata: { sprintId: 'sprint-pilot-24', capacity: 40 },
    createdAt: '2026-08-24T09:00:00.000Z'
  },
  {
    id: 'act-pilot-4',
    projectKey: 'PILOT',
    actorId: 'm-3',
    actor: { id: 'm-3', name: 'Samir Khan', avatar: 'SK', role: 'DevOps Engineer' },
    type: 'ticket',
    action: 'status_changed',
    targetType: 'ticket',
    targetId: 't-pilot-92',
    targetKey: 'PILOT-92',
    targetTitle: 'Implement pgvector document chunking and indexing script',
    message: 'completed PILOT-92 (pgvector chunking script)',
    metadata: { fromStatus: 'In Review', toStatus: 'Done', storyPoints: 5 },
    createdAt: '2026-08-27T11:20:00.000Z'
  },
  {
    id: 'act-pilot-5',
    projectKey: 'PILOT',
    actorId: 'm-1',
    actor: { id: 'm-1', name: 'Alex Morgan', avatar: 'AM', role: 'Project Admin' },
    type: 'team',
    action: 'member_added',
    targetType: 'member',
    targetId: 'm-4',
    targetKey: 'ER',
    targetTitle: 'Elena Rostova',
    message: 'added Elena Rostova as Frontend Engineer to ProjectPilot Core',
    metadata: { memberName: 'Elena Rostova', role: 'Frontend Engineer' },
    createdAt: '2026-08-20T14:00:00.000Z'
  },

  // INFRA Project Activities
  {
    id: 'act-infra-1',
    projectKey: 'INFRA',
    actorId: 'm-3',
    actor: { id: 'm-3', name: 'Samir Khan', avatar: 'SK', role: 'DevOps Lead' },
    type: 'sprint',
    action: 'sprint_started',
    targetType: 'sprint',
    targetId: 'sprint-infra-12',
    targetKey: 'Infra S12',
    targetTitle: 'Infra Sprint 12 — Cloud & TLS',
    message: 'started Infra Sprint 12 — Cloud & TLS (25 pts capacity)',
    metadata: { sprintId: 'sprint-infra-12', capacity: 25 },
    createdAt: '2026-08-25T09:00:00.000Z'
  },
  {
    id: 'act-infra-2',
    projectKey: 'INFRA',
    actorId: 'm-3',
    actor: { id: 'm-3', name: 'Samir Khan', avatar: 'SK', role: 'DevOps Lead' },
    type: 'ticket',
    action: 'created',
    targetType: 'ticket',
    targetId: 't-infra-14',
    targetKey: 'INFRA-14',
    targetTitle: 'Provision staging Kubernetes cluster with GPU node pool',
    message: 'created urgent task INFRA-14 for Kubernetes GPU cluster',
    metadata: { priority: 'Urgent', storyPoints: 5 },
    createdAt: '2026-08-22T09:00:00.000Z'
  },

  // MOBILE Project Activities
  {
    id: 'act-mob-1',
    projectKey: 'MOBILE',
    actorId: 'm-4',
    actor: { id: 'm-4', name: 'Elena Rostova', avatar: 'ER', role: 'Mobile Lead' },
    type: 'sprint',
    action: 'sprint_started',
    targetType: 'sprint',
    targetId: 'sprint-mob-6',
    targetKey: 'Mobile S6',
    targetTitle: 'Mobile Sprint 6 — Offline Mode',
    message: 'started Mobile Sprint 6 — Offline Mode (20 pts capacity)',
    metadata: { sprintId: 'sprint-mob-6', capacity: 20 },
    createdAt: '2026-08-24T09:00:00.000Z'
  }
];

export const useActivityStore = defineStore('activity', () => {
  const activities = ref([...INITIAL_ACTIVITIES]);

  // All activities sorted chronologically descending
  const allActivities = computed(() => {
    return [...activities.value].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  /**
   * Record a new activity event.
   * Unidirectional sink called by domain stores upon successful state mutation.
   */
  function recordActivity({
    projectKey,
    type,
    action,
    targetType,
    targetId,
    targetKey = '',
    targetTitle = '',
    message,
    metadata = {},
    actor = CURRENT_DEMO_USER
  }) {
    if (!projectKey || !message) return null;

    const newActivity = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      projectKey,
      actorId: actor?.id || CURRENT_DEMO_USER.id,
      actor: {
        id: actor?.id || CURRENT_DEMO_USER.id,
        name: actor?.name || CURRENT_DEMO_USER.name,
        avatar: actor?.avatar || CURRENT_DEMO_USER.avatar,
        role: actor?.role || CURRENT_DEMO_USER.role
      },
      type: type || 'ticket',
      action: action || 'updated',
      targetType: targetType || 'ticket',
      targetId: targetId || '',
      targetKey: targetKey || '',
      targetTitle: targetTitle || '',
      message,
      metadata: metadata || {},
      createdAt: new Date().toISOString()
    };

    activities.value.unshift(newActivity);
    return newActivity;
  }

  /**
   * Get activities filtered by project with optional type, actor, or search criteria.
   * Enforces project isolation.
   */
  function getActivitiesByProject(projectKey, filters = {}) {
    if (!projectKey) return [];

    let list = activities.value.filter((a) => a.projectKey === projectKey);

    if (filters.type && filters.type !== 'all') {
      list = list.filter((a) => a.type === filters.type);
    }

    if (filters.actorId && filters.actorId !== 'all') {
      list = list.filter((a) => a.actorId === filters.actorId);
    }

    if (filters.query && filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.message.toLowerCase().includes(q) ||
          a.targetKey.toLowerCase().includes(q) ||
          a.targetTitle.toLowerCase().includes(q) ||
          a.actor.name.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (filters.limit && filters.limit > 0) {
      return list.slice(0, filters.limit);
    }

    return list;
  }

  /**
   * Global cross-workspace activity query.
   */
  function getGlobalActivities(filters = {}) {
    let list = [...activities.value];

    if (filters.projectKey && filters.projectKey !== 'all') {
      list = list.filter((a) => a.projectKey === filters.projectKey);
    }

    if (filters.type && filters.type !== 'all') {
      list = list.filter((a) => a.type === filters.type);
    }

    if (filters.actorId && filters.actorId !== 'all') {
      list = list.filter((a) => a.actorId === filters.actorId);
    }

    if (filters.query && filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.message.toLowerCase().includes(q) ||
          a.targetKey.toLowerCase().includes(q) ||
          a.targetTitle.toLowerCase().includes(q) ||
          a.actor.name.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (filters.limit && filters.limit > 0) {
      return list.slice(0, filters.limit);
    }

    return list;
  }

  return {
    activities,
    allActivities,
    recordActivity,
    getActivitiesByProject,
    getGlobalActivities
  };
});
