# ProjectPilot — REST API Documentation (v1)

This document provides complete developer-facing documentation for the **ProjectPilot Express REST API (`/api/v1`)**.

---

## 1. Architectural Flow

Every request passes through a strictly layered, decoupled architecture:

```text
Vue Component
     ↓
Pinia Stores (`client/src/stores/`)
     ↓
API Client (`client/src/services/api/`)
     ↓
Express Routes (`server/src/routes/v1/`)
     ↓
Validation Middleware (`server/src/middleware/validate.js`)
     ↓
Controllers (`server/src/controllers/`)
     ↓
Domain Services (`server/src/services/`)
     ↓
Data Repositories (`server/src/repositories/`)
     ↓
Prisma Client Singleton (`server/src/db/prisma.js`)
     ↓
PostgreSQL Database
```

---

## 2. Standardized Response Formats

All endpoints return predictable JSON structures.

### Success Response (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation description",
  "data": { ... },
  "timestamp": "2026-09-01T12:00:00.000Z"
}
```

### Error Response (`400 Bad Request`, `404 Not Found`, `409 Conflict`, `500 Internal Error`)
```json
{
  "success": false,
  "statusCode": 404,
  "error": {
    "code": "NOT_FOUND",
    "message": "Project with key \"XYZ\" not found",
    "details": null
  },
  "timestamp": "2026-09-01T12:00:00.000Z"
}
```

---

## 3. Endpoints Catalog

### Discovery & Health

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1` | ❌ No | Root API metadata and endpoint discovery catalog |
| `GET` | `/api/v1/health` | ❌ No | Comprehensive server & database health status |
| `GET` | `/api/v1/health/db` | ❌ No | Dedicated database latency & table metrics |
| `GET` | `/api/v1/health/system` | ❌ No | Node.js process and memory diagnostics |

---

### Authentication & Sessions (`/api/v1/auth`)

| Method | Endpoint | Auth Required | Minimum Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | ❌ No | None | Authenticate with email & password, sets HTTP-only cookie |
| `POST` | `/api/v1/auth/logout` | ❌ No | None | Clears `projectpilot_token` HTTP-only session cookie |
| `GET` | `/api/v1/auth/me` | ✅ Yes | `VIEWER` | Retrieve current authenticated user & profile |

#### `POST /api/v1/auth/login`
- **Rate Limit**: Max 20 requests per 15 minutes per IP.
- **Request Body**:
  ```json
  {
    "email": "alex.m@projectpilot.dev",
    "password": "PilotPass123!"
  }
  ```
- **Response**: `200 OK`
  - Sets HTTP-only `projectpilot_token` cookie (`SameSite: Lax`, `Secure` in production, `Max-Age: 7 days`).
  - Response Body:
    ```json
    {
      "success": true,
      "data": {
        "user": {
          "id": "u-1",
          "email": "alex.m@projectpilot.dev",
          "role": "ADMIN",
          "memberId": "m-1",
          "member": {
            "id": "m-1",
            "name": "Alex Morgan",
            "avatar": "AM",
            "role": "Project Admin"
          },
          "projectKeys": ["PILOT", "INFRA"]
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
    ```

#### `POST /api/v1/auth/logout`
- **Response**: `200 OK` (clears cookie).

#### `GET /api/v1/auth/me`
- **Headers**: Cookie `projectpilot_token` or `Authorization: Bearer <token>`
- **Response**: `200 OK` with sanitized authenticated user profile. (Zero password / secret leakage).

---

### Projects (`/api/v1/projects`)

#### `GET /api/v1/projects`
- **Query Params**: `status` (`active`, `planning`, `completed`), `search` (keyword)
- **Response**: Array of Project objects with `lead`, `members`, `activeSprint`, and derived `health` statistics.

#### `GET /api/v1/projects/:projectKey`
- **Path Params**: `projectKey` (e.g. `PILOT`, `INFRA`, `MOBILE`)
- **Response**: Single detailed Project object.

#### `POST /api/v1/projects`
- **Request Body**:
  ```json
  {
    "name": "ProjectPilot Core",
    "key": "PILOT",
    "description": "Multi-user agile platform",
    "status": "active",
    "leadName": "Alex Morgan"
  }
  ```
- **Response**: `201 Created` with initialized Project object.

#### `PATCH /api/v1/projects/:projectKey`
- **Request Body**: `{ "name"?: string, "description"?: string, "status"?: string }`
- **Response**: `200 OK` with updated Project object.

#### `DELETE /api/v1/projects/:projectKey`
- **Response**: `200 OK` with `{ "key": "PILOT", "id": "proj-pilot" }`.

#### `POST /api/v1/projects/:projectKey/members`
- **Request Body**:
  ```json
  {
    "name": "Elena Rostova",
    "role": "Frontend Engineer",
    "email": "elena.r@projectpilot.dev",
    "department": "UI/UX",
    "status": "Active",
    "capacity": 20
  }
  ```
- **Response**: `200 OK` with updated project member list.

#### `DELETE /api/v1/projects/:projectKey/members/:memberId`
- **Response**: `200 OK` with updated project member list.

---

### Tickets (`/api/v1/tickets`)

#### `GET /api/v1/tickets`
- **Query Params**: `projectKey`, `sprintId`, `status`, `priority`, `type`, `assigneeId`, `search`, `isBacklog`
- **Response**: Array of Ticket objects with populated `assignee`, `reporter`, and `sprint` data.

#### `GET /api/v1/tickets/:ticketKey`
- **Path Params**: `ticketKey` (e.g. `PILOT-89`)
- **Response**: Single Ticket details object.

#### `POST /api/v1/tickets`
- **Request Body**:
  ```json
  {
    "projectKey": "PILOT",
    "title": "Fix race condition in drag-and-drop",
    "description": "Card collision before store commit",
    "type": "Bug",
    "priority": "High",
    "status": "Todo",
    "assigneeId": "m-1",
    "sprintId": "sprint-pilot-24",
    "storyPoints": 3,
    "labels": ["frontend", "kanban"],
    "dueDate": "2026-09-02"
  }
  ```
- **Response**: `201 Created` with formatted Ticket.

#### `PATCH /api/v1/tickets/:ticketKey`
- **Request Body**: Partial update object (title, description, storyPoints, labels, dueDate, etc.).
- **Response**: `200 OK` with updated Ticket.

#### `PATCH /api/v1/tickets/:ticketKey/status`
- **Request Body**: `{ "status": "In Progress" | "In Review" | "Done" | "Todo" | "Backlog" }`
- **Response**: `200 OK` with updated Ticket.

#### `PATCH /api/v1/tickets/:ticketKey/priority`
- **Request Body**: `{ "priority": "Urgent" | "High" | "Medium" | "Low" }`
- **Response**: `200 OK` with updated Ticket.

#### `PATCH /api/v1/tickets/:ticketKey/assignee`
- **Request Body**: `{ "assigneeId": "m-2" }`
- **Response**: `200 OK` with updated Ticket.

#### `PATCH /api/v1/tickets/:ticketKey/sprint`
- **Request Body**: `{ "sprintId": "sprint-pilot-24" | null }`
- **Response**: `200 OK` with updated Ticket.

#### `POST /api/v1/tickets/reassign-member`
- **Request Body**: `{ "projectKey": "PILOT", "memberId": "m-4", "newAssigneeId": null }`
- **Response**: `200 OK` with count of updated tickets.

#### `POST /api/v1/tickets/reorder-backlog`
- **Request Body**: `{ "projectKey": "PILOT", "orderedKeys": ["PILOT-118", "PILOT-120"] }`
- **Response**: `200 OK` with updated rank array.

#### `DELETE /api/v1/tickets/:ticketKey`
- **Response**: `200 OK` with deleted key.

---

### Sprints (`/api/v1/sprints`)

#### `GET /api/v1/sprints`
- **Query Params**: `projectKey`, `status` (`active`, `planned`, `completed`)
- **Response**: Array of Sprint objects.

#### `GET /api/v1/sprints/:sprintId`
- **Response**: Single Sprint object with embedded tickets.

#### `POST /api/v1/sprints`
- **Request Body**:
  ```json
  {
    "projectKey": "PILOT",
    "name": "Sprint 26 — Advanced Search",
    "goal": "Implement vector search filtering",
    "startDate": "2026-09-23",
    "endDate": "2026-10-07",
    "capacity": 35
  }
  ```
- **Response**: `201 Created` with planned Sprint.

#### `POST /api/v1/sprints/:sprintId/start`
- **Response**: `200 OK` setting sprint status to `active` (enforces single active sprint per project rule).

#### `POST /api/v1/sprints/:sprintId/complete`
- **Request Body**: `{ "moveIncompleteTo": "backlog" | "sprint-id" }`
- **Response**: `200 OK` completing sprint and moving incomplete tickets.

#### `DELETE /api/v1/sprints/:sprintId`
- **Response**: `200 OK` deleting sprint and moving tickets to backlog.

---

### Workspace Members (`/api/v1/members`)

#### `GET /api/v1/members`
- **Query Params**: `status`, `department`, `search`
- **Response**: Array of Member objects with `projectKeys` and assigned ticket counts.

#### `POST /api/v1/members`
- **Request Body**: `{ "name": "Jane Doe", "email": "jane.d@projectpilot.dev", "role": "Senior Developer", "department": "Backend", "status": "Active", "capacity": 18 }`
- **Response**: `201 Created` with Member object.

#### `PATCH /api/v1/members/:memberId`
- **Request Body**: Partial update object.
- **Response**: `200 OK` with updated Member.

#### `DELETE /api/v1/members/:memberId`
- **Response**: `200 OK` with deleted Member ID.

---

### Activities (`/api/v1/activities`)

#### `GET /api/v1/activities`
- **Query Params**: `projectKey`, `type`, `actorId`, `limit` (default 50), `offset` (default 0)
- **Response**: Array of chronological Activity audit entries.

#### `POST /api/v1/activities`
- **Request Body**:
  ```json
  {
    "projectKey": "PILOT",
    "type": "ticket",
    "action": "status_changed",
    "targetType": "ticket",
    "targetId": "t-pilot-98",
    "targetKey": "PILOT-98",
    "targetTitle": "Streaming SSE handler",
    "message": "moved PILOT-98 from In Progress to In Review",
    "metadata": { "fromStatus": "In Progress", "toStatus": "In Review" }
  }
  ```
- **Response**: `201 Created` with recorded Activity object.
