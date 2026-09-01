/**
 * Sprint Service — Business logic for Sprint domain
 */
import { SprintRepository } from '../repositories/sprint.repository.js';
import { ProjectRepository } from '../repositories/project.repository.js';
import { TicketRepository } from '../repositories/ticket.repository.js';
import { ApiError } from '../utils/apiError.js';

export class SprintService {
  /**
   * Format sprint entity for API response
   */
  static formatSprint(s) {
    if (!s) return null;

    return {
      id: s.id,
      projectKey: s.project?.key || '',
      name: s.name,
      goal: s.goal || '',
      status: s.status.toLowerCase(),
      startDate: s.startDate ? s.startDate.toISOString().slice(0, 10) : null,
      endDate: s.endDate ? s.endDate.toISOString().slice(0, 10) : null,
      capacity: s.capacity || 0,
      createdAt: s.createdAt,
      completedAt: s.completedAt
    };
  }

  static async getAllSprints(filters) {
    const sprints = await SprintRepository.findAll(filters);
    return sprints.map((s) => this.formatSprint(s));
  }

  static async getSprintById(id) {
    const sprint = await SprintRepository.findById(id);
    if (!sprint) {
      throw ApiError.notFound(`Sprint with ID "${id}" not found`);
    }
    return this.formatSprint(sprint);
  }

  static async createSprint({
    projectKey,
    projectId,
    name,
    goal = '',
    startDate,
    endDate,
    capacity = 30
  }) {
    let project = null;
    if (projectKey) {
      project = await ProjectRepository.findByKey(projectKey);
    } else if (projectId) {
      project = await ProjectRepository.findById(projectId);
    }

    if (!project) {
      throw ApiError.notFound(`Project not found`);
    }

    const existingSprints = await SprintRepository.findAll({ projectId: project.id });
    const id = `sprint-${project.key.toLowerCase()}-${existingSprints.length + 10}`;

    const sprint = await SprintRepository.create({
      id,
      projectId: project.id,
      name: name.trim(),
      goal: goal ? goal.trim() : '',
      status: 'PLANNED',
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : new Date(Date.now() + 14 * 86400000),
      capacity: Number(capacity) || 30
    });

    return this.formatSprint(sprint);
  }

  static async updateSprint(id, data) {
    const existing = await SprintRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound(`Sprint with ID "${id}" not found`);
    }

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.goal !== undefined) updateData.goal = data.goal.trim();
    if (data.status !== undefined) updateData.status = data.status.toUpperCase();
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.capacity !== undefined) updateData.capacity = Number(data.capacity) || 0;

    const updated = await SprintRepository.update(id, updateData);
    return this.formatSprint(updated);
  }

  static async startSprint(id) {
    const sprint = await SprintRepository.findById(id);
    if (!sprint) {
      throw ApiError.notFound(`Sprint with ID "${id}" not found`);
    }

    // Check if another sprint is currently active for this project
    const currentActive = await SprintRepository.findActiveSprint(sprint.projectId);
    if (currentActive && currentActive.id !== id) {
      throw ApiError.conflict(`Project already has an active sprint ("${currentActive.name}"). Complete it first before starting a new sprint.`);
    }

    const updated = await SprintRepository.update(id, { status: 'ACTIVE' });
    return this.formatSprint(updated);
  }

  static async completeSprint(id, { moveIncompleteTo = 'backlog' } = {}) {
    const sprint = await SprintRepository.findById(id);
    if (!sprint) {
      throw ApiError.notFound(`Sprint with ID "${id}" not found`);
    }

    // Find incomplete tickets in this sprint
    const sprintTickets = sprint.tickets || [];
    const incompleteTickets = sprintTickets.filter((t) => t.status !== 'DONE');

    if (incompleteTickets.length > 0) {
      const targetSprintId = moveIncompleteTo === 'backlog' || !moveIncompleteTo ? null : moveIncompleteTo;
      for (const ticket of incompleteTickets) {
        await TicketRepository.update(ticket.id, { sprintId: targetSprintId });
      }
    }

    const updated = await SprintRepository.completeSprint(id);
    return {
      sprint: this.formatSprint(updated),
      movedTicketsCount: incompleteTickets.length
    };
  }

  static async deleteSprint(id) {
    const sprint = await SprintRepository.findById(id);
    if (!sprint) {
      throw ApiError.notFound(`Sprint with ID "${id}" not found`);
    }

    // Reassign all tickets in this sprint back to backlog
    const sprintTickets = sprint.tickets || [];
    for (const ticket of sprintTickets) {
      await TicketRepository.update(ticket.id, { sprintId: null });
    }

    await SprintRepository.delete(id);
    return { id: sprint.id };
  }
}
