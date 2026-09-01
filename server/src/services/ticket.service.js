/**
 * Ticket Service — Business logic for Ticket domain
 */
import { TicketRepository } from '../repositories/ticket.repository.js';
import { ProjectRepository } from '../repositories/project.repository.js';
import { MemberRepository } from '../repositories/member.repository.js';
import { ApiError } from '../utils/apiError.js';

export class TicketService {
  /**
   * Format ticket entity for API response
   */
  static formatTicket(t) {
    if (!t) return null;

    return {
      id: t.id,
      key: t.key,
      projectKey: t.project?.key || '',
      title: t.title,
      description: t.description || '',
      type: TicketRepository.mapEnumTypeToType(t.type),
      status: TicketRepository.mapEnumToStatus(t.status),
      priority: TicketRepository.mapEnumToPriority(t.priority),
      assignee: t.assignee
        ? {
            id: t.assignee.id,
            name: t.assignee.name,
            avatar: t.assignee.avatar,
            role: t.assignee.role
          }
        : null,
      reporter: t.reporter
        ? {
            id: t.reporter.id,
            name: t.reporter.name,
            avatar: t.reporter.avatar
          }
        : null,
      sprintId: t.sprintId || null,
      sprint: t.sprint?.name || (t.sprintId ? 'Assigned Sprint' : 'Backlog'),
      storyPoints: t.storyPoints || 0,
      rank: t.rank || 100,
      labels: t.labels || [],
      dueDate: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    };
  }

  static async getAllTickets(filters) {
    const tickets = await TicketRepository.findAll(filters);
    return tickets.map((t) => this.formatTicket(t));
  }

  static async getTicketByKey(key) {
    const ticket = await TicketRepository.findByKey(key);
    if (!ticket) {
      throw ApiError.notFound(`Ticket with key "${key}" not found`);
    }
    return this.formatTicket(ticket);
  }

  static async createTicket({
    projectKey,
    title,
    description = '',
    type = 'Task',
    priority = 'Medium',
    status = 'Todo',
    assigneeId = null,
    reporterId = null,
    sprintId = null,
    storyPoints = 3,
    labels = [],
    dueDate = null
  }) {
    const project = await ProjectRepository.findByKey(projectKey);
    if (!project) {
      throw ApiError.notFound(`Project with key "${projectKey}" not found`);
    }

    const maxNum = await TicketRepository.getMaxTicketNumber(projectKey);
    const nextNum = maxNum > 0 ? maxNum + 1 : 101;
    const ticketKey = `${projectKey.toUpperCase()}-${nextNum}`;

    const maxRank = await TicketRepository.getMaxRank(project.id);

    // Validate or default assignee
    let finalAssigneeId = assigneeId;
    if (!finalAssigneeId) {
      const defaultMember = await MemberRepository.findByEmail('alex.m@projectpilot.dev');
      finalAssigneeId = defaultMember?.id || null;
    }

    // Validate or default reporter
    let finalReporterId = reporterId;
    if (!finalReporterId) {
      finalReporterId = finalAssigneeId;
    }

    const ticket = await TicketRepository.create({
      id: `t-${ticketKey.toLowerCase()}`,
      key: ticketKey,
      projectId: project.id,
      title: title.trim(),
      description: description ? description.trim() : '',
      type: TicketRepository.mapTypeToEnum(type),
      status: TicketRepository.mapStatusToEnum(status),
      priority: TicketRepository.mapPriorityToEnum(priority),
      assigneeId: finalAssigneeId,
      reporterId: finalReporterId,
      sprintId: sprintId || null,
      storyPoints: Number(storyPoints) || 0,
      rank: maxRank + 100,
      labels: Array.isArray(labels) ? labels : typeof labels === 'string' ? labels.split(',').map((l) => l.trim()).filter(Boolean) : [],
      dueDate: dueDate ? new Date(dueDate) : null
    });

    return this.formatTicket(ticket);
  }

  static async updateTicket(key, updates) {
    const existing = await TicketRepository.findByKey(key);
    if (!existing) {
      throw ApiError.notFound(`Ticket with key "${key}" not found`);
    }

    const data = {};
    if (updates.title !== undefined) data.title = updates.title.trim();
    if (updates.description !== undefined) data.description = updates.description.trim();
    if (updates.type !== undefined) data.type = TicketRepository.mapTypeToEnum(updates.type);
    if (updates.status !== undefined) data.status = TicketRepository.mapStatusToEnum(updates.status);
    if (updates.priority !== undefined) data.priority = TicketRepository.mapPriorityToEnum(updates.priority);
    if (updates.assigneeId !== undefined) data.assigneeId = updates.assigneeId;
    if (updates.reporterId !== undefined) data.reporterId = updates.reporterId;
    if (updates.sprintId !== undefined) data.sprintId = updates.sprintId;
    if (updates.storyPoints !== undefined) data.storyPoints = Number(updates.storyPoints) || 0;
    if (updates.rank !== undefined) data.rank = Number(updates.rank);
    if (updates.labels !== undefined) {
      data.labels = Array.isArray(updates.labels)
        ? updates.labels
        : typeof updates.labels === 'string'
          ? updates.labels.split(',').map((l) => l.trim()).filter(Boolean)
          : [];
    }
    if (updates.dueDate !== undefined) {
      data.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
    }

    const updated = await TicketRepository.update(existing.id, data);
    return this.formatTicket(updated);
  }

  static async updateTicketStatus(key, status) {
    return this.updateTicket(key, { status });
  }

  static async updateTicketPriority(key, priority) {
    return this.updateTicket(key, { priority });
  }

  static async updateTicketAssignee(key, assigneeId) {
    return this.updateTicket(key, { assigneeId });
  }

  static async assignTicketToSprint(key, sprintId) {
    return this.updateTicket(key, { sprintId });
  }

  static async reassignMemberTickets(projectKey, memberId, newAssigneeId = null) {
    const project = await ProjectRepository.findByKey(projectKey);
    if (!project) {
      throw ApiError.notFound(`Project with key "${projectKey}" not found`);
    }

    const res = await TicketRepository.reassignMemberTickets(memberId, newAssigneeId);
    return { count: res.count };
  }

  static async reorderBacklog(projectKey, orderedKeys) {
    if (!Array.isArray(orderedKeys)) return [];

    const updates = [];
    for (let i = 0; i < orderedKeys.length; i++) {
      const key = orderedKeys[i];
      const ticket = await TicketRepository.findByKey(key);
      if (ticket && ticket.project?.key.toUpperCase() === projectKey.toUpperCase()) {
        const updated = await TicketRepository.update(ticket.id, { rank: (i + 1) * 100 });
        updates.push(this.formatTicket(updated));
      }
    }
    return updates;
  }

  static async deleteTicket(key) {
    const ticket = await TicketRepository.findByKey(key);
    if (!ticket) {
      throw ApiError.notFound(`Ticket with key "${key}" not found`);
    }

    await TicketRepository.delete(ticket.id);
    return { key: ticket.key, id: ticket.id };
  }
}
