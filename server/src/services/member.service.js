/**
 * Member Service — Business logic for Workspace Members
 */
import { MemberRepository } from '../repositories/member.repository.js';
import { ApiError } from '../utils/apiError.js';

export class MemberService {
  /**
   * Format member entity for API response
   */
  static formatMember(m) {
    if (!m) return null;

    const projectKeys = (m.projectMemberships || []).map((pm) => pm.project?.key).filter(Boolean);

    return {
      id: m.id,
      name: m.name,
      avatar: m.avatar,
      email: m.email,
      role: m.role,
      department: m.department,
      status: m.status === 'ACTIVE' ? 'Active' : m.status === 'AWAY' ? 'Away' : 'Offline',
      skills: m.skills || [],
      capacity: m.capacity || 20,
      projectKeys,
      createdAt: m.createdAt
    };
  }

  static async getAllMembers(filters) {
    const members = await MemberRepository.findAll(filters);
    return members.map((m) => this.formatMember(m));
  }

  static async getMemberById(id) {
    const member = await MemberRepository.findById(id);
    if (!member) {
      throw ApiError.notFound(`Member with ID "${id}" not found`);
    }
    return this.formatMember(member);
  }

  static async getMemberByEmail(email) {
    const member = await MemberRepository.findByEmail(email);
    if (!member) {
      throw ApiError.notFound(`Member with email "${email}" not found`);
    }
    return this.formatMember(member);
  }

  static async createMember({ name, email, role = 'Developer', department = 'Engineering', status = 'Active', skills = [], capacity = 20, avatar }) {
    const existing = await MemberRepository.findByEmail(email);
    if (existing) {
      throw ApiError.conflict(`Member with email "${email}" already exists`);
    }

    const initials = avatar || (name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'TM');

    const member = await MemberRepository.create({
      id: `m-${Date.now()}`,
      name: name.trim(),
      avatar: initials,
      email: email.trim().toLowerCase(),
      role: role.trim(),
      department: department.trim(),
      status: status.toUpperCase() === 'AWAY' ? 'AWAY' : status.toUpperCase() === 'OFFLINE' ? 'OFFLINE' : 'ACTIVE',
      skills: Array.isArray(skills) ? skills : typeof skills === 'string' ? skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      capacity: Number(capacity) || 20
    });

    return this.formatMember(member);
  }

  static async updateMember(id, data) {
    const existing = await MemberRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound(`Member with ID "${id}" not found`);
    }

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.email !== undefined) updateData.email = data.email.trim().toLowerCase();
    if (data.role !== undefined) updateData.role = data.role.trim();
    if (data.department !== undefined) updateData.department = data.department.trim();
    if (data.avatar !== undefined) updateData.avatar = data.avatar.trim();
    if (data.status !== undefined) {
      updateData.status = data.status.toUpperCase() === 'AWAY' ? 'AWAY' : data.status.toUpperCase() === 'OFFLINE' ? 'OFFLINE' : 'ACTIVE';
    }
    if (data.skills !== undefined) {
      updateData.skills = Array.isArray(data.skills)
        ? data.skills
        : typeof data.skills === 'string'
          ? data.skills.split(',').map((s) => s.trim()).filter(Boolean)
          : [];
    }
    if (data.capacity !== undefined) updateData.capacity = Number(data.capacity) || 20;

    const updated = await MemberRepository.update(id, updateData);
    return this.formatMember(updated);
  }

  static async deleteMember(id) {
    const member = await MemberRepository.findById(id);
    if (!member) {
      throw ApiError.notFound(`Member with ID "${id}" not found`);
    }

    await MemberRepository.delete(id);
    return { id: member.id };
  }
}
