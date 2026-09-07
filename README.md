# ProjectPilot — AI-Powered Project Intelligence & Management Platform

ProjectPilot is a production-style, portfolio-grade AI project intelligence and agile management platform built with **Vue 3, Pinia, Express, Prisma, Neon PostgreSQL, pgvector, and Google Gemini AI**.

It seamlessly combines Jira-style project management (Projects, Tickets, Sprints, Backlog, Kanban, Team Workload, Audit Logs) with an **observable, grounded, multi-round AI Copilot** capable of analyzing project risks, correlating live database state with technical documentation (RAG), evaluating response confidence deterministically, and enforcing strict server-side RBAC boundaries.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Frontend ["Vue 3 SaaS Web Application (client/)"]
        UI["AIAssistantPage / Kanban / Sprints / Knowledge UI"]
        PiniaStores["Pinia Stores (ai.store, ticket.store, sprint.store)"]
        UI --> PiniaStores
    end

    subgraph Backend ["Express REST API Server (server/)"]
        Routes["API Routes & Middlewares (Auth, RBAC, RateLimiter)"]
        AiAgentService["AiAgentService (Multi-Round Orchestrator)"]
        ToolExecutor["ToolExecutor (RBAC-Guarded Tool Execution)"]
        KnowledgeSearch["KnowledgeSearchService (RAG Pipeline)"]
        AiEvaluator["AiEvaluator & AiMetrics (Deterministic Quality)"]

        Routes --> AiAgentService
        AiAgentService --> ToolExecutor
        AiAgentService --> KnowledgeSearch
        AiAgentService --> AiEvaluator
    end

    subgraph External ["External Services & Persistence"]
        Gemini["Google Gemini AI API (gemini-3.6-flash)"]
        Postgres["Neon Cloud PostgreSQL (Prisma ORM)"]
        VectorDB["pgvector Semantic Embeddings (768-dim)"]

        AiAgentService <--> Gemini
        ToolExecutor <--> Postgres
        KnowledgeSearch <--> VectorDB
    end

    PiniaStores <--> Routes
```

---

## 🌟 Key Features

1. **Agile Project Management**:
   - Projects, Sprints, Backlog, Kanban Board, Ticket Management, Team Workload, Audit Logs.
   - Server-side RBAC and workspace isolation (`PILOT`, `INFRA`, etc.).

2. **Multi-Round AI Agent & Controlled Tool Calling**:
   - Driven by Gemini AI with `MAX_AGENT_ROUNDS = 5`.
   - Executes 7 allowlisted, read-only tools (`list_project_tickets`, `get_ticket_details`, `get_sprint_progress`, `list_sprint_tickets`, `get_project_activity`, `get_project_summary`, `search_project_knowledge`).
   - Grounded in live project database state. Live operational state strictly overrides historical conversation statements.

3. **Production RAG & Semantic Retrieval Pipeline**:
   - Supports PDF, DOCX, TXT, and Markdown document uploads.
   - Text extraction, semantic chunking, and 768-dimensional embeddings via Gemini Embedding API.
   - PostgreSQL `pgvector` similarity search (`>0.55` threshold, deduplication `>92%`, document diversity cap).
   - Treats retrieved document content as untrusted reference material to prevent prompt injection.

4. **Deterministic Evaluation & AI Observability**:
   - Zero-LLM-overhead rule-based evaluator (`AiEvaluator`) and metrics snapshot (`AiMetrics`).
   - Evaluates response validity, tool accuracy, citation correctness, and groundedness.
   - Measures high-precision latencies (Gemini, Tool Execution, RAG Search).

5. **Persistent Project-Scoped AI Conversations**:
   - Multi-turn conversation persistence in PostgreSQL with titles, message turns, execution metadata, and sources.

---

## 💡 Important Architectural Note

> [!NOTE]
> **Conversation Persistence and RAG are NOT Model Fine-Tuning.**
> ProjectPilot does not fine-tune or modify base model weights. Conversation persistence stores chat turn history in PostgreSQL for contextual reference, while RAG (Retrieval-Augmented Generation) dynamically retrieves semantically relevant document chunks from `pgvector` to inject into the Gemini context window at request time.

---

## 🛠️ Technology Stack

- **Frontend**: Vue 3 (Composition API), Vite, Pinia, Vue Router, Vanilla CSS Design System.
- **Backend**: Node.js, Express.js, Prisma ORM, `@google/genai` SDK.
- **Database**: Cloud PostgreSQL (Neon) with `pgvector` extension.
- **Testing**: Node.js Test Runner (`node --test`), Supertest (260+ automated subtests).

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v20+
- Google Gemini API Key

### Installation

1. **Clone & Install Dependencies**:
   ```bash
   # Server dependencies
   cd server
   npm install

   # Client dependencies
   cd ../client
   npm install
   ```

2. **Environment Configuration**:
   Copy `.env.example` to `server/.env` and update credentials:
   ```env
   PORT=5000
   DATABASE_URL=postgresql://user:password@ep-host.neon.tech/dbname?sslmode=require
   JWT_SECRET=production-super-secret-jwt-key-32-chars
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Database Migration & Seeding**:
   ```bash
   cd server
   npx prisma generate
   npx prisma db push
   npm run db:seed
   npm run seed:knowledge
   ```

---

## 📚 Demo Knowledge Base & RAG Dataset

ProjectPilot includes a realistic technical documentation dataset stored under `server/seed/knowledge/`.
- **Location**: `server/seed/knowledge/PILOT/`, `INFRA/`, `MOBILE/`
- **Seed Command**: `npm run seed:knowledge` or `npm run db:seed`
- **Pipeline Processing**: Upload $\rightarrow$ SHA-256 Checksum Validation $\rightarrow$ Text Extraction $\rightarrow$ Document Chunker $\rightarrow$ Gemini 768-dim Embeddings $\rightarrow$ pgvector PostgreSQL Indexing.
- **Idempotency**: Running the seeder multiple times calculates SHA-256 checksums and skips documents with matching content, avoiding duplicate chunks or redundant embeddings.
- **Note**: These documents are source knowledge-base files ingested for RAG vector retrieval; they are NOT used to fine-tune or train Gemini models.

4. **Run Development Servers**:
   ```bash
   # Start backend server
   cd server
   npm run dev

   # Start frontend client
   cd client
   npm run dev
   ```

5. **Run Verification Suite**:
   ```bash
   # Backend automated tests
   cd server
   npm test

   # Client production build
   cd client
   npm run build
   ```

---

## 🛡️ Security & Privacy Controls

- All API endpoints strictly enforce authentication and project-level RBAC.
- Raw database credentials, JWT secrets, password hashes, and 768-float embedding vectors are never exposed to clients.
- Prompt injection protection neutralizes malicious instruction artifacts in RAG documents and user inputs.
