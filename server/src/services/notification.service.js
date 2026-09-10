/**
 * Notification Service — Business logic for In-App Notifications & Agile Event Triggers
 */
import { NotificationRepository } from '../repositories/notification.repository.js';
import { MemberRepository } from '../repositories/member.repository.js';
import { ProjectRepository } from '../repositories/project.repository.js';

export class NotificationService {
  /**
   * Format notification entity for client consumption
   */
  static formatNotification(n) {
    if (!n) return null;

    return {
      id: n.id,
      recipientId: n.recipientId,
      actorId: n.actorId || null,
      actor: n.actor
        ? {
            id: n.actor.id,
            name: n.actor.name,
            avatar: n.actor.avatar,
            role: n.actor.role
          }
        : {
            id: 'system',
            name: 'ProjectPilot System',
            avatar: '⚡',
            role: 'System'
          },
      projectId: n.projectId || null,
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link || null,
      read: Boolean(n.read),
      metadata: n.metadata || {},
      createdAt: n.createdAt
    };
  }

  /**
   * Get notifications for active user/member
   */
  static async getUserNotifications(memberId, options = {}) {
    if (!memberId) return [];
    const notifications = await NotificationRepository.findAllForRecipient(memberId, options);
    return notifications.map((n) => this.formatNotification(n));
  }

  /**
   * Get total unread count for member
   */
  static async getUnreadCount(memberId) {
    if (!memberId) return 0;
    return NotificationRepository.countUnread(memberId);
  }

  /**
   * Mark a single notification as read
   */
  static async markRead(notificationId, memberId) {
    await NotificationRepository.markAsRead(notificationId, memberId);
    return { success: true, id: notificationId };
  }

  /**
   * Mark all notifications as read for active user
   */
  static async markAllRead(memberId) {
    await NotificationRepository.markAllAsRead(memberId);
    return { success: true };
  }

  /**
   * Dispatch a generic notification
   */
  static async dispatch({
    recipientId,
    actorId = null,
    projectId = null,
    type,
    title,
    message,
    link = null,
    metadata = {}
  }) {
    if (!recipientId) return null;
    // Don't notify oneself
    if (actorId && recipientId === actorId) return null;

    try {
      const created = await NotificationRepository.create({
        recipientId,
        actorId,
        projectId,
        type,
        title,
        message,
        link,
        metadata
      });
      return this.formatNotification(created);
    } catch (err) {
      console.error('[NotificationService.dispatch] Error:', err);
      return null;
    }
  }

  /**
   * Agile Trigger: Ticket Assigned
   */
  static async notifyTicketAssigned({ ticket, actorMemberId, projectKey }) {
    if (!ticket?.assigneeId || ticket.assigneeId === actorMemberId) return;

    let actorName = 'A team member';
    if (actorMemberId) {
      const actor = await MemberRepository.findById(actorMemberId);
      if (actor?.name) actorName = actor.name;
    }

    const pKey = projectKey || ticket.projectKey || (ticket.key ? ticket.key.split('-')[0] : 'PILOT');

    await this.dispatch({
      recipientId: ticket.assigneeId,
      actorId: actorMemberId,
      projectId: ticket.projectId || null,
      type: 'TICKET_ASSIGNED',
      title: `🎯 Assigned to ${ticket.key}`,
      message: `${actorName} assigned ticket ${ticket.key} "${ticket.title}" to you.`,
      link: `/projects/${pKey}/tickets?ticket=${ticket.key}`,
      metadata: { ticketKey: ticket.key, priority: ticket.priority }
    });
  }

  /**
   * Agile Trigger: Ticket Reopened by QA
   */
  static async notifyTicketReopened({ ticket, actorMemberId, note = '', projectKey }) {
    const recipients = new Set();
    if (ticket.assigneeId && ticket.assigneeId !== actorMemberId) {
      recipients.add(ticket.assigneeId);
    }
    if (ticket.reporterId && ticket.reporterId !== actorMemberId) {
      recipients.add(ticket.reporterId);
    }

    let actorName = 'QA Engineer';
    if (actorMemberId) {
      const actor = await MemberRepository.findById(actorMemberId);
      if (actor?.name) actorName = actor.name;
    }

    const pKey = projectKey || ticket.projectKey || (ticket.key ? ticket.key.split('-')[0] : 'PILOT');
    const notePreview = note ? ` Notes: "${note.slice(0, 100)}${note.length > 100 ? '...' : ''}"` : '';

    for (const recipientId of recipients) {
      await this.dispatch({
        recipientId,
        actorId: actorMemberId,
        projectId: ticket.projectId || null,
        type: 'TICKET_REOPENED',
        title: `🔄 Ticket ${ticket.key} Reopened`,
        message: `${actorName} reopened ${ticket.key} "${ticket.title}".${notePreview}`,
        link: `/projects/${pKey}/tickets?ticket=${ticket.key}`,
        metadata: { ticketKey: ticket.key, note }
      });
    }
  }

  /**
   * Agile Trigger: Comment added and @Mentions
   */
  static async notifyCommentAndMentions({ ticket, commentText, actorMemberId, projectKey }) {
    if (!commentText || !ticket) return;

    let actorName = 'Someone';
    if (actorMemberId) {
      const actor = await MemberRepository.findById(actorMemberId);
      if (actor?.name) actorName = actor.name;
    }

    const pKey = projectKey || ticket.projectKey || (ticket.key ? ticket.key.split('-')[0] : 'PILOT');
    const allMembers = await MemberRepository.findAll();
    const mentionedMemberIds = new Set();

    // Check for @mentions in comment text
    for (const member of allMembers) {
      if (!member?.name) continue;
      const mentionPattern = new RegExp(`@${member.name}\\b`, 'i');
      if (mentionPattern.test(commentText) && member.id !== actorMemberId) {
        mentionedMemberIds.add(member.id);
      }
    }

    // Dispatch USER_MENTIONED notifications
    for (const recipientId of mentionedMemberIds) {
      await this.dispatch({
        recipientId,
        actorId: actorMemberId,
        projectId: ticket.projectId || null,
        type: 'USER_MENTIONED',
        title: `💬 Mentioned in ${ticket.key}`,
        message: `${actorName} mentioned you on ${ticket.key}: "${commentText.slice(0, 80)}${commentText.length > 80 ? '...' : ''}"`,
        link: `/projects/${pKey}/tickets?ticket=${ticket.key}`,
        metadata: { ticketKey: ticket.key }
      });
    }

    // Dispatch COMMENT_ADDED to ticket assignee if not already mentioned & not commenter
    if (ticket.assigneeId && ticket.assigneeId !== actorMemberId && !mentionedMemberIds.has(ticket.assigneeId)) {
      await this.dispatch({
        recipientId: ticket.assigneeId,
        actorId: actorMemberId,
        projectId: ticket.projectId || null,
        type: 'COMMENT_ADDED',
        title: `💬 New comment on ${ticket.key}`,
        message: `${actorName} commented on ${ticket.key}: "${commentText.slice(0, 80)}${commentText.length > 80 ? '...' : ''}"`,
        link: `/projects/${pKey}/tickets?ticket=${ticket.key}`,
        metadata: { ticketKey: ticket.key }
      });
    }
  }

  /**
   * Agile Trigger: Sprint Started or Completed
   */
  static async notifySprintChange({ sprint, action, actorMemberId, projectKey }) {
    if (!sprint) return;

    let actorName = 'Scrum Master';
    if (actorMemberId) {
      const actor = await MemberRepository.findById(actorMemberId);
      if (actor?.name) actorName = actor.name;
    }

    const pKey = projectKey || (sprint.project?.key ? sprint.project.key : 'PILOT');
    const project = await ProjectRepository.findByKey(pKey);
    if (!project) return;

    // Get project members
    const members = await ProjectRepository.findMembersByProject(project.id);
    const isStart = action === 'start';

    for (const pm of members) {
      const recipientId = pm.memberId || pm.member?.id;
      if (!recipientId || recipientId === actorMemberId) continue;

      await this.dispatch({
        recipientId,
        actorId: actorMemberId,
        projectId: project.id,
        type: isStart ? 'SPRINT_STARTED' : 'SPRINT_COMPLETED',
        title: isStart ? `🚀 Sprint Started: ${sprint.name}` : `🏁 Sprint Completed: ${sprint.name}`,
        message: isStart
          ? `${actorName} started sprint "${sprint.name}" in ${project.name}. Target end date: ${sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : 'TBD'}.`
          : `${actorName} closed sprint "${sprint.name}" in ${project.name}.`,
        link: `/projects/${pKey}/sprints`,
        metadata: { sprintId: sprint.id, sprintName: sprint.name }
      });
    }
  }
}
