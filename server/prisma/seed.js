/**
 * ProjectPilot Database Seeder
 * Deterministic, idempotent development seed script
 */
import { PrismaClient, ProjectStatus, SprintStatus, TicketStatus, TicketPriority, TicketType, MemberStatus } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

import bcrypt from 'bcryptjs';
import { seedKnowledgeBase } from '../scripts/seed-knowledge.js';
import { SEED_TICKETS } from './seed-tickets.js';
export { SEED_TICKETS };

// Deterministic default development password for all seed accounts
export const DEFAULT_DEV_PASSWORD = 'PilotPass123!';
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync(DEFAULT_DEV_PASSWORD, 10);

export const SEED_USERS = [
  {
    id: 'u-1',
    email: 'alex.m@projectpilot.dev',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'ADMIN',
    memberId: 'm-1'
  },
  {
    id: 'u-2',
    email: 'jane.d@projectpilot.dev',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'DEVELOPER',
    memberId: 'm-2'
  },
  {
    id: 'u-3',
    email: 'samir.k@projectpilot.dev',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'PROJECT_MANAGER',
    memberId: 'm-3'
  },
  {
    id: 'u-4',
    email: 'elena.r@projectpilot.dev',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'PROJECT_MANAGER',
    memberId: 'm-4'
  },
  {
    id: 'u-5',
    email: 'david.k@projectpilot.dev',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'DEVELOPER',
    memberId: 'm-5'
  },
  {
    id: 'u-6',
    email: 'priya.p@projectpilot.dev',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'VIEWER',
    memberId: 'm-6'
  },
  {
    id: 'u-7',
    email: 'marcus.v@projectpilot.dev',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'DEVELOPER',
    memberId: 'm-7'
  },
  {
    id: 'u-8',
    email: 'rachel.c@projectpilot.dev',
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: 'QA',
    memberId: 'm-8'
  }
];

export const SEED_MEMBERS = [
  {
    id: 'm-1',
    name: 'Alex Morgan',
    avatar: 'AM',
    email: 'alex.m@projectpilot.dev',
    role: 'Project Admin',
    department: 'Architecture & Core Systems',
    status: MemberStatus.ACTIVE,
    skills: ['Vue 3', 'Node.js', 'PostgreSQL', 'System Design', 'pgvector'],
    capacity: 20
  },
  {
    id: 'm-2',
    name: 'Jane Doe',
    avatar: 'JD',
    email: 'jane.d@projectpilot.dev',
    role: 'Senior Developer',
    department: 'Backend Engineering',
    status: MemberStatus.ACTIVE,
    skills: ['Node.js', 'Express', 'SQL', 'SSE Streaming', 'Redis'],
    capacity: 18
  },
  {
    id: 'm-3',
    name: 'Samir Khan',
    avatar: 'SK',
    email: 'samir.k@projectpilot.dev',
    role: 'DevOps Lead',
    department: 'Cloud Infrastructure',
    status: MemberStatus.ACTIVE,
    skills: ['Kubernetes', 'Docker', 'Prometheus', 'Grafana', 'CI/CD'],
    capacity: 16
  },
  {
    id: 'm-4',
    name: 'Elena Rostova',
    avatar: 'ER',
    email: 'elena.r@projectpilot.dev',
    role: 'Frontend Engineer',
    department: 'UI/UX & Web Platforms',
    status: MemberStatus.ACTIVE,
    skills: ['Vue 3', 'TypeScript', 'CSS Tokens', 'Pinia', 'Vite'],
    capacity: 20
  },
  {
    id: 'm-5',
    name: 'David Kim',
    avatar: 'DK',
    email: 'david.k@projectpilot.dev',
    role: 'AI / ML Engineer',
    department: 'AI & Data Intelligence',
    status: MemberStatus.AWAY,
    skills: ['Python', 'Gemini API', 'pgvector', 'RAG Pipelines', 'Embeddings'],
    capacity: 15
  },
  {
    id: 'm-6',
    name: 'Priya Patel',
    avatar: 'PP',
    email: 'priya.p@projectpilot.dev',
    role: 'Product Auditor & Stakeholder',
    department: 'Compliance & Auditing',
    status: MemberStatus.OFFLINE,
    skills: ['Audit & Verification', 'Compliance', 'Metrics Review'],
    capacity: 14
  },
  {
    id: 'm-7',
    name: 'Marcus Vance',
    avatar: 'MV',
    email: 'marcus.v@projectpilot.dev',
    role: 'Frontend Developer',
    department: 'Mobile Delivery Platform',
    status: MemberStatus.ACTIVE,
    skills: ['Vue 3', 'TypeScript', 'Tailwind', 'REST APIs', 'Vite'],
    capacity: 20
  },
  {
    id: 'm-8',
    name: 'Rachel Chen',
    avatar: 'RC',
    email: 'rachel.c@projectpilot.dev',
    role: 'QA & Test Engineer',
    department: 'Quality Assurance',
    status: MemberStatus.ACTIVE,
    skills: ['End-to-End Testing', 'Security Triage', 'Playwright', 'Test Automation', 'Regression Triage'],
    capacity: 18
  }
];

export const SEED_PROJECTS = [
  {
    id: 'proj-pilot',
    key: 'PILOT',
    name: 'ProjectPilot Core',
    description: 'Primary multi-user agile intelligence platform, AI copilot, and pgvector RAG engine.',
    status: ProjectStatus.ACTIVE,
    leadId: 'm-1',
    createdAt: new Date('2026-08-01T09:00:00.000Z'),
    memberIds: ['m-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6', 'm-8']
  },
  {
    id: 'proj-infra',
    key: 'INFRA',
    name: 'Cloud Infrastructure',
    description: 'Kubernetes clusters, PostgreSQL replication, pgvector indexing, and edge deployments.',
    status: ProjectStatus.PLANNING,
    leadId: 'm-3',
    createdAt: new Date('2026-08-10T14:30:00.000Z'),
    memberIds: ['m-3', 'm-1', 'm-2', 'm-6', 'm-8']
  },
  {
    id: 'proj-mobile',
    key: 'MOBILE',
    name: 'Mobile Delivery Platform',
    description: 'Cross-platform mobile applications for on-the-go sprint monitoring and incident triage.',
    status: ProjectStatus.ACTIVE,
    leadId: 'm-4',
    createdAt: new Date('2026-08-15T11:00:00.000Z'),
    memberIds: ['m-4', 'm-2', 'm-5', 'm-6', 'm-7', 'm-8']
  }
];

export const SEED_SPRINTS = [
  // PILOT Sprints
  {
    id: 'sprint-pilot-23',
    projectId: 'proj-pilot',
    name: 'Sprint 23 — Foundation & Tokens',
    goal: 'Establish token architecture, light/dark theme variables, and core UI primitives.',
    status: SprintStatus.COMPLETED,
    startDate: new Date('2026-08-10T00:00:00.000Z'),
    endDate: new Date('2026-08-24T00:00:00.000Z'),
    capacity: 35,
    createdAt: new Date('2026-08-08T09:00:00.000Z'),
    completedAt: new Date('2026-08-24T18:00:00.000Z')
  },
  {
    id: 'sprint-pilot-24',
    projectId: 'proj-pilot',
    name: 'Sprint 24 — AI Intelligence Core',
    goal: 'Ship Gemini streaming assistant tools and stabilize project infrastructure.',
    status: SprintStatus.ACTIVE,
    startDate: new Date('2026-08-24T00:00:00.000Z'),
    endDate: new Date('2026-09-07T00:00:00.000Z'),
    capacity: 40,
    createdAt: new Date('2026-08-20T09:00:00.000Z'),
    completedAt: null
  },
  {
    id: 'sprint-pilot-25',
    projectId: 'proj-pilot',
    name: 'Sprint 25 — Security & Workspaces',
    goal: 'Implement multi-tenant role permissions and database seed automation.',
    status: SprintStatus.PLANNED,
    startDate: new Date('2026-09-08T00:00:00.000Z'),
    endDate: new Date('2026-09-22T00:00:00.000Z'),
    capacity: 30,
    createdAt: new Date('2026-08-28T10:00:00.000Z'),
    completedAt: null
  },

  // INFRA Sprints
  {
    id: 'sprint-infra-11',
    projectId: 'proj-infra',
    name: 'Infra Sprint 11 — Observability',
    goal: 'Set up Prometheus and Grafana alerts for memory usage and high latency.',
    status: SprintStatus.COMPLETED,
    startDate: new Date('2026-08-11T00:00:00.000Z'),
    endDate: new Date('2026-08-25T00:00:00.000Z'),
    capacity: 20,
    createdAt: new Date('2026-08-10T08:00:00.000Z'),
    completedAt: new Date('2026-08-25T17:00:00.000Z')
  },
  {
    id: 'sprint-infra-12',
    projectId: 'proj-infra',
    name: 'Infra Sprint 12 — Cloud & TLS',
    goal: 'Provision staging Kubernetes GPU nodes and automate TLS rotation on ingress.',
    status: SprintStatus.ACTIVE,
    startDate: new Date('2026-08-25T00:00:00.000Z'),
    endDate: new Date('2026-09-08T00:00:00.000Z'),
    capacity: 25,
    createdAt: new Date('2026-08-22T09:00:00.000Z'),
    completedAt: null
  },

  // MOBILE Sprints
  {
    id: 'sprint-mob-5',
    projectId: 'proj-mobile',
    name: 'Mobile Sprint 5 — UI Polishing',
    goal: 'Fix splash screen layout jitter and biometric authentication setup.',
    status: SprintStatus.COMPLETED,
    startDate: new Date('2026-08-10T00:00:00.000Z'),
    endDate: new Date('2026-08-24T00:00:00.000Z'),
    capacity: 15,
    createdAt: new Date('2026-08-08T10:00:00.000Z'),
    completedAt: new Date('2026-08-24T16:00:00.000Z')
  },
  {
    id: 'sprint-mob-6',
    projectId: 'proj-mobile',
    name: 'Mobile Sprint 6 — Offline Mode',
    goal: 'Deliver SQLite local cache synchronization and push notification handlers.',
    status: SprintStatus.ACTIVE,
    startDate: new Date('2026-08-24T00:00:00.000Z'),
    endDate: new Date('2026-09-07T00:00:00.000Z'),
    capacity: 20,
    createdAt: new Date('2026-08-21T11:00:00.000Z'),
    completedAt: null
  }
];

// SEED_TICKETS imported from ./seed-tickets.js (46 realistic tickets)

export const SEED_ACTIVITIES = [
  {
    id: 'act-pilot-1',
    projectId: 'proj-pilot',
    actorId: 'm-1',
    type: 'ticket',
    action: 'status_changed',
    targetType: 'ticket',
    targetId: 't-pilot-98',
    targetKey: 'PILOT-98',
    targetTitle: 'Streaming SSE handler for Gemini Assistant chat responses',
    message: 'moved PILOT-98 from In Progress to In Review',
    metadata: { fromStatus: 'In Progress', toStatus: 'In Review', storyPoints: 8 },
    createdAt: new Date('2026-08-30T09:40:00.000Z')
  },
  {
    id: 'act-pilot-2',
    projectId: 'proj-pilot',
    actorId: 'm-2',
    type: 'ticket',
    action: 'priority_changed',
    targetType: 'ticket',
    targetId: 't-pilot-104',
    targetKey: 'PILOT-104',
    targetTitle: 'PostgreSQL connection pool exhaustion under load',
    message: 'escalated PILOT-104 priority to Urgent (Blocker)',
    metadata: { fromPriority: 'High', toPriority: 'Urgent', storyPoints: 5 },
    createdAt: new Date('2026-08-30T09:15:00.000Z')
  },
  {
    id: 'act-pilot-3',
    projectId: 'proj-pilot',
    actorId: 'm-1',
    type: 'sprint',
    action: 'sprint_started',
    targetType: 'sprint',
    targetId: 'sprint-pilot-24',
    targetKey: 'Sprint 24',
    targetTitle: 'Sprint 24 — AI Intelligence Core',
    message: 'started Sprint 24 — AI Intelligence Core (40 pts capacity)',
    metadata: { sprintId: 'sprint-pilot-24', capacity: 40 },
    createdAt: new Date('2026-08-24T09:00:00.000Z')
  },
  {
    id: 'act-pilot-4',
    projectId: 'proj-pilot',
    actorId: 'm-3',
    type: 'ticket',
    action: 'status_changed',
    targetType: 'ticket',
    targetId: 't-pilot-92',
    targetKey: 'PILOT-92',
    targetTitle: 'Implement pgvector document chunking and indexing script',
    message: 'completed PILOT-92 (pgvector chunking script)',
    metadata: { fromStatus: 'In Review', toStatus: 'Done', storyPoints: 5 },
    createdAt: new Date('2026-08-27T11:20:00.000Z')
  },
  {
    id: 'act-pilot-5',
    projectId: 'proj-pilot',
    actorId: 'm-1',
    type: 'team',
    action: 'member_added',
    targetType: 'member',
    targetId: 'm-4',
    targetKey: 'ER',
    targetTitle: 'Elena Rostova',
    message: 'added Elena Rostova as Frontend Engineer to ProjectPilot Core',
    metadata: { memberName: 'Elena Rostova', role: 'Frontend Engineer' },
    createdAt: new Date('2026-08-20T14:00:00.000Z')
  },
  {
    id: 'act-infra-1',
    projectId: 'proj-infra',
    actorId: 'm-3',
    type: 'sprint',
    action: 'sprint_started',
    targetType: 'sprint',
    targetId: 'sprint-infra-12',
    targetKey: 'Infra S12',
    targetTitle: 'Infra Sprint 12 — Cloud & TLS',
    message: 'started Infra Sprint 12 — Cloud & TLS (25 pts capacity)',
    metadata: { sprintId: 'sprint-infra-12', capacity: 25 },
    createdAt: new Date('2026-08-25T09:00:00.000Z')
  },
  {
    id: 'act-mob-1',
    projectId: 'proj-mobile',
    actorId: 'm-4',
    type: 'sprint',
    action: 'sprint_started',
    targetType: 'sprint',
    targetId: 'sprint-mob-6',
    targetKey: 'Mobile S6',
    targetTitle: 'Mobile Sprint 6 — Offline Mode',
    message: 'started Mobile Sprint 6 — Offline Mode (20 pts capacity)',
    metadata: { sprintId: 'sprint-mob-6', capacity: 20 },
    createdAt: new Date('2026-08-24T11:00:00.000Z')
  }
];

export const SEED_DOCUMENTS = [
  {
    id: 'doc-pilot-arch',
    projectId: 'proj-pilot',
    title: 'ProjectPilot System Architecture & Service Blueprint',
    description: 'Comprehensive blueprint describing the Vue 3 frontend shell, Express backend, PostgreSQL schema, and Gemini tool calling pipeline.',
    documentType: 'ARCHITECTURE',
    source: 'internal/architecture',
    status: 'INDEXED',
    createdById: 'm-1',
    content: `# ProjectPilot System Architecture & Service Blueprint

## 1. Overview & High-Level Architecture
ProjectPilot is built on a clean multi-layer modular architecture:
- Frontend: Vue 3 with Composition API, Pinia stores for unidirectional state, and Vanilla CSS design tokens.
- Backend: Node.js with Express 4, layered controllers, domain services, and repository patterns.
- Database: Cloud PostgreSQL with Prisma ORM and the pgvector extension for semantic similarity retrieval.
- AI Intelligence: Google Gemini 3.6 Flash for multi-turn tool calling and gemini-embedding-001 for 768-dimensional vector embeddings.

## 2. Layered Responsibilities
1. Routes: Express routers mapping REST endpoints to controllers with middleware validation.
2. Controllers: HTTP request parsing, response formatting, and status code mapping.
3. Services: Business logic, multi-turn AI tool loops, document chunking, and metric derivation.
4. Repositories: Direct database queries via Prisma and pgvector raw distance queries.
5. Database: Single runtime source of truth in PostgreSQL. Zero in-memory fallback datasets.

## 3. Database Connection & Pooling
The application connects to Cloud PostgreSQL using an optimized connection pool. To prevent connection exhaustion under heavy traffic, Prisma Client operates as a singleton instance across all service modules with pooled connection recycling.`,
    createdAt: new Date('2026-08-18T10:00:00.000Z'),
    updatedAt: new Date('2026-08-28T14:30:00.000Z')
  },
  {
    id: 'doc-pilot-auth',
    projectId: 'proj-pilot',
    title: 'Authentication & Role-Based Access Control (RBAC) Specifications',
    description: 'Security specifications for JWT browser sessions, password hashing with bcrypt, and multi-tenant project authorization.',
    documentType: 'ARCHITECTURE',
    source: 'internal/security',
    status: 'INDEXED',
    createdById: 'm-1',
    content: `# Authentication & Role-Based Access Control (RBAC) Specifications

## 1. Authentication Mechanism
ProjectPilot uses HTTP-only JSON Web Tokens (JWT) for secure browser authentication:
- Tokens are signed using HMAC SHA-256 with a 32-character secret key.
- Tokens expire in 24 hours (configurable via JWT_EXPIRES_IN).
- Secure, SameSite=Lax HTTP-only cookies prevent Cross-Site Scripting (XSS) token exfiltration.
- Passwords are salted and hashed with bcrypt using 10 salt rounds.

## 2. Global Role Hierarchy
- ADMIN: Superuser access across all projects, member invites, and global analytics.
- PROJECT_MANAGER: Full control over assigned project boards, sprint planning, and team membership.
- DEVELOPER: Standard access to view boards, move assigned tickets, and participate in sprints.
- VIEWER: Read-only access to project overview, metrics, and documentation.

## 3. Project-Level Authorization
Access to project data is strictly validated on every request via the requireProjectAccess() middleware. Even if a user knows a projectKey, they cannot access tickets, sprints, or documentation unless they have an active project membership record.`,
    createdAt: new Date('2026-08-20T11:00:00.000Z'),
    updatedAt: new Date('2026-08-29T16:00:00.000Z')
  },
  {
    id: 'doc-infra-k8s',
    projectId: 'proj-infra',
    title: 'Kubernetes Staging Deployment & TLS Rotation Runbook',
    description: 'Operational runbook for deploying microservices, provisioning staging ingress, and rotating Let\'s Encrypt TLS certificates.',
    documentType: 'RUNBOOK',
    source: 'devops/runbooks',
    status: 'INDEXED',
    createdById: 'm-3',
    content: `# Kubernetes Staging Deployment & TLS Rotation Runbook

## 1. Staging Deployment Pipeline
All backend and frontend builds are containerized using Docker multi-stage images and deployed via Helm charts to the staging EKS cluster:
1. Build step compiles Vite production bundle and validates zero TypeScript/linter errors.
2. Container images are scanned for vulnerabilities before pushing to AWS ECR.
3. Helm rollout automatically restarts deployment pods with zero downtime rolling updates.

## 2. Automated TLS Certificate Rotation
TLS certificates are managed by cert-manager with Let's Encrypt ACME DNS-01 challenge automation:
- Certificates renew automatically 30 days prior to expiration.
- Emergency manual rotation: run \`kubectl cert-manager renew stage-projectpilot-tls\` from the bastion host.`,
    createdAt: new Date('2026-08-22T09:00:00.000Z'),
    updatedAt: new Date('2026-08-30T10:00:00.000Z')
  }
];

export async function seedDatabase(client = prisma) {
  console.log('🌱 Starting ProjectPilot database seeding...');

  // 1. Seed Members (Upsert)
  console.log(`👤 Seeding ${SEED_MEMBERS.length} workspace team members...`);
  for (const member of SEED_MEMBERS) {
    await client.member.upsert({
      where: { id: member.id },
      update: member,
      create: member
    });
  }

  // 1b. Seed Users (Upsert)
  console.log(`🔐 Seeding ${SEED_USERS.length} user authentication accounts...`);
  for (const user of SEED_USERS) {
    await client.user.upsert({
      where: { id: user.id },
      update: user,
      create: user
    });
  }

  // 2. Seed Projects (Upsert)
  console.log(`📁 Seeding ${SEED_PROJECTS.length} project workspaces...`);
  for (const proj of SEED_PROJECTS) {
    const { memberIds, ...projectData } = proj;
    await client.project.upsert({
      where: { id: projectData.id },
      update: projectData,
      create: projectData
    });

    // Seed Project Memberships
    for (const memberId of memberIds) {
      await client.projectMember.upsert({
        where: {
          projectId_memberId: {
            projectId: projectData.id,
            memberId
          }
        },
        update: {},
        create: {
          projectId: projectData.id,
          memberId,
          role: SEED_MEMBERS.find((m) => m.id === memberId)?.role || 'Developer'
        }
      });
    }
  }

  // 3. Seed Sprints (Upsert)
  console.log(`🏃 Seeding ${SEED_SPRINTS.length} project sprints...`);
  for (const sprint of SEED_SPRINTS) {
    await client.sprint.upsert({
      where: { id: sprint.id },
      update: sprint,
      create: sprint
    });
  }

  // 4. Seed Tickets (Upsert)
  console.log(`🎫 Seeding ${SEED_TICKETS.length} project tickets...`);
  for (const ticket of SEED_TICKETS) {
    await client.ticket.upsert({
      where: { id: ticket.id },
      update: ticket,
      create: ticket
    });
  }

  // 5. Seed Activities (Upsert)
  console.log(`📜 Seeding ${SEED_ACTIVITIES.length} audit activities...`);
  for (const activity of SEED_ACTIVITIES) {
    await client.activity.upsert({
      where: { id: activity.id },
      update: activity,
      create: activity
    });
  }

  // 6. Seed Knowledge Base Documents via DocumentIngestionService
  console.log(`📚 Seeding project documentation records via RAG ingestion pipeline...`);
  await seedKnowledgeBase();

  console.log('✅ ProjectPilot database seeded successfully!');
}

// Run when executed directly via `node prisma/seed.js` or `prisma db seed`
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .catch((e) => {
      console.error('❌ Seeding failed with error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
