/**
 * AI Project Context Builder
 * Constructs concise, structured, sanitized markdown context from PostgreSQL
 */
import { ProjectRepository } from '../repositories/project.repository.js';
import { SprintRepository } from '../repositories/sprint.repository.js';
import { TicketRepository } from '../repositories/ticket.repository.js';
import { ActivityRepository } from '../repositories/activity.repository.js';

export class AiContextBuilder {
  /**
   * Build project-scoped context string for LLM prompting
   * @param {string} projectKey
   * @param {object} user - Authenticated user context
   * @returns {Promise<string>} Structured markdown context
   */
  static async buildContext(projectKey, user) {
    const key = projectKey.toUpperCase();

    // 1. Fetch project details
    const project = await ProjectRepository.findByKey(key);
    if (!project) {
      return `Project "${key}" not found in database.`;
    }

    // 2. Fetch sprints
    const sprints = await SprintRepository.findAll({ projectKey: key });
    const activeSprint = sprints.find((s) => s.status === 'ACTIVE');
    const plannedSprints = sprints.filter((s) => s.status === 'PLANNED');

    // 3. Fetch tickets
    const tickets = await TicketRepository.findAll({ projectKey: key });

    // 4. Fetch recent project activities (last 8)
    const activities = await ActivityRepository.findAll({ projectKey: key, limit: 8 });

    // Calculate metrics
    const totalTickets = tickets.length;
    const doneTickets = tickets.filter((t) => t.status === 'Done');
    const inProgressTickets = tickets.filter((t) => t.status === 'In Progress');
    const inReviewTickets = tickets.filter((t) => t.status === 'In Review');
    const todoTickets = tickets.filter((t) => t.status === 'Todo');
    const backlogTickets = tickets.filter((t) => t.status === 'Backlog');
    const urgentTickets = tickets.filter((t) => t.priority === 'Urgent' && t.status !== 'Done');

    const totalPoints = tickets.reduce((sum, t) => sum + (Number(t.storyPoints) || 0), 0);
    const completedPoints = doneTickets.reduce((sum, t) => sum + (Number(t.storyPoints) || 0), 0);
    const inFlightPoints = inProgressTickets.reduce((sum, t) => sum + (Number(t.storyPoints) || 0), 0);

    // Format active members (without sensitive data)
    const membersList = (project.members || [])
      .map((m) => `${m.member?.name || 'Unknown'} (${m.role})`)
      .join(', ') || 'None assigned';

    // Format active sprint block
    let sprintSection = 'No active sprint currently running.';
    if (activeSprint) {
      const sprintTickets = tickets.filter((t) => t.sprintId === activeSprint.id);
      const sprintPoints = sprintTickets.reduce((sum, t) => sum + (Number(t.storyPoints) || 0), 0);
      const sprintDonePoints = sprintTickets.filter((t) => t.status === 'Done').reduce((sum, t) => sum + (Number(t.storyPoints) || 0), 0);

      sprintSection = `
**Active Sprint:** ${activeSprint.name}
- Goal: ${activeSprint.goal || 'No goal set'}
- Dates: ${activeSprint.startDate ? new Date(activeSprint.startDate).toISOString().split('T')[0] : 'N/A'} to ${activeSprint.endDate ? new Date(activeSprint.endDate).toISOString().split('T')[0] : 'N/A'}
- Sprint Velocity: ${sprintDonePoints}/${sprintPoints} points completed (${sprintTickets.length} tickets assigned)
`.trim();
    }

    // Format urgent blockers
    let blockersSection = 'No urgent blockers active.';
    if (urgentTickets.length > 0) {
      blockersSection = urgentTickets
        .map((t) => `- [${t.key}] ${t.title} (Status: ${t.status}, Assignee: ${t.assignee?.name || 'Unassigned'}, Points: ${t.storyPoints || 0})`)
        .join('\n');
    }

    // Format active work (In Progress & In Review)
    const activeWork = [...inProgressTickets, ...inReviewTickets];
    let activeWorkSection = 'No tickets currently in active development or review.';
    if (activeWork.length > 0) {
      activeWorkSection = activeWork
        .slice(0, 8)
        .map((t) => `- [${t.key}] ${t.title} (Status: ${t.status}, Priority: ${t.priority}, Assignee: ${t.assignee?.name || 'Unassigned'})`)
        .join('\n');
    }

    // Format recent activity log
    let activitySection = 'No recent activity recorded.';
    if (activities.length > 0) {
      activitySection = activities
        .slice(0, 6)
        .map((a) => `- ${a.message} (by ${a.actor?.name || 'System'}, ${new Date(a.createdAt).toISOString().split('T')[0]})`)
        .join('\n');
    }

    return `
# PROJECT CONTEXT: ${project.name} (${project.key})
- **Status:** ${project.status}
- **Description:** ${project.description || 'No description provided'}
- **Project Lead:** ${project.lead?.name || 'Unassigned'}
- **Team Members:** ${membersList}
- **Current Metrics:** Total: ${totalTickets} tickets | Committed: ${totalPoints} pts | Completed: ${completedPoints} pts | In-Flight: ${inFlightPoints} pts
- **Ticket Breakdown:** Backlog: ${backlogTickets.length} | Todo: ${todoTickets.length} | In Progress: ${inProgressTickets.length} | In Review: ${inReviewTickets.length} | Done: ${doneTickets.length}

## SPRINT STATUS
${sprintSection}
- Planned Sprints: ${plannedSprints.length > 0 ? plannedSprints.map((s) => s.name).join(', ') : 'None'}

## URGENT BLOCKERS & IMPEDIMENTS
${blockersSection}

## ACTIVE WORK IN FLIGHT
${activeWorkSection}

## RECENT AUDIT LOG & ACTIVITIES
${activitySection}
`.trim();
  }
}
