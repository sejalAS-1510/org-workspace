# Multi-Tenant B2B Enterprise Workspace & Collaboration Platform

A production-ready Next.js application built for multi-tenant enterprise organization management, cross-organization ticket/PR sharing, granular partner connection workflows, and compliance-grade audit logging.

---

## Key Features

- **Multi-Tenant Architecture**: Complete tenant isolation across organizations with scoped database querying, membership contexts, and role-based permissions (`PLATFORM_SUPER_ADMIN`, `ORG_ADMIN`, `MEMBER`).
- **Cross-Organization Collaboration**: Secure connection handshake workflow allowing organizations to approve, manage, or revoke inter-org data sharing links.
- **Granular Ticket & PR Sharing**: Share specific tickets or pull requests with linked partner organizations without exposing unshared tenant data.
- **Version History & Diff Snapshots**: Automated snapshot tracking on pull requests enabling side-by-side diff comparisons across revisions.
- **Immutable Audit Trail**: Append-only event logging for security-sensitive actions including login events, org switching, partner connection approvals, and access revocation.
- **Daily Digest Engine**: Aggregated activity summaries generated per organization member with built-in cross-tenant privacy filters.
- **Production-Grade Resilience**: Built-in self-healing database initialization supporting SQLite and PostgreSQL on containerized cloud hosting environments (Render, Vercel).

---

## Tech Stack

- **Framework**: Next.js 14 (App Router, Server Actions, API Routes)
- **Language**: TypeScript
- **Database & ORM**: Prisma ORM, SQLite / PostgreSQL
- **Styling**: Tailwind CSS
- **Authentication**: JWT-based session cookies with PBKDF2 native password hashing
- **Testing**: Vitest (Unit & Integration Security Test Suites)

---

## System Architecture

```
                               ┌─────────────────────────┐
                               │   Next.js App Router    │
                               └────────────┬────────────┘
                                            │
                      ┌─────────────────────┴─────────────────────┐
                      ▼                                           ▼
          ┌───────────────────────┐                   ┌───────────────────────┐
          │  Acme Corp Workspace │                   │ Globex Inc Workspace  │
          │    (Org Scope A)      │                   │    (Org Scope B)      │
          └───────────┬───────────┘                   └───────────┬───────────┘
                      │                                           │
                      └─────────────────┐       ┌─────────────────┘
                                        ▼       ▼
                            ┌──────────────────────────────┐
                            │ Partner Connection Handshake │
                            └──────────────┬───────────────┘
                                           │
                                           ▼
                            ┌──────────────────────────────┐
                            │  Scoped Cross-Org Data Access │
                            └──────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js 18.x or 20.x installed
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sejalAS-1510/org-workspace.git
   cd org-workspace
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Environment Setup:
   Create a `.env` file in the project root (optional for local SQLite development):
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your-secure-jwt-secret-key"
   NODE_ENV="development"
   ```

4. Database Setup & Seeding:
   ```bash
   npx prisma generate
   npx prisma db push
   node scripts/seed.js
   ```

5. Run the Development Server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## Demo Credentials

The database comes pre-seeded with two demo organizations and active member personas:

| Email | Password | Role | Organization |
| :--- | :--- | :--- | :--- |
| `alice@acme.com` | `Password123!` | ORG_ADMIN | Acme Corp |
| `bob@acme.com` | `Password123!` | MEMBER | Acme Corp |
| `carol@globex.com` | `Password123!` | ORG_ADMIN | Globex Inc |
| `dave@globex.com` | `Password123!` | MEMBER | Globex Inc |
| `admin@platform.com` | `Password123!` | PLATFORM_SUPER_ADMIN | Cross-Org Admin |

---

## Test Suite

Run unit and integration test suites:

```bash
# Run Vitest test suite
npm run test

# Run End-to-End runtime verification
node scripts/e2e-verify.js
```

### Verified Test Scenarios

- **Cross-Tenant Ticket Isolation**: Verifies members cannot read or query tickets belonging to unlinked organizations.
- **Cross-Org Digest Leak Prevention**: Ensures user digests contain zero activity logs from unauthorized tenant scopes.
- **Partner Approval Handshake**: Tests state transitions for partner requests (`PENDING` $\rightarrow$ `APPROVED` $\rightarrow$ `REVOKED`).

---

## API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/login` | `POST` | Authenticates user credentials and sets HttpOnly JWT cookie |
| `/api/auth/me` | `GET` | Returns active user profile, memberships, and active org scope |
| `/api/auth/switch-org` | `POST` | Switches active organization context and reissues session token |
| `/api/tickets` | `GET`, `POST` | Lists scoped organization tickets or creates new tickets |
| `/api/tickets/[id]` | `GET`, `PATCH` | Retrieves or updates a specific ticket |
| `/api/tickets/[id]/share` | `POST` | Shares a ticket with an approved partner organization |
| `/api/prs` | `GET`, `POST` | Manages scoped pull requests and version histories |
| `/api/prs/[id]/approve` | `POST` | Reviews and approves a pull request |
| `/api/connections` | `GET`, `POST` | Manages partner organization connection requests |
| `/api/connections/[id]/approve` | `POST` | Approves an incoming partner connection request |
| `/api/audit` | `GET` | Exports append-only audit trail logs for compliance |
| `/api/digest` | `GET` | Generates personalized user activity digests |

---

## License

Distributed under the MIT License.
