# RBAC & Project Data Isolation Specification

## Overview
ProjectPilot enforces strict project-level multi-tenancy and data isolation. Users are restricted to accessing data belonging strictly to projects where they hold explicit active team membership.

## Project Isolation Principles

### 1. Inconvenient Inaccessible Boundaries (IDOR Prevention)
Knowing a resource ID (such as a conversation ID `conv_123`, ticket key `PILOT-99`, or document ID `doc_456`) belonging to another project does **not** grant access. Every API request verifies project membership before executing data retrieval or mutation. Attempts to query unauthorized resources return `403 Forbidden` or `404 Not Found`.

### 2. Authorization Middleware Layer (`verifyProjectMember`)
- The `verifyProjectMember` middleware resolves the target project key (`:projectKey`) or project ID (`:projectId`) from route parameters or request body.
- It checks if `req.user.id` is linked to an active `ProjectMember` record for that project.
- Global `ADMIN` users bypass project-level membership checks to allow cross-project administration.

### 3. AI Tool Project Isolation
- All AI agent tool executions (`ToolExecutor`) enforce project isolation.
- When an AI tool like `list_project_tickets` or `search_project_knowledge` is invoked, `ToolExecutor` passes `req.user` and verifies caller membership.
- Tools **cannot** query database records or RAG chunks from projects where the user lacks membership.

### 4. Vector Database Search Isolation
- In `KnowledgeRepository.searchChunksByVector`, semantic search SQL queries include an explicit SQL predicate: `WHERE d."projectId" = $2`.
- Vector embeddings and text chunks from Project A are completely unreachable when querying from Project B, ensuring cryptographic project boundary isolation.

### 5. Private AI Conversation Ownership
- AI Conversations (`Conversation` model) belong to a specific user (`userId`) and project (`projectId`).
- Users cannot list, view messages, or send prompts to private conversation threads created by another user, even within the same project.
