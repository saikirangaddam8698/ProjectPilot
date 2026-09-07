# ProjectPilot System Architecture Overview

## Executive Summary
ProjectPilot is an enterprise-grade AI-powered project intelligence and agile management platform. It combines real-time operational project data (projects, tickets, sprints, activity logs) with unstructured project documentation via Retrieval-Augmented Generation (RAG) and a multi-tool AI reasoning agent.

## Technology Stack

### Frontend Layer
- **Framework**: Vue 3 (Composition API with `<script setup>`)
- **State Management**: Pinia (Domain-specific stores: `ticket`, `sprint`, `project`, `knowledge`, `activity`, `ai`)
- **Routing**: Vue Router 4
- **Build Tool**: Vite 6
- **Styling**: Modern Vanilla CSS with CSS custom properties (Design System design tokens)

### Backend Layer
- **Runtime**: Node.js (v18+ ESM)
- **HTTP Server**: Express.js v4
- **ORM / Database Access**: Prisma ORM 6
- **Primary Database**: PostgreSQL / Neon Cloud PostgreSQL with `pgvector` extension
- **Authentication**: Stateless JSON Web Tokens (JWT) with HTTP-only cookies

### AI & Intelligence Layer
- **LLM Provider**: Google Gemini API (`@google/genai`)
- **Embeddings**: Gemini 768-dimensional text embedding model
- **Vector Search**: PostgreSQL native cosine distance search (`<=>`) via pgvector
- **Agent Orchestration**: `AiAgentService` multi-turn loop with 7 approved read-only operational tools

## High-Level Component Flow
1. **Client Interaction**: Users interact with the Vue 3 frontend workspace (Kanban board, Backlog, Sprint management, Knowledge Base, AI Assistant drawer).
2. **REST API Interface**: HTTP requests are processed by Express v1 routes (`/api/v1/*`), protected by authentication and project-level RBAC middleware.
3. **Operational Database**: Tickets, sprints, audit logs, and project metadata are persisted in PostgreSQL via Prisma ORM.
4. **Knowledge Indexing**: Uploaded documentation is processed by `DocumentIngestionService`, chunked, embedded using Gemini, and stored in pgvector.
5. **AI Reasoning Agent**: The AI agent synthesizes user queries by executing approved read-only tools against operational DB and RAG vector search, evaluating evidence confidence and producing grounded answers.
