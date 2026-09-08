/**
 * Task 17 — Conversation Repository
 * Data access layer for persistent AI Conversations & Messages in PostgreSQL via Prisma.
 */
import { prisma } from '../db/prisma.js';

export class ConversationRepository {
  /**
   * Create a new AI conversation
   */
  static async createConversation({ projectId, createdById, title }) {
    return prisma.conversation.create({
      data: {
        projectId,
        createdById: createdById || null,
        title: title || 'New AI Conversation'
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  /**
   * Find conversations for a project (strictly isolated by user)
   */
  static async findConversationsByProject({ projectId, userId, limit = 50, offset = 0 }) {
    const where = { projectId };
    if (userId) {
      where.createdById = userId;
    }

    return prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        _count: { select: { messages: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  /**
   * Find single conversation by ID, project ID, and optional owner userId
   */
  static async findConversationById({ conversationId, projectId, userId }) {
    const where = {
      id: conversationId,
      projectId
    };
    if (userId) {
      where.createdById = userId;
    }

    return prisma.conversation.findFirst({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  /**
   * Update conversation title or updatedAt timestamp
   */
  static async updateConversation(id, data) {
    return prisma.conversation.update({
      where: { id },
      data
    });
  }

  /**
   * Delete conversation (strictly isolated by owner userId)
   */
  static async deleteConversation({ conversationId, projectId, userId }) {
    const where = {
      id: conversationId,
      projectId
    };
    if (userId) {
      where.createdById = userId;
    }

    return prisma.conversation.deleteMany({
      where
    });
  }

  /**
   * Create a message within a conversation
   */
  static async createMessage({ conversationId, role, content, metadata }) {
    const [message] = await prisma.$transaction([
      prisma.conversationMessage.create({
        data: {
          conversationId,
          role,
          content,
          metadata: metadata || null
        }
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      })
    ]);

    return message;
  }

  /**
   * Get the most recent N messages for a conversation (for agent history context)
   */
  static async getRecentMessages({ conversationId, limit = 20 }) {
    const messages = await prisma.conversationMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // Return in chronological order (oldest first) for LLM context
    return messages.reverse();
  }
}
