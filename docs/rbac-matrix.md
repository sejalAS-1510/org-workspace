# Role-Based Access Control (RBAC) Permission Matrix

This document defines the system-wide permissions assigned to each organizational role across the **Support Hub (Dashboard 1)**, **Review & Audit Console (Dashboard 2)**, and **Platform Administration**.

---

## Permission Matrix

| Action / Permission | Org Admin | Support Agent | Reviewer / Approver | Cross-Org Guest | Platform Super Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Create Ticket** (`ticket:create`) | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Read Own-Org Tickets** (`ticket:read:own_org`) | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Read Shared Tickets** (`ticket:read:shared`) | — | — | — | ✅ | ❌ |
| **Update / Delete Tickets** (`ticket:update`, `ticket:delete`) | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Comment on Own-Org Tickets** (`ticket:comment:own_org`) | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Comment on Shared Tickets** (`ticket:comment:shared`) | — | — | — | ✅ | ❌ |
| **Share Ticket Cross-Org** (`ticket:share`) | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Create Pull Request** (`pr:create`) | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Review / Approve PR** (`pr:review`, `pr:approve`) | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Comment on Shared PR** (`pr:comment:shared`) | — | — | — | ✅ | ❌ |
| **Read Unified Audit Trail** (`audit:read:unified`) | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Manage Org Members & Feature Flags** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Request / Approve / Revoke Connection** | ✅ | ❌ | ❌ | ❌ | ✅ (Approve/Revoke) |
| **Platform Organization Management** | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Security Principles

1. **Item-Level Guest Scoping**:
   `Cross-Org Guest` permissions only apply to tickets or pull requests explicitly shared via `TicketShare` or `PRShare` join records. Guests are strictly isolated from all unshared tenant data.

2. **Platform Super Admin Boundaries**:
   `Platform Super Admin` is restricted to platform-level connections, tenant provisioning, and global platform auditing. It does not provide an un-audited backdoor into an organization's private tickets or code reviews.
