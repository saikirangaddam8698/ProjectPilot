/**
 * Notification Repository — Data Access Layer for User / Member Notifications
 */
import { prisma } from '../db/prisma.js';

export class NotificationRepository {
  /**
   * Find notifications for a recipient member
   */
  static async findAllForRecipient(recipientId, { unreadOnly = false, limit = 50, offset = 0 } = {}) {
    const where = { recipientId };
    if (unreadOnly) {
      where.read = false;
    }

    return prisma.notification.findMany({
      where,
      include: {
        actor: {
          select: { id: true, name: true, avatar: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
  }

  /**
   * Count unread notifications for a recipient
   */
  static async countUnread(recipientId) {
    return prisma.notification.count({
      where: {
        recipientId,
        read: false
      }
    });
  }

  /**
   * Find single notification by ID
   */
  static async findById(id) {
    return prisma.notification.findUnique({
      where: { id },
      include: {
        actor: {
          select: { id: true, name: true, avatar: true, role: true }
        }
      }
    });
  }

  /**
   * Create a single notification
   */
  static async create(data) {
    return prisma.notification.create({
      data,
      include: {
        actor: {
          select: { id: true, name: true, avatar: true, role: true }
        }
      }
    });
  }

  /**
   * Create multiple notifications in bulk
   */
  static async createMany(dataArray) {
    if (!dataArray || dataArray.length === 0) return { count: 0 };
    return prisma.notification.createMany({
      data: dataArray
    });
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(id, recipientId) {
    return prisma.notification.updateMany({
      where: {
        id,
        recipientId
      },
      data: {
        read: true
      }
    });
  }

  /**
   * Mark all notifications as read for a recipient
   */
  static async markAllAsRead(recipientId) {
    return prisma.notification.updateMany({
      where: {
        recipientId,
        read: false
      },
      data: {
        read: true
      }
    });
  }

  /**
   * Delete a notification
   */
  static async delete(id, recipientId) {
    return prisma.notification.deleteMany({
      where: {
        id,
        recipientId
      }
    });
  }
}
