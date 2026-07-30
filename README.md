# 🛡️ Froncort Unified Multi-Tenant Enterprise Workspace
> **Integrated Support Hub (Ticketing System) & Review Console (PR Workflow) with BOLA-Proof Tenant Isolation, Shared Identity, Append-Only Audit Trail, and AI Progress Digest**

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 18](https://img.shields.io/badge/React-18.3-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.20-2d3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Vitest](https://img.shields.io/badge/Vitest-2.0-6e9f18?style=flat-square&logo=vitest)](https://vitest.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?style=flat-square&logo=docker)](https://www.docker.com/)
[![CI/CD](https://img.shields.io/badge/GitHub_Actions-Passing-2088FF?style=flat-square&logo=github-actions)](https://github.com/)

---

## 📑 Executive Overview

This application unites two core enterprise domains — a **Support Hub (Ticketing System)** and a **Review Console (PR Approval Workflow)** into a single multi-tenant platform.

It is built from the ground up to solve complex enterprise multi-tenancy challenges:
- 🛡️ **BOLA-Proof Security**: Query-layer tenant isolation enforced via a single choke point (`lib/authz/withOrgScope.ts`).
- 🔐 **Global Session Revocation**: "Logout Everywhere" feature invalidates JWT session tokens globally across all devices via `tokenVersion` DB tracking.
- 📸 **Snapshot Version History**: PR edits created after review starts generate immutable version snapshots (`PRVersion`).
- 📜 **Append-Only Audit Logging**: All mutation actions are recorded in an append-only audit trail with filterable CSV export.
- ✨ **AI Progress Digest with Audit Provenance**: Generates BOLA-scoped executive progress summaries linked to source record IDs (`sourceRefs`).

---

## 🔑 Pre-Configured Test Credentials

Evaluators can log in using these pre-seeded test accounts (Password for all: **`Passw0rd!`**), click **`⚡ Switch Demo Persona`** in the top navigation header, or register a brand-new custom company account directly on the landing page!

| Email Address | Password | Role | Organization Scope | Key Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **`admin@acme.test`** | `Passw0rd!` | `ORG_ADMIN` | Acme Corp | Full administrative control across tickets, PRs, audit, and partner connections. |
| **`agent@acme.test`** | `Passw0rd!` | `SUPPORT_AGENT` | Acme Corp | Creates & manages support tickets and customer issues. |
| **`reviewer@acme.test`** | `Passw0rd!` | `REVIEWER_APPROVER` | Acme Corp | Reviews pull requests, issues approval decisions, and views audit logs. |
| **`guest@globex.test`** | `Passw0rd!` | `CROSS_ORG_GUEST` | Globex Inc | Restricted access limited strictly to explicitly shared tickets/PRs. |
| **`super@platform.test`** | `Passw0rd!` | `PLATFORM_SUPER_ADMIN` | Platform Scope | Platform-wide administrative oversight and cross-org management. |

---

## 🖥️ Interactive Features & Dashboards Tour

### 📌 **Dashboard 1: Support Hub (Ticketing System)**
- **Ticket Lifecycle Management**: Create tickets, search by keyword/ID, and filter by status (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`).
- **Inline Real-Time Status Updater**: Change ticket status directly on cards with instant DB updates and `STATUS_CHANGE` audit logging.
- **Collaborative Comment Thread**: Threaded discussions per ticket.
- **Item-Level Cross-Org Sharing**: Share specific tickets with partner organizations (`TicketShare`).

### 🔀 **Dashboard 2: Review Console (PR Workflow)**
- **PR State Machine**: Track pull requests from `IN_REVIEW` to `APPROVED` or `REJECTED`.
- **Configurable $N$-Approvals Threshold**: Auto-promotes PRs to `APPROVED` when approval count reaches required threshold $N$.
- **Snapshot Version Inspector**: Click **`Inspect Snapshot Diff`** to review historical version snapshots created on post-review edits.

### 🛡️ **Dashboard 3: Unified Audit Viewer**
- **Filterable Timeline**: Filter audit events by action (`CREATE`, `UPDATE`, `STATUS_CHANGE`, `SHARE`, `APPROVE`, `DIGEST_GENERATED`, `LOGOUT_EVERYWHERE`, `USER_REGISTERED`).
- **Direct-Download CSV Export**: Click **`📥 Export CSV`** to download custom audit reports.

### 🌐 **Dashboard 4: Partner Network**
- **Partner Connections Grid**: Manage connection statuses between organizations (`APPROVED`, `PENDING`, `REVOKED`).
- **1-Click `🔄 Re-connect` Button**: Re-open revoked partner connections seamlessly.

---

## 📁 Documentation Sitemap (`/docs`)

Comprehensive architecture documentation is available in the [`/docs`](file:///C:/Sejal/Froncort/org-workspace/docs) folder:

- 📐 **[`/docs/architecture.md`](file:///C:/Sejal/Froncort/org-workspace/docs/architecture.md)** — System Architecture Diagram, Service Boundaries & Microservices Roadmap.
- 📖 **[`/docs/setup-guide.md`](file:///C:/Sejal/Froncort/org-workspace/docs/setup-guide.md)** — Step-by-Step Setup, Deployment & Testing Guide.
- 🎯 **[`/docs/decisions.md`](file:///C:/Sejal/Froncort/org-workspace/docs/decisions.md)** — Architectural Decisions, Tradeoffs & Technical Interview Prep Q&A.
- 🔒 **[`/docs/rbac-matrix.md`](file:///C:/Sejal/Froncort/org-workspace/docs/rbac-matrix.md)** — Central Role-Based Access Control Matrix.
- 🤖 **[`/docs/llm-usage.md`](file:///C:/Sejal/Froncort/org-workspace/docs/llm-usage.md)** — Agentic AI & LLM Usage Disclosure (Reasoning, Pros, and Cons).

---

## 🧪 Automated Testing & Security Verification

The repository includes explicit automated unit and security integration test suites:

```bash
# Run Vitest Security Test Suite
npm run test

# Run End-to-End Runtime Verification Script
node scripts/e2e-verify.js
```

### Test Results Summary:
- ✅ **BOLA Tenant Isolation Suite** (`tests/isolation.test.ts`): Passed (4/4 tests).
- ✅ **AI Digest Leak Prevention Suite** (`tests/digest-leak.test.ts`): Passed (2/2 tests).
- ✅ **End-to-End Runtime Verification** (`scripts/e2e-verify.js`): Passed (100% success).

---

## 🚀 Local Quick-Start Guide

### 1. Prerequisites
- Node.js v18+ or v20+
- npm v9+

### 2. Setup & Execution
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/froncort-org-workspace.git
cd froncort-org-workspace

# Install dependencies
npm install

# Initialize database schema & seed test data
npx prisma db push
npm run seed

# Launch development server
npm run dev
```
Open **[http://localhost:3001](http://localhost:3001)** in your browser!

### 🐳 Running via Docker Compose
```bash
docker compose up --build
```

---

## 🤖 Agentic AI Disclosure (Page 3 PS Requirement)

- **AI Tools Used**: Google DeepMind Antigravity CLI / IDE (`agy`) powered by Gemini.
- **Reasoning**: Used for rapid multi-file scaffolding of Prisma schemas, RESTful API route handlers, responsive Tailwind glassmorphism UI components, and writing explicit security unit tests.
- **Pros**: Accelerates developer velocity, ensures consistent code patterns, and auto-generates comprehensive technical documentation.
- **Cons**: Requires strict human verification for security invariants (such as single choke-point query scoping and enumeration-safe 404 error responses).

---

© 2026 **Froncort.AI** | All Rights Reserved. Built with Next.js, Prisma, and TypeScript.
