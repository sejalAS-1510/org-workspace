# Unified Org Workspace (Support Hub + Review & Audit Console)

A multi-tenant organization workspace built with **Next.js 14, React.js, Tailwind CSS, TypeScript, and Prisma ORM**. Features a shared identity & authentication layer, BOLA-proof tenant isolation, role-based access control (RBAC), item-by-item cross-org collaboration, snapshot diff versioning, an append-only audit trail, and personalized AI progress digests.

---

## 🔗 Quick Links & Documentation Index
- **[http://localhost:3001](http://localhost:3001)** — Live Local Workspace URL
- **[`/docs/architecture.md`](file:///C:/Sejal/Froncort/org-workspace/docs/architecture.md)** — System Architecture Diagram & Service Boundaries
- **[`/docs/setup-guide.md`](file:///C:/Sejal/Froncort/org-workspace/docs/setup-guide.md)** — Step-by-Step Setup Guide & Test Credentials
- **[`/docs/decisions.md`](file:///C:/Sejal/Froncort/org-workspace/docs/decisions.md)** — Technical Decisions & Interview Prep Q&A
- **[`/docs/rbac-matrix.md`](file:///C:/Sejal/Froncort/org-workspace/docs/rbac-matrix.md)** — Central Role-Based Access Control Matrix
- **[`/docs/llm-usage.md`](file:///C:/Sejal/Froncort/org-workspace/docs/llm-usage.md)** — Agentic AI & LLM Usage Disclosure (Reasoning, Pros, Cons)

---

## 🏗️ Core Architecture & File Structure

```text
prisma/schema.prisma           Full multi-tenant data model (Identity, Tickets, PRs, Audit, Connections, Feature Flags)
lib/identity/auth.ts           JWT authentication, session management, tokenVersion revocation ("logout everywhere")
lib/authz/withOrgScope.ts      Single BOLA-proof isolation choke point for tickets and PRs
lib/authz/permissions.ts       RBAC matrix as code (Org Admin, Support Agent, Reviewer/Approver, Cross-Org Guest, SuperAdmin)
lib/audit/audit.ts             Single write path into AuditLog + append-only security model
lib/digest/generateDigest.ts   BOLA-proof personalized AI progress digest engine with sourceRefs provenance
app/api/                       RESTful API routes for Auth, Tickets, PRs, Audit, Connections, and AI Digest
app/page.tsx                   Unified SPA Frontend UI (Support Hub, Review Console, Audit Viewer, Partner Network)
tests/isolation.test.ts        BOLA tenant isolation test suite (100% Passing)
tests/digest-leak.test.ts      AI cross-org data leak test suite (100% Passing)
scripts/e2e-verify.js          Automated End-to-End Runtime Verification Script
Dockerfile                     Multi-stage production Docker container configuration
docker-compose.yml             1-command local container orchestration with healthchecks
.github/workflows/ci.yml       GitHub Actions CI/CD automated pipeline
```

---

## 🔑 Key Features Implemented

1. **Shared Identity & Authentication Layer**:
   - Central source of truth for users & organizations.
   - JWT tokens carrying `userId`, `activeOrgId`, `role`, and `tokenVersion`.
   - **Logout-Everywhere**: Increments `tokenVersion` in the DB, instantly invalidating all issued JWTs across all devices.
   - **Org Switcher**: Dynamic active organization context switching for multi-tenant users.

2. **Dashboard 1 — Support Hub (Ticketing)**:
   - Ticket CRUD, real-time status management (`OPEN` → `IN_PROGRESS` → `RESOLVED` → `CLOSED`), comments thread.
   - Query-layer BOLA (Broken Object Level Authorization) protection via `withOrgScope.ts`.

3. **Dashboard 2 — Review & Audit Console (PR Workflow)**:
   - PR state machine (`DRAFT` → `IN_REVIEW` → `APPROVED` / `REJECTED` → `MERGED`).
   - **Snapshot Versioning**: Edits after review starts create an automatic `PRVersion` snapshot before updating.
   - **N-Approvals Rule**: Configurable approval threshold; auto-promotes PR to `APPROVED` once required approvals are met.

4. **Cross-Org Collaboration**:
   - Partner organization connection requests, approvals, revocations, and 1-click **`🔄 Re-connect`**.
   - Item-by-item sharing (`TicketShare`, `PRShare`); external users get restricted view/comment rights only.

5. **Unified Append-Only Audit Viewer**:
   - Searchable, filterable timeline spanning all system mutations.
   - Direct-download CSV Export (`/api/audit?format=csv`) with active action filters.

6. **AI Progress Digest Engine**:
   - Personalized digest computed on demand or via background schedule (`/api/cron/digest`).
   - Provenance tracking via `sourceRefs` attached to `DIGEST_GENERATED` audit entries.

---

## 🔑 Test Credentials (Seeded)

| Email | Password | Role | Organization |
|:---|:---|:---|:---|
| **`admin@acme.test`** | `Passw0rd!` | Org Admin | Acme Corp |
| **`agent@acme.test`** | `Passw0rd!` | Support Agent | Acme Corp |
| **`reviewer@acme.test`** | `Passw0rd!` | Reviewer / Approver | Acme Corp |
| **`guest@globex.test`** | `Passw0rd!` | Cross-Org Guest | Globex Inc (Shared into Acme Ticket) |
| **`super@platform.test`** | `Passw0rd!` | Platform Super Admin | Platform Scope |

*Note: You can also click **`⚡ Switch Demo Persona`** in the top header or create a new custom account directly on the landing page!*

---

## 🚀 Local Run Guide

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables in .env
# DATABASE_URL="file:./dev.db"
# JWT_SECRET="super-secret-local-jwt-key-2026"

# 3. Seed database
npx prisma db push
npm run seed

# 4. Run development server
npm run dev

# 5. Run tests & E2E verification
npm run test
node scripts/e2e-verify.js
```

---

## 🤖 Agentic Tooling Evaluation (Page 3 PS Requirement)

**Tool Used**: Google Antigravity (AGY) Agentic AI Coding Assistant powered by Gemini.

### Reasoning & Usage:
- **Scaffolding & Boilerplate Generation**: Used for rapid scaffolding of Prisma schemas, RBAC permission tables, and Next.js API route handlers.
- **Architectural Boundary Verification**: Guided the design of the single choke point `withOrgScope.ts` to guarantee that no direct un-scoped queries touch the database layer.

### Pros & Cons:
- **Pros**: Extremely fast at generating consistent code patterns across multiple files, building responsive modern glassmorphism UI components, and writing explicit vitest security test suites.
- **Cons**: Requires rigorous human verification for isolation invariants, database permission grants (`REVOKE UPDATE, DELETE`), and edge-case error handling (e.g., enumeration-safe 404 responses instead of leaking 403s).
