/**
 * Tool: get_ticket_details
 * Returns full details for a single ticket within the specified project
 */
import { TicketRepository } from '../../../repositories/ticket.repository.js';
import { ApiError } from '../../../utils/apiError.js';

export const ticketDetailsTool = {
  name: 'get_ticket_details',
  description: 'Get complete details, description, assignee, reporter, and sprint for a specific ticket.',
  parameters: {
    type: 'OBJECT',
    properties: {
      projectKey: {
        type: 'STRING',
        description: 'The project key (e.g. PILOT).'
      },
      ticketKey: {
        type: 'STRING',
        description: 'The ticket identifier (e.g. PILOT-104).'
      }
    },
    required: ['projectKey', 'ticketKey']
  },

  async execute({ projectKey, ticketKey }) {
    const pKey = projectKey.toUpperCase();
    const tKey = ticketKey.toUpperCase();

    // Verify ticket key format matches project key
    if (!tKey.startsWith(`${pKey}-`)) {
      throw ApiError.badRequest(`Ticket key "${tKey}" does not belong to project "${pKey}".`);
    }

    const ticket = await TicketRepository.findByKey(tKey);
    if (!ticket) {
      return {
        error: `Ticket "${tKey}" was not found in project "${pKey}".`
      };
    }

    return {
      key: ticket.key,
      title: ticket.title,
      description: ticket.description || 'No description provided.',
      status: ticket.status,
      priority: ticket.priority,
      type: ticket.type,
      storyPoints: ticket.storyPoints || 0,
      assignee: ticket.assignee ? { name: ticket.assignee.name, email: ticket.assignee.email, role: ticket.assignee.role } : 'Unassigned',
      reporter: ticket.reporter ? { name: ticket.reporter.name } : 'Unknown',
      sprint: ticket.sprint ? { id: ticket.sprint.id, name: ticket.sprint.name, status: ticket.sprint.status } : 'Backlog',
      labels: ticket.labels ? ticket.labels.split(',').map((l) => l.trim()).filter(Boolean) : [],
      dueDate: ticket.dueDate ? new Date(ticket.dueDate).toISOString().split('T')[0] : null,
      createdAt: new Date(ticket.createdAt).toISOString(),
      updatedAt: new Date(ticket.updatedAt).toISOString()
    };
  }
};
