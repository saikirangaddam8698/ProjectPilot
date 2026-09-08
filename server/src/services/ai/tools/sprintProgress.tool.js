/**
 * Tool: get_sprint_progress
 * Computes active/specified sprint velocity, progress metrics, and completion percentage.
 *
 * Performance optimisation: for the active sprint path (no sprintId provided),
 * uses SprintRepository.findActiveSprintWithTickets() which is a single DB query
 * that fetches ONLY the active sprint + its tickets with assignee data.
 * Previously the tool made 2 separate DB calls:
 *   1. SprintRepository.findAll() — loaded ALL sprints with ALL tickets
 *   2. TicketRepository.findAll() — loaded ALL project tickets again
 * Both roundtrips to Neon cloud DB are now replaced with a single targeted query.
 */
import { SprintRepository } from '../../../repositories/sprint.repository.js';

// Status values as stored in the DB after TicketRepository enum mapping
const STATUS_DONE = 'Done';
const STATUS_IN_PROGRESS = 'In Progress';
const STATUS_IN_REVIEW = 'In Review';
const STATUS_TODO = 'Todo';
const STATUS_BACKLOG = 'Backlog';

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
      // Specific sprint requested — use findById (already includes tickets)
      targetSprint = await SprintRepository.findById(sprintId);
      if (targetSprint && targetSprint.project?.key?.toUpperCase() !== key) {
        return {
          projectKey: key,
          message: `Sprint "${sprintId}" does not belong to project "${key}".`,
          sprint: null,
          metrics: null
        };
      }
    } else {
      // Active sprint path — single optimised query (replaces 2 separate DB calls)
      targetSprint = await SprintRepository.findActiveSprintWithTickets(key);

      // Fallback: if no active sprint, try the most recent sprint via findAll
      // (but only for listing, so we don't over-fetch tickets again)
      if (!targetSprint) {
        const sprints = await SprintRepository.findAll({ projectKey: key });
        const fallback = sprints[0] || null; // most recent
        if (fallback) {
          // Re-fetch with tickets using findById (already efficient)
          targetSprint = await SprintRepository.findById(fallback.id);
        }
      }
    }

    if (!targetSprint) {
      return {
        projectKey: key,
        message: `No sprint found for project "${key}".`,
        sprint: null,
        metrics: null
      };
    }

    // Use sprint.tickets already included — no second DB query needed
    // Handle both the new findActiveSprintWithTickets shape (status as DB enum)
    // and the findById shape (which goes through TicketRepository mapping).
    const rawTickets = targetSprint.tickets || [];

    // Normalise status strings — findActiveSprintWithTickets uses select (raw DB enums
    // like 'IN_PROGRESS'), findById uses TicketRepository includes (mapped strings).
    function normaliseStatus(s) {
      if (!s) return STATUS_TODO;
      const up = s.toUpperCase().replace(/\s+/g, '_');
      switch (up) {
        case 'DONE': return STATUS_DONE;
        case 'IN_PROGRESS': return STATUS_IN_PROGRESS;
        case 'IN_REVIEW': return STATUS_IN_REVIEW;
        case 'TODO': return STATUS_TODO;
        case 'BACKLOG': return STATUS_BACKLOG;
        default: return s; // already mapped
      }
    }

    function normalisePriority(p) {
      if (!p) return 'Medium';
      const up = p.toUpperCase();
      switch (up) {
        case 'LOW': return 'Low';
        case 'MEDIUM': return 'Medium';
        case 'HIGH': return 'High';
        case 'URGENT': return 'Urgent';
        default: return p;
      }
    }

    const sprintTickets = rawTickets.map((t) => ({
      ...t,
      status: normaliseStatus(t.status),
      priority: normalisePriority(t.priority)
    }));

    const totalTickets = sprintTickets.length;
    const completedTickets = sprintTickets.filter((t) => t.status === STATUS_DONE).length;
    const inProgressTickets = sprintTickets.filter((t) => t.status === STATUS_IN_PROGRESS).length;
    const inReviewTickets = sprintTickets.filter((t) => t.status === STATUS_IN_REVIEW).length;
    const todoTickets = sprintTickets.filter((t) => t.status === STATUS_TODO).length;
    const blockedTickets = sprintTickets.filter(
      (t) => t.priority === 'Urgent' && t.status !== STATUS_DONE
    ).length;

    const totalStoryPoints = sprintTickets.reduce((sum, t) => sum + (Number(t.storyPoints) || 0), 0);
    const completedStoryPoints = sprintTickets
      .filter((t) => t.status === STATUS_DONE)
      .reduce((sum, t) => sum + (Number(t.storyPoints) || 0), 0);
    const inProgressStoryPoints = sprintTickets
      .filter((t) => t.status === STATUS_IN_PROGRESS || t.status === STATUS_IN_REVIEW)
      .reduce((sum, t) => sum + (Number(t.storyPoints) || 0), 0);

    const completionPercentage = totalStoryPoints > 0
      ? Math.round((completedStoryPoints / totalStoryPoints) * 100)
      : totalTickets > 0
      ? Math.round((completedTickets / totalTickets) * 100)
      : 0;

    // Days remaining calculation
    let daysRemaining = null;
    if (targetSprint.endDate) {
      const now = new Date();
      const end = new Date(targetSprint.endDate);
      const diffMs = end.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    return {
      projectKey: key,
      sprint: {
        id: targetSprint.id,
        name: targetSprint.name,
        goal: targetSprint.goal || 'No sprint goal specified',
        status: targetSprint.status,
        startDate: targetSprint.startDate ? new Date(targetSprint.startDate).toISOString().split('T')[0] : null,
        endDate: targetSprint.endDate ? new Date(targetSprint.endDate).toISOString().split('T')[0] : null,
        daysRemaining,
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
        completedStoryPoints,
        inProgressStoryPoints,
        remainingStoryPoints: totalStoryPoints - completedStoryPoints
      },
      completionPercentage
    };
  }
};
