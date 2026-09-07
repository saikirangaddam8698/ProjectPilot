# ProjectPilot Coding Standards & Development Guidelines

## Architectural Layering Rules
All backend code must follow a clear 3-tier layering contract:
1. **Controllers (`src/controllers/`)**: Handle HTTP request extraction, input validation, status code assignment, and error delegation to `next(err)`. Controllers must **not** execute direct SQL or Prisma queries.
2. **Services (`src/services/`)**: Enforce business logic, transaction orchestration, safety limits, AI agent workflows, and telemetry logging.
3. **Repositories (`src/repositories/`)**: Encapsulate all database interaction and Prisma query execution. Services call repositories; controllers do not call repositories directly.

## Frontend Store Event Emission Rules
- **Pure Domain Store Unidirectional Logging**: The `activity.store.js` store acts strictly as an append-only timeline event log.
- **Rule**: Domain stores (`ticket.store.js`, `sprint.store.js`, `project.store.js`) emit events to `activityStore`. UI components and Vue component watchers must **never** directly emit audit events to `activityStore`.

## Safe Member Removal & Ticket Reassignment
- Before deleting or removing a project member from workspace active status, open tickets assigned to that member must be reassigned to `Unassigned` using `ticketStore.reassignMemberTickets()`.

## Environment & Build Integrity Controls
- **`validateEnv()`**: Server startup validates that essential environment variables (`DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`) are present and properly formatted.
- **Zero Build Errors**: Any code changes, component refactorings, or new pages must compile with zero errors when executing `npm run build` in `client/`.
