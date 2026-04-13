# Loop

**Internal knowledge base for operations and shared-services teams.**

Multi-tenant SaaS built to production standards — TypeScript across the full stack, session auth, role-based access control, Postgres full-text search, version history, onboarding playbooks, audit log, and Stripe billing.

**Live demo → [loop-lake-five.vercel.app](https://loop-lake-five.vercel.app)**
_(Demo credentials are shown on the login page)_

---

## Why this exists

I spent several years building internal tools at enterprise scale — SharePoint applications, Power Automate workflows, document systems used daily by shared-services teams. I understood what operations teams actually need. What I wanted to add was full engineering ownership of the product behind those tools.

Loop is that project. It's the system I wish existed when I was building those workflows — and it's the codebase I used to prove I can own a production-grade stack end to end.

---

## Stack

| Layer | Technology |
|---|---|
| API | Node.js · Express · TypeScript (strict) |
| Auth | Lucia v3 — server-side sessions, httpOnly cookies |
| Database | PostgreSQL via Prisma (Neon) |
| Search | Postgres `tsvector` with GIN index, maintained by trigger |
| Queue | BullMQ + Redis |
| Frontend | React 18 · Vite · TanStack Query · Tailwind CSS |
| Validation | Zod — shared schemas between API and frontend |
| Billing | Stripe (test mode) — checkout, portal, webhooks |
| Testing | Vitest · Supertest · Playwright |
| CI/CD | GitHub Actions → Vercel (frontend) + Fly.io (API) |
| Monorepo | pnpm workspaces — `apps/api`, `apps/web`, `packages/db`, `packages/shared` |

---

## Features

### Multi-tenant workspaces
Every resource is scoped to a workspace. Tenant isolation is enforced at the query layer — every Prisma call includes `workspaceId`, with no cross-tenant data access possible.

### Role-based access control
Three roles per workspace: **Owner**, **Editor**, **Viewer**. Enforced by composable Express middleware — `requireAuth → requireMember → requireRole("EDITOR")` — so route handlers never deal with permission logic.

### Markdown articles with version history
Every save creates an immutable `ArticleVersion` row. The current content is denormalised onto the `Article` row for read performance. Version diffs are viewable from the article page.

### Postgres full-text search
A `tsvector` column on `articles` is maintained by a Postgres trigger — title weighted `A`, content weighted `B`. Queries use `websearch_to_tsquery` which understands natural language input. No external search service required.

### Onboarding playbooks
Ordered article sequences with per-user completion tracking. Progress is stored at the article level (not playbook level) so users can resume mid-sequence and a progress bar can be computed accurately.

### Audit log
Every write operation in a workspace — article published, member added, role changed, plan upgraded — is written to `audit_logs` with actor, action, resource, and metadata. Viewable by Owners.

### Background jobs
BullMQ + Redis workers handle search re-indexing and email dispatch. Workers run in the same process in development; the code is structured to split into a separate Fly.io machine for production.

### Stripe billing
Free and Pro tiers per workspace. Checkout and customer portal sessions created server-side. Plan state is updated via webhook (`customer.subscription.created/updated/deleted`) — the UI reads plan from the database, not from Stripe directly.

---

## Architecture notes

**Multi-tenancy** is row-level (shared schema, shared database). Every content table carries `workspaceId`. This is the pragmatic choice for early-stage SaaS — the tradeoff vs schema-per-tenant or Postgres RLS is documented inline.

**Session auth** uses Lucia v3 with a Prisma adapter. Sessions are stored in the database, not JWTs — simpler revocation, no token refresh complexity. Lucia v3 is deprecated as of late 2024 (the author moved to `better-auth`); the migration path is straightforward since the session/cookie contract is identical.

**FTS trigger** vs BullMQ indexing job: the Postgres trigger handles all real-time updates. The BullMQ search worker exists for bulk re-indexing after imports or schema changes — it's not on the hot path.

**Monorepo layout:**
```
loop/
├── apps/
│   ├── api/          # Express + TypeScript
│   └── web/          # React + Vite
├── packages/
│   ├── db/           # Prisma schema, migrations, client
│   └── shared/       # Zod schemas shared by API and frontend
└── .github/
    └── workflows/    # CI: typecheck → test → build → deploy
```

---

## Running locally

**Prerequisites:** Node 20+, pnpm 9+, Docker

```bash
# Clone and install
git clone https://github.com/deonmatongo/loop.git
cd loop
pnpm install

# Start Postgres and Redis
docker run -d --name loop-postgres -e POSTGRES_USER=loop -e POSTGRES_PASSWORD=loop -e POSTGRES_DB=loop -p 5432:5432 postgres:16-alpine
docker run -d --name loop-redis -p 6379:6379 redis:7-alpine

# Configure environment
cp .env.example .env
# Edit .env — DATABASE_URL and REDIS_URL are the only required fields for local dev

# Migrate and seed
DATABASE_URL="postgresql://loop:loop@localhost:5432/loop" pnpm db:migrate:deploy
pnpm db:seed

# Start both servers
pnpm dev
```

Open [http://localhost:5174](http://localhost:5174).

**Seed accounts:**

| Role | Email | Password |
|---|---|---|
| Owner | alice@example.com | password123 |
| Editor | bob@example.com | password123 |

---

## Testing

```bash
# API integration tests (requires running Postgres + Redis)
pnpm --filter @loop/api test

# E2E tests (starts both servers automatically)
pnpm --filter @loop/web test:e2e
```

CI runs on every push to `main` — typecheck, API tests against Postgres + Redis, build verification, then deploys to Vercel and Fly.io.

---

## Deployment

| Service | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Auto-deploys from `main` via GitHub integration |
| API + Workers | Fly.io | Single machine; workers run in-process |
| Database | Neon (Postgres) | Serverless, branching for preview environments |
| Cache / Queue | Upstash (Redis) | Serverless Redis, compatible with BullMQ |

See the [deployment guide](apps/api/fly.toml) for Fly.io configuration.

---

## What I'd change at production scale

- **RLS over `workspaceId` filters** — Postgres row-level security would make cross-tenant leaks impossible at the database layer, not just the application layer.
- **Separate worker process** — BullMQ workers would run as a dedicated Fly.io machine, not in the API process, so they can scale and restart independently.
- **`better-auth` instead of Lucia v3** — Lucia v3 is deprecated; `better-auth` is the maintained successor by the same author with an identical session model.
- **Neon branching in CI** — preview deployments would get their own database branch, enabling migration testing against real data shapes.
