/**
 * Activity Service — Business logic for Activity log / audit events
 */
import { ActivityRepository } from '../repositories/activity.repository.js';
import { ProjectRepository } from '../repositories/project.repository.js';
import { MemberRepository } from '../repositories/member.repository.js';
import { ApiError } from '../utils/apiError.js';

export class ActivityService {
  /**
   * Format activity entity for API response
   */
  static formatActivity(a) {
    if (!a) return null;

    return {
      id: a.id,
      projectKey: a.project?.key || '',
      actorId: a.actorId || null,
      actor: a.actor
        ? {
            id: a.actor.id,
            name: a.actor.name,
            avatar: a.actor.avatar,
            role: a.actor.role
          }
        : {
            id: 'm-1',
            name: 'Alex Morgan',
            avatar: 'AM',
            role: 'Project Admin'
          },
      type: a.type,
      action: a.action,
      targetType: a.targetType,
      targetId: a.targetId || '',
      targetKey: a.targetKey || '',
      targetTitle: a.targetTitle || '',
      message: a.message,
      metadata: a.metadata || {},
      createdAt: a.createdAt
    };
  }

  static async getAllActivities(filters) {
    const limit = filters.limit ? parseInt(filters.limit, 10) : 50;
    const offset = filters.offset ? parseInt(filters.offset, 10) : 0;
    const activities = await ActivityRepository.findAll({ ...filters, limit, offset });
    return activities.map((a) => this.formatActivity(a));
  }

  static async recordActivity({
    projectKey,
    actorId = null,
    type = 'ticket',
    action = 'updated',
    targetType = 'ticket',
    targetId = '',
    targetKey = '',
    targetTitle = '',
    message,
    metadata = {}
  }) {
    const project = await ProjectRepository.findByKey(projectKey);
    if (!project) {
      throw ApiError.notFound(`Project with key "${projectKey}" not found`);
    }

    let finalActorId = actorId;
    if (!finalActorId) {
      const defaultActor = await MemberRepository.findByEmail('alex.m@projectpilot.dev');
      finalActorId = defaultActor?.id || null;
    }

    const activity = await ActivityRepository.createActivity({
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      projectId: project.id,
      actorId: finalActorId,
      type,
      action,
      targetType,
      targetId: targetId || null,
      targetKey: targetKey || null,
      targetTitle: targetTitle || null,
      message,
      metadata
    });

    return this.formatActivity(activity);
  }
}
