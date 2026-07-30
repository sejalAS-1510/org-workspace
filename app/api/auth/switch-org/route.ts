import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionContext, createJWT } from "@/lib/identity/auth";

export async function POST(req: Request) {
  const session = await getSessionContext(prisma, req);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { targetOrgId } = await req.json();

  if (!targetOrgId) {
    return NextResponse.json({ error: "targetOrgId is required" }, { status: 400 });
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.userId },
    include: { memberships: { include: { org: true } } },
  });

  const membership = user.memberships.find((m) => m.orgId === targetOrgId);

  if (!membership && session.role !== "PLATFORM_SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden: Not a member of target organization" }, { status: 403 });
  }

  const newOrgName = membership ? membership.org.name : "Platform SuperAdmin Scope";
  const newRole = membership ? membership.role : "PLATFORM_SUPER_ADMIN";

  const newToken = createJWT({
    userId: user.id,
    activeOrgId: targetOrgId,
    tokenVersion: user.tokenVersion,
  });

  const response = NextResponse.json({
    success: true,
    token: newToken,
    activeOrgId: targetOrgId,
    orgName: newOrgName,
    role: newRole,
  });

  response.cookies.set("session_token", newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return response;
}
