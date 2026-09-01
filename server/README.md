# ProjectPilot Backend Server

Backend API & Persistence Layer for **ProjectPilot** — portfolio-quality AI-powered project intelligence and Jira-style agile management platform.

---

## 🛠️ Technology Stack

- **Runtime**: Node.js (ES Modules, `>=18.0.0`)
- **Web Framework**: Express.js 4.x
- **Database & ORM**: PostgreSQL with Prisma ORM 6.x
- **Security & Utilities**: Helmet, CORS, Express-Rate-Limit, Morgan

---

## 📁 Architecture Pattern

```text
Routes (`src/routes/`)
  ↓
Controllers (`src/controllers/`)
  ↓
Services (`src/services/`)
  ↓
Repositories (`src/repositories/`)
  ↓
Prisma Client Singleton (`src/db/prisma.js` → `src/generated/client`)
  ↓
PostgreSQL
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and set your PostgreSQL connection string:
```bash
cp .env.example .env
```

### 3. Generate Prisma Client & Run Migrations
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```

The server starts on `http://localhost:5000`.

---

## 🧪 Testing

Run backend integration and database layer tests:
```bash
npm test
```

---

## 📜 Database Scripts

| Command | Description |
| :--- | :--- |
| `npm run db:generate` | Generate typed Prisma client |
| `npm run db:migrate` | Apply schema migrations in development |
| `npm run db:seed` | Seed database with realistic demo projects, sprints, tickets, and members |
| `npm run db:studio` | Launch visual browser-based database inspector |
| `npm run db:reset` | Reset database and re-seed |

For detailed documentation, see [docs/DATABASE_SETUP.md](../docs/DATABASE_SETUP.md).
