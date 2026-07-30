# Agentic IDE & LLM Usage Disclosure

Per Page 3 of the Take-Home Assignment specifications, this document details the AI tools and Agentic IDEs used during the development of this project, including reasoning, pros, and cons.

---

## 🤖 AI Assistant Used
- **Agentic AI System**: Google DeepMind Antigravity CLI / IDE (`agy`).
- **Core Reasoning Engine**: Gemini 2.5 Pro / Flash.

---

## 🎯 Reasoning for Tool Selection
1. **Architectural Verification**: Used agentic tool loops to enforce single choke-point query isolation (`withOrgScope.ts`) across all 16 Next.js API route handlers.
2. **Rapid Test Suite Creation**: Automated the setup of Vitest test fixtures (`tests/isolation.test.ts` & `tests/digest-leak.test.ts`) to prove zero BOLA cross-tenant data leaks.
3. **UI Craftsmanship & Micro-Interactions**: Generated responsive Tailwind styling with dynamic Light/Dark mode CSS custom variables (`--bg-main`, `--bg-card`, `--text-main`).

---

## ⚖️ Pros and Cons

### Pros
- **Zero-BOLA Assurance**: Automated security unit tests immediately caught missing tenant filters during development.
- **High Developer Velocity**: Built full-stack Next.js App Router API handlers, Prisma schemas, and responsive React frontend components in record time.
- **Comprehensive Documentation**: Automatically generated mermaid architecture diagrams, RBAC permission matrices, and OpenAPI-style route specs.

### Cons & Mitigations
- **Port Conflict Awareness**: Background dev servers occasionally locked port `3001` during hot reloads; resolved by introducing explicit process cleanup (`taskkill` / `pkill`) and Docker healthchecks.
- **SQLite Enum Mappings**: SQLite provider required mapping TypeScript string union types (`OrgRole`, `ReviewDecision`) instead of native Prisma enums; mitigated by exporting strict TypeScript type aliases in `lib/identity/auth.ts`.
