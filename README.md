# Unified Org Workspace (Ticketing + PR/Audit Console)

> **Live Application**: [https://unified-org-workspace-t0zr.onrender.com/](https://unified-org-workspace-t0zr.onrender.com/)  
> **Demo Video (2 min)**: [Google Drive Video Link](https://drive.google.com/file/d/11DVpUJntFhCdtwUQzSLR-iuxO4Ktinq0/view?usp=drive_link)  
> **GitHub Repository**: [https://github.com/sejalAS-1510/org-workspace](https://github.com/sejalAS-1510/org-workspace)

A production-ready, multi-tenant enterprise workspace platform featuring a shared JWT identity layer, cross-organization partner collaboration, and append-only audit logging across two integrated dashboards: the **Support Hub** (ticketing) and the **Review & Audit Console** (PR workflow).

---

## 🔑 Demo Credentials

Password for **ALL** demo accounts: **`Passw0rd!`**

| Email | Password | Role | Organization | Scope & Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`admin@acme.test`** | **`Passw0rd!`** | `ORG_ADMIN` | Acme Corp | Full admin access across both dashboards, ticket creation, PR approval, and partner sharing |
| **`agent@acme.test`** | **`Passw0rd!`** | `SUPPORT_AGENT` | Acme Corp | Support Hub ticket management and status updates |
| **`reviewer@acme.test`** | **`Passw0rd!`** | `REVIEWER_APPROVER` | Acme Corp | Reviews tickets in Dashboard 1, approves PRs in Dashboard 2, and views audit logs |
| **`guest@globex.test`** | **`Passw0rd!`** | `CROSS_ORG_GUEST` | Globex Inc | Restricted cross-org access: view and comment on explicitly shared items only |
| **`super@platform.test`** | **`Passw0rd!`** | `PLATFORM_SUPER_ADMIN` | Platform Scope | Global platform management and connection oversight |

---

## 🏗️ Architecture Overview

```
                                 ┌─────────────────────────────────┐
                                 │   Central Identity & Org Layer  │
                                 │   (JWT Session, PBKDF2 Auth)   │
                                 └────────────────┬────────────────┘
                                                  │
                        ┌─────────────────────────┴─────────────────────────┐
                        ▼                                                   ▼
            ┌───────────────────────┐                           ┌───────────────────────┐
            │     Dashboard 1       │                           │      Dashboard 2      │
            │      Support Hub      │                           │ Review & Audit Console│
            │  (Tickets & Sharing)  │                           │   (PRs & Audit Log)   │
            └───────────┬───────────┘                           └───────────┬───────────┘
                        │                                                   │
                        └─────────────────────────┬─────────────────────────┘
                                                  │
                                                  ▼
                                 ┌─────────────────────────────────┐
                                 │      Prisma DB / Self-Healing    │
                                 │     Strict BOLA Query Scoping   │
                                 └─────────────────────────────────┘
```

---

## 🚀 Core Capabilities

### 1. Shared Identity & Session Synchronization
- **Central Auth Service**: Single source of truth for users, organization memberships, and role assignments across both dashboards.
- **Context-Aware Org Switcher**: Switch active organization scope on demand with instant JWT token re-issuance.
- **Global Token Revocation**: "Logout Everywhere" invalidates all active sessions by incrementing the user's `tokenVersion`.

### 2. Dashboard 1 — Support Hub (Ticketing)
- **Ticket Lifecycle**: Complete CRUD operations, status management, attachments, and threaded comments.
- **Strict BOLA Enforcement**: Multi-tenancy enforced strictly at the database query level (`withOrgScope`), preventing unauthorized access via direct API ID manipulation.
- **Per-Tenant Feature Flags**: Dynamically toggle feature availability per organization.
- **Item-Level Cross-Org Sharing**: Share individual tickets with linked partner organizations without granting access to unshared workspace data.

### 3. Dashboard 2 — Review & Audit Console (PR Workflow)
- **PR Workflow Engine**: Manage pull requests across states (`DRAFT` $\rightarrow$ `IN_REVIEW` $\rightarrow$ `APPROVED` / `REJECTED` $\rightarrow$ `MERGED`).
- **N-Approvals Rule**: Configurable reviewer approval threshold enforcing policy compliance before merge.
- **Revision Diff Snapshots**: Every edit made after review start creates a version snapshot with a side-by-side diff viewer.
- **Unified Audit Viewer**: Searchable, filterable timeline spanning all system mutations, with CSV export capabilities.

### 4. Cross-Organization Collaboration
- **Partner Handshake**: Connection request, approval, and revocation workflow between distinct organizations.
- **Restricted Guest Access**: External users from partner orgs receive view/comment-only privileges on explicitly shared items.

### 5. AI Progress Tracker & Digest Engine
- **Personalized Digests**: Aggregated summary of assigned tickets, pending PR reviews, and idle item metrics.
- **Scheduled Background Delivery**: Cron-triggered background job execution (`/api/cron/digest`) with zero page-load compute overhead.
- **Cross-Tenant Privacy Guarantee**: Digest computation strictly scopes data to the user's active org and shared items, covered by automated leak tests.

---

## 🛡️ Role-Based Access Control (RBAC)

| Role | Scope of Access |
| :--- | :--- |
| **Org Admin** | Full administration within their organization across both dashboards |
| **Support Agent** | Support Hub only; manages organization tickets |
| **Reviewer / Approver** | Both dashboards: PR review workflow, ticket reviews, and unified audit viewer |
| **Cross-Org Guest** | Read & comment access to explicitly shared tickets/PRs from partner orgs |
| **Platform Super Admin** | Platform-wide management, cross-org connection oversight, and global settings |

---

## ⚡ Quick Start & Local Setup

### 1. Clone & Install
```bash
git clone https://github.com/sejalAS-1510/org-workspace.git
cd org-workspace
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-secure-jwt-secret-key"
NODE_ENV="development"
```

### 3. Database Initialization & Seeding
```bash
npx prisma generate
npx prisma db push
node scripts/seed.js
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## 🧪 Automated Verification & Test Suites

Run the test suite to verify security constraints and tenant isolation:

```bash
# Run Vitest Security Tests (BOLA isolation & Digest leak prevention)
npm run test

# Run Comprehensive E2E Runtime Verification
node scripts/e2e-verify.js
```

---

## 📁 Repository Documentation (`/docs`)

Detailed architectural documentation is available in the [`/docs`](./docs) folder:

- [`docs/architecture.md`](./docs/architecture.md): System architecture, module boundaries, and tenant isolation design.
- [`docs/setup-guide.md`](./docs/setup-guide.md): Complete setup guide and environment configuration.
- [`docs/decisions.md`](./docs/decisions.md): Architectural trade-offs, design decisions, and future scaling plans.
- [`docs/rbac-matrix.md`](./docs/rbac-matrix.md): Granular permission matrix per endpoint and role.
- [`docs/llm-usage.md`](./docs/llm-usage.md): Agentic IDE and LLM tooling breakdown.

---

## 📄 License

Distributed under the MIT License.
