/**
 * Tool: list_project_tickets
 * Returns filtered tickets belonging to the selected project
 */
import { TicketRepository } from '../../../repositories/ticket.repository.js';
import { ApiError } from '../../../utils/apiError.js';

export const listProjectTicketsTool = {
  name: 'list_project_tickets',
  description: 'List and filter tickets for a project by status, priority, assignee, or sprint.',
  parameters: {
    type: 'OBJECT',
    properties: {
      projectKey: {
        type: 'STRING',
        description: 'The uppercase project key (e.g. PILOT, INFRA, MOBILE).'
      },
      status: {
        type: 'STRING',
        description: 'Filter by ticket status: Backlog, Todo, "In Progress", "In Review", or Done.'
      },
      priority: {
        type: 'STRING',
        description: 'Filter by ticket priority: Low, Medium, High, or Urgent.'
      },
      assignee: {
        type: 'STRING',
        description: 'Filter by assignee name or email substring.'
      },
      sprintId: {
        type: 'STRING',
        description: 'Filter by sprint ID.'
      },
      limit: {
        type: 'INTEGER',
        description: 'Maximum number of tickets to return (default 25, max 50).'
      }
    },
    required: ['projectKey']
  },

  async execute({ projectKey, status, priority, assignee, sprintId, limit = 25 }) {
    const key = projectKey.toUpperCase();
    const maxLimit = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 50);

    const allTickets = await TicketRepository.findAll({ projectKey: key });

    let filtered = allTickets;

    if (status) {
      const s = status.toLowerCase();
      filtered = filtered.filter((t) => t.status.toLowerCase() === s);
    }

    if (priority) {
      const p = priority.toLowerCase();
      filtered = filtered.filter((t) => t.priority.toLowerCase() === p);
    }

    if (assignee) {
      const a = assignee.toLowerCase();
      filtered = filtered.filter((t) => t.assignee?.name?.toLowerCase().includes(a) || t.assignee?.email?.toLowerCase().includes(a));
    }

    if (sprintId) {
      filtered = filtered.filter((t) => t.sprintId === sprintId);
    }

    const count = filtered.length;
    const tickets = filtered.slice(0, maxLimit).map((t) => ({
      key: t.key,
      title: t.title,
      status: t.status,
      priority: t.priority,
      type: t.type,
      assignee: t.assignee?.name || 'Unassigned',
      sprint: t.sprint?.name || 'Backlog',
      storyPoints: t.storyPoints || 0
    }));

    return {
      projectKey: key,
      tickets,
      count,
      returned: tickets.length
    };
  }
};
