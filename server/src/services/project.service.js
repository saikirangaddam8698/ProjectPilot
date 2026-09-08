/**
 * Project Service — Business logic for Project domain
 */
import { ProjectRepository } from '../repositories/project.repository.js';
import { MemberRepository } from '../repositories/member.repository.js';
import { ApiError } from '../utils/apiError.js';

export class ProjectService {
  /**
   * Format project entity for API response
   */
  static formatProject(p) {
    if (!p) return null;

    const tickets = p.tickets || [];
    const totalTickets = tickets.length;
    const openTickets = tickets.filter((t) => t.status !== 'DONE').length;
    const blockedTickets = tickets.filter((t) => t.priority === 'URGENT' && t.status !== 'DONE').length;
    const criticalBugs = tickets.filter((t) => t.priority === 'URGENT' && t.type === 'BUG' && t.status !== 'DONE').length;
    const completedTickets = tickets.filter((t) => t.status === 'DONE').length;
    const progress = totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 0;

    const activeSprint = (p.sprints || []).find((s) => s.status === 'ACTIVE') || null;

    return {
      id: p.id,
      key: p.key,
      name: p.name,
      description: p.description || '',
      status: p.status.toLowerCase(),
      lead: p.lead
        ? {
            id: p.lead.id,
            name: p.lead.name,
            avatar: p.lead.avatar,
            email: p.lead.email,
            role: p.lead.role
          }
        : null,
      members: (p.members || []).map((pm) => ({
        id: pm.member.id,
        name: pm.member.name,
        avatar: pm.member.avatar,
        email: pm.member.email,
        role: pm.role || pm.member.role,
        department: pm.member.department,
        status: pm.member.status === 'ACTIVE' ? 'Active' : pm.member.status === 'AWAY' ? 'Away' : 'Offline',
        skills: pm.member.skills || [],
        capacity: pm.member.capacity
      })),
      ticketCount: totalTickets,
      activeSprint: activeSprint
        ? {
            id: activeSprint.id,
            name: activeSprint.name,
            goal: activeSprint.goal,
            status: activeSprint.status.toLowerCase(),
            startDate: activeSprint.startDate,
            endDate: activeSprint.endDate,
            capacity: activeSprint.capacity
          }
        : null,
      health: {
        progress,
        openTickets,
        blockedTickets,
        criticalBugs
      },
      createdAt: p.createdAt
    };
  }

  static async getAllProjects(filters = {}) {
    const { status, search, user } = filters;
    let memberId = null;
    let projectKeys = null;

    if (user && user.role !== 'ADMIN') {
      if (user.memberId) {
        memberId = user.memberId;
      } else if (Array.isArray(user.projectKeys)) {
        projectKeys = user.projectKeys;
      }
    }

    const projects = await ProjectRepository.findAll({ status, search, memberId, projectKeys });
    return projects.map((p) => this.formatProject(p));
  }

  static async getProjectByKey(key) {
    const project = await ProjectRepository.findByKey(key);
    if (!project) {
      throw ApiError.notFound(`Project with key "${key}" not found`);
    }
    return this.formatProject(project);
  }

  static async createProject({ name, key, description, status, leadName, leadEmail }) {
    const formattedKey = (key ? key.trim() : name.slice(0, 4)).toUpperCase();

    const existing = await ProjectRepository.findByKey(formattedKey);
    if (existing) {
      throw ApiError.conflict(`Project with key "${formattedKey}" already exists`);
    }

    const leadInitials = leadName
      ? leadName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'PM';

    const email = leadEmail || `${(leadName || 'lead').toLowerCase().replace(/\s+/g, '.')}@projectpilot.dev`;

    // Find or create lead member
    let lead = await MemberRepository.findByEmail(email);
    if (!lead) {
      lead = await MemberRepository.create({
        id: `m-${Date.now()}`,
        name: leadName || 'Alex Morgan',
        avatar: leadInitials,
        email,
        role: 'Project Admin',
        department: 'Architecture & Engineering',
        status: 'ACTIVE',
        skills: ['Vue 3', 'Node.js', 'System Design'],
        capacity: 20
      });
    }

    const project = await ProjectRepository.create({
      id: `proj-${formattedKey.toLowerCase()}`,
      key: formattedKey,
      name: name.trim(),
      description: description ? description.trim() : '',
      status: (status || 'ACTIVE').toUpperCase(),
      leadId: lead.id
    });

    // Add lead to ProjectMember join table
    await ProjectRepository.addMember(project.id, lead.id, 'Project Admin');

    const created = await ProjectRepository.findByKey(formattedKey);
    return this.formatProject(created);
  }

  static async updateProject(key, data) {
    const project = await ProjectRepository.findByKey(key);
    if (!project) {
      throw ApiError.notFound(`Project with key "${key}" not found`);
    }

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.status !== undefined) updateData.status = data.status.toUpperCase();
    if (data.leadId !== undefined) updateData.leadId = data.leadId;

    const updated = await ProjectRepository.update(project.id, updateData);
    return this.formatProject(updated);
  }

  static async deleteProject(key) {
    const project = await ProjectRepository.findByKey(key);
    if (!project) {
      throw ApiError.notFound(`Project with key "${key}" not found`);
    }

    await ProjectRepository.delete(project.id);
    return { key: project.key, id: project.id };
  }

  static async addMember(key, { memberId, name, role, email, department, status, skills, capacity }) {
    const project = await ProjectRepository.findByKey(key);
    if (!project) {
      throw ApiError.notFound(`Project with key "${key}" not found`);
    }

    let member = null;
    if (memberId) {
      member = await MemberRepository.findById(memberId);
    } else if (email) {
      member = await MemberRepository.findByEmail(email);
    }

    if (!member) {
      const initials = name
        ? name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : 'TM';

      member = await MemberRepository.create({
        id: `m-${Date.now()}`,
        name: name.trim(),
        avatar: initials,
        email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@projectpilot.dev`,
        role: role || 'Developer',
        department: department || 'Engineering',
        status: (status || 'ACTIVE').toUpperCase(),
        skills: Array.isArray(skills) ? skills : ['JavaScript'],
        capacity: Number(capacity) || 20
      });
    }

    await ProjectRepository.addMember(project.id, member.id, role || member.role || 'Developer');

    const updated = await ProjectRepository.findByKey(key);
    return this.formatProject(updated);
  }

  static async removeMember(key, memberId) {
    const project = await ProjectRepository.findByKey(key);
    if (!project) {
      throw ApiError.notFound(`Project with key "${key}" not found`);
    }

    await ProjectRepository.removeMember(project.id, memberId);
    const updated = await ProjectRepository.findByKey(key);
    return this.formatProject(updated);
  }
}
