# Production Deployment & Infrastructure Specification

## Deployment Overview
ProjectPilot is deployed as a modern multi-tier web application using containerized application instances and Cloud PostgreSQL with native vector extension support.

## Infrastructure Blueprint
- **Frontend Hosting**: Static web build (`client/dist`) served via Nginx or Cloudfront CDN.
- **Backend API Server**: Node.js ESM runtime managed via PM2 or Kubernetes deployment.
- **Database Engine**: Neon Cloud PostgreSQL (v15+) with `pgvector` extension enabled for 768-dimensional embedding storage.
- **LLM Endpoint**: Google Gemini API (`gemini-3.6-flash` and `text-embedding-004`).

## Database Initialization & Migration Sequence
1. **Prisma Code Generation**: `npx prisma generate` creates the type-safe Prisma client in `server/src/generated/client`.
2. **Database Migration**: `npx prisma migrate deploy` executes schema migrations against target PostgreSQL database.
3. **pgvector Extension Setup**: Migration scripts execute `CREATE EXTENSION IF NOT EXISTS vector;` to enable vector operations.
4. **Data Seeding**: `npm run db:seed` and `npm run seed:knowledge` seed base project metadata and index technical documentation into pgvector.

## Health Probes & Monitoring
- **Liveness Probe (`GET /api/v1/health`)**: Returns HTTP 200 indicating the Express HTTP server is accepting requests.
- **Readiness Probe (`GET /api/v1/health/ready`)**: Verifies database query execution via Prisma and validates Gemini configuration status. Returns 200 OK when ready or 503 Service Unavailable if dependencies fail.
