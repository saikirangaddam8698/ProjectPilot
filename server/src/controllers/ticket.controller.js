/**
 * Ticket Controller — HTTP Request Handlers for Tickets
 */
import { TicketService } from '../services/ticket.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../utils/constants.js';

export class TicketController {
  static async getAllTickets(req, res) {
    const { projectKey, sprintId, status, priority, type, assigneeId, search, isBacklog } = req.query;
    const tickets = await TicketService.getAllTickets({
      projectKey,
      sprintId,
      status,
      priority,
      type,
      assigneeId,
      search,
      isBacklog: isBacklog === 'true'
    });

    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Tickets retrieved successfully',
      data: tickets
    });
  }

  static async getTicketByKey(req, res) {
    const { ticketKey } = req.params;
    const ticket = await TicketService.getTicketByKey(ticketKey);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Ticket retrieved successfully',
      data: ticket
    });
  }

  static async createTicket(req, res) {
    const ticket = await TicketService.createTicket(req.body);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Ticket created successfully',
      data: ticket
    });
  }

  static async updateTicket(req, res) {
    const { ticketKey } = req.params;
    const ticket = await TicketService.updateTicket(ticketKey, req.body);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Ticket updated successfully',
      data: ticket
    });
  }

  static async updateTicketStatus(req, res) {
    const { ticketKey } = req.params;
    const { status } = req.body;
    const ticket = await TicketService.updateTicketStatus(ticketKey, status);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Ticket status updated successfully',
      data: ticket
    });
  }

  static async updateTicketPriority(req, res) {
    const { ticketKey } = req.params;
    const { priority } = req.body;
    const ticket = await TicketService.updateTicketPriority(ticketKey, priority);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Ticket priority updated successfully',
      data: ticket
    });
  }

  static async updateTicketAssignee(req, res) {
    const { ticketKey } = req.params;
    const { assigneeId } = req.body;
    const ticket = await TicketService.updateTicketAssignee(ticketKey, assigneeId);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Ticket assignee updated successfully',
      data: ticket
    });
  }

  static async assignTicketToSprint(req, res) {
    const { ticketKey } = req.params;
    const { sprintId } = req.body;
    const ticket = await TicketService.assignTicketToSprint(ticketKey, sprintId);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Ticket sprint assignment updated successfully',
      data: ticket
    });
  }

  static async reassignMemberTickets(req, res) {
    const { projectKey, memberId, newAssigneeId } = req.body;
    const result = await TicketService.reassignMemberTickets(projectKey, memberId, newAssigneeId);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Member tickets reassigned successfully',
      data: result
    });
  }

  static async reorderBacklog(req, res) {
    const { projectKey, orderedKeys } = req.body;
    const result = await TicketService.reorderBacklog(projectKey, orderedKeys);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Backlog reordered successfully',
      data: result
    });
  }

  static async deleteTicket(req, res) {
    const { ticketKey } = req.params;
    const result = await TicketService.deleteTicket(ticketKey);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Ticket deleted successfully',
      data: result
    });
  }
}
