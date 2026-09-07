/**
 * AI Tool Executor
 * Enforces strict tool validation, argument sanitation, RBAC authorization, and result normalization
 */
import { ToolRegistry } from './tool.registry.js';
import { ProjectRepository } from '../../repositories/project.repository.js';
import { ApiError } from '../../utils/apiError.js';

export class ToolExecutor {
  /**
   * Execute an approved AI tool with strict validation and authorization
   * @param {object} params
   * @param {string} params.name - Tool name requested by Gemini
   * @param {object} params.args - Tool arguments requested by Gemini
   * @param {object} params.user - Authenticated user context
   * @param {string} [params.fallbackProjectKey] - Active workspace projectKey
   * @returns {Promise<object>} Normalized execution result
   */
  static async execute({ name, args = {}, user, fallbackProjectKey }) {
    // 1. Validate tool name against explicit allowlist
    if (!name || typeof name !== 'string' || !ToolRegistry.has(name)) {
      throw ApiError.badRequest(`Unknown or unapproved AI tool: "${name}"`);
    }

    const tool = ToolRegistry.get(name);
    const parsedArgs = (args && typeof args === 'object') ? { ...args } : {};

    // 2. Validate and resolve projectKey
    let targetProjectKey = (parsedArgs.projectKey || fallbackProjectKey || '').trim().toUpperCase();
    if (!targetProjectKey) {
      throw ApiError.badRequest(`Tool "${name}" requires a valid projectKey.`);
    }
    parsedArgs.projectKey = targetProjectKey;

    // 3. Enforce Server-Side Authorization (RBAC)
    await this.verifyProjectAccess(targetProjectKey, user);

    // 4. Validate specific tool constraints
    if (name === 'get_ticket_details') {
      if (!parsedArgs.ticketKey || typeof parsedArgs.ticketKey !== 'string' || !parsedArgs.ticketKey.trim()) {
        throw ApiError.badRequest('get_ticket_details requires a non-empty ticketKey.');
      }
      parsedArgs.ticketKey = parsedArgs.ticketKey.trim().toUpperCase();
    }

    if (parsedArgs.limit !== undefined) {
      const numLimit = parseInt(parsedArgs.limit, 10);
      if (isNaN(numLimit) || numLimit < 1) {
        parsedArgs.limit = 25;
      }
    }

    // 5. Execute approved tool
    try {
      const result = await tool.execute(parsedArgs);
      return result;
    } catch (err) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw ApiError.internal(`Error executing tool "${name}": ${err.message}`);
    }
  }

  /**
   * Check if user has permission to view project data
   */
  static async verifyProjectAccess(projectKey, user) {
    if (!user) {
      throw ApiError.unauthorized('Authentication required for tool execution');
    }

    // Global Admin has access to all projects
    if (user.role === 'ADMIN') {
      return true;
    }

    const project = await ProjectRepository.findByKey(projectKey);
    if (!project) {
      throw ApiError.notFound(`Project "${projectKey}" not found`);
    }

    // Check project lead
    if (project.leadId && (project.leadId === user.memberId || project.leadId === user.id)) {
      return true;
    }

    // Check project team members
    const isMember = (project.members || []).some((m) => {
      const memberId = m.memberId || m.member?.id;
      return memberId === user.memberId || memberId === user.id;
    });

    if (!isMember) {
      throw ApiError.forbidden(`You do not have access to project "${projectKey}".`);
    }

    return true;
  }
}
