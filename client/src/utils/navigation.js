export const NAVIGATION_GROUPS = [
  {
    id: 'work',
    label: 'Core Work',
    items: [
      {
        name: 'Dashboard',
        path: '/dashboard',
        icon: 'dashboard',
        description: 'Overview of active projects, sprints, and recent tasks'
      },
      {
        name: 'Projects',
        path: '/projects',
        icon: 'projects',
        description: 'Manage active workspaces and team repositories'
      },
      {
        name: 'My Work',
        path: '/my-work',
        icon: 'my-work',
        description: 'Assigned tickets, open pull requests, and mentions'
      },
      {
        name: 'Tickets',
        path: '/tickets',
        icon: 'tickets',
        description: 'Kanban boards and customizable ticket lists'
      },
      {
        name: 'Sprints',
        path: '/sprints',
        icon: 'sprints',
        description: 'Sprint planning, backlog prioritization, and velocity'
      }
    ]
  },
  {
    id: 'intelligence',
    label: 'Intelligence & Docs',
    items: [
      {
        name: 'Analytics',
        path: '/analytics',
        icon: 'analytics',
        description: 'Velocity trends, burndown metrics, and cycle time'
      },
      {
        name: 'AI Assistant',
        path: '/ai',
        icon: 'ai',
        badge: 'Gemini',
        badgeVariant: 'purple',
        description: 'Project intelligence agent and context-aware copilot'
      },
      {
        name: 'Knowledge Base',
        path: '/knowledge',
        icon: 'knowledge',
        description: 'Engineering documentation, playbooks, and specifications'
      }
    ]
  },
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      {
        name: 'Team',
        path: '/team',
        icon: 'team',
        description: 'Team members, permissions, and workload capacity'
      },
      {
        name: 'Settings',
        path: '/settings',
        icon: 'settings',
        description: 'Workspace configuration and integration settings'
      }
    ]
  }
];
