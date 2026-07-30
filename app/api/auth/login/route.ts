import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createJWT } from "@/lib/identity/auth";
import { logAudit } from "@/lib/audit/audit";

export async function POST(req: Request) {
  try {
    const { email, password, orgId } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        memberships: {
          include: { org: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const passwordValid = await verifyPassword(user.passwordHash, password);
    if (!passwordValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    let activeMembership = user.memberships[0];
    if (orgId) {
      const target = user.memberships.find((m) => m.orgId === orgId);
      if (target) activeMembership = target;
    }

    if (!activeMembership) {
      return NextResponse.json({ error: "User does not belong to any organization" }, { status: 403 });
    }

    const token = createJWT({
      userId: user.id,
      activeOrgId: activeMembership.orgId,
      tokenVersion: user.tokenVersion,
    });

    await prisma.session.create({
      data: {
        userId: user.id,
        activeOrgId: activeMembership.orgId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await logAudit(prisma, {
      orgId: activeMembership.orgId,
      actorId: user.id,
      action: "LOGIN",
      entityType: "USER_SESSION",
      entityId: user.id,
      metadata: { email: user.email, activeOrgId: activeMembership.orgId },
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        activeOrgId: activeMembership.orgId,
        role: activeMembership.role,
        orgName: activeMembership.org.name,
        memberships: user.memberships.map((m) => ({
          orgId: m.orgId,
          orgName: m.org.name,
          role: m.role,
        })),
      },
    });

    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
