# ProjectPilot — Database Setup & Architecture Guide

This document outlines the PostgreSQL database foundation, Prisma ORM architecture, configuration, migrations, seed data, and local setup options for **ProjectPilot**.

---

## 1. Architecture Overview

ProjectPilot follows a strict, layered backend data-access architecture that isolates HTTP concerns from database persistence:

```text
HTTP Request
     ↓
Routes (`src/routes/`)
     ↓
Controllers (`src/controllers/`)
     ↓
Services (`src/services/`)
     ↓
Repositories / Data Access (`src/repositories/`)
     ↓
Prisma Client (`src/db/prisma.js` → `src/generated/client`)
     ↓
PostgreSQL Database
```

### Layer Responsibilities

- **Routes (`src/routes/`)**: Request routing, versioning (`/api/v1`), middleware mapping.
- **Controllers (`src/controllers/`)**: HTTP parameter parsing, status codes, standardized API response format (`ApiResponse.success` / `ApiError`).
- **Services (`src/services/`)**: Business logic, cross-entity coordination, validation, activity logging triggers.
- **Repositories (`src/repositories/`)**: Pure database queries, Prisma operations, relational joins, filtering, and pagination.
- **Prisma Client Singleton (`src/db/prisma.js`)**: Connection lifecycle, connection health checks, query performance logging, and graceful teardown.

---

## 2. Domain Data Model & Prisma Schema

The initial database schema encapsulates the core ProjectPilot agile intelligence domain:

```mermaid
erDiagram
    MEMBER ||--o{ PROJECT : "leads"
    MEMBER ||--o{ PROJECT_MEMBER : "member of"
    PROJECT ||--o{ PROJECT_MEMBER : "has members"
    PROJECT ||--o{ SPRINT : "contains"
    PROJECT ||--o{ TICKET : "contains"
    PROJECT ||--o{ ACTIVITY : "records"
    MEMBER ||--o{ TICKET : "assigned to"
    MEMBER ||--o{ TICKET : "reported by"
    SPRINT ||--o{ TICKET : "scheduled in"
    MEMBER ||--o{ ACTIVITY : "acted by"

    MEMBER {
        string id PK
        string name
        string avatar
        string email UK
        string role
        string department
        enum status "ACTIVE | AWAY | OFFLINE"
        string[] skills
        int capacity
        datetime createdAt
        datetime updatedAt
    }

    PROJECT {
        string id PK
        string key UK
        string name
        string description
        enum status "ACTIVE | PLANNING | COMPLETED | ARCHIVED"
        string leadId FK
        datetime createdAt
        datetime updatedAt
    }

    PROJECT_MEMBER {
        string id PK
        string projectId FK
        string memberId FK
        string role
        datetime joinedAt
    }

    SPRINT {
        string id PK
        string projectId FK
        string name
        string goal
        enum status "PLANNED | ACTIVE | COMPLETED | CANCELLED"
        datetime startDate
        datetime endDate
        int capacity
        datetime createdAt
        datetime updatedAt
        datetime completedAt
    }

    TICKET {
        string id PK
        string key UK
        string projectId FK
        string title
        string description
        enum type "TASK | BUG | STORY | EPIC"
        enum status "BACKLOG | TODO | IN_PROGRESS | IN_REVIEW | DONE"
        enum priority "LOW | MEDIUM | HIGH | URGENT"
        string assigneeId FK
        string reporterId FK
        string sprintId FK
        int storyPoints
        int rank
        string[] labels
        datetime dueDate
        datetime createdAt
        datetime updatedAt
    }

    ACTIVITY {
        string id PK
        string projectId FK
        string actorId FK
        string type
        string action
        string targetType
        string targetId
        string targetKey
        string targetTitle
        string message
        json metadata
        datetime createdAt
    }
```

---

## 3. Environment Configuration

Database connection and pooling parameters are managed via the standard `DATABASE_URL` connection string:

```env
# PostgreSQL Database Configuration (Prisma)
# Connection pooling and timeout parameters:
# - connection_limit: maximum number of concurrent database connections
# - pool_timeout: timeout in seconds to wait for an available connection from pool
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/projectpilot?schema=public&connection_limit=10&pool_timeout=10"
```

---

## 4. Local PostgreSQL Setup Options

### Option A: Local Native PostgreSQL

1. Install PostgreSQL on your operating system (macOS `brew install postgresql@16`, Windows PostgreSQL installer, or Linux `apt install postgresql`).
2. Create the `projectpilot` database:
   ```sql
   CREATE DATABASE projectpilot;
   ```
3. Set your credentials in `server/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/projectpilot?schema=public&connection_limit=10&pool_timeout=10"
   ```

### Option B: Docker / Docker Compose

If using Docker, run a PostgreSQL 16 container:
```bash
docker run --name projectpilot-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=projectpilot \
  -p 5432:5432 \
  -d postgres:16-alpine
```

### Option C: Cloud PostgreSQL (Neon / Supabase / Render)

1. Provision a free PostgreSQL instance on [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Render](https://render.com).
2. Copy the pooled or direct connection string into `server/.env`.

---

## 5. Database CLI Commands

Run these scripts from `ProjectPilot/server`:

| Command | Action |
| :--- | :--- |
| `npm run db:generate` | Generates the typed Prisma Client into `src/generated/client` |
| `npm run db:migrate` | Runs database migrations against development database |
| `npm run db:migrate:deploy` | Deploys pending migrations (production/CI environments) |
| `npm run db:seed` | Seeds database with deterministic development data |
| `npm run db:push` | Pushes the schema state directly to database without creating a migration file |
| `npm run db:studio` | Opens visual Prisma Studio UI in your browser |
| `npm run db:reset` | Drops database, reapplies migrations, and runs seed script |

---

## 6. Health & Diagnostics Endpoints

ProjectPilot includes non-blocking database health verification:

- **`GET /api/health`** or **`GET /api/v1/health`**:
  Returns server health, uptime, memory, and database connection state:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "ProjectPilot Server is operational",
    "data": {
      "status": "healthy",
      "app": "ProjectPilot Server",
      "version": "0.1.0",
      "uptime": { "seconds": 42, "formatted": "42s" },
      "database": {
        "status": "connected",
        "provider": "postgresql",
        "latencyMs": 2.14,
        "tables": {
          "projects": 3,
          "tickets": 16,
          "sprints": 7,
          "members": 6,
          "activities": 7
        }
      }
    }
  }
  ```

- **`GET /api/v1/health/db`**:
  Dedicated database diagnostics returning connectivity, latency, and table counts.
