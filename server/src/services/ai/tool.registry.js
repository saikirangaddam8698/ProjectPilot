/**
 * AI Tool Registry
 * Central registry holding explicitly approved ProjectPilot tools and function declarations
 */
import { listProjectTicketsTool } from './tools/projectTickets.tool.js';
import { ticketDetailsTool } from './tools/ticketDetails.tool.js';
import { sprintProgressTool } from './tools/sprintProgress.tool.js';
import { sprintTicketsTool } from './tools/sprintTickets.tool.js';
import { projectActivityTool } from './tools/projectActivity.tool.js';
import { projectSummaryTool } from './tools/projectSummary.tool.js';
import { knowledgeSearchTool } from './tools/knowledgeSearch.tool.js';

export const APPROVED_AI_TOOLS = [
  'list_project_tickets',
  'get_ticket_details',
  'get_sprint_progress',
  'list_sprint_tickets',
  'get_project_activity',
  'get_project_summary',
  'search_project_knowledge'
];

class ToolRegistryService {
  constructor() {
    this.tools = new Map();

    // Register all default approved tools
    this.register(listProjectTicketsTool);
    this.register(ticketDetailsTool);
    this.register(sprintProgressTool);
    this.register(sprintTicketsTool);
    this.register(projectActivityTool);
    this.register(projectSummaryTool);
    this.register(knowledgeSearchTool);
  }

  /**
   * Register an approved tool
   */
  register(tool) {
    if (!tool || !tool.name) {
      throw new Error('Invalid tool definition: name is required');
    }
    if (!APPROVED_AI_TOOLS.includes(tool.name)) {
      throw new Error(`Tool "${tool.name}" is not on the APPROVED_AI_TOOLS allowlist`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Get a tool by name
   */
  get(name) {
    return this.tools.get(name) || null;
  }

  /**
   * Check if a tool is registered and approved
   */
  has(name) {
    return this.tools.has(name) && APPROVED_AI_TOOLS.includes(name);
  }

  /**
   * Return all registered tools
   */
  getAll() {
    return Array.from(this.tools.values());
  }

  /**
   * Generate Gemini-compatible functionDeclarations array
   */
  getGeminiFunctionDeclarations() {
    return this.getAll().map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));
  }
}

export const ToolRegistry = new ToolRegistryService();
