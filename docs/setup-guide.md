# Local Run & Setup Guide

This document provides step-by-step instructions to run the **Froncort Unified Multi-Tenant Workspace** locally, test all features, run security test suites, and execute production Docker builds.

---

## 🚀 Quick Start (Local Run)

### Prerequisites
- **Node.js**: v18.x or v20.x
- **npm**: v9.x or v10.x

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/your-username/froncort-org-workspace.git
cd froncort-org-workspace
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="super-secret-local-jwt-key-2026"
```

### 3. Initialize Database & Seed Sample Data
```bash
# Push Prisma schema to SQLite database
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed sample organizations, users, tickets, PRs, and connections
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3001](http://localhost:3001)** in your browser!

---

## 🔑 Pre-Configured Test Credentials

| Email Address | Password | Role | Organization Scope |
| :--- | :--- | :--- | :--- |
| **`admin@acme.test`** | `Passw0rd!` | `ORG_ADMIN` | Acme Corp |
| **`agent@acme.test`** | `Passw0rd!` | `SUPPORT_AGENT` | Acme Corp |
| **`reviewer@acme.test`** | `Passw0rd!` | `REVIEWER_APPROVER` | Acme Corp |
| **`guest@globex.test`** | `Passw0rd!` | `CROSS_ORG_GUEST` | Globex Inc |
| **`super@platform.test`** | `Passw0rd!` | `PLATFORM_SUPER_ADMIN` | Platform Scope |

*Note: You can also use the **`⚡ Switch Demo Persona`** dropdown in the top header or register a brand-new custom company account directly on the landing page!*

---

## 🧪 Running Automated Security & E2E Verification Tests

### Run Vitest Security Suite (BOLA Isolation & AI Digest Leak Prevention)
```bash
npm run test
```

### Run End-to-End Runtime Verification Script
```bash
node scripts/e2e-verify.js
```

---

## 🐳 Running via Docker & Docker Compose

To launch the full containerized production build with 1 command:

```bash
docker compose up --build
```
Access the containerized app at **`http://localhost:3001`**.
