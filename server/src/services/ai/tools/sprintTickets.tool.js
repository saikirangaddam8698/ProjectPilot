/**
 * Tool: list_sprint_tickets
 * Returns concise list of tickets inside an active or specified sprint
 */
import { SprintRepository } from '../../../repositories/sprint.repository.js';
import { TicketRepository } from '../../../repositories/ticket.repository.js';

export const sprintTicketsTool = {
  name: 'list_sprint_tickets',
  description: 'List all tickets currently committed to a specific sprint or active sprint.',
  parameters: {
    type: 'OBJECT',
    properties: {
      projectKey: {
        type: 'STRING',
        description: 'The project key (e.g. PILOT).'
      },
      sprintId: {
        type: 'STRING',
        description: 'Optional sprint ID. If omitted, uses the currently active sprint.'
      },
      status: {
        type: 'STRING',
        description: 'Filter by ticket status in sprint.'
      },
      limit: {
        type: 'INTEGER',
        description: 'Maximum tickets to return (default 30, max 50).'
      }
    },
    required: ['projectKey']
  },

  async execute({ projectKey, sprintId, status, limit = 30 }) {
    const key = projectKey.toUpperCase();
    const maxLimit = Math.min(Math.max(parseInt(limit, 10) || 30, 1), 50);

    let targetSprint = null;
    let sprintTickets = [];

    if (sprintId) {
      targetSprint = await SprintRepository.findById(sprintId);
      if (targetSprint && targetSprint.project?.key?.toUpperCase() !== key) {
        return {
          projectKey: key,
          sprintId,
          sprintName: null,
          tickets: [],
          message: `Sprint "${sprintId}" does not belong to project "${key}".`
        };
      }
      if (targetSprint) {
        sprintTickets = Array.isArray(targetSprint.tickets)
          ? targetSprint.tickets
          : await TicketRepository.findAll({ sprintId: targetSprint.id });
      }
    } else {
      targetSprint = await SprintRepository.findActiveSprintWithTickets(key);
      if (targetSprint) {
        sprintTickets = Array.isArray(targetSprint.tickets) ? targetSprint.tickets : [];
      } else {
        const sprints = await SprintRepository.findAll({ projectKey: key });
        targetSprint = sprints.find((s) => s.status === 'ACTIVE') || sprints[0] || null;
        if (targetSprint) {
          sprintTickets = Array.isArray(targetSprint.tickets)
            ? targetSprint.tickets
            : await TicketRepository.findAll({ sprintId: targetSprint.id });
        }
      }
    }

    if (!targetSprint) {
      return {
        projectKey: key,
        sprintId: null,
        sprintName: null,
        tickets: [],
        message: `No sprint found for project "${key}".`
      };
    }

    if (status) {
      const s = status.toLowerCase();
      sprintTickets = sprintTickets.filter((t) => t.status.toLowerCase() === s);
    }

    const tickets = sprintTickets.slice(0, maxLimit).map((t) => ({
      key: t.key,
      title: t.title,
      status: t.status,
      priority: t.priority,
      assignee: t.assignee?.name || 'Unassigned',
      storyPoints: t.storyPoints || 0
    }));

    return {
      projectKey: key,
      sprintId: targetSprint.id,
      sprintName: targetSprint.name,
      sprintStatus: targetSprint.status,
      tickets,
      count: sprintTickets.length,
      returned: tickets.length
    };
  }
};
