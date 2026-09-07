# ProjectPilot — Complete Architecture, RBAC, Page & Data-Flow Audit

> **Audit Date:** 2026-09-07  
> **Status:** Read-only. No files were modified.  
> **Codebase root:** `c:/Users/SaikiranGaddam/.gemini/antigravity-ide/scratch/AntiGravity/ProjectPilot`

---

## 1. Application Overview

ProjectPilot is a full-stack AI-powered project management SaaS (monorepo):

```
client/   Vue 3 + Vite SPA        port 3000
server/   Node.js + Express API   port 5000
```

**Request flow:**
```
Browser (Vue 3 SPA)
  ↓ HTTP/REST via Vite proxy → /api/v1
Express Server (Node.js)
  ↓ JWT HTTP-only cookie auth
Controllers → Services → Repositories → Prisma ORM
  ↓
PostgreSQL (Neon cloud, pgvector extension)
  DocumentChunk.embedding = vector(768)
  ↕
Gemini API (gemini-3.6-flash)
```

### Frontend Stack
- Vue 3 Composition API, `<script setup>`
- Vite 6.4.3, Vue Router 4 (web history), Pinia (8 stores)
- Dev port: 3000, API proxy: `/api/**` → `http://localhost:5000`

**Key pattern — Optimistic UI + API fallback:** Every mutating store action applies local state changes *immediately*, then fires the API call. If the API fails, `console.warn()` is logged but local state persists.

### Backend Stack
- Express.js, Prisma ORM (generated client: `src/generated/client`)
- Entry: `src/server.js` → `src/app.js`
- Layer order: `Routes → Middleware → Controllers → Services → Repositories → Prisma → PostgreSQL`

### Authentication
- JWT stored in **HTTP-only cookie** `projectpilot_token` (1-hour expiry)
- Login: `POST /api/v1/auth/login` → bcrypt compare → JWT → cookie
- Session: `GET /api/v1/auth/me` → verify cookie → return sanitized user
- Logout: `POST /api/v1/auth/logout` → clear cookie
- Fallback: Also accepts `Authorization: Bearer <token>` header
- Security: `AuthService.sanitizeUser()` strips `passwordHash` from **all** responses
- Frontend guard: `router.beforeEach` calls `authStore.checkAuth()` on first navigation

### RBAC — Two Independent Layers

**Layer 1 — Global Workspace Role** (`User.role` Prisma enum):
```
ADMIN | PROJECT_MANAGER | DEVELOPER | VIEWER
```
Enforced via `requireRole(...allowedRoles)` middleware.

**Layer 2 — Project Membership Role** (`ProjectMember.role` free text string):
```
"Project Admin"  |  "Lead"  |  any other free text
```
Enforced via `requireProjectAccess(minProjectRole)` middleware.  
**Elevated roles:** Only `"Project Admin"` and `"Lead"` grant elevated access. All other strings (e.g. `"Senior Developer"`) = standard member.  
**ADMIN bypass:** `requireProjectAccess()` always passes for global `ADMIN` — automatic superuser.

### Demo / Seed Data

Three demo projects (in local store fallbacks AND seeded database):

| Project Key | Project Name | Lead |
|---|---|---|
| `PILOT` | ProjectPilot Core | Alex Morgan |
| `INFRA` | Cloud Infrastructure | Samir Khan |
| `MOBILE` | Mobile Delivery Platform | Elena Rostova |

Six demo workspace members (from `project.store.js → WORKSPACE_MEMBERS`):

| ID | Name | UI Role | DB Global Role | Department |
|---|---|---|---|---|
| m-1 | Alex Morgan | Project Admin | ADMIN | Architecture & Core Systems |
| m-2 | Jane Doe | Senior Developer | DEVELOPER | Backend Engineering |
| m-3 | Samir Khan | DevOps Lead | PROJECT_MANAGER | Cloud Infrastructure |
| m-4 | Elena Rostova | Frontend Engineer | DEVELOPER | UI/UX & Web Platforms |
| m-5 | David Kim | AI / ML Engineer | DEVELOPER | AI & Data Intelligence |
| m-6 | Priya Patel | QA Lead | VIEWER | Quality Assurance |

Demo login accounts (from `LoginPage.vue`):

| Badge | Email | DB Role |
|---|---|---|
| Workspace Admin | alex.m@projectpilot.dev | ADMIN |
| Senior Developer | jane.d@projectpilot.dev | DEVELOPER |
| DevOps & PM | samir.k@projectpilot.dev | PROJECT_MANAGER |
| QA & Viewer | priya.p@projectpilot.dev | VIEWER |

All passwords: `PilotPass123!`  
Visibility: controlled by `VITE_ENABLE_DEMO_ACCOUNTS` env var.

### Server Configuration (`server/src/config/index.js`)

| Variable | Default |
|---|---|
| `PORT` | 5000 |
| `CLIENT_ORIGIN` | http://localhost:3000 |
| `DATABASE_URL` | localhost PostgreSQL |
| `JWT_SECRET` | dev fallback (32 chars) |
| `JWT_EXPIRES_IN` | 1h |
| `GEMINI_API_KEY` | "" |
| `GEMINI_MODEL` | gemini-3.6-flash |
| `RATE_LIMIT_MAX_REQUESTS` | 100 per 15 min |
| `AI_RATE_LIMIT_MAX` | 20 per 1 min |

**RAG configuration (`rag.config.js`):**

| Parameter | Value |
|---|---|
| `TOP_K` | 5 |
| `MIN_SIMILARITY` | 0.55 |
| `MAX_CONTEXT_CHUNKS` | 5 |
| `MAX_CONTEXT_CHARACTERS` | 4000 |
| `DEDUPLICATION_SIMILARITY_THRESHOLD` | 0.92 |
| `MAX_CHUNKS_PER_DOC` | 3 |

---

## 2. Complete Route / Page Inventory

From `router/index.js` (actual code):

| Route | Component | Public? | Purpose |
|---|---|---|---|
| `/login` | LoginPage.vue | ✅ | Authentication |
| `/` | AppLayout | No | Redirect → `/dashboard` |
| `/dashboard` | DashboardPage.vue | No | Cross-project executive overview |
| `/projects` | ProjectsPage.vue | No | Project directory & management |
| `/projects/:projectKey` | ProjectWorkspace.vue | No | Redirect → `/overview` |
| `/projects/:projectKey/overview` | ProjectOverviewPage.vue | No | Project health, sprint, team |
| `/projects/:projectKey/board` | ProjectBoardPage.vue | No | Kanban board |
| `/projects/:projectKey/backlog` | ProjectBacklogPage.vue | No | Product backlog |
| `/projects/:projectKey/tickets` | ProjectTicketsPage.vue | No | Project ticket list |
| `/projects/:projectKey/sprints` | ProjectSprintsPage.vue | No | Sprint management |
| `/projects/:projectKey/analytics` | ProjectAnalyticsPage.vue | No | Project charts |
| `/projects/:projectKey/knowledge` | KnowledgePage.vue | No | RAG knowledge base |
| `/projects/:projectKey/activity` | ProjectActivityPage.vue | No | Project audit log |
| `/projects/:projectKey/settings` | **ProjectSectionPlaceholder.vue** | No | **Placeholder only — no functionality** |
| `/my-work` | MyWorkPage.vue | No | Personal ticket workload |
| `/tickets` | TicketsPage.vue | No | Cross-project tickets + board |
| `/sprints` | SprintsPage.vue | No | Cross-project sprint management |
| `/team` | TeamPage.vue | No | Team roster & permissions |
| `/analytics` | AnalyticsPage.vue | No | Cross-project analytics |
| `/ai` | AIAssistantPage.vue | No | AI project intelligence chat |
| `/knowledge` | KnowledgePage.vue | No | Workspace-level knowledge base |
| `/settings` | SettingsPage.vue | No | User/workspace settings |
| `/:pathMatch(.*)` | — | — | Catch-all → `/dashboard` |

> **Note 1:** `/projects/:projectKey/settings` renders a "coming soon" placeholder. No settings functionality exists.  
> **Note 2:** `/knowledge` and `/projects/:projectKey/knowledge` render the **same** `KnowledgePage.vue`. Project context from `$route.params.projectKey`.  
> **Note 3:** No role-based frontend route guards. All authenticated users can navigate anywhere. Backend API enforces actual permissions.

---

## 3. Page Functionality Reference

### `/login` — LoginPage.vue
- **Left panel** (≥1024px): Logo, headline, 3 capability rows, trust strip
- **Right panel**: Email/password form, submit spinner, demo accounts section
- **Actions**: Submit → `authStore.login()` → `POST /api/v1/auth/login` → cookie → `/dashboard`
- **Demo accounts**: Click button → pre-fills fields (does NOT auto-submit)

### `/dashboard` — DashboardPage.vue
- Workspace stats header (active workspaces, story points, blockers, AI health %)
- Per-project sprint cards, recent activities, quick board links
- **Data**: `projectStore.allProjects`, `ticketStore.allTickets`, `activityStore.allActivities`, `sprintStore.allSprints`

### `/projects` — ProjectsPage.vue
- Project card grid; search + status filter; "New Project" button (ADMIN/PM only)
- **Data**: `projectStore.filteredProjects`
- **Actions**: Create project → `POST /api/v1/projects` → activity recorded

### `/projects/:key/overview` — ProjectOverviewPage.vue
- Project header, active sprint card, team grid, 5 recent activities, ticket stats
- **Data**: `projectStore`, `ticketStore.getProjectStats()`, `sprintStore.getActiveSprint()`, `activityStore` (limit 5)
- **Actions**: Add/remove member → project member API endpoints

### `/projects/:key/board` — ProjectBoardPage.vue
- **Note**: 420 bytes — thin shell rendering shared `KanbanBoard` component
- 5 columns: Backlog | To Do | In Progress | In Review | Done
- **Actions**: Drag → `updateTicketStatus()` → `PATCH /api/v1/tickets/:key/status` → activity; Click → `TicketDetailModal`

### `/projects/:key/backlog` — ProjectBacklogPage.vue
- Ranked backlog list (sprintId=null), sprint sidebar, drag-to-sprint
- **Data**: `ticketStore.getBacklogTickets()`, `sprintStore.getSprintsByProject()`
- **Actions**: Assign to sprint → `PATCH /api/v1/tickets/:key/sprint`; Reorder → `POST /api/v1/tickets/reorder-backlog`

### `/projects/:key/sprints` — ProjectSprintsPage.vue
- Active sprint card, planned list, completed archive
- **Data**: `sprintStore.getSprintsByProject()`, `ticketStore.getSprintTickets()`
- **Actions**: Create/start/complete/edit/delete sprints via sprint API endpoints

### `/projects/:key/analytics` — ProjectAnalyticsPage.vue
- Sprint velocity, ticket type/status/priority distributions, member workload
- **Data**: Entirely client-side from `ticketStore` + `sprintStore`. **No analytics API.**

### `/projects/:key/knowledge` — KnowledgePage.vue
- Document list (type/status badges), markdown editor, semantic search, index button
- **Data**: `GET /api/v1/projects/:key/knowledge`; Search: `POST /api/v1/projects/:key/knowledge/search`
- **Actions**: Full document CRUD + index/reindex → triggers Gemini embedding pipeline

### `/projects/:key/activity` — ProjectActivityPage.vue
- Chronological audit log with type/actor/search filters (all client-side)
- **Data**: `activityStore.getActivitiesByProject(projectKey, filters)`

### `/projects/:key/settings` — ProjectSectionPlaceholder.vue
- **"Coming soon" placeholder only. No functionality implemented.**

### `/my-work` — MyWorkPage.vue
- Tickets assigned to logged-in user across all projects
- **Data**: `ticketStore.allTickets` filtered by `assignee.id === authStore.user.memberId`

### `/tickets` — TicketsPage.vue
- Cross-project ticket list + Kanban board (tab toggle), full filter panel
- **Data**: `ticketStore.getFilteredTickets()` — no project scope
- **Actions**: Click ticket → `TicketDetailModal` with `?ticket=KEY` URL deep-link

### `/sprints` — SprintsPage.vue
- Cross-project sprint overview with project switcher
- Same sprint CRUD as project-scoped sprint page

### `/team` — TeamPage.vue
- Workspace member grid (deduped across all projects), member detail drawer
- **Data**: `projectStore.allWorkspaceMembers`
- **Actions**: Add/remove member (ADMIN only). Remove: `reassignMemberTickets()` FIRST then `removeMemberFromProject()`

### `/analytics` — AnalyticsPage.vue
- Cross-project analytics with project selector
- **Data**: Entirely client-side. **No analytics API.**

### `/ai` — AIAssistantPage.vue
- Conversation sidebar, chat thread, agent activity indicator, tool disclosure, source citations, analysis cards
- **Data**: `aiStore.conversations` (API), `aiStore.messages` (API), `aiStore.agentActivity` (client-side cycling string)
- **Actions**: Send message → `aiStore.sendMessage()` → multi-round Gemini agent with 7 tools

### `/settings` — SettingsPage.vue
- User profile display, dark/light theme toggle
- Theme toggle → `data-theme` attribute on `<html>`

---

## 4. Pinia Stores — Complete Documentation

### `auth.store.js`
- **State**: `user`, `isAuthenticated`, `isInitialized`, `isLoading`
- **Actions**: `login()`, `logout()`, `checkAuth()`
- **API**: `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- **Consumed by**: Router guard, AppShell, LoginPage

### `project.store.js`
- **State**: `projects[]`, `workspaceMembersList[]`, `activeProjectKey`, `searchQuery`, `statusFilter`
- **Getters**: `allProjects`, `filteredProjects`, `activeProject`, `allWorkspaceMembers`
- **Actions**: `fetchProjects()`, `getProjectByKey()`, `setActiveProjectKey()`, `createProject()`, `addMemberToProject()`, `removeMemberFromProject()`
- **API**: `GET /api/v1/projects`, `GET /api/v1/members`, `POST /api/v1/projects`, project member endpoints
- **Fallback**: `INITIAL_PROJECTS` (3) + `WORKSPACE_MEMBERS` (6) hardcoded arrays
- **Consumed by**: Dashboard, Projects, ProjectOverview, Team, Analytics, AI context

### `ticket.store.js`
- **State**: `tickets[]`, `activeTicketKey`, `isCreateModalOpen`, `createModalProjectKey`, `searchQuery`, `statusFilter`, `priorityFilter`, `typeFilter`, `assigneeFilter`, `sprintFilter`
- **Getters**: `allTickets`, `activeTicket`
- **Actions**: `fetchTickets()`, `createTicket()`, `updateTicket()`, `updateTicketStatus()`, `updateTicketPriority()`, `updateTicketAssignee()`, `assignTicketToSprint()`, `removeTicketFromSprint()`, `reassignMemberTickets()`, `reorderBacklog()`, `deleteTicket()`, `openTicketDetail()`, `closeTicketDetail()`, `resetFilters()`
- **API**: `GET/POST /api/v1/tickets`, all `PATCH /api/v1/tickets/:key/*`, `DELETE`, `POST /tickets/reassign-member`, `POST /tickets/reorder-backlog`
- **Fallback**: `INITIAL_TICKETS` (17 seeded tickets across PILOT/INFRA/MOBILE)
- **Consumed by**: Dashboard, Board, Backlog, Tickets, MyWork, Sprints, Analytics, ProjectTickets

### `sprint.store.js`
- **State**: `sprints[]`, `isCreateModalOpen`, `createModalProjectKey`, `editingSprint`, `completingSprintId`
- **Getters**: `allSprints`
- **Actions**: `fetchSprints()`, `getSprintsByProject()`, `getSprintById()`, `getActiveSprint()`, `getPlannedSprints()`, `getCompletedSprints()`, `createSprint()`, `updateSprint()`, `startSprint()`, `completeSprint()`, `deleteSprint()`
- **API**: `GET/POST /api/v1/sprints`, `PATCH/DELETE /api/v1/sprints/:id`, start/complete endpoints
- **Fallback**: `INITIAL_SPRINTS` (7 sprints across 3 projects)
- **Consumed by**: Dashboard, Board, Backlog, Sprints, ProjectSprints, Analytics, AI context

### `activity.store.js`
- **State**: `activities[]`, `isLoading`, `isInitialized`
- **Getters**: `allActivities` (sorted by `createdAt` DESC)
- **Actions**: `fetchActivities()`, `recordActivity()`, `getActivitiesByProject()`, `getGlobalActivities()`
- **API**: `GET /api/v1/activities`, `POST /api/v1/activities` (background fire-and-forget)
- **Fallback**: `INITIAL_ACTIVITIES` (8 seeded events)
- **Architecture rule**: `recordActivity()` is the **only entry point** for new events. Called exclusively by domain stores (`ticket.store`, `sprint.store`, `project.store`) — **never** by UI components or watcher lifecycles.
- **Consumed by**: Dashboard, ProjectOverview, ProjectActivity, AI context

### `ai.store.js`
- **State**: `selectedProjectKey`, `conversations[]`, `activeConversationId`, `messages[]`, `isGenerating`, `isLoadingConversations`, `isLoadingConversation`, `error`, `agentActivity`
- **Getters**: `hasMessages`, `lastMessage`, `activeConversation`
- **Actions**: `setProject()`, `fetchConversations()`, `createNewConversation()`, `selectConversation()`, `deleteConversation()`, `sendMessage()`, `retryLastMessage()`, `clearConversation()`
- **API**: All `/api/v1/projects/:key/conversations/*` endpoints
- **Fallback**: None — all data from API
- **Consumed by**: AIAssistantPage **exclusively**

### `knowledge.store.js`
- **State**: `documents[]`, `activeDocumentId`, `isLoading`, `searchResults`, `isSearching`
- **Actions**: `fetchDocuments()`, `createDocument()`, `updateDocument()`, `deleteDocument()`, `indexDocument()`, `searchKnowledge()`
- **API**: All `/api/v1/projects/:key/knowledge/*` endpoints
- **Consumed by**: KnowledgePage **exclusively**

### `ui.store.js`
- **State**: `isPageLoading`, `isNavigating`
- **Actions**: `triggerPageLoading(ms)`, `setNavigating(bool)`
- **Key behavior**: `triggerPageLoading(1000)` fires on **every** route navigation — guarantees minimum 1-second skeleton screen on all page transitions.
- **Consumed by**: AppLayout, Router

### Store Dependency Map

```
auth.store
  → Router guard, AppShell, LoginPage, SessionExpiredModal

project.store
  → Dashboard, Projects, ProjectOverview, Team, Analytics, AI context

ticket.store
  → Dashboard, Board (all), Backlog, Tickets (global)
  → MyWork, ProjectTickets, Sprints, Analytics, AI context

sprint.store
  → Dashboard, Board, Backlog, Sprints (global), ProjectSprints, Analytics, AI context

activity.store
  → Dashboard, ProjectOverview, ProjectActivity, AI context
  ← Written ONLY by: ticket.store, sprint.store, project.store

ai.store
  → AIAssistantPage (exclusively)

knowledge.store
  → KnowledgePage (exclusively)

ui.store
  → AppLayout, Router
```

---

## 5. Database / Data Model

### Entity Relationship Summary

```
User ─(1:1)→ Member
  |               |── ProjectMember[] ──→ Project
  |               |                          ├── Sprint[]
  └─ Conversation[]                          │     └── Ticket[] (FK: sprintId)
         └── ConversationMessage[]           ├── Ticket[] (FK: projectId)
                                             │     ├── assignee: Member
                                             │     └── reporter: Member
                                             ├── Activity[]
                                             │     └── actor: Member
                                             └── Document[]
                                                   └── DocumentChunk[]
                                                         └── embedding: vector(768)
```

### Models (from `prisma/schema.prisma`)

#### `User`
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| email | String | UNIQUE |
| passwordHash | String | bcrypt — **never returned to clients** |
| role | Role enum | ADMIN \| PROJECT_MANAGER \| DEVELOPER \| VIEWER |
| memberId | String? | FK → Member (1:1 optional) |

#### `Member`
| Field | Type | Notes |
|---|---|---|
| id | String | PK (manually assigned, e.g. `m-1`) |
| name | String | |
| avatar | String | 2-letter initials |
| email | String | UNIQUE |
| role | String | Free text (e.g. `"Project Admin"`) |
| department | String | |
| status | MemberStatus | ACTIVE \| AWAY \| OFFLINE |
| skills | String[] | |
| capacity | Int | Story points per sprint (default 20) |

#### `Project`
| Field | Type | Notes |
|---|---|---|
| id | String | PK |
| key | String | UNIQUE (e.g. `"PILOT"`) |
| name | String | |
| description | String? | Text |
| status | ProjectStatus | ACTIVE \| PLANNING \| COMPLETED \| ARCHIVED |
| leadId | String? | FK → Member (SetNull) |

#### `ProjectMember`
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| projectId | String | FK → Project (CASCADE) |
| memberId | String | FK → Member (CASCADE) |
| role | String? | Free text project role |
| joinedAt | DateTime | |
| UNIQUE | (projectId, memberId) | Prevents duplicate membership |

#### `Sprint`
| Field | Type | Notes |
|---|---|---|
| id | String | PK (e.g. `"sprint-pilot-24"`) |
| projectId | String | FK → Project (CASCADE) |
| name | String | |
| goal | String? | Text |
| status | SprintStatus | PLANNED \| ACTIVE \| COMPLETED \| CANCELLED |
| startDate / endDate | DateTime? | |
| capacity | Int | Story points (default 0) |
| completedAt | DateTime? | |

> **Constraint:** Only 1 ACTIVE sprint per project — enforced in `SprintService.startSprint()`.

#### `Ticket`
| Field | Type | Notes |
|---|---|---|
| id | String | PK |
| key | String | UNIQUE (e.g. `"PILOT-89"`) |
| projectId | String | FK → Project (CASCADE) |
| title | String | |
| description | String? | Text |
| type | TicketType | TASK \| BUG \| STORY \| EPIC |
| status | TicketStatus | BACKLOG \| TODO \| IN_PROGRESS \| IN_REVIEW \| DONE |
| priority | TicketPriority | LOW \| MEDIUM \| HIGH \| URGENT |
| assigneeId / reporterId | String? | FK → Member (SetNull) |
| sprintId | String? | FK → Sprint (SetNull; null = backlog) |
| storyPoints | Int | default 0 |
| rank | Int | Backlog ordering (default 100) |
| labels | String[] | |
| dueDate | DateTime? | |

> **Note:** DB enums use `IN_PROGRESS`/`IN_REVIEW` but frontend uses `"In Progress"`/`"In Review"`. Backend normalizes on read/write.

#### `Activity`
| Field | Type | Notes |
|---|---|---|
| id | String | PK |
| projectId | String | FK → Project (CASCADE) |
| actorId | String? | FK → Member (SetNull) |
| type | String | `"ticket"` \| `"sprint"` \| `"team"` \| `"project"` |
| action | String | `"created"` \| `"status_changed"` \| etc. |
| targetType / targetId / targetKey / targetTitle | String? | Context fields |
| message | String | Human-readable event string |
| metadata | Json? | Old/new values, extra context |
| createdAt | DateTime | |

#### `Document`
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| projectId | String | FK → Project (CASCADE) |
| title | String | |
| content | String | Text — full document |
| documentType | DocumentType | ARCHITECTURE \| API_SPEC \| RUNBOOK \| REQUIREMENTS \| TROUBLESHOOTING \| GENERAL |
| status | DocumentStatus | DRAFT \| INDEXED \| OUTDATED \| PROCESSING \| READY \| FAILED |
| checksum | String? | Deduplication |
| fileSize / mimeType | String? / Int? | Upload metadata |
| createdById | String? | FK → Member |

#### `DocumentChunk`
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| documentId | String | FK → Document (CASCADE) |
| projectId | String? | Denormalized for query performance |
| chunkIndex | Int | Sequence number |
| content | String | Text — chunk text |
| tokenCount | Int | Estimated token count |
| metadata | Json? | `{ page, section, source }` |
| **embedding** | **vector(768)** | **768-dim float vector from Gemini** |

#### `Conversation`
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| projectId | String | FK → Project (CASCADE) |
| createdById | String? | FK → User (SetNull) |
| title | String | Auto-generated from first message (max 80 chars) |

#### `ConversationMessage`
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| conversationId | String | FK → Conversation (CASCADE) |
| role | String | `"user"` \| `"assistant"` |
| content | String | Text |
| metadata | Json? | `{ executedTools, sources, analysis, grounded, agentRounds, requestId, usage, model }` |

---

## 6. Complete RBAC / Role Audit

### Backend Permission Matrix

| Endpoint | ADMIN | PM | DEV | VIEWER | Notes |
|---|---|---|---|---|---|
| **Auth** | | | | | |
| POST /auth/login | ✅ | ✅ | ✅ | ✅ | Public |
| POST /auth/logout | ✅ | ✅ | ✅ | ✅ | Authenticated |
| GET /auth/me | ✅ | ✅ | ✅ | ✅ | Authenticated |
| **Projects** | | | | | |
| GET /projects | ✅ | ✅ | ✅ | ✅ | All authenticated |
| POST /projects | ✅ | ✅ | ❌ | ❌ | ADMIN or PM |
| GET /projects/:key | ✅ | ✅† | ✅† | ✅† | Project member required |
| PATCH /projects/:key | ✅ | ✅‡ | ❌ | ❌ | PM + Project Admin/Lead role |
| DELETE /projects/:key | ✅ | ❌ | ❌ | ❌ | ADMIN only |
| POST /projects/:key/members | ✅ | ✅‡ | ❌ | ❌ | PM + Project Admin/Lead role |
| DELETE /projects/:key/members/:id | ✅ | ✅‡ | ❌ | ❌ | PM + Project Admin/Lead role |
| **Tickets** | | | | | |
| GET /tickets | ✅ | ✅ | ✅ | ✅ | All authenticated |
| POST /tickets | ✅ | ✅ | ✅ | ❌ | ADMIN, PM, DEVELOPER |
| GET /tickets/:key | ✅ | ✅ | ✅ | ✅ | All authenticated |
| PATCH /tickets/:key | ✅ | ✅ | ✅ | ❌ | ADMIN, PM, DEVELOPER |
| PATCH /tickets/:key/status | ✅ | ✅ | ✅ | ❌ | |
| PATCH /tickets/:key/priority | ✅ | ✅ | ✅ | ❌ | |
| PATCH /tickets/:key/assignee | ✅ | ✅ | ✅ | ❌ | |
| PATCH /tickets/:key/sprint | ✅ | ✅ | ✅ | ❌ | |
| DELETE /tickets/:key | ✅ | ✅ | ❌ | ❌ | ADMIN or PM |
| POST /tickets/reassign-member | ✅ | ✅‡ | ❌ | ❌ | PM + Project Admin/Lead role |
| POST /tickets/reorder-backlog | ✅ | ✅ | ✅ | ❌ | |
| **Sprints** | | | | | |
| GET /sprints | ✅ | ✅ | ✅ | ✅ | All authenticated |
| POST /sprints | ✅ | ✅‡ | ❌ | ❌ | PM + Project Admin/Lead role |
| GET /sprints/:id | ✅ | ✅ | ✅ | ✅ | All authenticated |
| PATCH /sprints/:id | ✅ | ✅‡ | ❌ | ❌ | PM + Project Admin/Lead role |
| POST /sprints/:id/start | ✅ | ✅‡ | ❌ | ❌ | PM + Project Admin/Lead role |
| POST /sprints/:id/complete | ✅ | ✅‡ | ❌ | ❌ | PM + Project Admin/Lead role |
| DELETE /sprints/:id | ✅ | ✅‡ | ❌ | ❌ | PM + Project Admin/Lead role |
| **Members** | | | | | |
| GET /members | ✅ | ✅ | ✅ | ✅ | All authenticated |
| POST /members | ✅ | ❌ | ❌ | ❌ | ADMIN only |
| PATCH /members/:id | ✅ | ❌ | ❌ | ❌ | ADMIN only |
| DELETE /members/:id | ✅ | ❌ | ❌ | ❌ | ADMIN only |
| **Activities** | | | | | |
| GET /activities | ✅ | ✅ | ✅ | ✅ | All authenticated |
| POST /activities | ✅ | ✅ | ✅ | ✅ | Background write |
| **Knowledge** (`/projects/:key/knowledge`) | | | | | |
| GET (list) | ✅ | ✅† | ✅† | ✅† | Project member |
| POST (create) | ✅ | ✅† | ✅† | ✅† | ⚠️ No min role restriction |
| PUT /:id | ✅ | ✅† | ✅† | ✅† | ⚠️ No min role restriction |
| DELETE /:id | ✅ | ✅† | ✅† | ✅† | ⚠️ No min role restriction |
| POST /:id/index | ✅ | ✅† | ✅† | ✅† | ⚠️ No min role restriction |
| POST /search | ✅ | ✅† | ✅† | ✅† | Project member |
| **AI / Conversations** | | | | | |
| POST /ai/chat | ✅ | ✅† | ✅† | ✅† | + rate limit (20/min) |
| GET /ai/metrics | ✅ | ✅ | ✅ | ✅ | All authenticated |
| GET /projects/:key/conversations | ✅ | ✅† | ✅† | ✅† | Project member |
| POST /projects/:key/conversations | ✅ | ✅† | ✅† | ✅† | Project member |
| DELETE /projects/:key/conversations/:id | ✅ | ✅† | ✅† | ✅† | Project member |
| POST /projects/:key/conversations/:id/messages | ✅ | ✅† | ✅† | ✅† | + rate limit |

**Legend:** `†` = project membership required (ADMIN bypasses) | `‡` = PM global role + `"Project Admin"` or `"Lead"` project role | ❌ = HTTP 403

---

## 7. Role-by-Role Capabilities

### ADMIN (demo: Alex Morgan)
- **Can see**: All pages, all projects
- **Can do**: Everything — no restrictions
- **Project access**: Bypasses all `requireProjectAccess()` checks — superuser
- **DISCREPANCY**: None — ADMIN is unrestricted across the entire system

### PROJECT_MANAGER (demo: Samir Khan)
- **Can see**: All pages
- **Can do**: Create projects (PM global role sufficient); Edit/manage sprints/members **only where** they hold `"Project Admin"` or `"Lead"` project membership role
- **Cannot do**: Delete projects (ADMIN only); Create/edit/delete workspace member records (ADMIN only)
- **Project access**: Must be a project member; does not bypass membership check

### DEVELOPER (demo: Jane Doe)
- **Can do**: Create/edit tickets in member projects; Update status/priority/assignee/sprint; Reorder backlog; Full knowledge document CRUD (⚠️ see discrepancy #1); AI assistant in member projects
- **Cannot do**: Create projects; Delete tickets; Create/start/complete/delete sprints; Add/remove project members; Manage workspace member records

### VIEWER (demo: Priya Patel)
- **Can do (read)**: View all GET endpoints — tickets, projects, sprints, activities, members; Search knowledge; Use AI assistant if project member
- **Cannot do (HTTP 403)**: Any write operation — create/edit/delete tickets, sprints, projects; Reassign members

> [!WARNING]
> **Discrepancy:** Backend knowledge routes (`POST/PUT/DELETE /knowledge/*`) use only `requireProjectAccess()` with **no minimum role restriction**. A VIEWER who is a project member **can** create, edit, delete, and index knowledge documents via direct API call. Frontend may hide controls but backend does not enforce it.

---

## 8. Operation → System Impact Traces

### Create Project
```
User → "New Project" modal [ProjectsPage.vue]
  ↓
projectStore.createProject({ name, key, description, status, leadName })
  ↓
POST /api/v1/projects  [requireRole ADMIN/PM]
  ↓
ProjectController → ProjectService → Prisma INSERT Project
  ↓
projects[].unshift(newProject)  [optimistic]
  ↓
activityStore.recordActivity({ type: 'project', action: 'created' })
  ↓
POST /api/v1/activities  [background]
  ↓
Dashboard + Projects page: new card visible
```

### Create Ticket
```
User → "Create Ticket" modal
  ↓
ticketStore.createTicket({ projectKey, title, ... })
  ↓
POST /api/v1/tickets  [requireRole ADMIN/PM/DEVELOPER + requireProjectAccess]
  ↓
TicketController → TicketService → Prisma INSERT Ticket
  ↓
tickets[].unshift(newTicket)  [optimistic]
  ↓
activityStore.recordActivity({ type: 'ticket', action: 'created' })
  ↓
Board re-renders, Backlog updates, Dashboard counters update
Next AI query sees new ticket via list_project_tickets tool
```

### Change Ticket Status (Kanban drag)
```
User → drags card to new column [KanbanBoard.vue]
  ↓
ticketStore.updateTicketStatus(key, newStatus)
  ↓
ticket.status = newStatus  [optimistic local mutation]
  ↓
PATCH /api/v1/tickets/:key/status  [requireRole ADMIN/PM/DEVELOPER]
  ↓
TicketController → TicketService → Prisma UPDATE Ticket SET status
  ↓
activityStore.recordActivity({ action: 'status_changed', metadata: { fromStatus, toStatus } })
  ↓
Board columns recompute from reactive allTickets
Dashboard stats update (computed from same store)
ProjectActivity feed gets new entry
Next AI query sees updated status via list_project_tickets tool
```

### Complete Sprint
```
User → "Complete Sprint" [ProjectSprintsPage.vue]
  ↓
sprintStore.completeSprint(sprintId)
  ↓
POST /api/v1/sprints/:id/complete  [requireRole ADMIN/PM + requireProjectAccess 'Project Admin']
  ↓
SprintController → SprintService.completeSprint
  ↓
For each incomplete ticket: Prisma UPDATE Ticket SET sprintId = null  (→ backlog)
  ↓
UPDATE Sprint SET status='COMPLETED', completedAt=now()
  ↓
sprint.status = 'completed'  [store]
incomplete tickets: sprintId = null  [store]
Backlog view shows previously incomplete tickets
Activity: sprint_completed recorded
```

### Semantic Knowledge Search (RAG)
```
User → types query [KnowledgePage.vue]
  ↓
knowledgeStore.searchKnowledge({ projectKey, query })
  ↓
POST /api/v1/projects/:key/knowledge/search  [requireProjectAccess]
  ↓
KnowledgeController → KnowledgeSearchService.searchKnowledge
  ↓
1. QueryProcessor.process(query)           normalize text
2. EmbeddingService.generateEmbedding(query, 768)  Gemini API → 768-dim vector
3. KnowledgeRepository.searchChunksByVector(...)   pgvector cosine similarity
4. Filter: similarity >= 0.55  (MIN_SIMILARITY)
5. Deduplicate: near-duplicate chunks (>90% word overlap) removed
6. Diversity: max 3 chunks per document
7. Context budget: max 5 chunks, max 4000 chars
8. Sort: similarity DESC, chunkIndex ASC
  ↓
Return { hasResults, results[], count }
knowledgeStore.searchResults updated
KnowledgePage renders with similarity scores + document sources
```

### AI Agent Question Answering
```
User → sends message [AIAssistantPage.vue]
  ↓
aiStore.sendMessage(text)
  ↓
If no active conversation: POST /api/v1/projects/:key/conversations
  ↓
POST /api/v1/projects/:key/conversations/:id/messages
  [requireProjectAccess + aiRateLimiter 20 req/min]
  ↓
ConversationController → ConversationService.sendMessage
  ↓
1. Persist user message (ConversationMessage role='user')
2. Load last 20 messages as history
3. AiAgentService.chat({ projectKey, message, history, user })
   a. buildAgentInstruction(projectKey) → system prompt + 7 tool descriptions
   b. Gemini API call with history + tools
   c. Gemini responds: text OR tool_call
   d. tool_call → ToolRegistry validates name against APPROVED_AI_TOOLS allowlist
   e. ToolExecutor.execute(toolName, toolArgs, { projectKey, user })
      One of 7 approved tools:
        list_project_tickets      → TicketRepository
        get_ticket_details        → TicketRepository
        get_sprint_progress       → SprintRepository
        list_sprint_tickets       → SprintRepository
        get_project_activity      → ActivityRepository
        get_project_summary       → Project + Ticket + Sprint Repositories
        search_project_knowledge  → KnowledgeSearchService (full RAG pipeline)
   f. Tool result → Gemini as function_response
   g. Gemini generates final answer (may call more tools — multi-round)
   h. Parse ANALYSIS_BLOCK JSON from response
   i. AiEvaluator.evaluate(...)
      Checks: responseValid, toolsApproved, sourcesGrounded, analysisGrounded,
              confidenceValid, evidenceSummaryValid, secretsSafe
      secretsSafe: scans for JWT/API key/DATABASE_URL/passwordHash patterns
4. Persist assistant message + metadata (executedTools, sources, analysis, grounded)
5. Auto-update conversation title if default + early turn
  ↓
Return full response to aiStore
messages[]: temp user msg replaced, assistant msg appended
UI renders: text, tool execution list, source citations, analysis cards
AiMetrics.record*()  ← IN-MEMORY ONLY, resets on server restart
```

---

## 9. Known Discrepancies & Implementation Notes

> [!WARNING]
> **#1 — VIEWER can write knowledge documents via API.**  
> Knowledge routes use only `requireProjectAccess()` with no minimum role restriction. A VIEWER project member can create/edit/delete/index knowledge documents via direct API call. The frontend may hide controls, but the backend does not enforce a role restriction for knowledge writes.

> [!NOTE]
> **#2 — Activity actor defaults to Alex Morgan (m-1) in client-side fallback.**  
> `activity.store.js` exports `CURRENT_DEMO_USER = { id: 'm-1', name: 'Alex Morgan', ... }` as the default actor. When `recordActivity()` is called without an explicit actor, it defaults to Alex Morgan — regardless of who is actually logged in. This is a demo limitation.

> [!NOTE]
> **#3 — Ticket key generation is client-side and may collide.**  
> `generateNextKey()` scans local `tickets[]` for the max number. If the API fails and local state is stale, the generated key could collide with server-assigned keys.

> [!NOTE]
> **#4 — `/projects/:projectKey/settings` is a placeholder.**  
> `ProjectSectionPlaceholder.vue` renders only a "coming soon" message. No project settings CRUD exists.

> [!NOTE]
> **#5 — Analytics are fully client-side — no analytics API.**  
> All charts derive from reactive `ticketStore` and `sprintStore` state. No server-side aggregation or dedicated endpoint.

> [!NOTE]
> **#6 — AI metrics are in-memory only.**  
> `AiMetrics` uses static class properties. All counters reset to zero on server restart. No persistent telemetry.

> [!NOTE]
> **#7 — `ProjectBoardPage.vue` (420 bytes) is a thin shell.**  
> The actual Kanban implementation lives in shared `KanbanBoard.vue`.

> [!NOTE]
> **#8 — Only one ACTIVE sprint per project enforced server-side.**  
> `SprintService.startSprint()` throws HTTP 409 Conflict if another active sprint exists for the project. Not enforced client-side.

> [!NOTE]
> **#9 — `/knowledge` and `/projects/:key/knowledge` render the same component.**  
> Both routes use `KnowledgePage.vue`. Project context determined by `$route.params.projectKey`.
