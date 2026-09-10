/**
 * Notification Controller — HTTP Request Handlers for In-App Notifications
 */
import { NotificationService } from '../services/notification.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../utils/constants.js';

export class NotificationController {
  /**
   * GET /api/v1/notifications
   * List notifications for the authenticated user
   */
  static async getNotifications(req, res) {
    const memberId = req.user?.memberId || req.user?.member?.id;
    const unreadOnly = req.query.unread === 'true';
    const limit = parseInt(req.query.limit || '50', 10);
    const offset = parseInt(req.query.offset || '0', 10);

    const notifications = await NotificationService.getUserNotifications(memberId, {
      unreadOnly,
      limit,
      offset
    });
    const unreadCount = await NotificationService.getUnreadCount(memberId);

    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Notifications retrieved successfully',
      data: {
        notifications,
        unreadCount
      }
    });
  }

  /**
   * GET /api/v1/notifications/unread-count
   * Fast badge counter
   */
  static async getUnreadCount(req, res) {
    const memberId = req.user?.memberId || req.user?.member?.id;
    const count = await NotificationService.getUnreadCount(memberId);

    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      data: { count }
    });
  }

  /**
   * PATCH /api/v1/notifications/:id/read
   * Mark a single notification as read
   */
  static async markAsRead(req, res) {
    const { id } = req.params;
    const memberId = req.user?.memberId || req.user?.member?.id;

    const result = await NotificationService.markRead(id, memberId);
    const unreadCount = await NotificationService.getUnreadCount(memberId);

    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Notification marked as read',
      data: { ...result, unreadCount }
    });
  }

  /**
   * PATCH /api/v1/notifications/read-all
   * Mark all notifications as read for active user
   */
  static async markAllAsRead(req, res) {
    const memberId = req.user?.memberId || req.user?.member?.id;

    await NotificationService.markAllRead(memberId);

    return ApiResponse.success(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'All notifications marked as read',
      data: { unreadCount: 0 }
    });
  }
}
