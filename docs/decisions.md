# Architectural Decision Records (ADRs) & Trade-offs

This document outlines key technical decisions, security trade-offs, and design rationale made during the development of the Unified Org Workspace platform.

---

## 1. Single Application Monorepo vs. Separately Deployed Microservices

- **Decision**: Implemented identity, ticketing, PR workflows, and audit logging as distinct internal modules within a unified Next.js App Router project (`/lib`).
- **Rationale**: Reduces deployment friction and inter-service latency while maintaining strict domain module boundaries (`lib/identity`, `lib/tickets`, `lib/prs`, `lib/audit`).
- **Trade-off**: Does not showcase multi-origin deployment isolation. 
- **Future Scaling**: Extract the Identity module into a standalone microservice issuing RS256-signed JWTs, verified statelessly by independent dashboard apps.

---

## 2. Stateless JWT Sessions with Atomic Token Revocation

- **Decision**: Encoded `userId`, `activeOrgId`, and `role` into HttpOnly JWT cookies, using a database `tokenVersion` check for global session revocation ("Logout Everywhere").
- **Rationale**: Eliminates database lookups on standard authorized requests while ensuring instant session invalidation when a user triggers global logout.
- **Trade-off**: Requires a lightweight database check on token verification to compare `tokenVersion`.
- **Future Scaling**: Cache active `tokenVersion` keys in Redis with short TTLs to achieve sub-millisecond session validation.

---

## 3. Join-Table Resource Sharing vs. Blanket Tenant Authorization

- **Decision**: Modeled cross-organization sharing via explicit join models (`TicketShare`, `PRShare`), rather than loosening tenant `orgId` filters.
- **Rationale**: Preserves the core security invariant: every database query strictly filters by `activeOrgId` unless an explicit, revocable share record exists.
- **Trade-off**: Requires explicit `OR` query joins when listing shared items.

---

## 4. Generic Security Responses for Cross-Tenant Resource Isolation

- **Decision**: Return generic `404 Not Found` responses when users attempt to access unauthorized cross-tenant resources by manipulating IDs (BOLA protection).
- **Rationale**: Returning `403 Forbidden` leaks resource existence to unauthorized actors, creating a resource enumeration vulnerability.
- **Trade-off**: Slightly less detailed API error messages for frontend debugging.

---

## 5. Append-Only Database Security Model for Audit Logs

- **Decision**: Enforced append-only audit rules through strict Prisma scoping and database-level permissions.
- **Rationale**: Application-level discipline alone cannot protect audit trails from compromised application logic or raw SQL execution.
- **Trade-off**: Requires separate migration roles when altering table schemas.

---

## 6. Scheduled Background Digest Execution vs. Page-Load Calculation

- **Decision**: Processed user activity digests via background cron triggers (`/api/cron/digest`) rather than computing summaries dynamically on page load.
- **Rationale**: Prevents heavy analytical database queries during client navigation and ensures digests represent consistent scheduled snapshots.
- **Trade-off**: Digest data reflects the last scheduled execution interval rather than real-time state.
