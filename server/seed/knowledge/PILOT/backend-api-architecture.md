# Backend & REST API Architecture Specification

## Overview
The ProjectPilot backend is built with Node.js and Express v4. It exposes a standardized RESTful API under `/api/v1/` protected by authentication, role-based access control (RBAC), request rate limiting, payload size controls, and correlation tracking.

## Standardized Response Payload Contract
All API endpoints return JSON payloads following a uniform envelope schema:

### Success Response Format
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_84f92c10",
    "timestamp": "2026-09-04T12:00:00.000Z"
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please provide a valid bearer token.",
    "status": 401,
    "details": null
  },
  "requestId": "req_84f92c10"
}
```

## Middleware Chain & Request Pipeline
1. **Security Headers**: `helmet()` middleware configures HTTP security headers (HSTS, CSP, X-Frame-Options).
2. **CORS Control**: Configured via `cors()` middleware restricting allowed origins.
3. **Payload Limits**: Body parsing capped at 10MB to handle document uploads cleanly while rejecting oversized payloads.
4. **Correlation ID Generation**: `requestIdMiddleware` generates or preserves `X-Request-Id` across response headers for end-to-end tracing.
5. **Authentication Middleware**: `authenticateToken` validates JWT tokens passed via Authorization Bearer headers or HTTP-only cookies.
6. **Project Membership RBAC**: `verifyProjectMember` verifies that the caller belongs to the target project workspace (`:projectKey` or `:projectId`).
7. **Error Handler Middleware**: `errorHandler` catches operational `ApiError` instances, sanitizes stack traces in production, and formats standardized JSON error responses.

## Core API Endpoints Catalog
- `/api/v1/auth`: Login, logout, current user profile (`/me`).
- `/api/v1/projects`: Project creation, details, list, and team membership.
- `/api/v1/tickets`: Ticket CRUD, status transitions, assignees, and sprint links.
- `/api/v1/sprints`: Sprint lifecycle management (create, start, complete, burndown).
- `/api/v1/projects/:projectId/knowledge`: Document ingestion upload, list, status polling, RAG search, re-indexing, deletion.
- `/api/v1/ai/chat`: Main AI agent multi-tool reasoning and conversation interface.
- `/api/v1/ai/metrics`: Aggregated AI telemetry, pass rate, groundedness %, latency, and evaluation checks.
- `/api/v1/health/ready`: System readiness probe checking PostgreSQL/Prisma database connectivity and Gemini configuration.
