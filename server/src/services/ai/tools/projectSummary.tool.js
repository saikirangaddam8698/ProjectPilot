/**
 * Tool: get_project_summary
 * Returns concise project intelligence overview, team size, ticket breakdown, and sprint metrics
 */
import { ProjectRepository } from '../../../repositories/project.repository.js';
import { SprintRepository } from '../../../repositories/sprint.repository.js';
import { TicketRepository } from '../../../repositories/ticket.repository.js';

export const projectSummaryTool = {
  name: 'get_project_summary',
  description: 'Get an executive project summary including status, lead, team size, ticket counts by stage, and active sprint health.',
  parameters: {
    type: 'OBJECT',
    properties: {
      projectKey: {
        type: 'STRING',
        description: 'The project key (e.g. PILOT).'
      }
    },
    required: ['projectKey']
  },

  async execute({ projectKey }) {
    const key = projectKey.toUpperCase();

    const project = await ProjectRepository.findByKey(key);
    if (!project) {
      return {
        error: `Project "${key}" not found in database.`
      };
    }

    const tickets = await TicketRepository.findAll({ projectKey: key });
    const sprints = await SprintRepository.findAll({ projectKey: key });
    const activeSprint = sprints.find((s) => s.status === 'ACTIVE') || null;

    const todoCount = tickets.filter((t) => t.status === 'Todo' || t.status === 'Backlog').length;
    const inProgressCount = tickets.filter((t) => t.status === 'In Progress').length;
    const reviewCount = tickets.filter((t) => t.status === 'In Review').length;
    const doneCount = tickets.filter((t) => t.status === 'Done').length;
    const blockedCount = tickets.filter((t) => t.priority === 'Urgent' && t.status !== 'Done').length;

    let sprintInfo = {
      activeSprint: 'None',
      completionPercentage: 0,
      completedStoryPoints: 0,
      totalStoryPoints: 0
    };

    if (activeSprint) {
      const sprintTickets = tickets.filter((t) => t.sprintId === activeSprint.id);
      const sprintTotalPts = sprintTickets.reduce((sum, t) => sum + (Number(t.storyPoints) || 0), 0);
      const sprintDonePts = sprintTickets.filter((t) => t.status === 'Done').reduce((sum, t) => sum + (Number(t.storyPoints) || 0), 0);

      sprintInfo = {
        activeSprint: activeSprint.name,
        goal: activeSprint.goal || 'No goal set',
        completionPercentage: sprintTotalPts > 0 ? Math.round((sprintDonePts / sprintTotalPts) * 100) : 0,
        completedStoryPoints: sprintDonePts,
        totalStoryPoints: sprintTotalPts
      };
    }

    return {
      project: {
        key: project.key,
        name: project.name,
        description: project.description || 'No description provided',
        status: project.status,
        lead: project.lead ? project.lead.name : 'Unassigned'
      },
      tickets: {
        total: tickets.length,
        todo: todoCount,
        inProgress: inProgressCount,
        review: reviewCount,
        done: doneCount,
        blocked: blockedCount
      },
      sprint: sprintInfo,
      team: {
        memberCount: (project.members || []).length,
        members: (project.members || []).map((m) => `${m.member?.name || 'Unknown'} (${m.role})`)
      }
    };
  }
};
