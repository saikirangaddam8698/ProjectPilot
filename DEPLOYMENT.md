# ProjectPilot Production Deployment & Architecture Guide

This guide details the production deployment procedure, database configuration, security boundaries, and health probes for ProjectPilot.

---

## 1. System Requirements & Stack Overview

- **Node.js**: v20.x LTS or higher
- **Frontend**: Vue 3 + Vite + Pinia (`client/`)
- **Backend**: Express + Prisma ORM (`server/`)
- **Database**: Cloud PostgreSQL (Neon) with `pgvector` extension enabled
- **AI Engine**: Google Gemini AI (`gemini-3.6-flash`)

---

## 2. Environment Setup

1. Copy `.env.example` to `.env` in `server/`:
   ```bash
   cp .env.example server/.env
   ```
2. Configure mandatory environment variables:
   - `DATABASE_URL`: Cloud PostgreSQL connection string (with SSL mode required).
   - `JWT_SECRET`: 32+ character secure secret key.
   - `GEMINI_API_KEY`: Valid API key from Google AI Studio.

---

## 3. Database & pgvector Migration

1. Enable `vector` extension on PostgreSQL database:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
2. Generate Prisma client & apply database schema migrations:
   ```bash
   cd server
   npx prisma generate
   npx prisma db push
   ```

---

## 4. Production Build & Execution

### Backend
```bash
cd server
npm install --production
npm start
```

### Frontend
```bash
cd client
npm install
npm run build
```
Deploy `client/dist` static assets to Vercel, Netlify, AWS S3, or NGINX.

---

## 5. Health & Readiness Probes

- **Liveness Probe**: `GET /api/v1/health`
  - Returns HTTP 200 with server uptime and operational status.
- **Readiness Probe**: `GET /api/v1/health/ready`
  - Returns HTTP 200 if PostgreSQL connection and Gemini AI service configurations are verified; returns HTTP 503 if degraded.

---

## 6. Security Boundaries & Protection Measures

- **Helmet Security Headers**: Strict CSP, HSTS, frameguard, X-Content-Type-Options active.
- **CORS Isolation**: Restricts cross-origin requests strictly to `CLIENT_ORIGIN`.
- **RBAC Server-Side Isolation**: All project resource requests (`/projects/:projectKey/...`) strictly verify user membership server-side.
- **Vector & Grounding Privacy**: Raw 768-dimensional float vectors, JWT secrets, database connection strings, and stack traces are filtered out of all API and tool outputs.
