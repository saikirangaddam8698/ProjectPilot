/**
 * Tool: get_project_activity
 * Returns recent activity and audit log events for a project
 */
import { ActivityRepository } from '../../../repositories/activity.repository.js';

export const projectActivityTool = {
  name: 'get_project_activity',
  description: 'Get recent project activity, ticket updates, assignments, and sprint actions from the audit log.',
  parameters: {
    type: 'OBJECT',
    properties: {
      projectKey: {
        type: 'STRING',
        description: 'The project key (e.g. PILOT).'
      },
      limit: {
        type: 'INTEGER',
        description: 'Number of recent activities to fetch (default 10, max 25).'
      },
      type: {
        type: 'STRING',
        description: 'Optional filter by activity type (e.g. TICKET, SPRINT, PROJECT).'
      }
    },
    required: ['projectKey']
  },

  async execute({ projectKey, limit = 10, type }) {
    const key = projectKey.toUpperCase();
    const maxLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 25);

    const allActivities = await ActivityRepository.findAll({ projectKey: key, limit: maxLimit, type });

    const activities = allActivities.map((a) => {
      const meta = (a.metadata && typeof a.metadata === 'object') ? a.metadata : {};
      const actorName = a.actor?.name || 'A team member';
      const actorRole = a.actor?.role || null;
      const createdAtIso = new Date(a.createdAt).toISOString();
      const oldVal = meta.fromStatus || meta.fromPriority || meta.previousStatus || meta.previousPriority || null;
      const newVal = meta.toStatus || meta.toPriority || meta.newStatus || meta.newPriority || null;

      return {
        actor: actorName,
        actorName,
        actorRole,
        type: a.type,
        action: a.action,
        targetType: a.targetType,
        targetKey: a.targetKey || null,
        targetTitle: a.targetTitle || null,
        message: a.message || null,
        oldValue: oldVal,
        newValue: newVal,
        priority: meta.toPriority || meta.priority || null,
        status: meta.toStatus || meta.status || null,
        sprintName: meta.sprintName || (a.targetType === 'sprint' ? a.targetTitle : null),
        dueDate: meta.dueDate || null,
        metadata: meta,
        createdAt: createdAtIso,
        timestamp: createdAtIso
      };
    });

    return {
      projectKey: key,
      activities,
      count: activities.length
    };
  }
};

