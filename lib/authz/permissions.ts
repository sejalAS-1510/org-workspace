/**
 * Central RBAC matrix. Middleware and route handlers check against this —
 * never hardcode a role check inline in a handler. Keep this file and
 * /docs/rbac-matrix.md in sync (the doc is generated from this, ideally
 * by a small script once you have time).
 */

export type Role =
  | "ORG_ADMIN"
  | "SUPPORT_AGENT"
  | "REVIEWER_APPROVER"
  | "CROSS_ORG_GUEST"
  | "PLATFORM_SUPER_ADMIN";

export type Permission =
  | "ticket:create"
  | "ticket:read:own_org"
  | "ticket:read:shared"
  | "ticket:update"
  | "ticket:delete"
  | "ticket:comment:own_org"
  | "ticket:comment:shared"
  | "ticket:share"
  | "pr:create"
  | "pr:review"
  | "pr:approve"
  | "pr:comment:shared"
  | "audit:read:unified"
  | "org:manage_members"
  | "org:manage_feature_flags"
  | "org_connection:request"
  | "org_connection:approve"
  | "org_connection:revoke"
  | "platform:manage_orgs";

const MATRIX: Record<Role, Permission[]> = {
  ORG_ADMIN: [
    "ticket:create",
    "ticket:read:own_org",
    "ticket:update",
    "ticket:delete",
    "ticket:comment:own_org",
    "ticket:share",
    "pr:create",
    "pr:review",
    "pr:approve",
    "audit:read:unified",
    "org:manage_members",
    "org:manage_feature_flags",
    "org_connection:request",
    "org_connection:approve",
    "org_connection:revoke",
  ],
  SUPPORT_AGENT: [
    "ticket:create",
    "ticket:read:own_org",
    "ticket:update",
    "ticket:comment:own_org",
    "pr:create",
  ],
  REVIEWER_APPROVER: [
    "ticket:read:own_org",
    "ticket:comment:own_org",
    "pr:create",
    "pr:review",
    "pr:approve",
    "audit:read:unified",
  ],
  CROSS_ORG_GUEST: ["ticket:read:shared", "ticket:comment:shared", "pr:comment:shared"],
  PLATFORM_SUPER_ADMIN: [
    "platform:manage_orgs",
    "org_connection:approve",
    "org_connection:revoke",
    "audit:read:unified",
  ],
};

export function can(role: Role, permission: Permission): boolean {
  return MATRIX[role]?.includes(permission) ?? false;
}

/** Throw-friendly variant for use at the top of route handlers. */
export function assertCan(role: Role, permission: Permission): void {
  if (!can(role, permission)) {
    const err = new Error("Not found");
    err.name = "ForbiddenError";
    throw err;
  }
}
