import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword, createJWT } from "@/lib/identity/auth";
import { logAudit } from "@/lib/audit/audit";

export async function POST(req: Request) {
  try {
    const { email, password, orgId } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        memberships: {
          include: { org: true },
        },
      },
    });

    // Auto-seed default test accounts if fresh cloud DB has 0 users
    if (!user) {
      try {
        const userCount = await prisma.user.count();
        if (userCount === 0) {
          console.log("⚡ Fresh database detected on cloud host. Auto-seeding test accounts...");
          const passwordHash = await hashPassword("Passw0rd!");

          const acme = await prisma.org.create({ data: { name: "Acme Corp", slug: "acme" } });
          const globex = await prisma.org.create({ data: { name: "Globex Inc", slug: "globex" } });

          const admin = await prisma.user.create({
            data: { email: "admin@acme.test", name: "Ana Admin", passwordHash },
          });
          const agent = await prisma.user.create({
            data: { email: "agent@acme.test", name: "Sam Agent", passwordHash },
          });
          const reviewer = await prisma.user.create({
            data: { email: "reviewer@acme.test", name: "Rae Reviewer", passwordHash },
          });
          const guest = await prisma.user.create({
            data: { email: "guest@globex.test", name: "Gil Guest", passwordHash },
          });
          const superAdmin = await prisma.user.create({
            data: { email: "super@platform.test", name: "Pat SuperAdmin", passwordHash },
          });

          await prisma.orgMembership.createMany({
            data: [
              { userId: admin.id, orgId: acme.id, role: "ORG_ADMIN" },
              { userId: agent.id, orgId: acme.id, role: "SUPPORT_AGENT" },
              { userId: reviewer.id, orgId: acme.id, role: "REVIEWER_APPROVER" },
              { userId: guest.id, orgId: globex.id, role: "CROSS_ORG_GUEST" },
              { userId: superAdmin.id, orgId: acme.id, role: "PLATFORM_SUPER_ADMIN" },
            ],
          });

          await prisma.orgConnection.create({
            data: {
              fromOrgId: acme.id,
              toOrgId: globex.id,
              status: "APPROVED",
              requestedById: admin.id,
              respondedById: admin.id,
            },
          });

          user = await prisma.user.findUnique({
            where: { email: cleanEmail },
            include: { memberships: { include: { org: true } } },
          });
        }
      } catch (seedErr) {
        console.error("Auto-seed error:", seedErr);
      }
    }

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

    try {
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
    } catch (auditErr) {
      console.warn("Session/Audit logging warning:", auditErr);
    }

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
    console.error("Login API Error Detail:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
