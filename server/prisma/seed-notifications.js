/**
 * Seed Initial Realistic Demo Notifications for ProjectPilot
 */
import { PrismaClient } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial notifications for demo accounts...');

  const notifications = [
    {
      id: 'notif-1',
      recipientId: 'm-1', // Alex Morgan
      actorId: 'm-8',     // Rachel Chen (QA)
      projectId: 'proj-pilot',
      type: 'TICKET_REOPENED',
      title: '🔄 Ticket PILOT-88 Reopened by QA',
      message: 'Rachel Chen (QA) reopened PILOT-88 "Database query optimization on sprint velocity". Failed criteria: query execution time > 120ms under 50 concurrent requests.',
      link: '/projects/PILOT/tickets?ticket=PILOT-88',
      read: false,
      metadata: { ticketKey: 'PILOT-88' },
      createdAt: new Date(Date.now() - 1000 * 60 * 18) // 18 mins ago
    },
    {
      id: 'notif-2',
      recipientId: 'm-1', // Alex Morgan
      actorId: 'm-7',     // Marcus Vance
      projectId: 'proj-pilot',
      type: 'USER_MENTIONED',
      title: '💬 Mentioned on PILOT-104',
      message: 'Marcus Vance mentioned you on PILOT-104: "@Alex Morgan can you verify the Neon pgvector pool limit configuration?"',
      link: '/projects/PILOT/tickets?ticket=PILOT-104',
      read: false,
      metadata: { ticketKey: 'PILOT-104' },
      createdAt: new Date(Date.now() - 1000 * 60 * 42) // 42 mins ago
    },
    {
      id: 'notif-3',
      recipientId: 'm-1', // Alex Morgan
      actorId: 'm-3',     // Samir Khan
      projectId: 'proj-pilot',
      type: 'SPRINT_STARTED',
      title: '🚀 Sprint 24 Started',
      message: 'Samir Khan started Sprint 24 — AI Intelligence Core (40 story points capacity).',
      link: '/projects/PILOT/sprints',
      read: false,
      metadata: { sprintId: 'sprint-pilot-24' },
      createdAt: new Date(Date.now() - 1000 * 60 * 120) // 2 hours ago
    },
    {
      id: 'notif-4',
      recipientId: 'm-1', // Alex Morgan
      actorId: 'm-2',     // Jane Doe
      projectId: 'proj-pilot',
      type: 'TICKET_ASSIGNED',
      title: '🎯 Assigned to PILOT-98',
      message: 'Jane Doe assigned ticket PILOT-98 "Streaming SSE handler for Gemini Assistant chat responses" to you.',
      link: '/projects/PILOT/tickets?ticket=PILOT-98',
      read: true,
      metadata: { ticketKey: 'PILOT-98' },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
    },
    {
      id: 'notif-5',
      recipientId: 'm-8', // Rachel Chen (QA)
      actorId: 'm-1',     // Alex Morgan
      projectId: 'proj-pilot',
      type: 'COMMENT_ADDED',
      title: '💬 New note on PILOT-88',
      message: 'Alex Morgan added test parameters and reproduction scripts for PostgreSQL query indexing.',
      link: '/projects/PILOT/tickets?ticket=PILOT-88',
      read: false,
      metadata: { ticketKey: 'PILOT-88' },
      createdAt: new Date(Date.now() - 1000 * 60 * 25)
    }
  ];

  for (const notif of notifications) {
    await prisma.notification.upsert({
      where: { id: notif.id },
      update: notif,
      create: notif
    });
  }

  console.log(`Seeded ${notifications.length} demo notifications successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
