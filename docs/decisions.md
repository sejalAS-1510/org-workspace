# Decisions & Tradeoffs

One line per non-obvious choice, added as I build — this doubles as my
interview prep sheet. Newest at bottom.

- **Single Next.js app instead of two separately deployed services.**
  Fastest path to a working, coherent product in the timeline available.
  Module boundaries (`lib/identity`, `lib/tickets`, `lib/prs`,
  `lib/audit`) are real even though the deployment isn't split. Tradeoff:
  doesn't yet demonstrate independent deploy/scale of the two dashboards.
  Next step: extract Identity as its own service issuing JWTs the other
  two verify via a shared public key.

- **JWT carries `userId`, `activeOrgId`, `role`; org-switch re-issues a
  token rather than mutating claims server-side.** Keeps verification
  stateless (no DB hit on every request). Tradeoff: revocation needs a
  side-channel check — solved via `tokenVersion` on `User`, bumped on
  logout-everywhere and checked on each request.

- **Ticket/PR sharing modeled as an explicit join table
  (`TicketShare`/`PRShare`), never a loosened org filter.** Keeps the
  isolation invariant — "every query filters by orgId unless via an
  explicit, revocable share record" — true everywhere, including the
  BOLA test. No org-to-org blanket grant exists anywhere in the schema.

- **Forbidden responses are generic ("not found"), not "403: exists but
  not yours."** Distinguishing 403 from 404 leaks whether an ID exists —
  an enumeration side channel across tenant boundaries. Both cases return
  the same shape.

- **Audit log append-only enforced via Postgres role grants, not just
  "we don't call .update() in our code."** Application-level discipline
  doesn't survive a compromised app server or a future teammate who
  doesn't know the rule. DB grants do.

- **AI digest writes its own AuditLog entry with `sourceRefs`** (the IDs
  of every ticket/PR it drew from). Makes the "AI must never leak
  cross-org data" test meaningful — it can assert on `sourceRefs`
  directly, not just parse the summary text — and gives the audit viewer
  a way to show provenance for AI-generated content, not just human
  actions.

- **No Redis in this build; session revocation via DB + tokenVersion.**
  Sufficient at this scale. Redis would help with session cache and rate
  limiting in production — noted as a limitation, not silently omitted.

- **Digest delivery via a cron-triggered endpoint rather than a real job
  queue.** BullMQ/similar would be the production choice for retries and
  backpressure; a cron endpoint is enough to demonstrate "computed on a
  schedule, not on page load," which is the actual requirement being
  tested.

## Questions I expect in the interview (and my answers)

- *"Walk me through what happens when I hit `/api/tickets/123` with
  someone else's ticket ID."* → traced through `getTicketScoped` in
  `lib/authz/withOrgScope.ts`: single `findFirst` with an `OR` of
  (owned by activeOrgId) or (explicitly shared with activeOrgId/userId);
  no match → generic `ForbiddenError` → route handler returns 404.

- *"How do you know the audit log can't be tampered with by the app
  itself?"* → Postgres `REVOKE UPDATE, DELETE ... FROM app_runtime`; the
  app's own DB credentials physically cannot modify existing rows,
  independent of application code correctness.

- *"What's the difference between a shared ticket and a normal one, from
  the query's perspective?"* → None at the read layer — both resolve
  through the same `getTicketScoped` OR clause. They diverge at the
  mutation layer: shared access only ever reaches
  `commentOnSharedOrOwnedTicket`, never `updateTicketScoped`.

- *"If you had another week, what's the first thing you'd change?"* →
  Split Identity into a real separate service; move digest delivery to a
  proper job queue; add Redis for session cache and rate limiting.
