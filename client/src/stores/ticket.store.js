import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useActivityStore } from './activity.store';

const INITIAL_TICKETS = [
  // PILOT Project Tickets
  {
    id: 't-pilot-89',
    key: 'PILOT-89',
    projectKey: 'PILOT',
    title: 'Fix race condition in drag-and-drop Kanban column reordering',
    description: 'When dragging multiple cards rapidly between columns, state mutations can collide before store commit.',
    type: 'Bug',
    status: 'Todo',
    priority: 'High',
    assignee: { id: 'm-1', name: 'Alex Morgan', avatar: 'AM', role: 'Project Admin' },
    reporter: { id: 'm-2', name: 'Jane Doe', avatar: 'JD' },
    sprintId: 'sprint-pilot-24',
    sprint: 'Sprint 24 — AI Intelligence Core',
    storyPoints: 3,
    rank: 100,
    labels: ['frontend', 'kanban', 'ui'],
    dueDate: '2026-09-02',
    createdAt: '2026-08-20T10:00:00.000Z',
    updatedAt: '2026-08-28T16:00:00.000Z'
  },
  {
    id: 't-pilot-92',
    key: 'PILOT-92',
    projectKey: 'PILOT',
    title: 'Implement pgvector document chunking and indexing script',
    description: 'Create markdown parsing pipeline that splits technical docs into 500-token chunks with 50-token overlap for vector embeddings.',
    type: 'Task',
    status: 'Done',
    priority: 'Medium',
    assignee: { id: 'm-3', name: 'Samir Khan', avatar: 'SK', role: 'DevOps Engineer' },
    reporter: { id: 'm-1', name: 'Alex Morgan', avatar: 'AM' },
    sprintId: 'sprint-pilot-24',
    sprint: 'Sprint 24 — AI Intelligence Core',
    storyPoints: 5,
    rank: 200,
    labels: ['ai', 'rag', 'database'],
    dueDate: '2026-08-26',
    createdAt: '2026-08-18T08:30:00.000Z',
    updatedAt: '2026-08-27T11:20:00.000Z'
  },
  {
    id: 't-pilot-98',
    key: 'PILOT-98',
    projectKey: 'PILOT',
    title: 'Streaming SSE handler for Gemini Assistant chat responses',
    description: 'Implement Server-Sent Events stream pipeline so the Vue frontend can render tokens in real-time as Gemini generates them.',
    type: 'Story',
    status: 'In Review',
    priority: 'High',
    assignee: { id: 'm-1', name: 'Alex Morgan', avatar: 'AM', role: 'Project Admin' },
    reporter: { id: 'm-5', name: 'David Kim', avatar: 'DK' },
    sprintId: 'sprint-pilot-24',
    sprint: 'Sprint 24 — AI Intelligence Core',
    storyPoints: 8,
    rank: 300,
    labels: ['ai', 'streaming', 'frontend'],
    dueDate: '2026-09-03',
    createdAt: '2026-08-22T14:15:00.000Z',
    updatedAt: '2026-08-30T09:40:00.000Z'
  },
  {
    id: 't-pilot-104',
    key: 'PILOT-104',
    projectKey: 'PILOT',
    title: 'PostgreSQL connection pool exhaustion under load',
    description: 'Under heavy concurrent test traffic, the connection pool exceeds max_connections limit, resulting in 500 error responses on the auth route.',
    type: 'Bug',
    status: 'In Progress',
    priority: 'Urgent',
    assignee: { id: 'm-2', name: 'Jane Doe', avatar: 'JD', role: 'Senior Developer' },
    reporter: { id: 'm-6', name: 'Priya Patel', avatar: 'PP' },
    sprintId: 'sprint-pilot-24',
    sprint: 'Sprint 24 — AI Intelligence Core',
    storyPoints: 5,
    rank: 400,
    labels: ['database', 'performance', 'critical'],
    dueDate: '2026-08-31',
    createdAt: '2026-08-25T11:00:00.000Z',
    updatedAt: '2026-08-30T10:00:00.000Z'
  },
  {
    id: 't-pilot-112',
    key: 'PILOT-112',
    projectKey: 'PILOT',
    title: 'Design responsive navigation shell and design token system',
    description: 'Establish CSS custom properties, light/dark theme variables, and responsive collapsible sidebar.',
    type: 'Task',
    status: 'In Progress',
    priority: 'Medium',
    assignee: { id: 'm-4', name: 'Elena Rostova', avatar: 'ER', role: 'Frontend Engineer' },
    reporter: { id: 'm-1', name: 'Alex Morgan', avatar: 'AM' },
    sprintId: 'sprint-pilot-24',
    sprint: 'Sprint 24 — AI Intelligence Core',
    storyPoints: 3,
    rank: 500,
    labels: ['ui', 'design-system', 'css'],
    dueDate: '2026-09-01',
    createdAt: '2026-08-26T09:00:00.000Z',
    updatedAt: '2026-08-29T18:00:00.000Z'
  },
  {
    id: 't-pilot-118',
    key: 'PILOT-118',
    projectKey: 'PILOT',
    title: 'Multi-tenant role permission policies for project settings',
    description: 'Define RBAC middleware enforcing Project Admin, Developer, and Viewer access boundaries on API endpoints.',
    type: 'Story',
    status: 'Backlog',
    priority: 'High',
    assignee: { id: 'm-1', name: 'Alex Morgan', avatar: 'AM', role: 'Project Admin' },
    reporter: { id: 'm-1', name: 'Alex Morgan', avatar: 'AM' },
    sprintId: null, // In Backlog
    sprint: 'Backlog',
    storyPoints: 5,
    rank: 600,
    labels: ['security', 'rbac', 'backend'],
    dueDate: '2026-09-10',
    createdAt: '2026-08-28T13:00:00.000Z',
    updatedAt: '2026-08-28T13:00:00.000Z'
  },
  {
    id: 't-pilot-120',
    key: 'PILOT-120',
    projectKey: 'PILOT',
    title: 'Add automated database seed scripts for local development',
    description: 'Write npm run db:seed script creating deterministic demo users, workspaces, and ticket histories.',
    type: 'Task',
    status: 'Backlog',
    priority: 'Medium',
    assignee: { id: 'm-3', name: 'Samir Khan', avatar: 'SK', role: 'DevOps Engineer' },
    reporter: { id: 'm-2', name: 'Jane Doe', avatar: 'JD' },
    sprintId: null, // In Backlog
    sprint: 'Backlog',
    storyPoints: 2,
    rank: 700,
    labels: ['dx', 'database'],
    dueDate: '2026-09-12',
    createdAt: '2026-08-29T10:00:00.000Z',
    updatedAt: '2026-08-29T10:00:00.000Z'
  },
  {
    id: 't-pilot-122',
    key: 'PILOT-122',
    projectKey: 'PILOT',
    title: 'Markdown live preview sync with document chunking index',
    description: 'Ensure saving document edits triggers re-chunking and vector re-indexing automatically in the background.',
    type: 'Story',
    status: 'Todo',
    priority: 'High',
    assignee: { id: 'm-5', name: 'David Kim', avatar: 'DK', role: 'AI / ML Engineer' },
    reporter: { id: 'm-1', name: 'Alex Morgan', avatar: 'AM' },
    sprintId: 'sprint-pilot-25', // In Planned Sprint 25
    sprint: 'Sprint 25 — Security & Workspaces',
    storyPoints: 8,
    rank: 800,
    labels: ['ai', 'docs', 'rag'],
    dueDate: '2026-09-05',
    createdAt: '2026-08-29T15:30:00.000Z',
    updatedAt: '2026-08-29T15:30:00.000Z'
  },

  // INFRA Project Tickets
  {
    id: 't-infra-14',
    key: 'INFRA-14',
    projectKey: 'INFRA',
    title: 'Provision staging Kubernetes cluster with GPU node pool',
    description: 'Set up cluster nodes with NVIDIA driver operator for local embedding model inference experiments.',
    type: 'Task',
    status: 'In Progress',
    priority: 'Urgent',
    assignee: { id: 'm-3', name: 'Samir Khan', avatar: 'SK', role: 'DevOps Lead' },
    reporter: { id: 'm-1', name: 'Alex Morgan', avatar: 'AM' },
    sprintId: 'sprint-infra-12',
    sprint: 'Infra Sprint 12 — Cloud & TLS',
    storyPoints: 5,
    rank: 100,
    labels: ['kubernetes', 'cloud', 'gpu'],
    dueDate: '2026-09-02',
    createdAt: '2026-08-22T09:00:00.000Z',
    updatedAt: '2026-08-29T17:00:00.000Z'
  },
  {
    id: 't-infra-16',
    key: 'INFRA-16',
    projectKey: 'INFRA',
    title: 'Configure TLS certificate rotation on ingress gateway',
    description: 'Automate Let’s Encrypt cert-manager renewals and configure HTTP to HTTPS redirection.',
    type: 'Task',
    status: 'Todo',
    priority: 'Medium',
    assignee: { id: 'm-3', name: 'Samir Khan', avatar: 'SK', role: 'DevOps Lead' },
    reporter: { id: 'm-3', name: 'Samir Khan', avatar: 'SK' },
    sprintId: 'sprint-infra-12',
    sprint: 'Infra Sprint 12 — Cloud & TLS',
    storyPoints: 3,
    rank: 200,
    labels: ['security', 'ssl', 'networking'],
    dueDate: '2026-09-06',
    createdAt: '2026-08-24T11:00:00.000Z',
    updatedAt: '2026-08-24T11:00:00.000Z'
  },
  {
    id: 't-infra-18',
    key: 'INFRA-18',
    projectKey: 'INFRA',
    title: 'Automated database backup snapshots to S3-compatible storage',
    description: 'Schedule daily WAL-G backup scripts with retention policy of 30 days and point-in-time recovery test.',
    type: 'Story',
    status: 'Backlog',
    priority: 'High',
    assignee: { id: 'm-2', name: 'Jane Doe', avatar: 'JD', role: 'Backend Engineer' },
    reporter: { id: 'm-3', name: 'Samir Khan', avatar: 'SK' },
    sprintId: null, // Backlog
    sprint: 'Backlog',
    storyPoints: 8,
    rank: 300,
    labels: ['database', 'storage', 'backup'],
    dueDate: '2026-09-15',
    createdAt: '2026-08-26T14:00:00.000Z',
    updatedAt: '2026-08-26T14:00:00.000Z'
  },
  {
    id: 't-infra-20',
    key: 'INFRA-20',
    projectKey: 'INFRA',
    title: 'Set up Prometheus and Grafana alerts for high memory usage',
    description: 'Create alertmanager rules notifying on pod restarts or memory consumption > 85% for 5 minutes.',
    type: 'Task',
    status: 'Done',
    priority: 'Low',
    assignee: { id: 'm-6', name: 'Priya Patel', avatar: 'PP', role: 'Security & QA' },
    reporter: { id: 'm-3', name: 'Samir Khan', avatar: 'SK' },
    sprintId: 'sprint-infra-11',
    sprint: 'Infra Sprint 11 — Observability',
    storyPoints: 2,
    rank: 400,
    labels: ['observability', 'monitoring'],
    dueDate: '2026-08-25',
    createdAt: '2026-08-19T10:00:00.000Z',
    updatedAt: '2026-08-25T16:45:00.000Z'
  },

  // MOBILE Project Tickets
  {
    id: 't-mob-22',
    key: 'MOBILE-22',
    projectKey: 'MOBILE',
    title: 'SQLite local cache synchronization layer for offline access',
    description: 'Implement bi-directional sync queue syncing local changes when device reconnects to Wi-Fi/cellular.',
    type: 'Task',
    status: 'In Progress',
    priority: 'High',
    assignee: { id: 'm-5', name: 'David Kim', avatar: 'DK', role: 'Offline Sync Engineer' },
    reporter: { id: 'm-4', name: 'Elena Rostova', avatar: 'ER' },
    sprintId: 'sprint-mob-6',
    sprint: 'Mobile Sprint 6 — Offline Mode',
    storyPoints: 5,
    rank: 100,
    labels: ['mobile', 'offline', 'sqlite'],
    dueDate: '2026-09-04',
    createdAt: '2026-08-23T11:30:00.000Z',
    updatedAt: '2026-08-30T08:15:00.000Z'
  },
  {
    id: 't-mob-25',
    key: 'MOBILE-25',
    projectKey: 'MOBILE',
    title: 'Push notification service worker for ticket mentions',
    description: 'Handle APNs and FCM payload decoding to open the relevant ticket detail sheet directly when tapped.',
    type: 'Story',
    status: 'Todo',
    priority: 'High',
    assignee: { id: 'm-4', name: 'Elena Rostova', avatar: 'ER', role: 'Mobile Lead' },
    reporter: { id: 'm-4', name: 'Elena Rostova', avatar: 'ER' },
    sprintId: 'sprint-mob-6',
    sprint: 'Mobile Sprint 6 — Offline Mode',
    storyPoints: 5,
    rank: 200,
    labels: ['mobile', 'notifications'],
    dueDate: '2026-09-07',
    createdAt: '2026-08-25T16:00:00.000Z',
    updatedAt: '2026-08-25T16:00:00.000Z'
  },
  {
    id: 't-mob-28',
    key: 'MOBILE-28',
    projectKey: 'MOBILE',
    title: 'iOS Widget for active sprint burndown tracking',
    description: 'Build WidgetKit medium widget showing remaining points and countdown for active project sprint.',
    type: 'Story',
    status: 'Backlog',
    priority: 'Medium',
    assignee: { id: 'm-4', name: 'Elena Rostova', avatar: 'ER', role: 'Mobile Lead' },
    reporter: { id: 'm-4', name: 'Elena Rostova', avatar: 'ER' },
    sprintId: null, // Backlog
    sprint: 'Backlog',
    storyPoints: 3,
    rank: 300,
    labels: ['ios', 'widgets'],
    dueDate: '2026-09-18',
    createdAt: '2026-08-27T10:00:00.000Z',
    updatedAt: '2026-08-27T10:00:00.000Z'
  },
  {
    id: 't-mob-30',
    key: 'MOBILE-30',
    projectKey: 'MOBILE',
    title: 'Fix splash screen layout jitter on Android 14 devices',
    description: 'Resolve status bar height computation bug causing brief white flash before dark theme hydration.',
    type: 'Bug',
    status: 'Done',
    priority: 'Low',
    assignee: { id: 'm-6', name: 'Priya Patel', avatar: 'PP', role: 'Mobile QA' },
    reporter: { id: 'm-4', name: 'Elena Rostova', avatar: 'ER' },
    sprintId: 'sprint-mob-5',
    sprint: 'Mobile Sprint 5 — UI Polishing',
    storyPoints: 2,
    rank: 400,
    labels: ['android', 'ui-bug'],
    dueDate: '2026-08-24',
    createdAt: '2026-08-19T13:00:00.000Z',
    updatedAt: '2026-08-24T15:00:00.000Z'
  }
];

export const useTicketStore = defineStore('ticket', () => {
  const tickets = ref([...INITIAL_TICKETS]);
  const activeTicketKey = ref(null);
  const isCreateModalOpen = ref(false);
  const createModalProjectKey = ref('PILOT');

  // Search & Filter state for views
  const searchQuery = ref('');
  const statusFilter = ref('all');
  const priorityFilter = ref('all');
  const typeFilter = ref('all');
  const assigneeFilter = ref('all');
  const sprintFilter = ref('all');

  // Computed / Getters
  const allTickets = computed(() => tickets.value);

  const activeTicket = computed(() => {
    if (!activeTicketKey.value) return null;
    return getTicketByKey(activeTicketKey.value);
  });

  function getTicketByKey(key) {
    if (!key) return null;
    return tickets.value.find((t) => t.key.toUpperCase() === key.toUpperCase()) || null;
  }

  function getTicketsByProject(projectKey) {
    if (!projectKey || projectKey === 'all') return tickets.value;
    return tickets.value.filter((t) => t.projectKey.toUpperCase() === projectKey.toUpperCase());
  }

  function getTicketsByStatus(projectKey, status) {
    const projTickets = getTicketsByProject(projectKey);
    return projTickets.filter((t) => t.status.toLowerCase() === status.toLowerCase());
  }

  function getSprintTickets(sprintId) {
    if (!sprintId) return [];
    return tickets.value.filter((t) => t.sprintId === sprintId);
  }

  function getBacklogTickets(projectKey) {
    const list = getTicketsByProject(projectKey);
    return list
      .filter((t) => !t.sprintId)
      .sort((a, b) => (a.rank || 0) - (b.rank || 0));
  }

  function getProjectStats(projectKey) {
    const list = getTicketsByProject(projectKey);
    const total = list.length;
    const open = list.filter((t) => t.status !== 'Done').length;
    const inProgress = list.filter((t) => t.status === 'In Progress').length;
    const inReview = list.filter((t) => t.status === 'In Review').length;
    const done = list.filter((t) => t.status === 'Done').length;
    const blocked = list.filter((t) => t.priority === 'Urgent' && t.status !== 'Done').length;
    const totalPoints = list.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
    const completedPoints = list.filter((t) => t.status === 'Done').reduce((acc, t) => acc + (t.storyPoints || 0), 0);

    return {
      total,
      open,
      inProgress,
      inReview,
      done,
      blocked,
      totalPoints,
      completedPoints
    };
  }

  // Filtered tickets based on active filter state
  function getFilteredTickets(projectKey = null) {
    let list = projectKey ? getTicketsByProject(projectKey) : tickets.value;

    // Search query (key, title, description, assignee name, labels)
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      list = list.filter((t) => {
        const matchesKey = t.key.toLowerCase().includes(q);
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        const matchesAssignee = t.assignee?.name?.toLowerCase().includes(q);
        const matchesLabels = t.labels?.some((l) => l.toLowerCase().includes(q));
        return matchesKey || matchesTitle || matchesDesc || matchesAssignee || matchesLabels;
      });
    }

    // Status filter
    if (statusFilter.value !== 'all') {
      list = list.filter((t) => t.status.toLowerCase() === statusFilter.value.toLowerCase());
    }

    // Priority filter
    if (priorityFilter.value !== 'all') {
      list = list.filter((t) => t.priority.toLowerCase() === priorityFilter.value.toLowerCase());
    }

    // Type filter
    if (typeFilter.value !== 'all') {
      list = list.filter((t) => t.type.toLowerCase() === typeFilter.value.toLowerCase());
    }

    // Assignee filter
    if (assigneeFilter.value !== 'all') {
      list = list.filter((t) => t.assignee?.id === assigneeFilter.value || t.assignee?.name === assigneeFilter.value);
    }

    // Sprint filter
    if (sprintFilter.value !== 'all') {
      if (sprintFilter.value === 'backlog') {
        list = list.filter((t) => !t.sprintId);
      } else {
        list = list.filter((t) => t.sprintId === sprintFilter.value);
      }
    }

    return list;
  }

  // Actions
  function openCreateModal(prefillProjectKey = 'PILOT') {
    createModalProjectKey.value = prefillProjectKey || 'PILOT';
    isCreateModalOpen.value = true;
  }

  function closeCreateModal() {
    isCreateModalOpen.value = false;
  }

  function openTicketDetail(ticketKey) {
    activeTicketKey.value = ticketKey;
  }

  function closeTicketDetail() {
    activeTicketKey.value = null;
  }

  function generateNextKey(projectKey) {
    const pKey = projectKey.toUpperCase();
    const existing = tickets.value.filter((t) => t.projectKey.toUpperCase() === pKey);
    let maxNum = 0;
    existing.forEach((t) => {
      const parts = t.key.split('-');
      if (parts.length === 2) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });

    const nextNum = maxNum > 0 ? maxNum + 1 : 101;
    return `${pKey}-${nextNum}`;
  }

  function createTicket({
    projectKey,
    title,
    description,
    type = 'Task',
    priority = 'Medium',
    status = 'Todo',
    assignee = null,
    reporter = null,
    sprintId = null,
    sprint = null,
    storyPoints = 3,
    labels = [],
    dueDate = null
  }) {
    const formattedProjectKey = (projectKey || 'PILOT').toUpperCase();
    const key = generateNextKey(formattedProjectKey);

    const maxRank = tickets.value
      .filter((t) => t.projectKey === formattedProjectKey)
      .reduce((max, t) => Math.max(max, t.rank || 0), 0);

    const newTicket = {
      id: `t-${key.toLowerCase()}`,
      key,
      projectKey: formattedProjectKey,
      title: title.trim(),
      description: description ? description.trim() : '',
      type,
      status,
      priority,
      assignee: assignee || { id: 'm-1', name: 'Alex Morgan', avatar: 'AM', role: 'Project Admin' },
      reporter: reporter || { id: 'm-1', name: 'Alex Morgan', avatar: 'AM' },
      sprintId: sprintId || null,
      sprint: sprint || (sprintId ? 'Active Sprint' : 'Backlog'),
      storyPoints: Number(storyPoints) || 0,
      rank: maxRank + 100,
      labels: Array.isArray(labels) ? labels : labels ? labels.split(',').map((l) => l.trim()).filter(Boolean) : [],
      dueDate: dueDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    tickets.value.unshift(newTicket);

    // Record activity
    try {
      const activityStore = useActivityStore();
      activityStore.recordActivity({
        projectKey: formattedProjectKey,
        type: 'ticket',
        action: 'created',
        targetType: 'ticket',
        targetId: newTicket.id,
        targetKey: newTicket.key,
        targetTitle: newTicket.title,
        message: `created ${newTicket.type.toLowerCase()} ${newTicket.key} "${newTicket.title}"`,
        metadata: { priority: newTicket.priority, points: newTicket.storyPoints }
      });
    } catch (e) {
      console.warn('Could not record activity:', e);
    }

    return newTicket;
  }

  function updateTicket(key, updates) {
    const ticket = getTicketByKey(key);
    if (!ticket) return null;

    Object.assign(ticket, updates, { updatedAt: new Date().toISOString() });
    return ticket;
  }

  function updateTicketStatus(key, newStatus) {
    const ticket = getTicketByKey(key);
    if (!ticket) return null;
    const oldStatus = ticket.status;

    if (oldStatus !== newStatus) {
      updateTicket(key, { status: newStatus });

      try {
        const activityStore = useActivityStore();
        activityStore.recordActivity({
          projectKey: ticket.projectKey,
          type: 'ticket',
          action: 'status_changed',
          targetType: 'ticket',
          targetId: ticket.id,
          targetKey: ticket.key,
          targetTitle: ticket.title,
          message: `moved ${ticket.key} from ${oldStatus} to ${newStatus}`,
          metadata: { fromStatus: oldStatus, toStatus: newStatus }
        });
      } catch (e) {
        console.warn('Could not record activity:', e);
      }
      return ticket;
    }
    return ticket;
  }

  function updateTicketPriority(key, newPriority) {
    const ticket = getTicketByKey(key);
    if (!ticket) return null;
    const oldPriority = ticket.priority;

    if (oldPriority !== newPriority) {
      updateTicket(key, { priority: newPriority });

      try {
        const activityStore = useActivityStore();
        activityStore.recordActivity({
          projectKey: ticket.projectKey,
          type: 'ticket',
          action: 'priority_changed',
          targetType: 'ticket',
          targetId: ticket.id,
          targetKey: ticket.key,
          targetTitle: ticket.title,
          message: `updated ${ticket.key} priority to ${newPriority}`,
          metadata: { fromPriority: oldPriority, toPriority: newPriority }
        });
      } catch (e) {
        console.warn('Could not record activity:', e);
      }
      return ticket;
    }
    return ticket;
  }

  function updateTicketAssignee(key, assignee) {
    const ticket = getTicketByKey(key);
    if (!ticket) return null;
    const oldAssigneeName = ticket.assignee?.name || 'Unassigned';
    const newAssigneeName = assignee?.name || 'Unassigned';

    updateTicket(key, { assignee });

    try {
      const activityStore = useActivityStore();
      activityStore.recordActivity({
        projectKey: ticket.projectKey,
        type: 'ticket',
        action: 'assigned',
        targetType: 'ticket',
        targetId: ticket.id,
        targetKey: ticket.key,
        targetTitle: ticket.title,
        message: `reassigned ${ticket.key} from ${oldAssigneeName} to ${newAssigneeName}`,
        metadata: { fromAssignee: oldAssigneeName, toAssignee: newAssigneeName }
      });
    } catch (e) {
      console.warn('Could not record activity:', e);
    }

    return ticket;
  }

  function assignTicketToSprint(ticketKey, sprintId, sprintName = null) {
    const ticket = getTicketByKey(ticketKey);
    const updated = updateTicket(ticketKey, {
      sprintId: sprintId || null,
      sprint: sprintName || (sprintId ? 'Assigned Sprint' : 'Backlog')
    });

    if (ticket) {
      try {
        const activityStore = useActivityStore();
        activityStore.recordActivity({
          projectKey: ticket.projectKey,
          type: 'ticket',
          action: 'sprint_moved',
          targetType: 'ticket',
          targetId: ticket.id,
          targetKey: ticket.key,
          targetTitle: ticket.title,
          message: `assigned ${ticket.key} to ${sprintName || 'Sprint'}`,
          metadata: { sprintId }
        });
      } catch (e) {
        console.warn('Could not record activity:', e);
      }
    }

    return updated;
  }

  function removeTicketFromSprint(ticketKey) {
    const ticket = getTicketByKey(ticketKey);
    const updated = updateTicket(ticketKey, {
      sprintId: null,
      sprint: 'Backlog'
    });

    if (ticket) {
      try {
        const activityStore = useActivityStore();
        activityStore.recordActivity({
          projectKey: ticket.projectKey,
          type: 'ticket',
          action: 'sprint_moved',
          targetType: 'ticket',
          targetId: ticket.id,
          targetKey: ticket.key,
          targetTitle: ticket.title,
          message: `moved ${ticket.key} to Product Backlog`,
          metadata: { sprintId: null }
        });
      } catch (e) {
        console.warn('Could not record activity:', e);
      }
    }

    return updated;
  }

  /**
   * Reassign all open tickets belonging to a member in a project.
   * Used during member removal workflows to prevent orphan tickets.
   */
  function reassignMemberTickets(projectKey, memberId, newAssignee = null) {
    const fallbackAssignee = newAssignee || {
      id: 'unassigned',
      name: 'Unassigned',
      avatar: '—',
      role: 'Unassigned'
    };

    const affectedTickets = tickets.value.filter(
      (t) =>
        t.projectKey.toUpperCase() === projectKey.toUpperCase() &&
        t.assignee?.id === memberId &&
        t.status !== 'Done'
    );

    affectedTickets.forEach((t) => {
      t.assignee = { ...fallbackAssignee };
      t.updatedAt = new Date().toISOString();
    });

    return affectedTickets.length;
  }

  function reorderBacklog(projectKey, orderedKeys) {
    orderedKeys.forEach((key, index) => {
      const ticket = getTicketByKey(key);
      if (ticket && ticket.projectKey.toUpperCase() === projectKey.toUpperCase()) {
        ticket.rank = (index + 1) * 100;
      }
    });
  }

  function deleteTicket(key) {
    const idx = tickets.value.findIndex((t) => t.key.toUpperCase() === key.toUpperCase());
    if (idx !== -1) {
      tickets.value.splice(idx, 1);
      if (activeTicketKey.value === key) {
        activeTicketKey.value = null;
      }
      return true;
    }
    return false;
  }

  function resetFilters() {
    searchQuery.value = '';
    statusFilter.value = 'all';
    priorityFilter.value = 'all';
    typeFilter.value = 'all';
    assigneeFilter.value = 'all';
    sprintFilter.value = 'all';
  }

  return {
    tickets,
    activeTicketKey,
    isCreateModalOpen,
    createModalProjectKey,
    searchQuery,
    statusFilter,
    priorityFilter,
    typeFilter,
    assigneeFilter,
    sprintFilter,
    allTickets,
    activeTicket,
    getTicketByKey,
    getTicketsByProject,
    getTicketsByStatus,
    getSprintTickets,
    getBacklogTickets,
    getProjectStats,
    getFilteredTickets,
    openCreateModal,
    closeCreateModal,
    openTicketDetail,
    closeTicketDetail,
    generateNextKey,
    createTicket,
    updateTicket,
    updateTicketStatus,
    updateTicketPriority,
    updateTicketAssignee,
    assignTicketToSprint,
    removeTicketFromSprint,
    reassignMemberTickets,
    reorderBacklog,
    deleteTicket,
    resetFilters
  };
});
