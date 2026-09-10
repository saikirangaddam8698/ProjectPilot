import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useActivityStore } from './activity.store.js';
import { useAuthStore } from './auth.store.js';
import { useUiStore } from './ui.store.js';
import { projectsApi, membersApi } from '../services/api/index.js';

// Master workspace member definitions fallback
export const WORKSPACE_MEMBERS = [
  {
    id: 'm-1',
    name: 'Alex Morgan',
    avatar: 'AM',
    email: 'alex.m@projectpilot.dev',
    role: 'Project Admin',
    department: 'Architecture & Core Systems',
    status: 'Active',
    skills: ['Vue 3', 'Node.js', 'PostgreSQL', 'System Design', 'pgvector'],
    capacity: 20,
    projectKeys: ['PILOT', 'INFRA']
  },
  {
    id: 'm-2',
    name: 'Jane Doe',
    avatar: 'JD',
    email: 'jane.d@projectpilot.dev',
    role: 'Senior Developer',
    department: 'Backend Engineering',
    status: 'Active',
    skills: ['Node.js', 'Express', 'SQL', 'SSE Streaming', 'Redis'],
    capacity: 18,
    projectKeys: ['PILOT', 'INFRA', 'MOBILE']
  },
  {
    id: 'm-3',
    name: 'Samir Khan',
    avatar: 'SK',
    email: 'samir.k@projectpilot.dev',
    role: 'DevOps Lead',
    department: 'Cloud Infrastructure',
    status: 'Active',
    skills: ['Kubernetes', 'Docker', 'Prometheus', 'Grafana', 'CI/CD'],
    capacity: 16,
    projectKeys: ['PILOT', 'INFRA']
  },
  {
    id: 'm-4',
    name: 'Elena Rostova',
    avatar: 'ER',
    email: 'elena.r@projectpilot.dev',
    role: 'Frontend Engineer',
    department: 'UI/UX & Web Platforms',
    status: 'Active',
    skills: ['Vue 3', 'TypeScript', 'CSS Tokens', 'Pinia', 'Vite'],
    capacity: 20,
    projectKeys: ['PILOT', 'MOBILE']
  },
  {
    id: 'm-5',
    name: 'David Kim',
    avatar: 'DK',
    email: 'david.k@projectpilot.dev',
    role: 'AI / ML Engineer',
    department: 'AI & Data Intelligence',
    status: 'Away',
    skills: ['Python', 'Gemini API', 'pgvector', 'RAG Pipelines', 'Embeddings'],
    capacity: 15,
    projectKeys: ['PILOT', 'MOBILE']
  },
  {
    id: 'm-6',
    name: 'Priya Patel',
    avatar: 'PP',
    email: 'priya.p@projectpilot.dev',
    role: 'Product Auditor & Stakeholder',
    department: 'Compliance & Auditing',
    status: 'Offline',
    skills: ['Audit & Verification', 'Compliance', 'Metrics Review'],
    capacity: 14,
    projectKeys: ['PILOT', 'INFRA', 'MOBILE']
  },
  {
    id: 'm-7',
    name: 'Marcus Vance',
    avatar: 'MV',
    email: 'marcus.v@projectpilot.dev',
    role: 'Frontend Developer',
    department: 'Mobile Delivery Platform',
    status: 'Active',
    skills: ['Vue 3', 'TypeScript', 'Tailwind', 'REST APIs', 'Vite'],
    capacity: 20,
    projectKeys: ['MOBILE']
  },
  {
    id: 'm-8',
    name: 'Rachel Chen',
    avatar: 'RC',
    email: 'rachel.c@projectpilot.dev',
    role: 'QA & Test Engineer',
    department: 'Quality Assurance',
    status: 'Active',
    skills: ['End-to-End Testing', 'Security Triage', 'Playwright', 'Test Automation'],
    capacity: 18,
    projectKeys: ['PILOT', 'INFRA', 'MOBILE']
  }
];

const INITIAL_PROJECTS = [
  {
    id: 'proj-pilot',
    key: 'PILOT',
    name: 'ProjectPilot Core',
    description: 'Primary multi-user agile intelligence platform, AI copilot, and pgvector RAG engine.',
    status: 'active',
    lead: {
      name: 'Alex Morgan',
      avatar: 'AM',
      email: 'alex.m@projectpilot.dev',
      role: 'Lead Architect'
    },
    members: [
      { id: 'm-1', name: 'Alex Morgan', avatar: 'AM', role: 'Project Admin', email: 'alex.m@projectpilot.dev', department: 'Architecture', status: 'Active', skills: ['Vue 3', 'Node.js', 'PostgreSQL', 'System Design'], capacity: 20 },
      { id: 'm-2', name: 'Jane Doe', avatar: 'JD', role: 'Senior Developer', email: 'jane.d@projectpilot.dev', department: 'Backend', status: 'Active', skills: ['Node.js', 'Express', 'SQL'], capacity: 18 },
      { id: 'm-3', name: 'Samir Khan', avatar: 'SK', role: 'DevOps Engineer', email: 'samir.k@projectpilot.dev', department: 'DevOps', status: 'Active', skills: ['Kubernetes', 'Docker'], capacity: 16 },
      { id: 'm-4', name: 'Elena Rostova', avatar: 'ER', role: 'Frontend Engineer', email: 'elena.r@projectpilot.dev', department: 'Frontend', status: 'Active', skills: ['Vue 3', 'CSS', 'Vite'], capacity: 20 },
      { id: 'm-5', name: 'David Kim', avatar: 'DK', role: 'AI / ML Engineer', email: 'david.k@projectpilot.dev', department: 'AI', status: 'Away', skills: ['Gemini API', 'pgvector', 'RAG'], capacity: 15 },
      { id: 'm-6', name: 'Priya Patel', avatar: 'PP', role: 'Product Auditor & Stakeholder', email: 'priya.p@projectpilot.dev', department: 'Compliance & Auditing', status: 'Offline', skills: ['Audit', 'Metrics'], capacity: 14 },
      { id: 'm-8', name: 'Rachel Chen', avatar: 'RC', role: 'QA & Test Engineer', email: 'rachel.c@projectpilot.dev', department: 'QA', status: 'Active', skills: ['Playwright', 'End-to-End Testing'], capacity: 18 }
    ],
    ticketCount: 18,
    activeSprint: {
      id: 'sprint-24',
      name: 'Sprint 24 — AI Intelligence Core',
      goal: 'Ship Gemini streaming assistant tools and pgvector vector search schema migration.',
      status: 'active',
      progress: 65,
      remainingDays: 4,
      pointsCommitted: 64,
      pointsCompleted: 42
    },
    health: {
      progress: 65,
      openTickets: 14,
      blockedTickets: 2,
      criticalBugs: 1
    },
    createdAt: '2026-08-01T09:00:00.000Z'
  },
  {
    id: 'proj-infra',
    key: 'INFRA',
    name: 'Cloud Infrastructure',
    description: 'Kubernetes clusters, PostgreSQL replication, pgvector indexing, and edge deployments.',
    status: 'planning',
    lead: {
      name: 'Samir Khan',
      avatar: 'SK',
      email: 'samir.k@projectpilot.dev',
      role: 'DevOps Lead'
    },
    members: [
      { id: 'm-3', name: 'Samir Khan', avatar: 'SK', role: 'DevOps Lead', email: 'samir.k@projectpilot.dev', department: 'DevOps', status: 'Active', skills: ['Kubernetes', 'Docker', 'Prometheus'], capacity: 16 },
      { id: 'm-1', name: 'Alex Morgan', avatar: 'AM', role: 'Architect', email: 'alex.m@projectpilot.dev', department: 'Architecture', status: 'Active', skills: ['System Design', 'PostgreSQL'], capacity: 20 },
      { id: 'm-2', name: 'Jane Doe', avatar: 'JD', role: 'Backend Engineer', email: 'jane.d@projectpilot.dev', department: 'Backend', status: 'Active', skills: ['Node.js', 'SQL'], capacity: 18 },
      { id: 'm-6', name: 'Priya Patel', avatar: 'PP', role: 'Product Auditor & Stakeholder', email: 'priya.p@projectpilot.dev', department: 'Compliance & Auditing', status: 'Offline', skills: ['Audit', 'Metrics'], capacity: 14 },
      { id: 'm-8', name: 'Rachel Chen', avatar: 'RC', role: 'QA & Test Engineer', email: 'rachel.c@projectpilot.dev', department: 'QA', status: 'Active', skills: ['Playwright', 'Security Triage'], capacity: 18 }
    ],
    ticketCount: 9,
    activeSprint: null,
    health: {
      progress: 20,
      openTickets: 8,
      blockedTickets: 0,
      criticalBugs: 0
    },
    createdAt: '2026-08-10T14:30:00.000Z'
  },
  {
    id: 'proj-mobile',
    key: 'MOBILE',
    name: 'Mobile Delivery Platform',
    description: 'Cross-platform mobile applications for on-the-go sprint monitoring and incident triage.',
    status: 'active',
    lead: {
      name: 'Elena Rostova',
      avatar: 'ER',
      email: 'elena.r@projectpilot.dev',
      role: 'Mobile Lead'
    },
    members: [
      { id: 'm-4', name: 'Elena Rostova', avatar: 'ER', role: 'Mobile Lead', email: 'elena.r@projectpilot.dev', department: 'Mobile', status: 'Active', skills: ['Vue 3', 'Mobile UX'], capacity: 20 },
      { id: 'm-2', name: 'Jane Doe', avatar: 'JD', role: 'API Engineer', email: 'jane.d@projectpilot.dev', department: 'Backend', status: 'Active', skills: ['REST', 'Express'], capacity: 18 },
      { id: 'm-5', name: 'David Kim', avatar: 'DK', role: 'Offline Sync Engineer', email: 'david.k@projectpilot.dev', department: 'AI/Mobile', status: 'Away', skills: ['Offline DB', 'Sync'], capacity: 15 },
      { id: 'm-6', name: 'Priya Patel', avatar: 'PP', role: 'Product Auditor & Stakeholder', email: 'priya.p@projectpilot.dev', department: 'Compliance & Auditing', status: 'Offline', skills: ['Audit', 'Metrics'], capacity: 14 },
      { id: 'm-7', name: 'Marcus Vance', avatar: 'MV', role: 'Frontend Developer', email: 'marcus.v@projectpilot.dev', department: 'Mobile Delivery Platform', status: 'Active', skills: ['Vue 3', 'Tailwind', 'Vite'], capacity: 20 },
      { id: 'm-8', name: 'Rachel Chen', avatar: 'RC', role: 'QA & Test Engineer', email: 'rachel.c@projectpilot.dev', department: 'QA', status: 'Active', skills: ['Mobile Testing', 'Playwright'], capacity: 18 }
    ],
    ticketCount: 12,
    activeSprint: {
      id: 'sprint-mob-6',
      name: 'Mobile Sprint 6 — Offline Mode',
      goal: 'Deliver offline ticket caching and biometric authentication.',
      status: 'active',
      progress: 40,
      remainingDays: 7,
      pointsCommitted: 36,
      pointsCompleted: 14
    },
    health: {
      progress: 40,
      openTickets: 10,
      blockedTickets: 1,
      criticalBugs: 0
    },
    createdAt: '2026-08-15T11:00:00.000Z'
  }
];

export const useProjectStore = defineStore('project', () => {
  const projects = ref([...INITIAL_PROJECTS]);
  const workspaceMembersList = ref([...WORKSPACE_MEMBERS]);
  const activeProjectKey = ref(null);
  const isLoading = ref(false);
  const error = ref(null);
  const isInitialized = ref(false);

  // Search & Filter state
  const searchQuery = ref('');
  const statusFilter = ref('all'); // 'all' | 'active' | 'planning' | 'completed'

  // Getters
  // Raw workspace projects in store state
  const rawProjects = computed(() => projects.value);

  // Accessible projects scoped to the logged-in user (or all projects if ADMIN)
  const allProjects = computed(() => {
    const authStore = useAuthStore();
    const currentUser = authStore.user;
    if (!currentUser || authStore.isAdmin) {
      return projects.value;
    }
    const userKeys = (currentUser.projectKeys || []).map((k) => k.toUpperCase());
    const memberId = currentUser.memberId || currentUser.member?.id;
    return projects.value.filter((p) => {
      const isKeyMatch = userKeys.includes(p.key.toUpperCase());
      const isMemberMatch = (p.members || []).some((m) => m.id === memberId || m.email === currentUser.email);
      return isKeyMatch || isMemberMatch;
    });
  });

  const filteredProjects = computed(() => {
    return allProjects.value.filter((project) => {
      const matchesSearch =
        !searchQuery.value.trim() ||
        project.name.toLowerCase().includes(searchQuery.value.toLowerCase().trim()) ||
        project.key.toLowerCase().includes(searchQuery.value.toLowerCase().trim()) ||
        project.description.toLowerCase().includes(searchQuery.value.toLowerCase().trim());

      const matchesStatus =
        statusFilter.value === 'all' || project.status === statusFilter.value;

      return matchesSearch && matchesStatus;
    });
  });

  const activeProject = computed(() => {
    if (activeProjectKey.value) {
      const found = allProjects.value.find((p) => p.key.toUpperCase() === activeProjectKey.value.toUpperCase());
      if (found) return found;
    }
    return allProjects.value[0] || null;
  });

  /**
   * Master deduplicated list of workspace team members across all projects.
   */
  const allWorkspaceMembers = computed(() => {
    const memberMap = new Map();

    // 1. Seed with master directory
    workspaceMembersList.value.forEach((m) => {
      memberMap.set(m.id, { ...m, projectKeys: [...(m.projectKeys || [])] });
    });

    // 2. Synchronize with project.members arrays
    projects.value.forEach((p) => {
      (p.members || []).forEach((m) => {
        if (!memberMap.has(m.id)) {
          memberMap.set(m.id, {
            id: m.id,
            name: m.name,
            avatar: m.avatar || m.name.slice(0, 2).toUpperCase(),
            email: m.email,
            role: m.role || 'Developer',
            department: m.department || 'Engineering',
            status: m.status || 'Active',
            skills: m.skills || ['JavaScript'],
            capacity: m.capacity || 20,
            projectKeys: [p.key]
          });
        } else {
          const rec = memberMap.get(m.id);
          if (!rec.projectKeys.includes(p.key)) {
            rec.projectKeys.push(p.key);
          }
        }
      });
    });

    return Array.from(memberMap.values());
  });

  // Async API Actions
  async function fetchProjects() {
    isLoading.value = true;
    error.value = null;
    try {
      const [fetchedProjects, fetchedMembers] = await Promise.all([
        projectsApi.getAll(),
        membersApi.getAll().catch(() => null)
      ]);

      if (Array.isArray(fetchedProjects) && fetchedProjects.length > 0) {
        projects.value = fetchedProjects;
      }
      if (Array.isArray(fetchedMembers) && fetchedMembers.length > 0) {
        workspaceMembersList.value = fetchedMembers;
      }
      isInitialized.value = true;
    } catch (err) {
      console.warn('Could not load projects from API, using cached data:', err.message);
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  }

  function getProjectByKey(key) {
    if (!key) return null;
    return (
      allProjects.value.find((p) => p.key.toUpperCase() === key.toUpperCase()) || null
    );
  }

  function isMemberOfProject(key) {
    if (!key) return false;
    const authStore = useAuthStore();
    if (authStore.isAdmin) return true;
    return allProjects.value.some((p) => p.key.toUpperCase() === key.toUpperCase());
  }

  function setActiveProjectKey(key) {
    if (!key) {
      activeProjectKey.value = null;
      return;
    }
    const upperKey = key.toUpperCase();
    const authStore = useAuthStore();
    if (authStore.isAuthenticated && !authStore.isAdmin && !authStore.hasProjectAccess(upperKey)) {
      console.warn(`[Security Warning] Blocked attempt to set active project to unauthorized key: ${upperKey}`);
      return;
    }
    activeProjectKey.value = upperKey;
  }

  function resetProjectState() {
    activeProjectKey.value = null;
    searchQuery.value = '';
    statusFilter.value = 'all';
    error.value = null;
  }

  async function createProject({ name, key, description, status, leadName }) {
    const formattedKey = key ? key.trim().toUpperCase() : name.slice(0, 4).toUpperCase();
    const leadInitials = leadName
      ? leadName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'PM';

    // Optimistic fallback object
    const newProject = {
      id: `proj-${Date.now()}`,
      key: formattedKey,
      name: name.trim(),
      description: description ? description.trim() : 'Project workspace created in ProjectPilot.',
      status: status || 'active',
      lead: {
        name: leadName || 'Alex Morgan',
        avatar: leadInitials,
        email: `${(leadName || 'lead').toLowerCase().replace(/\s+/g, '.')}@projectpilot.dev`,
        role: 'Project Lead'
      },
      members: [
        {
          id: `m-1`,
          name: leadName || 'Alex Morgan',
          avatar: leadInitials,
          role: 'Project Admin',
          email: `${(leadName || 'lead').toLowerCase().replace(/\s+/g, '.')}@projectpilot.dev`,
          department: 'Architecture',
          status: 'Active',
          skills: ['Vue 3', 'Node.js', 'System Design'],
          capacity: 20
        }
      ],
      ticketCount: 0,
      activeSprint: null,
      health: {
        progress: 0,
        openTickets: 0,
        blockedTickets: 0,
        criticalBugs: 0
      },
      createdAt: new Date().toISOString()
    };

    const uiStore = useUiStore();
    uiStore.startOperation('project-create', `Creating Workspace ${formattedKey}...`);

    try {
      const created = await projectsApi.create({
        name: name.trim(),
        key: formattedKey,
        description,
        status: status || 'active',
        leadName
      });

      projects.value.unshift(created || newProject);
    } catch (err) {
      console.warn('API project creation failed, using local state:', err.message);
      projects.value.unshift(newProject);
    } finally {
      uiStore.endOperation('project-create');
    }

    // Record activity in event store
    try {
      const activityStore = useActivityStore();
      activityStore.recordActivity({
        projectKey: formattedKey,
        type: 'project',
        action: 'created',
        targetType: 'project',
        targetId: newProject.id,
        targetKey: formattedKey,
        targetTitle: newProject.name,
        message: `created project workspace ${formattedKey} — ${newProject.name}`,
        metadata: { lead: newProject.lead.name }
      });
    } catch (e) {
      console.warn('Could not record activity:', e);
    }

    return newProject;
  }

  async function addMemberToProject(projectKey, { name, role, email, department, status, skills, capacity }) {
    const project = getProjectByKey(projectKey);
    if (!project) return null;

    const existing = allWorkspaceMembers.value.find(
      (m) => m.email?.toLowerCase() === email?.toLowerCase() || m.name.toLowerCase() === name.toLowerCase()
    );

    const initials = name
      ? name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'TM';

    const newMember = {
      id: existing?.id || `m-${Date.now()}`,
      name: name.trim(),
      avatar: existing?.avatar || initials,
      role: role || 'Developer',
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@projectpilot.dev`,
      department: department || existing?.department || 'Engineering',
      status: status || existing?.status || 'Active',
      skills: skills || existing?.skills || ['JavaScript'],
      capacity: capacity || existing?.capacity || 20
    };

    const uiStore = useUiStore();
    const opId = `member-add-${newMember.name}`;
    uiStore.startOperation(opId, `Adding ${newMember.name}...`);

    try {
      await projectsApi.addMember(projectKey, {
        memberId: existing?.id,
        name: newMember.name,
        role: newMember.role,
        email: newMember.email,
        department: newMember.department,
        status: newMember.status,
        skills: newMember.skills,
        capacity: newMember.capacity
      });
    } catch (err) {
      console.warn('API add member failed, applying locally:', err.message);
    } finally {
      uiStore.endOperation(opId);
    }

    // Update local project.members
    const alreadyMember = project.members.some((m) => m.id === newMember.id || m.email === newMember.email);
    if (!alreadyMember) {
      project.members.push(newMember);
    }

    // Record activity
    try {
      const activityStore = useActivityStore();
      activityStore.recordActivity({
        projectKey,
        type: 'team',
        action: 'member_added',
        targetType: 'member',
        targetId: newMember.id,
        targetKey: newMember.avatar,
        targetTitle: newMember.name,
        message: `added ${newMember.name} as ${newMember.role} to ${project.name}`,
        metadata: { role: newMember.role, email: newMember.email }
      });
    } catch (e) {
      console.warn('Could not record activity:', e);
    }

    return newMember;
  }

  async function removeMemberFromProject(projectKey, memberId) {
    const project = getProjectByKey(projectKey);
    if (!project) return false;

    const memberIndex = project.members.findIndex((m) => m.id === memberId);
    if (memberIndex === -1) return false;

    const removedMember = project.members[memberIndex];

    const uiStore = useUiStore();
    const opId = `member-remove-${memberId}`;
    uiStore.startOperation(opId, `Removing ${removedMember.name}...`);

    try {
      await projectsApi.removeMember(projectKey, memberId);
    } catch (err) {
      console.warn('API remove member failed, applying locally:', err.message);
    } finally {
      uiStore.endOperation(opId);
    }

    project.members.splice(memberIndex, 1);

    // Record activity
    try {
      const activityStore = useActivityStore();
      activityStore.recordActivity({
        projectKey,
        type: 'team',
        action: 'member_removed',
        targetType: 'member',
        targetId: memberId,
        targetKey: removedMember.avatar,
        targetTitle: removedMember.name,
        message: `removed ${removedMember.name} from ${project.name}`,
        metadata: { memberName: removedMember.name }
      });
    } catch (e) {
      console.warn('Could not record activity:', e);
    }

    return true;
  }

  function setSearchQuery(q) {
    searchQuery.value = q;
  }

  function setStatusFilter(status) {
    statusFilter.value = status;
  }

  async function deleteProject(projectKey) {
    if (!projectKey) return false;
    const targetKey = projectKey.toUpperCase();
    const index = projects.value.findIndex((p) => p.key.toUpperCase() === targetKey);
    if (index === -1) return false;

    const removedProject = projects.value[index];

    const uiStore = useUiStore();
    const opId = `project-delete-${targetKey}`;
    uiStore.startOperation(opId, `Deleting Workspace ${targetKey}...`);

    try {
      await projectsApi.delete(targetKey);
    } catch (err) {
      console.warn('API delete project failed, applied locally:', err.message);
    } finally {
      uiStore.endOperation(opId);
    }

    projects.value.splice(index, 1);

    if (activeProjectKey.value?.toUpperCase() === targetKey) {
      activeProjectKey.value = projects.value[0]?.key || null;
    }

    try {
      const activityStore = useActivityStore();
      activityStore.recordActivity({
        projectKey: targetKey,
        type: 'project',
        action: 'project_deleted',
        targetType: 'project',
        targetId: removedProject.id,
        targetKey: removedProject.key,
        targetTitle: removedProject.name,
        message: `deleted project workspace ${removedProject.name} (${targetKey})`,
        metadata: { projectKey: targetKey, projectName: removedProject.name }
      });
    } catch (e) {
      console.warn('Could not record activity:', e);
    }

    return true;
  }

  return {
    projects,
    activeProjectKey,
    searchQuery,
    statusFilter,
    isLoading,
    error,
    isInitialized,
    rawProjects,
    allProjects,
    filteredProjects,
    activeProject,
    allWorkspaceMembers,
    fetchProjects,
    getProjectByKey,
    isMemberOfProject,
    setActiveProjectKey,
    setCurrentProject: setActiveProjectKey,
    currentProjectKey: activeProjectKey,
    createProject,
    deleteProject,
    addMemberToProject,
    removeMemberFromProject,
    setSearchQuery,
    setStatusFilter,
    resetProjectState
  };
});
