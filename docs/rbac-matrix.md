# RBAC Matrix

Source of truth is `lib/authz/permissions.ts` — this table is a readable
mirror of it. If they drift, the code wins; update this file to match.

| Permission                  | Org Admin | Support Agent | Reviewer/Approver | Cross-Org Guest | Platform Super Admin |
|------------------------------|:---:|:---:|:---:|:---:|:---:|
| Create ticket                | ✅ | ✅ | ❌ | ❌ | ❌ |
| Read own-org tickets         | ✅ | ✅ | ✅ | ❌ | ❌ |
| Read shared ticket           | — | — | — | ✅ | ❌ |
| Update / delete ticket       | ✅ | ✅ | ❌ | ❌ | ❌ |
| Comment on own-org ticket    | ✅ | ✅ | ✅ | ❌ | ❌ |
| Comment on shared ticket     | — | — | — | ✅ | ❌ |
| Share ticket cross-org       | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create PR                    | ✅ | ❌ | ❌ | ❌ | ❌ |
| Review / approve PR          | ❌ | ❌ | ✅ | ❌ | ❌ |
| Comment on shared PR         | — | — | — | ✅ | ❌ |
| Read unified audit trail     | ❌ | ❌ | ✅ | ❌ | ✅ |
| Manage org members           | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage feature flags         | ✅ | ❌ | ❌ | ❌ | ❌ |
| Request/approve/revoke connection | ✅ | ❌ | ❌ | ❌ | ✅ (approve/revoke) |
| Manage orgs (platform-wide)  | ❌ | ❌ | ❌ | ❌ | ✅ |

Notes:
- Cross-Org Guest permissions only ever apply to items explicitly shared
  with them — there is no "read all tickets" grant for this role, by
  design. See `TicketShare`/`PRShare` in the schema.
- Platform Super Admin is scoped to platform administration (orgs,
  connections, global settings) — it is deliberately **not** a backdoor
  into every org's ticket/PR content. If a support/debugging use case
  needs that later, it should be a separate, explicitly audited
  "impersonation" action, not a blanket permission.
