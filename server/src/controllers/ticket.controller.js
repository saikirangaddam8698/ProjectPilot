/**
 * Ticket Controller — HTTP Request Handlers for Tickets
 */
import { TicketService } from '../services/ticket.service.js';
import { NotificationService } from '../services/notification.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { HTTP_STATUS } from '../utils/constants.js';

export class TicketController {
  static async getAllTickets(req, res) {
    const { projectKey, sprintId, status, priority, type, assigneeId, search, isBacklog } = req.query;
    const user = req.user;

    let allowedProjectKeys = null;
    if (user && user.role !== 'ADMIN') {
      const userKeys = (user.projectKeys || []).map((k) => k.toUpperCase());
      if (projectKey && projectKey !== 'all') {
        if (!userKeys.includes(projectKey.toUpperCase())) {
          throw ApiError.forbidden(`Forbidden: You are not a member of project workspace "${projectKey}"`);
        }
      } else {
        allowedProjectKeys = userKeys;
      }
    }

    const tickets = await TicketService.getAllTickets({
      projectKey,
      sprintId,
      status,
      priority,
      type,
      assigneeId,
      search,
      isBacklog: isBacklog === 'true',
      allowedProjectKeys
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
    const user = req.user;
    if (user && user.role !== 'ADMIN') {
      const userKeys = (user.projectKeys || []).map((k) => k.toUpperCase());
      if (ticket.projectKey && !userKeys.includes(ticket.projectKey.toUpperCase())) {
        throw ApiError.forbidden(`Forbidden: You are not a member of project workspace "${ticket.projectKey}"`);
      }
    }
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Ticket retrieved successfully',
      data: ticket
    });
  }

  static async createTicket(req, res) {
    const { projectKey } = req.body;
    if (req.user && req.user.role === 'VIEWER') {
      throw ApiError.forbidden('Forbidden: Viewer role is read-only and cannot create tickets');
    }
    if (projectKey && req.user && req.user.role !== 'ADMIN') {
      const userKeys = (req.user.projectKeys || []).map((k) => k.toUpperCase());
      if (!userKeys.includes(projectKey.toUpperCase())) {
        throw ApiError.forbidden(`Forbidden: You are not a member of project workspace "${projectKey}"`);
      }
    }

    const ticket = await TicketService.createTicket(req.body);
    const actorMemberId = req.user?.memberId || req.user?.member?.id;

    // Dispatch assignment notification if assigned to another user upon creation
    if (ticket?.assignee?.id && ticket.assignee.id !== actorMemberId) {
      NotificationService.notifyTicketAssigned({
        ticket,
        actorMemberId,
        projectKey: projectKey || ticket.projectKey
      }).catch((err) => console.error('[Notification Trigger createTicket]', err));
    }

    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Ticket created successfully',
      data: ticket
    });
  }

  static async updateTicket(req, res) {
    const { ticketKey } = req.params;
    const existing = await TicketService.getTicketByKey(ticketKey);
    if (req.user && req.user.role !== 'ADMIN') {
      const userKeys = (req.user.projectKeys || []).map((k) => k.toUpperCase());
      if (existing.projectKey && !userKeys.includes(existing.projectKey.toUpperCase())) {
        throw ApiError.forbidden(`Forbidden: You are not a member of project workspace "${existing.projectKey}"`);
      }
      if (req.user.role === 'VIEWER') {
        throw ApiError.forbidden('Forbidden: Viewer role is read-only and cannot edit tickets');
      }
    }

    const ticket = await TicketService.updateTicket(ticketKey, req.body);
    const actorMemberId = req.user?.memberId || req.user?.member?.id;

    // 1. Assignment notification
    if (req.body.assigneeId && req.body.assigneeId !== existing.assignee?.id) {
      NotificationService.notifyTicketAssigned({
        ticket,
        actorMemberId,
        projectKey: existing.projectKey
      }).catch((err) => console.error('[Notification Trigger updateTicket assign]', err));
    }

    // 2. QA Reopen notification
    if (
      req.body.status &&
      (String(req.body.status).toUpperCase() === 'REOPENED') &&
      String(existing.status).toUpperCase() !== 'REOPENED'
    ) {
      NotificationService.notifyTicketReopened({
        ticket,
        actorMemberId,
        note: req.body.reopenReason || req.body.comment || '',
        projectKey: existing.projectKey
      }).catch((err) => console.error('[Notification Trigger updateTicket reopen]', err));
    }

    // 3. Comments & @Mentions notification
    if (Array.isArray(req.body.comments) && req.body.comments.length > 0) {
      const latestComment = req.body.comments[req.body.comments.length - 1];
      if (latestComment && latestComment.text) {
        NotificationService.notifyCommentAndMentions({
          ticket,
          commentText: latestComment.text,
          actorMemberId,
          projectKey: existing.projectKey
        }).catch((err) => console.error('[Notification Trigger updateTicket comment]', err));
      }
    }

    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Ticket updated successfully',
      data: ticket
    });
  }

  static async updateTicketStatus(req, res) {
    const { ticketKey } = req.params;
    const { status } = req.body;
    const existing = await TicketService.getTicketByKey(ticketKey);
    if (req.user && req.user.role !== 'ADMIN') {
      const userKeys = (req.user.projectKeys || []).map((k) => k.toUpperCase());
      if (existing.projectKey && !userKeys.includes(existing.projectKey.toUpperCase())) {
        throw ApiError.forbidden(`Forbidden: You are not a member of project workspace "${existing.projectKey}"`);
      }
      if (req.user.role === 'VIEWER') {
        throw ApiError.forbidden('Forbidden: Viewer role is read-only and cannot change ticket status');
      }
    }

    const ticket = await TicketService.updateTicketStatus(ticketKey, status);
    const actorMemberId = req.user?.memberId || req.user?.member?.id;

    // QA Reopen notification
    if (
      status &&
      String(status).toUpperCase() === 'REOPENED' &&
      String(existing.status).toUpperCase() !== 'REOPENED'
    ) {
      NotificationService.notifyTicketReopened({
        ticket,
        actorMemberId,
        note: req.body.reopenReason || '',
        projectKey: existing.projectKey
      }).catch((err) => console.error('[Notification Trigger updateTicketStatus reopen]', err));
    }

    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Ticket status updated successfully',
      data: ticket
    });
  }

  static async updateTicketPriority(req, res) {
    const { ticketKey } = req.params;
    const { priority } = req.body;
    const existing = await TicketService.getTicketByKey(ticketKey);
    if (req.user && req.user.role !== 'ADMIN') {
      const userKeys = (req.user.projectKeys || []).map((k) => k.toUpperCase());
      if (existing.projectKey && !userKeys.includes(existing.projectKey.toUpperCase())) {
        throw ApiError.forbidden(`Forbidden: You are not a member of project workspace "${existing.projectKey}"`);
      }
      if (req.user.role === 'VIEWER') {
        throw ApiError.forbidden('Forbidden: Viewer role is read-only and cannot change ticket priority');
      }
    }

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
    const existing = await TicketService.getTicketByKey(ticketKey);
    if (req.user && req.user.role !== 'ADMIN') {
      const userKeys = (req.user.projectKeys || []).map((k) => k.toUpperCase());
      if (existing.projectKey && !userKeys.includes(existing.projectKey.toUpperCase())) {
        throw ApiError.forbidden(`Forbidden: You are not a member of project workspace "${existing.projectKey}"`);
      }
      if (req.user.role === 'VIEWER') {
        throw ApiError.forbidden('Forbidden: Viewer role is read-only and cannot reassign tickets');
      }
    }

    const ticket = await TicketService.updateTicketAssignee(ticketKey, assigneeId);
    const actorMemberId = req.user?.memberId || req.user?.member?.id;

    if (assigneeId && assigneeId !== existing.assignee?.id) {
      NotificationService.notifyTicketAssigned({
        ticket,
        actorMemberId,
        projectKey: existing.projectKey
      }).catch((err) => console.error('[Notification Trigger updateTicketAssignee]', err));
    }

    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Ticket assignee updated successfully',
      data: ticket
    });
  }

  static async assignTicketToSprint(req, res) {
    const { ticketKey } = req.params;
    const { sprintId } = req.body;
    const existing = await TicketService.getTicketByKey(ticketKey);
    if (req.user && req.user.role !== 'ADMIN') {
      const userKeys = (req.user.projectKeys || []).map((k) => k.toUpperCase());
      if (existing.projectKey && !userKeys.includes(existing.projectKey.toUpperCase())) {
        throw ApiError.forbidden(`Forbidden: You are not a member of project workspace "${existing.projectKey}"`);
      }
      if (req.user.role === 'VIEWER') {
        throw ApiError.forbidden('Forbidden: Viewer role is read-only and cannot reassign tickets to sprints');
      }
    }

    const ticket = await TicketService.assignTicketToSprint(ticketKey, sprintId);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Ticket sprint assignment updated successfully',
      data: ticket
    });
  }

  static async reassignMemberTickets(req, res) {
    const { projectKey, memberId, newAssigneeId } = req.body;
    if (projectKey && req.user && req.user.role !== 'ADMIN') {
      const userKeys = (req.user.projectKeys || []).map((k) => k.toUpperCase());
      if (!userKeys.includes(projectKey.toUpperCase())) {
        throw ApiError.forbidden(`Forbidden: You are not a member of project workspace "${projectKey}"`);
      }
    }

    const result = await TicketService.reassignMemberTickets(projectKey, memberId, newAssigneeId);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Member tickets reassigned successfully',
      data: result
    });
  }

  static async reorderBacklog(req, res) {
    const { projectKey, orderedKeys } = req.body;
    if (req.user && req.user.role === 'VIEWER') {
      throw ApiError.forbidden('Forbidden: Viewer role is read-only and cannot reorder backlog');
    }
    if (projectKey && req.user && req.user.role !== 'ADMIN') {
      const userKeys = (req.user.projectKeys || []).map((k) => k.toUpperCase());
      if (!userKeys.includes(projectKey.toUpperCase())) {
        throw ApiError.forbidden(`Forbidden: You are not a member of project workspace "${projectKey}"`);
      }
    }

    const result = await TicketService.reorderBacklog(projectKey, orderedKeys);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Backlog reordered successfully',
      data: result
    });
  }

  static async deleteTicket(req, res) {
    const { ticketKey } = req.params;
    const existing = await TicketService.getTicketByKey(ticketKey);
    if (req.user && req.user.role !== 'ADMIN') {
      const userKeys = (req.user.projectKeys || []).map((k) => k.toUpperCase());
      if (existing.projectKey && !userKeys.includes(existing.projectKey.toUpperCase())) {
        throw ApiError.forbidden(`Forbidden: You are not a member of project workspace "${existing.projectKey}"`);
      }
      const membership = (req.user.projectMemberships || []).find(
        (pm) => pm.projectKey?.toUpperCase() === existing.projectKey.toUpperCase()
      );
      const isProjectAdmin = membership?.projectRole === 'Project Admin' || membership?.projectRole === 'Lead';
      if (!isProjectAdmin) {
        throw ApiError.forbidden(`Forbidden: Only Project Admins can delete tickets in project "${existing.projectKey}"`);
      }
    }

    const result = await TicketService.deleteTicket(ticketKey);
    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Ticket deleted successfully',
      data: result
    });
  }
}

