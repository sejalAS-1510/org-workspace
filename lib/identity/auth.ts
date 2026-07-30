import jwt from "jsonwebtoken";
import * as argon2 from "argon2";
import { PrismaClient } from "@prisma/client";

export type OrgRole =
  | "ORG_ADMIN"
  | "SUPPORT_AGENT"
  | "REVIEWER_APPROVER"
  | "CROSS_ORG_GUEST"
  | "PLATFORM_SUPER_ADMIN";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key-froncort-2026";

export interface JWTPayload {
  userId: string;
  activeOrgId: string;
  tokenVersion: number;
}

export interface UserSessionContext {
  userId: string;
  activeOrgId: string;
  role: OrgRole;
  email: string;
  name: string;
  orgName: string;
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

export function createJWT(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function decodeJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Authenticates an HTTP request using Bearer Token or Cookie.
 * Validates user tokenVersion to support "logout everywhere".
 */
export async function getSessionContext(
  prisma: PrismaClient,
  req: Request
): Promise<UserSessionContext | null> {
  const authHeader = req.headers.get("authorization");
  let token: string | null = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    // Check Cookie header
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/session_token=([^;]+)/);
    if (match) {
      token = match[1];
    }
  }

  if (!token) return null;

  const payload = decodeJWT(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      memberships: {
        include: { org: true },
      },
    },
  });

  if (!user) return null;

  // Logout Everywhere Check: Token version must match user's tokenVersion in DB
  if (payload.tokenVersion !== user.tokenVersion) {
    return null;
  }

  // Check membership in activeOrgId
  const membership = user.memberships.find((m) => m.orgId === payload.activeOrgId);
  if (!membership) {
    // If activeOrgId is not a direct membership, check if user is PLATFORM_SUPER_ADMIN
    const superMembership = user.memberships.find((m) => m.role === "PLATFORM_SUPER_ADMIN");
    if (superMembership) {
      const targetOrg = await prisma.org.findUnique({ where: { id: payload.activeOrgId } });
      return {
        userId: user.id,
        activeOrgId: payload.activeOrgId,
        role: "PLATFORM_SUPER_ADMIN",
        email: user.email,
        name: user.name,
        orgName: targetOrg?.name || "Platform SuperAdmin Scope",
      };
    }
    return null;
  }

  return {
    userId: user.id,
    activeOrgId: membership.orgId,
    role: membership.role as OrgRole,
    email: user.email,
    name: user.name,
    orgName: membership.org.name,
  };
}
