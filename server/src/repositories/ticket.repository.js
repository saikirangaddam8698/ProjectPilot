/**
 * Ticket Repository — Data Access Layer for Ticket entities
 */
import { prisma } from '../db/prisma.js';

export class TicketRepository {
  /**
   * Map database enums to frontend string representation
   */
  static mapEnumToStatus(status) {
    switch (status) {
      case 'BACKLOG': return 'Backlog';
      case 'TODO': return 'Todo';
      case 'IN_PROGRESS': return 'In Progress';
      case 'IN_REVIEW': return 'In Review';
      case 'DONE': return 'Done';
      case 'REOPENED': return 'Reopened';
      default: return 'Todo';
    }
  }

  static mapStatusToEnum(status) {
    if (!status) return 'TODO';
    const s = status.toUpperCase().replace(/\s+/g, '_');
    if (['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'REOPENED'].includes(s)) {
      return s;
    }
    return 'TODO';
  }

  static mapEnumToPriority(priority) {
    switch (priority) {
      case 'LOW': return 'Low';
      case 'MEDIUM': return 'Medium';
      case 'HIGH': return 'High';
      case 'URGENT': return 'Urgent';
      default: return 'Medium';
    }
  }

  static mapPriorityToEnum(priority) {
    if (!priority) return 'MEDIUM';
    const p = priority.toUpperCase().replace(/\s+/g, '_');
    if (['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(p)) {
      return p;
    }
    return 'MEDIUM';
  }

  static mapEnumTypeToType(type) {
    switch (type) {
      case 'TASK': return 'Task';
      case 'BUG': return 'Bug';
      case 'STORY': return 'Story';
      case 'EPIC': return 'Epic';
      default: return 'Task';
    }
  }

  static mapTypeToEnum(type) {
    if (!type) return 'TASK';
    const t = type.toUpperCase().replace(/\s+/g, '_');
    if (['TASK', 'BUG', 'STORY', 'EPIC'].includes(t)) {
      return t;
    }
    return 'TASK';
  }

  /**
   * Find all tickets with flexible filtering
   */
  static async findAll({
    projectId,
    projectKey,
    sprintId,
    status,
    priority,
    type,
    assigneeId,
    search,
    isBacklog,
    allowedProjectKeys
  } = {}) {
    const where = {};

    if (projectId) where.projectId = projectId;
    if (projectKey && projectKey !== 'all') {
      where.project = { key: projectKey.toUpperCase() };
    } else if (Array.isArray(allowedProjectKeys)) {
      where.project = { key: { in: allowedProjectKeys.map((k) => k.toUpperCase()) } };
    }
    if (sprintId !== undefined) {
      if (sprintId === null || sprintId === 'backlog' || isBacklog) {
        where.sprintId = null;
      } else if (sprintId !== 'all') {
        where.sprintId = sprintId;
      }
    }
    if (status && status !== 'all') where.status = this.mapStatusToEnum(status);
    if (priority && priority !== 'all') where.priority = this.mapPriorityToEnum(priority);
    if (type && type !== 'all') where.type = this.mapTypeToEnum(type);
    if (assigneeId && assigneeId !== 'all') where.assigneeId = assigneeId;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { key: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    return prisma.ticket.findMany({
      where,
      include: {
        assignee: true,
        reporter: true,
        sprint: true,
        project: {
          select: { id: true, key: true, name: true }
        }
      },
      orderBy: [{ rank: 'asc' }, { createdAt: 'desc' }]
    });
  }

  /**
   * Find ticket by unique ID
   */
  static async findById(id) {
    return prisma.ticket.findUnique({
      where: { id },
      include: {
        assignee: true,
        reporter: true,
        sprint: true,
        project: true
      }
    });
  }

  /**
   * Find ticket by unique Key (e.g. 'PILOT-89')
   */
  static async findByKey(key) {
    if (!key) return null;
    return prisma.ticket.findUnique({
      where: { key: key.toUpperCase() },
      include: {
        assignee: true,
        reporter: true,
        sprint: true,
        project: true
      }
    });
  }

  /**
   * Find max rank in a project
   */
  static async getMaxRank(projectId) {
    const ticket = await prisma.ticket.findFirst({
      where: { projectId },
      orderBy: { rank: 'desc' },
      select: { rank: true }
    });
    return ticket?.rank || 0;
  }

  /**
   * Find max ticket number for a project key
   */
  static async getMaxTicketNumber(projectKey) {
    const tickets = await prisma.ticket.findMany({
      where: { project: { key: projectKey.toUpperCase() } },
      select: { key: true }
    });

    let max = 0;
    tickets.forEach((t) => {
      const parts = t.key.split('-');
      if (parts.length === 2) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > max) max = num;
      }
    });
    return max;
  }

  /**
   * Create a new ticket
   */
  static async create(data) {
    return prisma.ticket.create({
      data,
      include: {
        assignee: true,
        reporter: true,
        sprint: true,
        project: true
      }
    });
  }

  /**
   * Update an existing ticket
   */
  static async update(id, data) {
    return prisma.ticket.update({
      where: { id },
      data,
      include: {
        assignee: true,
        reporter: true,
        sprint: true,
        project: true
      }
    });
  }

  /**
   * Reassign all open tickets assigned to a specific member
   */
  static async reassignMemberTickets(memberId, newAssigneeId = null) {
    return prisma.ticket.updateMany({
      where: {
        assigneeId: memberId,
        status: { not: 'DONE' }
      },
      data: {
        assigneeId: newAssigneeId
      }
    });
  }

  /**
   * Delete a ticket
   */
  static async delete(id) {
    return prisma.ticket.delete({
      where: { id }
    });
  }
}
