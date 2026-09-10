/**
 * ProjectPilot Seed Tickets
 * 16 Updated Existing Tickets + 30 Brand New Production-Grade Tickets (Total: 46)
 * Structured with realistic, developer-focused Problem, Update, Fix, Acceptance Criteria.
 */
import { TicketType, TicketStatus, TicketPriority } from '../src/generated/client/index.js';

export const SEED_TICKETS = [
  // =========================================================================
  // PILOT PROJECT — EXISTING TICKETS (UPDATED REALISTIC DESCRIPTIONS)
  // =========================================================================
  {
    id: 't-pilot-89',
    key: 'PILOT-89',
    projectId: 'proj-pilot',
    title: 'Fix race condition in drag-and-drop Kanban column reordering',
    description: `Problem:
When developers rapidly drag multiple cards across adjacent columns, Vue reactivity triggers parallel dispatch calls to ticketStore.updateTicketStatus(). In high-latency networks, the backend responses return out of sequence, causing optimistic state collisions where tickets flicker back to their previous status columns before settling.

Update:
Observed primarily during sprint triage sessions when 4+ items are transitioned within a 2-second window. Sentry traces confirm concurrent PUT /api/v1/tickets/:id requests with overlapping timestamps.

Fix:
Introduce a per-ticket mutex queue in ticketStore along with optimistic revision tracking (versionId). Cancel pending stale debounce transitions when a new drag-drop event occurs, and enforce sequential store commits.

Acceptance Criteria:
- Rapid consecutive drag-and-drop actions on a card update state deterministically with zero UI rubber-banding.
- Network requests are queued per card ID, aborting obsolete in-flight requests.
- Failed network requests revert the card to its pre-drag column with an inline error toast.`,
    type: TicketType.BUG,
    status: TicketStatus.TODO,
    priority: TicketPriority.HIGH,
    assigneeId: 'm-1',
    reporterId: 'm-2',
    sprintId: 'sprint-pilot-24',
    storyPoints: 3,
    rank: 100,
    labels: ['frontend', 'kanban', 'ui'],
    dueDate: new Date('2026-09-02T00:00:00.000Z'),
    createdAt: new Date('2026-08-20T10:00:00.000Z'),
    updatedAt: new Date('2026-08-28T16:00:00.000Z')
  },
  {
    id: 't-pilot-92',
    key: 'PILOT-92',
    projectId: 'proj-pilot',
    title: 'Implement pgvector document chunking and indexing script',
    description: `Problem:
Project technical documentation and architectural runbooks are too large for single-pass LLM context windows, resulting in truncation and poor semantic retrieval accuracy in copilot responses.

Update:
Benchmarked various chunking window sizes against existing architecture markdown files in server/seed/knowledge. A 500-token window with a 50-token rolling overlap preserves semantic coherence across function signatures and markdown headings.

Fix:
Build DocumentIngestionService with recursive token splitting, metadata header extraction, and automatic batching into the PostgreSQL pgvector DocumentChunk table with cosine distance indexing (vector_cosine_ops).

Acceptance Criteria:
- Markdown files are parsed into semantic chunks with 500 max tokens and 50 token overlap.
- Each chunk stores parent document foreign key, chunk index, token count, and 768-dimensional embedding.
- Idempotent re-indexing script replaces outdated chunks without orphaned embeddings.`,
    type: TicketType.TASK,
    status: TicketStatus.DONE,
    priority: TicketPriority.MEDIUM,
    assigneeId: 'm-3',
    reporterId: 'm-1',
    sprintId: 'sprint-pilot-24',
    storyPoints: 5,
    rank: 200,
    labels: ['ai', 'rag', 'database'],
    dueDate: new Date('2026-08-26T00:00:00.000Z'),
    createdAt: new Date('2026-08-18T08:30:00.000Z'),
    updatedAt: new Date('2026-08-27T11:20:00.000Z')
  },
  {
    id: 't-pilot-98',
    key: 'PILOT-98',
    projectId: 'proj-pilot',
    title: 'Streaming SSE handler for Gemini Assistant chat responses',
    description: `Problem:
Gemini AI chat completions previously waited for full response generation before returning JSON, causing a 3-5 second perceived latency where the assistant UI appeared frozen without user feedback.

Update:
Implemented Server-Sent Events (SSE) streaming endpoint using @google/genai generateContentStream API. Event stream protocol emits text-delta chunks as tokens arrive from the model.

Fix:
Implement EventSource reader in ai.api.js and pipe text tokens into aiStore.activeMessageStream. Add markdown chunk parser to handle partial code blocks and syntax formatting gracefully.

Acceptance Criteria:
- AI assistant responses start streaming tokens within 400ms of prompt dispatch.
- Code fences and markdown lists render progressively without visual layout snapping.
- User can trigger generation abort via the cancel button, cleanly closing the HTTP SSE connection.`,
    type: TicketType.STORY,
    status: TicketStatus.IN_REVIEW,
    priority: TicketPriority.HIGH,
    assigneeId: 'm-1',
    reporterId: 'm-5',
    sprintId: 'sprint-pilot-24',
    storyPoints: 8,
    rank: 300,
    labels: ['ai', 'streaming', 'frontend'],
    dueDate: new Date('2026-09-03T00:00:00.000Z'),
    createdAt: new Date('2026-08-22T14:15:00.000Z'),
    updatedAt: new Date('2026-08-30T09:40:00.000Z')
  },
  {
    id: 't-pilot-104',
    key: 'PILOT-104',
    projectId: 'proj-pilot',
    title: 'PostgreSQL connection pool exhaustion under load',
    description: `Problem:
Under heavy concurrent test traffic (50+ simulated users executing board refreshes), the Prisma connection pool exceeds PostgreSQL max_connections (10), resulting in timeout errors (PrismaClientInitializationError: Timed out fetching a connection from the pool).

Update:
Connection pooling metrics on Neon DB showed connection spikes caused by unclosed transaction instances in the audit activity logger and rapid polling on the dashboard page.

Fix:
Tune Prisma client connection pooling parameters: configure connection_limit=20, pool_timeout=15, and wrap long-running audit event inserts in lightweight background promises rather than blocking main request threads.

Acceptance Criteria:
- Load test with 60 concurrent requests produces 0 connection pool timeout errors.
- Database pool metrics remain below 80% capacity during peak board reload operations.
- Healthcheck endpoint /api/v1/health reports connection latency < 45ms.`,
    type: TicketType.BUG,
    status: TicketStatus.IN_PROGRESS,
    priority: TicketPriority.URGENT,
    assigneeId: 'm-2',
    reporterId: 'm-6',
    sprintId: 'sprint-pilot-24',
    storyPoints: 5,
    rank: 400,
    labels: ['database', 'performance', 'critical'],
    dueDate: new Date('2026-08-31T00:00:00.000Z'),
    createdAt: new Date('2026-08-25T11:00:00.000Z'),
    updatedAt: new Date('2026-08-30T10:00:00.000Z')
  },
  {
    id: 't-pilot-112',
    key: 'PILOT-112',
    projectId: 'proj-pilot',
    title: 'Design responsive navigation shell and design token system',
    description: `Problem:
Inconsistent color codes, hardcoded hex values, and disparate border radii across the application created visual fragmentation between navigation components, cards, and modal dialogs.

Update:
Audited legacy CSS across components. Found 14 distinct gray hex colors and inconsistent padding tokens between project views and global navigation.

Fix:
Centralize tokens into tokens.css with semantic variables for light and dark themes: surface colors, elevation levels, glassmorphism backdrops, border highlights, focus rings, and typography scales.

Acceptance Criteria:
- All components consume semantic CSS variables instead of hardcoded hex colors.
- Theme switching toggles between light and dark tokens with zero full-page reload or visual flashing.
- Sidebar collapses smoothly to 64px icon mode with preserved active route indicators.`,
    type: TicketType.TASK,
    status: TicketStatus.IN_PROGRESS,
    priority: TicketPriority.MEDIUM,
    assigneeId: 'm-4',
    reporterId: 'm-1',
    sprintId: 'sprint-pilot-24',
    storyPoints: 3,
    rank: 500,
    labels: ['ui', 'design-system', 'css'],
    dueDate: new Date('2026-09-01T00:00:00.000Z'),
    createdAt: new Date('2026-08-26T09:00:00.000Z'),
    updatedAt: new Date('2026-08-29T18:00:00.000Z')
  },
  {
    id: 't-pilot-118',
    key: 'PILOT-118',
    projectId: 'proj-pilot',
    title: 'Multi-tenant role permission policies for project settings',
    description: `Problem:
Users with 'Viewer' roles were able to submit PUT and DELETE requests directly to /api/v1/projects/:key and mutate project metadata because RBAC middleware only checked authentication, not authorization permissions.

Update:
Security review identified missing project-level role assertions in project.controller.js and sprint.controller.js.

Fix:
Introduce requireProjectRole(['ADMIN', 'PROJECT_MANAGER']) middleware that verifies user membership and permissions against the requested project workspace before delegating to route handlers.

Acceptance Criteria:
- Viewers receive 403 Forbidden when attempting to update project settings or delete projects.
- UI elements for destructive actions (Delete, Edit, Reassign) are hidden or disabled for unauthorized users.
- Permission enforcement unit tests pass for Admin, Project Manager, Developer, and Viewer roles.`,
    type: TicketType.STORY,
    status: TicketStatus.BACKLOG,
    priority: TicketPriority.HIGH,
    assigneeId: 'm-1',
    reporterId: 'm-1',
    sprintId: null,
    storyPoints: 5,
    rank: 600,
    labels: ['security', 'rbac', 'backend'],
    dueDate: new Date('2026-09-10T00:00:00.000Z'),
    createdAt: new Date('2026-08-28T13:00:00.000Z'),
    updatedAt: new Date('2026-08-28T13:00:00.000Z')
  },
  {
    id: 't-pilot-120',
    key: 'PILOT-120',
    projectId: 'proj-pilot',
    title: 'Add automated database seed scripts for local development',
    description: `Problem:
Onboarding new engineers requires manual database seeding and ad-hoc SQL dumps, which often drifted from Prisma schema migrations and left demo environments with empty workspaces.

Update:
Created server/prisma/seed.js to deterministically populate realistic team members, sprint cadences, tickets, and knowledge base documentation.

Fix:
Write an idempotent seeding script utilizing Prisma upsert queries, deterministic UUIDs, bcrypt password hashes, and automated ingestion of markdown technical runbooks.

Acceptance Criteria:
- Running npm run db:seed provisions demo users, 3 projects, 6 sprints, and indexed knowledge docs.
- Script is completely idempotent and can be executed multiple times without duplicating entities.
- Seed data adheres to all foreign key constraints and enum definitions.`,
    type: TicketType.TASK,
    status: TicketStatus.BACKLOG,
    priority: TicketPriority.MEDIUM,
    assigneeId: 'm-3',
    reporterId: 'm-2',
    sprintId: null,
    storyPoints: 2,
    rank: 700,
    labels: ['dx', 'database'],
    dueDate: new Date('2026-09-12T00:00:00.000Z'),
    createdAt: new Date('2026-08-29T10:00:00.000Z'),
    updatedAt: new Date('2026-08-29T10:00:00.000Z')
  },
  {
    id: 't-pilot-122',
    key: 'PILOT-122',
    projectId: 'proj-pilot',
    title: 'Markdown live preview sync with document chunking index',
    description: `Problem:
When users edit project documentation in the knowledge base, embeddings in pgvector become stale until a manual server restart or re-seed script is triggered.

Update:
Evaluated background job queue vs inline event hooks. Given the low volume of document edits per project, an inline post-save hook in KnowledgeService ensures real-time index synchronization.

Fix:
Hook DocumentIngestionService.reindexDocument(docId) into document update and creation mutations. Delete stale chunk records in a transaction before inserting freshly embedded chunks.

Acceptance Criteria:
- Editing a document immediately triggers chunk regeneration and vector re-indexing.
- Stale vector embeddings are purged in the same database transaction.
- AI search queries return updated content within 2 seconds of document save.`,
    type: TicketType.STORY,
    status: TicketStatus.TODO,
    priority: TicketPriority.HIGH,
    assigneeId: 'm-5',
    reporterId: 'm-1',
    sprintId: 'sprint-pilot-25',
    storyPoints: 8,
    rank: 800,
    labels: ['ai', 'docs', 'rag'],
    dueDate: new Date('2026-09-05T00:00:00.000Z'),
    createdAt: new Date('2026-08-29T15:30:00.000Z'),
    updatedAt: new Date('2026-08-29T15:30:00.000Z')
  },

  // =========================================================================
  // INFRA PROJECT — EXISTING TICKETS (UPDATED REALISTIC DESCRIPTIONS)
  // =========================================================================
  {
    id: 't-infra-14',
    key: 'INFRA-14',
    projectId: 'proj-infra',
    title: 'Provision staging Kubernetes cluster with GPU node pool',
    description: `Problem:
Local AI embeddings and self-hosted model evaluation experiments require dedicated GPU acceleration on staging infrastructure to avoid rate-limiting third-party cloud APIs.

Update:
Terraform manifests prepared for an EKS node group using g5.xlarge instances with NVIDIA A10G Tensor Core GPUs.

Fix:
Deploy AWS EKS cluster with NVIDIA GPU operator, configure containerd runtime for CUDA support, and set up Kubernetes node taints so standard web application pods do not schedule on expensive GPU nodes.

Acceptance Criteria:
- GPU node pool auto-scales between 1 and 3 nodes based on inference queue depth.
- nvidia-smi reports operational GPU memory on all worker pods in the ml-inference namespace.
- Non-GPU workloads remain scheduled exclusively on standard m6i compute nodes.`,
    type: TicketType.TASK,
    status: TicketStatus.IN_PROGRESS,
    priority: TicketPriority.URGENT,
    assigneeId: 'm-3',
    reporterId: 'm-1',
    sprintId: 'sprint-infra-12',
    storyPoints: 5,
    rank: 100,
    labels: ['kubernetes', 'cloud', 'gpu'],
    dueDate: new Date('2026-09-02T00:00:00.000Z'),
    createdAt: new Date('2026-08-22T09:00:00.000Z'),
    updatedAt: new Date('2026-08-29T17:00:00.000Z')
  },
  {
    id: 't-infra-16',
    key: 'INFRA-16',
    projectId: 'proj-infra',
    title: 'Configure TLS certificate rotation on ingress gateway',
    description: `Problem:
Production and staging ingress certificates are manually renewed, creating an operational risk of expired SSL certificates causing browser security warnings.

Update:
Identified cert-manager Helm chart with Let's Encrypt ACME ClusterIssuer as the standard automated solution for Kubernetes ingress controllers.

Fix:
Configure cert-manager with DNS-01 ACME challenge using AWS Route53 credentials, set certificate renewal threshold to 30 days prior to expiry, and bind ingress annotations for automated cert injection.

Acceptance Criteria:
- SSL certificates automatically provision and renew for all *.projectpilot.dev subdomains.
- Qualys SSL Labs rating tests achieve an A+ security benchmark.
- Automatic HTTP to HTTPS 301 redirection is enforced at the ingress layer.`,
    type: TicketType.TASK,
    status: TicketStatus.TODO,
    priority: TicketPriority.MEDIUM,
    assigneeId: 'm-3',
    reporterId: 'm-3',
    sprintId: 'sprint-infra-12',
    storyPoints: 3,
    rank: 200,
    labels: ['security', 'ssl', 'networking'],
    dueDate: new Date('2026-09-06T00:00:00.000Z'),
    createdAt: new Date('2026-08-24T11:00:00.000Z'),
    updatedAt: new Date('2026-08-24T11:00:00.000Z')
  },
  {
    id: 't-infra-18',
    key: 'INFRA-18',
    projectId: 'proj-infra',
    title: 'Automated database backup snapshots to S3-compatible storage',
    description: `Problem:
Production PostgreSQL database lacks automated point-in-time recovery (PITR) and cross-region backup archives, exposing project history to potential data loss during catastrophic cloud provider outages.

Update:
Evaluated WAL-G vs pg_dump cron jobs. WAL-G continuous archiving provides sub-5-minute recovery point objective (RPO) with minimal database I/O overhead.

Fix:
Deploy daily automated snapshot jobs with continuous Write-Ahead Log (WAL) archiving to an encrypted, versioned AWS S3 bucket with a 30-day lifecycle retention policy.

Acceptance Criteria:
- Automated full daily backup snapshots run at 02:00 UTC without service interruption.
- Continuous WAL streaming enables point-in-time recovery to any minute in the past 14 days.
- Automated quarterly restore test restores snapshot to an isolated staging database and validates record counts.`,
    type: TicketType.STORY,
    status: TicketStatus.BACKLOG,
    priority: TicketPriority.HIGH,
    assigneeId: 'm-2',
    reporterId: 'm-3',
    sprintId: null,
    storyPoints: 8,
    rank: 300,
    labels: ['database', 'storage', 'backup'],
    dueDate: new Date('2026-09-15T00:00:00.000Z'),
    createdAt: new Date('2026-08-26T14:00:00.000Z'),
    updatedAt: new Date('2026-08-26T14:00:00.000Z')
  },
  {
    id: 't-infra-20',
    key: 'INFRA-20',
    projectId: 'proj-infra',
    title: 'Set up Prometheus and Grafana alerts for high memory usage',
    description: `Problem:
Node.js server memory leaks under streaming AI assistant workloads were previously only detected after pod crashes triggered Kubernetes OOMKilled restarts.

Update:
Prometheus node-exporter and Prometheus Node.js client metrics exporter deployed to staging cluster.

Fix:
Configure Alertmanager rules triggering alerts on Slack and email when container memory consumption exceeds 85% for 5 consecutive minutes or event loop lag exceeds 120ms.

Acceptance Criteria:
- Prometheus captures memory, CPU, and event loop metrics from all running server replicas.
- Grafana dashboard visualizes memory trends alongside active SSE connections.
- Alertmanager fires notifications within 60 seconds of memory threshold breaches.`,
    type: TicketType.TASK,
    status: TicketStatus.DONE,
    priority: TicketPriority.LOW,
    assigneeId: 'm-6',
    reporterId: 'm-3',
    sprintId: 'sprint-infra-11',
    storyPoints: 2,
    rank: 400,
    labels: ['observability', 'monitoring'],
    dueDate: new Date('2026-08-25T00:00:00.000Z'),
    createdAt: new Date('2026-08-19T10:00:00.000Z'),
    updatedAt: new Date('2026-08-25T16:45:00.000Z')
  },

  // =========================================================================
  // MOBILE PROJECT — EXISTING TICKETS (UPDATED REALISTIC DESCRIPTIONS)
  // =========================================================================
  {
    id: 't-mob-22',
    key: 'MOBILE-22',
    projectId: 'proj-mobile',
    title: 'SQLite local cache synchronization layer for offline access',
    description: `Problem:
Mobile engineers visiting remote job sites or experiencing airplane Wi-Fi dropouts cannot view active sprints, ticket details, or create offline issue drafts.

Update:
Designed a local SQLite schema mirroring core ticket and sprint entities with a syncStatus flag (SYNCED, PENDING_INSERT, PENDING_UPDATE).

Fix:
Implement bi-directional synchronization manager that queues mutation events in SQLite and flushes them sequentially with conflict resolution when device connectivity transitions from offline to online.

Acceptance Criteria:
- Users can view cached boards, sprints, and ticket details with zero network connectivity.
- Offline ticket creations are queued locally with temporary client IDs and synchronized upon reconnection.
- Sync engine handles connection drops gracefully without duplicate ticket creation.`,
    type: TicketType.TASK,
    status: TicketStatus.IN_PROGRESS,
    priority: TicketPriority.HIGH,
    assigneeId: 'm-5',
    reporterId: 'm-4',
    sprintId: 'sprint-mob-6',
    storyPoints: 5,
    rank: 100,
    labels: ['mobile', 'offline', 'sqlite'],
    dueDate: new Date('2026-09-04T00:00:00.000Z'),
    createdAt: new Date('2026-08-23T11:30:00.000Z'),
    updatedAt: new Date('2026-08-30T08:15:00.000Z')
  },
  {
    id: 't-mob-25',
    key: 'MOBILE-25',
    projectId: 'proj-mobile',
    title: 'Push notification service worker for ticket mentions',
    description: `Problem:
Team members frequently miss urgent ticket assignments or comment mentions when away from their workstations, resulting in delayed incident responses.

Update:
Configured Firebase Cloud Messaging (FCM) and Apple Push Notification service (APNs) push notification payload schemas.

Fix:
Build backend notification dispatcher in NotificationService that triggers on ticket assignment and user mentions (@username), dispatching encrypted push payloads with deep-link navigation metadata.

Acceptance Criteria:
- Users receive push notifications within 3 seconds of being assigned or mentioned on a ticket.
- Tapping a notification opens the mobile app directly to the relevant ticket drawer view.
- Users can configure notification preferences per project in account settings.`,
    type: TicketType.STORY,
    status: TicketStatus.TODO,
    priority: TicketPriority.HIGH,
    assigneeId: 'm-4',
    reporterId: 'm-4',
    sprintId: 'sprint-mob-6',
    storyPoints: 5,
    rank: 200,
    labels: ['mobile', 'notifications'],
    dueDate: new Date('2026-09-07T00:00:00.000Z'),
    createdAt: new Date('2026-08-25T16:00:00.000Z'),
    updatedAt: new Date('2026-08-25T16:00:00.000Z')
  },
  {
    id: 't-mob-28',
    key: 'MOBILE-28',
    projectId: 'proj-mobile',
    title: 'iOS Widget for active sprint burndown tracking',
    description: `Problem:
Project managers and developers want at-a-glance visibility of active sprint progress, remaining story points, and sprint end date without repeatedly launching the full mobile application.

Update:
Prototyped WidgetKit medium and small widget layouts using SwiftUI.

Fix:
Develop iOS WidgetKit extension that fetches cached sprint burndown statistics from shared App Group storage and reloads its timeline every 30 minutes or upon push payload signals.

Acceptance Criteria:
- Widget displays active sprint title, progress ring percentage, and remaining days.
- Medium widget variant renders a compact 5-day burndown sparkline chart.
- Tapping the widget opens the app directly to the active project sprint overview.`,
    type: TicketType.STORY,
    status: TicketStatus.BACKLOG,
    priority: TicketPriority.MEDIUM,
    assigneeId: 'm-4',
    reporterId: 'm-4',
    sprintId: null,
    storyPoints: 3,
    rank: 300,
    labels: ['ios', 'widgets'],
    dueDate: new Date('2026-09-18T00:00:00.000Z'),
    createdAt: new Date('2026-08-27T10:00:00.000Z'),
    updatedAt: new Date('2026-08-27T10:00:00.000Z')
  },
  {
    id: 't-mob-30',
    key: 'MOBILE-30',
    projectId: 'proj-mobile',
    title: 'Fix splash screen layout jitter on Android 14 devices',
    description: `Problem:
On Android 14 devices with gesture navigation bars, the application splash screen undergoes a brief 120ms layout jump where the window background flickers white before theme hydration completes.

Update:
Identified that windowOptOutEdgeToEdgeEnforcement was deprecated in API level 34, causing asynchronous insets dispatch during cold launch.

Fix:
Adopt Android 14 SplashScreen API with window background color set to dark slate (#0B0D10) in styles.xml, and defer splash screen dismissal until Vue root component mounts.

Acceptance Criteria:
- Cold app launch transitions seamlessly from OS splash to application login/dashboard with zero white flash.
- Status bar and navigation bar insets are respected across all tested Android screen aspect ratios.
- Total cold boot time remains under 850ms on mid-tier test devices.`,
    type: TicketType.BUG,
    status: TicketStatus.DONE,
    priority: TicketPriority.LOW,
    assigneeId: 'm-6',
    reporterId: 'm-4',
    sprintId: 'sprint-mob-5',
    storyPoints: 2,
    rank: 400,
    labels: ['android', 'ui-bug'],
    dueDate: new Date('2026-08-24T00:00:00.000Z'),
    createdAt: new Date('2026-08-19T13:00:00.000Z'),
    updatedAt: new Date('2026-08-24T15:00:00.000Z')
  },

  // =========================================================================
  // 30 BRAND NEW REALISTIC PRODUCTION-GRADE TICKETS
  // =========================================================================

  // --- PILOT (12 New Tickets) ---
  {
    id: 't-pilot-130',
    key: 'PILOT-130',
    projectId: 'proj-pilot',
    title: 'Implement pgvector cosine similarity threshold calibration for RAG queries',
    description: `Problem:
When developers ask AI Assistant vague or cross-cutting questions, the RAG similarity search returns loosely correlated chunks with cosine distances > 0.45, diluting the prompt context and inducing hallucinations.

Update:
Ran cross-entropy evaluation on 100 sample architecture questions. A calibrated distance threshold of 0.32 yields 94% precision on ground-truth runbook citations.

Fix:
Add similarity threshold parameter in VectorSearchService. Filter out chunks with cosine distance exceeding 0.35, and dynamically adjust top-k retrieval between 3 and 7 based on prompt token length.

Acceptance Criteria:
- Chunks with cosine distance > 0.35 are discarded before assembling Gemini context window.
- If no chunks meet the threshold, the assistant gracefully indicates insufficient documentation rather than speculating.
- Unit tests verify filtering precision across 15 standard architecture queries.`,
    type: TicketType.TASK,
    status: TicketStatus.IN_PROGRESS,
    priority: TicketPriority.HIGH,
    assigneeId: 'm-5',
    reporterId: 'm-1',
    sprintId: 'sprint-pilot-24',
    storyPoints: 5,
    rank: 810,
    labels: ['ai', 'rag', 'pgvector'],
    dueDate: new Date('2026-09-04T00:00:00.000Z'),
    createdAt: new Date('2026-08-30T10:00:00.000Z'),
    updatedAt: new Date('2026-08-31T14:20:00.000Z')
  },
  {
    id: 't-pilot-131',
    key: 'PILOT-131',
    projectId: 'proj-pilot',
    title: 'Fix JWT token refresh race condition on concurrent API requests',
    description: `Problem:
When a user session approaches its 24-hour token expiration, multiple parallel client requests simultaneously trigger refresh token rotations, causing one request to succeed while sibling requests fail with 401 Unauthorized.

Update:
Reproduced in automated staging tests by firing 5 parallel GET requests with a token expired by 10 seconds. 4 of 5 requests trigger token revocation errors.

Fix:
Implement a client-side request queue in httpClient.js that holds subsequent API requests while a single refresh token exchange is in progress, re-issuing all queued requests with the new bearer token upon resolution.

Acceptance Criteria:
- 10 parallel API requests at expiration boundary resolve successfully using a single refresh call.
- No redundant refresh token generation requests sent to /api/v1/auth/refresh.
- If refresh token is genuinely invalid, redirect cleanly to /login with an expired session banner.`,
    type: TicketType.BUG,
    status: TicketStatus.IN_REVIEW,
    priority: TicketPriority.URGENT,
    assigneeId: 'm-2',
    reporterId: 'm-1',
    sprintId: 'sprint-pilot-24',
    storyPoints: 5,
    rank: 820,
    labels: ['auth', 'security', 'http'],
    dueDate: new Date('2026-09-02T00:00:00.000Z'),
    createdAt: new Date('2026-08-29T11:00:00.000Z'),
    updatedAt: new Date('2026-08-31T16:00:00.000Z')
  },
  {
    id: 't-pilot-132',
    key: 'PILOT-132',
    projectId: 'proj-pilot',
    title: 'Add debounce handler to global search command palette',
    description: `Problem:
Typing quickly in the Command + K search modal dispatches full-text filter operations on every keystroke, causing visible UI typing lag when the ticket dataset exceeds 200 items.

Update:
Profiled Chrome performance timeline during rapid typing in AppShell.vue command palette; input thread spends 85ms on redundant computed list re-evaluations.

Fix:
Wrap search input watcher with a 150ms trailing debounce and memoize normalized ticket search tokens to keep the input responsive at 60 FPS.

Acceptance Criteria:
- Keystroke latency inside Command Palette remains under 16ms during fast typing.
- Search results populate within 160ms after typing pauses.
- Up and down arrow navigation remains buttery smooth regardless of ticket list size.`,
    type: TicketType.TASK,
    status: TicketStatus.DONE,
    priority: TicketPriority.MEDIUM,
    assigneeId: 'm-4',
    reporterId: 'm-3',
    sprintId: 'sprint-pilot-23',
    storyPoints: 2,
    rank: 830,
    labels: ['frontend', 'performance', 'search'],
    dueDate: new Date('2026-08-23T00:00:00.000Z'),
    createdAt: new Date('2026-08-16T14:00:00.000Z'),
    updatedAt: new Date('2026-08-23T17:00:00.000Z')
  },
  {
    id: 't-pilot-133',
    key: 'PILOT-133',
    projectId: 'proj-pilot',
    title: 'Implement ticket dependency graphing and blocked status indicator',
    description: `Problem:
When tickets have prerequisite blockers (e.g. backend schema migration required before frontend UI implementation), developers cannot see dependency links directly on the Kanban board card.

Update:
Team leads currently have to manually write blocker notices in ticket titles or post in Slack channels.

Fix:
Introduce blockedByTicketId relational attribute in Ticket schema, add dependency badges to ticket cards, and display a visual warning pill when attempting to move a blocked ticket into 'Done'.

Acceptance Criteria:
- Ticket cards clearly show an amber 'Blocked by KEY-XXX' chip if prerequisite ticket is not Done.
- Ticket detail modal allows selecting one or more dependency ticket links.
- Moving a blocked ticket to 'Done' prompts a confirmation modal highlighting unresolved dependencies.`,
    type: TicketType.STORY,
    status: TicketStatus.TODO,
    priority: TicketPriority.HIGH,
    assigneeId: 'm-4',
    reporterId: 'm-2',
    sprintId: 'sprint-pilot-25',
    storyPoints: 5,
    rank: 840,
    labels: ['kanban', 'dependencies', 'workflow'],
    dueDate: new Date('2026-09-14T00:00:00.000Z'),
    createdAt: new Date('2026-08-30T09:00:00.000Z'),
    updatedAt: new Date('2026-08-30T09:00:00.000Z')
  },
  {
    id: 't-pilot-134',
    key: 'PILOT-134',
    projectId: 'proj-pilot',
    title: 'Refactor ticket store to emit optimistic state updates with automatic rollback',
    description: `Problem:
When updating ticket estimates or assigning team members on poor 3G connections, the UI feels sluggish because input controls freeze until the network roundtrip completes.

Update:
Tested standard optimistic updates pattern across KanbanBoard.vue and TicketDetailModal.vue.

Fix:
Update ticketStore.updateTicket to immediately apply mutations to client state, caching a snapshot of previous state. If the API returns a non-2xx status, rollback the mutation and display a contextual retry toast.

Acceptance Criteria:
- Assignee and priority dropdown changes reflect instantly in UI (< 10ms).
- Network errors trigger immediate rollback to initial value with clear error feedback.
- Activity feed receives event only after backend persistence succeeds.`,
    type: TicketType.TASK,
    status: TicketStatus.IN_PROGRESS,
    priority: TicketPriority.MEDIUM,
    assigneeId: 'm-4',
    reporterId: 'm-1',
    sprintId: 'sprint-pilot-24',
    storyPoints: 3,
    rank: 850,
    labels: ['pinia', 'state', 'ux'],
    dueDate: new Date('2026-09-03T00:00:00.000Z'),
    createdAt: new Date('2026-08-28T16:00:00.000Z'),
    updatedAt: new Date('2026-08-31T11:00:00.000Z')
  },
  {
    id: 't-pilot-135',
    key: 'PILOT-135',
    projectId: 'proj-pilot',
    title: 'Add automated audit event logging on bulk ticket reassignment',
    description: `Problem:
When project managers reassign a member's open tickets prior to removing them from a team, no audit log entries are generated, leaving the project activity timeline with missing context on who inherited the work.

Update:
Identified that ticket.store.js reassignMemberTickets executed direct patch loops without triggering ActivityRepository.create() calls.

Fix:
Update bulk reassignment service endpoint to bundle ticket reassignment activities in a single batch insert, associating actorId and previousAssignee in activity metadata.

Acceptance Criteria:
- Bulk reassignments produce aggregated audit activity entries in /projects/:key/activity.
- Timeline displays: 'Alex Morgan reassigned 4 tickets from Priya Patel to Unassigned'.
- Database batch insert completes in a single SQL transaction.`,
    type: TicketType.TASK,
    status: TicketStatus.DONE,
    priority: TicketPriority.MEDIUM,
    assigneeId: 'm-2',
    reporterId: 'm-1',
    sprintId: 'sprint-pilot-24',
    storyPoints: 3,
    rank: 860,
    labels: ['activity', 'audit', 'backend'],
    dueDate: new Date('2026-08-28T00:00:00.000Z'),
    createdAt: new Date('2026-08-24T09:00:00.000Z'),
    updatedAt: new Date('2026-08-28T18:00:00.000Z')
  },
  {
    id: 't-pilot-136',
    key: 'PILOT-136',
    projectId: 'proj-pilot',
    title: 'Gemini token consumption metrics and latency dashboard widget',
    description: `Problem:
Administrators have zero operational visibility into API quota usage, token expenditure per project, and average streaming response latency across the AI Assistant interface.

Update:
Google GenAI SDK response objects include usageMetadata (promptTokenCount, candidatesTokenCount, totalTokenCount).

Fix:
Create AiUsageMetric persistence table logging request duration and token counts per project. Expose summary endpoint /api/v1/ai/metrics and build an analytics chart widget.

Acceptance Criteria:
- Dashboard analytics tab visualizes daily token consumption and average response latency.
- High-token queries (> 3,000 tokens) are flagged with cost breakdown indicators.
- Metrics endpoint aggregates data within 50ms query time.`,
    type: TicketType.STORY,
    status: TicketStatus.BACKLOG,
    priority: TicketPriority.MEDIUM,
    assigneeId: 'm-5',
    reporterId: 'm-1',
    sprintId: null,
    storyPoints: 5,
    rank: 870,
    labels: ['ai', 'analytics', 'metrics'],
    dueDate: new Date('2026-09-20T00:00:00.000Z'),
    createdAt: new Date('2026-08-30T14:00:00.000Z'),
    updatedAt: new Date('2026-08-30T14:00:00.000Z')
  },
  {
    id: 't-pilot-137',
    key: 'PILOT-137',
    projectId: 'proj-pilot',
    title: 'Implement markdown code syntax highlighting in AI assistant message stream',
    description: `Problem:
Code blocks generated by Gemini assistant inside AIQuickChat.vue and AIAssistantPage.vue render as plain unhighlighted text, making multiline code snippets difficult to inspect and copy.

Update:
Benchmarked lightweight syntax highlighters. Prism.js with custom tokens provides minimal bundle impact (< 18KB gzipped) compared to Highlight.js.

Fix:
Integrate code block formatter in formatMessage.js with copy-to-clipboard button and Prism syntax coloring for JavaScript, SQL, Python, Bash, and Vue template blocks.

Acceptance Criteria:
- Streamed and static code blocks display syntax highlighting matching dark and light themes.
- Each code block header includes language badge and one-click 'Copy code' button.
- Code rendering does not crash or break during live token streaming.`,
    type: TicketType.TASK,
    status: TicketStatus.DONE,
    priority: TicketPriority.LOW,
    assigneeId: 'm-4',
    reporterId: 'm-5',
    sprintId: 'sprint-pilot-24',
    storyPoints: 2,
    rank: 880,
    labels: ['ai', 'frontend', 'markdown'],
    dueDate: new Date('2026-08-27T00:00:00.000Z'),
    createdAt: new Date('2026-08-22T10:00:00.000Z'),
    updatedAt: new Date('2026-08-27T15:00:00.000Z')
  },
  {
    id: 't-pilot-138',
    key: 'PILOT-138',
    projectId: 'proj-pilot',
    title: 'Add multi-criteria sorting to backlog ticket table',
    description: `Problem:
Backlog view only supported manual drag rank reordering. When triaging 50+ tickets, engineering leads cannot quickly sort tickets by priority, story points, or due date.

Update:
Gathered feedback from sprint planning meetings. Most common triage queries: 'Show all Urgent bugs sorted by points desc'.

Fix:
Build sort header toggles in TicketListView.vue and BacklogView.vue supporting primary and secondary sort keys (priority -> points -> createdAt) with persistent local storage preferences.

Acceptance Criteria:
- Clicking column headers toggles ascending, descending, and custom rank sort modes.
- Visual chevron indicates active sort column and direction.
- Drag-and-drop manual rank ordering remains disabled during active column sort to avoid index corruption.`,
    type: TicketType.TASK,
    status: TicketStatus.IN_REVIEW,
    priority: TicketPriority.MEDIUM,
    assigneeId: 'm-4',
    reporterId: 'm-3',
    sprintId: 'sprint-pilot-24',
    storyPoints: 3,
    rank: 890,
    labels: ['backlog', 'ui', 'table'],
    dueDate: new Date('2026-09-02T00:00:00.000Z'),
    createdAt: new Date('2026-08-27T13:00:00.000Z'),
    updatedAt: new Date('2026-08-31T15:00:00.000Z')
  },
  {
    id: 't-pilot-139',
    key: 'PILOT-139',
    projectId: 'proj-pilot',
    title: 'Implement WebSocket fallback for SSE connections behind corporate proxies',
    description: `Problem:
Certain enterprise VPNs and corporate proxy firewalls buffer Server-Sent Events (SSE) HTTP streams indefinitely until connection close, preventing real-time AI token rendering.

Update:
Network trace in enterprise staging test revealed HTTP proxy stripped 'Transfer-Encoding: chunked' headers and buffered response.

Fix:
Implement automatic protocol fallback: attempt SSE connection first; if no chunks received within 3.5 seconds, seamlessly switch to duplex WebSocket connection handler.

Acceptance Criteria:
- Automatic detection and fallback to WebSocket when SSE response stream is buffered.
- Real-time token streaming works cleanly across proxy and non-proxy environments.
- Fallback event logged in client telemetry for infrastructure monitoring.`,
    type: TicketType.STORY,
    status: TicketStatus.BACKLOG,
    priority: TicketPriority.HIGH,
    assigneeId: 'm-2',
    reporterId: 'm-1',
    sprintId: null,
    storyPoints: 8,
    rank: 900,
    labels: ['networking', 'websockets', 'ai'],
    dueDate: new Date('2026-09-25T00:00:00.000Z'),
    createdAt: new Date('2026-08-31T09:00:00.000Z'),
    updatedAt: new Date('2026-08-31T09:00:00.000Z')
  },
  {
    id: 't-pilot-140',
    key: 'PILOT-140',
    projectId: 'proj-pilot',
    title: 'Optimize database query performance on sprint velocity aggregation',
    description: `Problem:
Loading the analytics page for projects with 10+ sprints takes > 1,200ms because sprint velocity metrics compute story point sums by loading full ticket relation trees into Node.js memory.

Update:
Prisma query logs showed 12 separate N+1 queries executing per sprint to calculate pointsCommitted vs pointsCompleted.

Fix:
Rewrite sprint velocity calculation using a single raw PostgreSQL aggregation query with SUM(CASE WHEN status = 'DONE' THEN "storyPoints" ELSE 0 END) GROUP BY "sprintId".

Acceptance Criteria:
- Analytics velocity endpoint latency reduced from 1,200ms to < 45ms.
- Database execution plan uses existing index on (sprintId, status).
- Chart rendering on /projects/:key/analytics displays without skeleton delay.`,
    type: TicketType.TASK,
    status: TicketStatus.DONE,
    priority: TicketPriority.MEDIUM,
    assigneeId: 'm-2',
    reporterId: 'm-3',
    sprintId: 'sprint-pilot-23',
    storyPoints: 3,
    rank: 910,
    labels: ['database', 'performance', 'analytics'],
    dueDate: new Date('2026-08-22T00:00:00.000Z'),
    createdAt: new Date('2026-08-15T11:00:00.000Z'),
    updatedAt: new Date('2026-08-22T16:00:00.000Z')
  },
  {
    id: 't-pilot-141',
    key: 'PILOT-141',
    projectId: 'proj-pilot',
    title: 'Add custom label management and color tag assignment modal',
    description: `Problem:
Labels on tickets were restricted to predefined strings. Developers cannot create project-specific tags (e.g. 'q3-release', 'tech-debt') or customize label background colors.

Update:
Surveyed team preferences: requested ability to define tag names, choose from curated design system palette, and filter boards by tag.

Fix:
Create ProjectLabel entity in database schema, implement project label CRUD controller, and update ticket modal with multiselect tag picker.

Acceptance Criteria:
- Project Admins can create and delete custom labels in Project Settings.
- Labels render with consistent design system contrast badges across cards and lists.
- Filtering by label updates Kanban board and backlog in real-time.`,
    type: TicketType.STORY,
    status: TicketStatus.TODO,
    priority: TicketPriority.LOW,
    assigneeId: 'm-4',
    reporterId: 'm-6',
    sprintId: 'sprint-pilot-25',
    storyPoints: 3,
    rank: 920,
    labels: ['frontend', 'tags', 'settings'],
    dueDate: new Date('2026-09-12T00:00:00.000Z'),
    createdAt: new Date('2026-08-30T15:00:00.000Z'),
    updatedAt: new Date('2026-08-30T15:00:00.000Z')
  },

  // --- INFRA (9 New Tickets) ---
  {
    id: 't-infra-21',
    key: 'INFRA-21',
    projectId: 'proj-infra',
    title: 'Configure PostgreSQL pg_stat_statements extension for slow query profiling',
    description: `Problem:
Backend performance anomalies during peak usage hours cannot be diagnosed without real-time query execution statistics and index usage counters.

Update:
Neon DB supports pg_stat_statements extension out of the box with shared memory allocation.

Fix:
Enable pg_stat_statements in PostgreSQL configuration, write automated hourly summary report script flagging queries with mean execution time > 100ms, and set up alert notifications.

Acceptance Criteria:
- Extension records execution counts, total runtime, and min/max latency for all parameterized queries.
- Slow query report automatically generated and stored in devops logs bucket.
- Queries missing database indexes are surfaced in weekly infra triage.`,
    type: TicketType.TASK,
    status: TicketStatus.DONE,
    priority: TicketPriority.MEDIUM,
    assigneeId: 'm-3',
    reporterId: 'm-2',
    sprintId: 'sprint-infra-11',
    storyPoints: 2,
    rank: 500,
    labels: ['database', 'postgresql', 'performance'],
    dueDate: new Date('2026-08-20T00:00:00.000Z'),
    createdAt: new Date('2026-08-14T09:00:00.000Z'),
    updatedAt: new Date('2026-08-20T14:00:00.000Z')
  },
  {
    id: 't-infra-22',
    key: 'INFRA-22',
    projectId: 'proj-infra',
    title: 'Set up Redis replica cluster for distributed session caching',
    description: `Problem:
User session tokens and rate-limiting buckets are currently held in single-instance memory, creating session invalidation when server pods restart or scale horizontally.

Update:
Designed Redis 7 cluster deployment with primary-replica replication and sentinel failover.

Fix:
Provision AWS ElastiCache Redis replication group with 2 shards, update express-rate-limit to use rate-limit-redis store, and configure automatic reconnection retry strategy.

Acceptance Criteria:
- Pod restarts preserve active user login sessions without forcing re-authentication.
- Rate limit counters synchronize across all scaled server pods.
- Failover test confirms standby replica promotes to primary within 5 seconds of node disruption.`,
    type: TicketType.STORY,
    status: TicketStatus.IN_PROGRESS,
    priority: TicketPriority.HIGH,
    assigneeId: 'm-3',
    reporterId: 'm-1',
    sprintId: 'sprint-infra-12',
    storyPoints: 5,
    rank: 510,
    labels: ['redis', 'caching', 'scalability'],
    dueDate: new Date('2026-09-04T00:00:00.000Z'),
    createdAt: new Date('2026-08-26T10:00:00.000Z'),
    updatedAt: new Date('2026-08-31T09:00:00.000Z')
  },
  {
    id: 't-infra-23',
    key: 'INFRA-23',
    projectId: 'proj-infra',
    title: 'Automate Docker container vulnerability scanning in GitHub Actions',
    description: `Problem:
Base container images and NPM transitive dependencies could introduce CVE security vulnerabilities into staging and production container registries without automated detection.

Update:
Benchmarked Trivy vs Snyk container scanning in CI/CD pipeline.

Fix:
Integrate Trivy container scanner in .github/workflows/ci.yml to scan Docker images on every pull request, failing builds on critical or unpatched high CVEs.

Acceptance Criteria:
- CI pipeline automatically scans production container images prior to ECR push.
- PRs containing critical severity CVEs are blocked with detailed remediation advisories.
- Weekly automated scan report audits all active base Alpine and Node runtime images.`,
    type: TicketType.TASK,
    status: TicketStatus.DONE,
    priority: TicketPriority.MEDIUM,
    assigneeId: 'm-6',
    reporterId: 'm-3',
    sprintId: 'sprint-infra-11',
    storyPoints: 3,
    rank: 520,
    labels: ['security', 'docker', 'ci-cd'],
    dueDate: new Date('2026-08-24T00:00:00.000Z'),
    createdAt: new Date('2026-08-17T11:00:00.000Z'),
    updatedAt: new Date('2026-08-24T12:00:00.000Z')
  },
  {
    id: 't-infra-24',
    key: 'INFRA-24',
    projectId: 'proj-infra',
    title: 'Implement rate limiting tiered policies by API token role',
    description: `Problem:
Global rate limiting applied a blanket 100 requests / 15 minutes limit across all users, causing automated QA test suites and heavy AI ingestion pipelines to trigger 429 Too Many Requests errors.

Update:
Current implementation in server/src/app.js applies single global rate limiter to all /api routes.

Fix:
Refactor rate limiting middleware to evaluate req.user role: grant ADMIN and automated service accounts 1,000 req/min while preserving strict 60 req/min limits on public unauthenticated auth routes.

Acceptance Criteria:
- Unauthenticated login routes enforce strict 20 req / 15 min brute-force protection.
- Standard authenticated developers receive 120 req / min.
- Automated QA test runner executes regression suites without encountering 429 throttling.`,
    type: TicketType.TASK,
    status: TicketStatus.TODO,
    priority: TicketPriority.MEDIUM,
    assigneeId: 'm-3',
    reporterId: 'm-6',
    sprintId: 'sprint-infra-12',
    storyPoints: 3,
    rank: 530,
    labels: ['security', 'rate-limit', 'api'],
    dueDate: new Date('2026-09-06T00:00:00.000Z'),
    createdAt: new Date('2026-08-28T14:00:00.000Z'),
    updatedAt: new Date('2026-08-28T14:00:00.000Z')
  },
  {
    id: 't-infra-25',
    key: 'INFRA-25',
    projectId: 'proj-infra',
    title: 'Configure AWS S3 bucket lifecycle policies for document chunk backups',
    description: `Problem:
Archived document upload artifacts and vector embeddings accumulate indefinitely in S3 standard storage tier, inflating monthly cloud storage costs for old revisions.

Update:
Audited S3 storage metrics. Over 65% of stored document artifacts belong to deprecated projects or replaced revisions older than 90 days.

Fix:
Configure S3 lifecycle rules transitioning noncurrent document versions to S3 Glacier Flexible Retrieval after 30 days and expiring them permanently after 180 days.

Acceptance Criteria:
- Noncurrent object versions transition to Glacier automatically after 30 days.
- S3 storage costs projected to decrease by 45% over a 6-month period.
- Active document artifacts remain instantly accessible in S3 Standard tier.`,
    type: TicketType.TASK,
    status: TicketStatus.BACKLOG,
    priority: TicketPriority.LOW,
    assigneeId: 'm-3',
    reporterId: 'm-1',
    sprintId: null,
    storyPoints: 2,
    rank: 540,
    labels: ['aws', 's3', 'storage'],
    dueDate: new Date('2026-09-22T00:00:00.000Z'),
    createdAt: new Date('2026-08-29T16:00:00.000Z'),
    updatedAt: new Date('2026-08-29T16:00:00.000Z')
  },
  {
    id: 't-infra-26',
    key: 'INFRA-26',
    projectId: 'proj-infra',
    title: 'Set up zero-downtime rolling restart for Node.js production pods',
    description: `Problem:
Deploying new backend releases previously caused brief 502 Bad Gateway responses when Kubernetes terminated old pods before new pods completed Prisma schema connection handshakes.

Update:
Analyzed deployment manifests. Readiness probes were missing initialDelaySeconds and terminationGracePeriodSeconds was set too low (5s).

Fix:
Configure readinessProbe on /api/v1/health with initialDelaySeconds=10, set preStop lifecycle hook sleeping 5s to allow ingress connection draining, and set terminationGracePeriodSeconds=30.

Acceptance Criteria:
- Deploying a new backend build results in 0 dropped requests during continuous load generation.
- Kubernetes waits for new pods to pass readiness checks before routing production traffic.
- Active SSE streaming connections gracefully complete or reconnect without broken pipes.`,
    type: TicketType.STORY,
    status: TicketStatus.IN_REVIEW,
    priority: TicketPriority.HIGH,
    assigneeId: 'm-3',
    reporterId: 'm-2',
    sprintId: 'sprint-infra-12',
    storyPoints: 5,
    rank: 550,
    labels: ['kubernetes', 'deployment', 'reliability'],
    dueDate: new Date('2026-09-03T00:00:00.000Z'),
    createdAt: new Date('2026-08-27T09:00:00.000Z'),
    updatedAt: new Date('2026-08-31T17:00:00.000Z')
  },
  {
    id: 't-infra-27',
    key: 'INFRA-27',
    projectId: 'proj-infra',
    title: 'Implement CloudWatch alarm triggers on 5xx error spikes',
    description: `Problem:
Transient backend errors or uncaught exceptions in worker threads could go unnoticed until reported by end users on customer support channels.

Update:
CloudWatch logs are ingested via AWS FluentBit agent on all EKS worker nodes.

Fix:
Create CloudWatch metric filter matching [status_code >= 500] and trigger an SNS topic notifying on-call engineers via PagerDuty whenever 5xx errors exceed 10 in a 1-minute window.

Acceptance Criteria:
- Metric filter captures all HTTP 5xx responses emitted by Express server logs.
- CloudWatch Alarm transitions to ALARM state within 60 seconds of simulated 500 error burst.
- On-call notification includes direct link to CloudWatch log insights query for fast triage.`,
    type: TicketType.TASK,
    status: TicketStatus.TODO,
    priority: TicketPriority.HIGH,
    assigneeId: 'm-3',
    reporterId: 'm-6',
    sprintId: 'sprint-infra-12',
    storyPoints: 3,
    rank: 560,
    labels: ['monitoring', 'cloudwatch', 'alerts'],
    dueDate: new Date('2026-09-07T00:00:00.000Z'),
    createdAt: new Date('2026-08-29T10:00:00.000Z'),
    updatedAt: new Date('2026-08-29T10:00:00.000Z')
  },
  {
    id: 't-infra-28',
    key: 'INFRA-28',
    projectId: 'proj-infra',
    title: 'Automate SSL certificate pre-expiration verification healthcheck',
    description: `Problem:
Even with cert-manager automated renewals, edge cases such as DNS rate-limiting or ACME challenge failures could silently block certificate issuance until expiry day.

Update:
Proposed a lightweight synthetic healthcheck script running daily in Kubernetes cron.

Fix:
Deploy Kubernetes CronJob executing openssl s_client verification against all public domain endpoints, alerting if days-to-expiration drops below 14 days.

Acceptance Criteria:
- Healthcheck verifies validity and expiry dates of staging and production SSL certificates daily.
- If certificate renewal fails and expiration is < 14 days, high-priority alert is dispatched.
- Healthcheck script runs in lightweight Alpine container with minimal resource consumption.`,
    type: TicketType.TASK,
    status: TicketStatus.BACKLOG,
    priority: TicketPriority.LOW,
    assigneeId: 'm-6',
    reporterId: 'm-3',
    sprintId: null,
    storyPoints: 2,
    rank: 570,
    labels: ['security', 'ssl', 'monitoring'],
    dueDate: new Date('2026-09-24T00:00:00.000Z'),
    createdAt: new Date('2026-08-30T16:00:00.000Z'),
    updatedAt: new Date('2026-08-30T16:00:00.000Z')
  },
  {
    id: 't-infra-29',
    key: 'INFRA-29',
    projectId: 'proj-infra',
    title: 'Deploy Loki and Promtail log aggregation daemonset on Kubernetes',
    description: `Problem:
Searching container logs across multiple autoscaling pods currently requires kubectl logs across individual pod names, making distributed request tracing tedious.

Update:
Evaluated Grafana Loki vs Elasticsearch. Loki shares the same label taxonomy as Prometheus and integrates natively with our existing Grafana dashboards.

Fix:
Deploy Promtail as a DaemonSet to ship container stdout logs to a Loki storage instance, and configure traceId correlation with Express request logs.

Acceptance Criteria:
- Developers can search unified logs across all pods directly inside Grafana Explore.
- Logs are indexed by projectKey, serviceName, and severity level.
- Querying logs by traceId returns complete request lifecycle across ingress, server, and worker pods.`,
    type: TicketType.STORY,
    status: TicketStatus.TODO,
    priority: TicketPriority.MEDIUM,
    assigneeId: 'm-3',
    reporterId: 'm-2',
    sprintId: 'sprint-infra-12',
    storyPoints: 5,
    rank: 580,
    labels: ['logging', 'grafana', 'loki'],
    dueDate: new Date('2026-09-08T00:00:00.000Z'),
    createdAt: new Date('2026-08-28T11:00:00.000Z'),
    updatedAt: new Date('2026-08-28T11:00:00.000Z')
  },

  // --- MOBILE (9 New Tickets) ---
  {
    id: 't-mob-31',
    key: 'MOBILE-31',
    projectId: 'proj-mobile',
    title: 'Implement biometric FaceID / TouchID session unlocking on iOS',
    description: `Problem:
Mobile users must re-type their full password every time the app returns from background after 15 minutes of inactivity, creating friction during fast sprint standups.

Update:
LocalAuthentication framework on iOS provides Secure Enclave biometric validation without storing plain credentials.

Fix:
Store encrypted session refresh token in iOS Keychain secured by kSecAccessControlBiometryAny, prompting FaceID / TouchID on app resume.

Acceptance Criteria:
- App prompts biometric unlock when returning to foreground after 15 minutes.
- User can toggle biometric authentication on/off in mobile settings.
- 3 failed biometric attempts fall back gracefully to password entry without account lockout.`,
    type: TicketType.STORY,
    status: TicketStatus.IN_PROGRESS,
    priority: TicketPriority.HIGH,
    assigneeId: 'm-4',
    reporterId: 'm-1',
    sprintId: 'sprint-mob-6',
    storyPoints: 5,
    rank: 500,
    labels: ['ios', 'biometrics', 'security'],
    dueDate: new Date('2026-09-05T00:00:00.000Z'),
    createdAt: new Date('2026-08-27T14:00:00.000Z'),
    updatedAt: new Date('2026-08-31T10:00:00.000Z')
  },
  {
    id: 't-mob-32',
    key: 'MOBILE-32',
    projectId: 'proj-mobile',
    title: 'Build offline ticket draft persistence with SQLite transaction rollback',
    description: `Problem:
If a developer drafts a lengthy bug report with reproduction steps and the mobile device battery dies or the app crashes, the entire form draft is lost.

Update:
Evaluated AsyncStorage vs SQLite. SQLite handles atomic transactions and supports saving draft image attachments.

Fix:
Autosave form state to local drafts table on every input change with a 500ms debounce. Provide an 'Unsaved Draft Available' restoration prompt upon modal re-open.

Acceptance Criteria:
- Unfinished ticket creation forms autosave to SQLite in the background.
- Re-opening ticket creation restores draft text, priority, and selected sprint.
- Successful ticket submission purges the local draft from SQLite.`,
    type: TicketType.TASK,
    status: TicketStatus.DONE,
    priority: TicketPriority.MEDIUM,
    assigneeId: 'm-7',
    reporterId: 'm-4',
    sprintId: 'sprint-mob-5',
    storyPoints: 3,
    rank: 510,
    labels: ['mobile', 'sqlite', 'drafts'],
    dueDate: new Date('2026-08-22T00:00:00.000Z'),
    createdAt: new Date('2026-08-16T10:00:00.000Z'),
    updatedAt: new Date('2026-08-22T16:00:00.000Z')
  },
  {
    id: 't-mob-33',
    key: 'MOBILE-33',
    projectId: 'proj-mobile',
    title: 'Optimize mobile Kanban board virtualization for low-end devices',
    description: `Problem:
Rendering 60+ cards simultaneously across 4 columns causes scroll frame drops below 24 FPS and memory warnings on older mobile devices (iPhone 11, Pixel 4a).

Update:
Chrome DevTools CPU throttling (4x slowdown) reproduced scroll stuttering during column horizontal swipe.

Fix:
Implement windowed virtualization for ticket card rows: render only visible cards plus a 2-card buffer, reusing DOM nodes as columns scroll vertically.

Acceptance Criteria:
- Horizontal column paging maintains stable 60 FPS on low-end test hardware.
- Memory usage for board view stays below 65MB during extended navigation.
- Fast scrolling does not produce blank card placeholders.`,
    type: TicketType.TASK,
    status: TicketStatus.IN_REVIEW,
    priority: TicketPriority.HIGH,
    assigneeId: 'm-7',
    reporterId: 'm-6',
    sprintId: 'sprint-mob-6',
    storyPoints: 5,
    rank: 520,
    labels: ['mobile', 'virtualization', 'performance'],
    dueDate: new Date('2026-09-04T00:00:00.000Z'),
    createdAt: new Date('2026-08-28T11:00:00.000Z'),
    updatedAt: new Date('2026-08-31T14:00:00.000Z')
  },
  {
    id: 't-mob-34',
    key: 'MOBILE-34',
    projectId: 'proj-mobile',
    title: 'Add swipe gesture actions for quick ticket status updates',
    description: `Problem:
Changing ticket status on mobile requires opening the full ticket detail drawer, scrolling to status dropdown, and confirming, which takes 4 taps per ticket.

Update:
User research confirmed developers want one-handed swipe interactions on ticket list rows.

Fix:
Implement gesture recognizer on mobile ticket list items: swipe right to advance status (Todo -> In Progress -> Done), swipe left to reveal quick assign menu.

Acceptance Criteria:
- Swiping right advances ticket status with tactile haptic feedback and green slide background.
- Swiping left reveals quick action menu with Assign, Move to Sprint, and Delete.
- Swiping can be cancelled mid-gesture by returning card before trigger threshold.`,
    type: TicketType.STORY,
    status: TicketStatus.TODO,
    priority: TicketPriority.MEDIUM,
    assigneeId: 'm-4',
    reporterId: 'm-7',
    sprintId: 'sprint-mob-6',
    storyPoints: 3,
    rank: 530,
    labels: ['mobile', 'gestures', 'ui'],
    dueDate: new Date('2026-09-06T00:00:00.000Z'),
    createdAt: new Date('2026-08-29T13:00:00.000Z'),
    updatedAt: new Date('2026-08-29T13:00:00.000Z')
  },
  {
    id: 't-mob-35',
    key: 'MOBILE-35',
    projectId: 'proj-mobile',
    title: 'Fix memory leak in background push notification listener',
    description: `Problem:
After receiving 10+ push notifications while the application is backgrounded, iOS terminates the app due to excessive background memory usage (EXC_RESOURCE_RESOURCE_LIMIT).

Update:
Instruments memory graph showed notification listener registered duplicate subscription handlers on every app state transition.

Fix:
Cleanly unbind notification event listeners in componentWillUnmount / onUnmounted lifecycle hook and retain a single singleton notification service worker instance.

Acceptance Criteria:
- Receiving 50 consecutive background push notifications produces 0 memory growth.
- App stays alive in iOS background refresh state without OS watchdog terminations.
- Memory leak regression test added to mobile CI suite.`,
    type: TicketType.BUG,
    status: TicketStatus.DONE,
    priority: TicketPriority.URGENT,
    assigneeId: 'm-6',
    reporterId: 'm-4',
    sprintId: 'sprint-mob-5',
    storyPoints: 3,
    rank: 540,
    labels: ['mobile', 'memory-leak', 'ios'],
    dueDate: new Date('2026-08-23T00:00:00.000Z'),
    createdAt: new Date('2026-08-18T15:00:00.000Z'),
    updatedAt: new Date('2026-08-23T11:00:00.000Z')
  },
  {
    id: 't-mob-36',
    key: 'MOBILE-36',
    projectId: 'proj-mobile',
    title: 'Implement deep linking route parser for ticket mention notifications',
    description: `Problem:
Tapping a ticket push notification opens the app to the root dashboard instead of routing directly to the mentioned ticket, forcing the user to manually search for the item.

Update:
Standardized deep link URL structure: projectpilot://tickets/:projectKey/:ticketKey.

Fix:
Implement URL routing handler in mobile router bootstrap: parse incoming deep links, verify active session, and automatically present TicketDetailDrawer for the target ticket.

Acceptance Criteria:
- Tapping push notification opens target ticket detail drawer within 400ms of app launch.
- If user is logged out, the deep link is preserved in redirect query and opened post-login.
- Handles invalid or deleted ticket links gracefully with a 'Ticket not found' notice.`,
    type: TicketType.TASK,
    status: TicketStatus.TODO,
    priority: TicketPriority.HIGH,
    assigneeId: 'm-7',
    reporterId: 'm-4',
    sprintId: 'sprint-mob-6',
    storyPoints: 3,
    rank: 550,
    labels: ['mobile', 'deep-linking', 'notifications'],
    dueDate: new Date('2026-09-07T00:00:00.000Z'),
    createdAt: new Date('2026-08-30T11:00:00.000Z'),
    updatedAt: new Date('2026-08-30T11:00:00.000Z')
  },
  {
    id: 't-mob-37',
    key: 'MOBILE-37',
    projectId: 'proj-mobile',
    title: 'Add offline sync conflict resolution modal with field-level merge',
    description: `Problem:
When a ticket is updated offline on mobile (e.g. status changed to 'In Review') while simultaneously updated on the web (e.g. description edited), the last-write-wins policy blindly overwrote the web edit.

Update:
Analyzed conflict patterns: 80% of concurrent edits affect orthogonal fields (e.g. status vs description).

Fix:
Implement field-level three-way merge in synchronization engine. If conflicting edits affect the same field, present an intuitive visual diff modal allowing the user to select which version to retain.

Acceptance Criteria:
- Orthogonal field updates merge automatically without user intervention.
- Same-field conflicts prompt a side-by-side comparison modal with 'Keep Server', 'Keep Local', or 'Merge'.
- Resolution events are recorded in local SQLite audit log.`,
    type: TicketType.STORY,
    status: TicketStatus.BACKLOG,
    priority: TicketPriority.HIGH,
    assigneeId: 'm-5',
    reporterId: 'm-7',
    sprintId: null,
    storyPoints: 8,
    rank: 560,
    labels: ['mobile', 'offline', 'conflict-resolution'],
    dueDate: new Date('2026-09-21T00:00:00.000Z'),
    createdAt: new Date('2026-08-31T12:00:00.000Z'),
    updatedAt: new Date('2026-08-31T12:00:00.000Z')
  },
  {
    id: 't-mob-38',
    key: 'MOBILE-38',
    projectId: 'proj-mobile',
    title: 'Optimize SVG chart rendering on mobile retina displays',
    description: `Problem:
Sprint burndown and velocity SVG charts on mobile screens exhibited jagged line rendering and cut-off x-axis date labels on high-DPI displays (3x scale factor).

Update:
Inspected SVG viewBox and text anchor properties in VelocityChart.vue and BurndownChart.vue.

Fix:
Add dynamic viewBox scaling, configure shape-rendering: geometricPrecision, and rotate date labels -35 degrees with compact date format on screens < 480px width.

Acceptance Criteria:
- SVG charts render crisp vector paths on @2x and @3x retina displays.
- Date labels do not overlap or truncate on mobile portrait viewport.
- Touch tap on chart points displays tooltip bubble positioned within visible screen bounds.`,
    type: TicketType.TASK,
    status: TicketStatus.DONE,
    priority: TicketPriority.LOW,
    assigneeId: 'm-4',
    reporterId: 'm-6',
    sprintId: 'sprint-mob-5',
    storyPoints: 2,
    rank: 570,
    labels: ['mobile', 'charts', 'svg'],
    dueDate: new Date('2026-08-24T00:00:00.000Z'),
    createdAt: new Date('2026-08-19T11:00:00.000Z'),
    updatedAt: new Date('2026-08-24T14:00:00.000Z')
  },
  {
    id: 't-mob-39',
    key: 'MOBILE-39',
    projectId: 'proj-mobile',
    title: 'Implement network connectivity status banner with auto-retry trigger',
    description: `Problem:
When mobile device network drops, failed API requests showed generic error modals, leaving the user unaware that the application had entered offline mode.

Update:
NetInfo API provides real-time network connectivity and connection type (wifi, cellular, none) listeners.

Fix:
Create global OfflineBanner.vue component that slides down when device is offline, displaying pending queue item count and automatically triggering sync flush when connectivity recovers.

Acceptance Criteria:
- Amber connectivity banner displays immediately when network connection drops.
- Banner indicates number of unsynced offline mutations queued locally.
- Re-establishing connection triggers automatic background sync and hides banner with smooth slide-up animation.`,
    type: TicketType.TASK,
    status: TicketStatus.TODO,
    priority: TicketPriority.MEDIUM,
    assigneeId: 'm-7',
    reporterId: 'm-4',
    sprintId: 'sprint-mob-6',
    storyPoints: 3,
    rank: 580,
    labels: ['mobile', 'offline', 'ux'],
    dueDate: new Date('2026-09-05T00:00:00.000Z'),
    createdAt: new Date('2026-08-30T13:00:00.000Z'),
    updatedAt: new Date('2026-08-30T13:00:00.000Z')
  }
];
