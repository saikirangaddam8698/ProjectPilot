/**
 * Tool: get_sprint_progress
 * Computes active/specified sprint velocity, progress metrics, and completion percentage
 */
import { SprintRepository } from '../../../repositories/sprint.repository.js';
import { TicketRepository } from '../../../repositories/ticket.repository.js';

export const sprintProgressTool = {
  name: 'get_sprint_progress',
  description: 'Get sprint progress, velocity, metrics, and completion percentage for the active or specified sprint.',
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
      }
    },
    required: ['projectKey']
  },

  async execute({ projectKey, sprintId }) {
    const key = projectKey.toUpperCase();

    let targetSprint = null;
    if (sprintId) {
      targetSprint = await SprintRepository.findById(sprintId);
    } else {
      const sprints = await SprintRepository.findAll({ projectKey: key });
      targetSprint = sprints.find((s) => s.status === 'ACTIVE') || sprints[0] || null;
    }

    if (!targetSprint) {
      return {
        projectKey: key,
        message: `No sprint found for project "${key}".`,
        sprint: null,
        metrics: null
      };
    }

    const tickets = await TicketRepository.findAll({ projectKey: key });
    const sprintTickets = tickets.filter((t) => t.sprintId === targetSprint.id);

    const totalTickets = sprintTickets.length;
    const completedTickets = sprintTickets.filter((t) => t.status === 'Done').length;
    const inProgressTickets = sprintTickets.filter((t) => t.status === 'In Progress').length;
    const inReviewTickets = sprintTickets.filter((t) => t.status === 'In Review').length;
    const todoTickets = sprintTickets.filter((t) => t.status === 'Todo').length;
    const blockedTickets = sprintTickets.filter((t) => t.priority === 'Urgent' && t.status !== 'Done').length;

    const totalStoryPoints = sprintTickets.reduce((sum, t) => sum + (Number(t.storyPoints) || 0), 0);
    const completedStoryPoints = sprintTickets
      .filter((t) => t.status === 'Done')
      .reduce((sum, t) => sum + (Number(t.storyPoints) || 0), 0);

    const completionPercentage = totalStoryPoints > 0
      ? Math.round((completedStoryPoints / totalStoryPoints) * 100)
      : totalTickets > 0
      ? Math.round((completedTickets / totalTickets) * 100)
      : 0;

    return {
      projectKey: key,
      sprint: {
        id: targetSprint.id,
        name: targetSprint.name,
        goal: targetSprint.goal || 'No sprint goal specified',
        status: targetSprint.status,
        startDate: targetSprint.startDate ? new Date(targetSprint.startDate).toISOString().split('T')[0] : null,
        endDate: targetSprint.endDate ? new Date(targetSprint.endDate).toISOString().split('T')[0] : null,
        capacity: targetSprint.capacity || null
      },
      metrics: {
        totalTickets,
        completedTickets,
        inProgressTickets,
        inReviewTickets,
        todoTickets,
        blockedTickets,
        totalStoryPoints,
        completedStoryPoints
      },
      completionPercentage
    };
  }
};
