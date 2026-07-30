import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/identity/auth";
import { logAudit } from "@/lib/audit/audit";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key-froncort-2026";

export async function POST(req: Request) {
  try {
    const { email, password, name, orgName, role } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    // Target organization name & role
    const targetOrgName = orgName?.trim() || "My Organization";
    const userRole = role || "ORG_ADMIN";

    // Always create a fresh unique organization for new user registrations
    const baseSlug = targetOrgName.toLowerCase().replace(/[^a-z0-9]/g, "") || "org";
    const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

    const org = await prisma.org.create({
      data: {
        name: targetOrgName,
        slug: uniqueSlug,
      },
    });

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        memberships: {
          create: {
            orgId: org.id,
            role: userRole,
          },
        },
      },
      include: {
        memberships: true,
      },
    });

    // Create audit log entry
    await logAudit(prisma, {
      orgId: org.id,
      actorId: newUser.id,
      action: "USER_REGISTERED",
      entityType: "User",
      entityId: newUser.id,
      metadata: { email: newUser.email, role: userRole, orgName: targetOrgName },
    });

    // Issue session JWT token
    const token = jwt.sign(
      {
        userId: newUser.id,
        activeOrgId: org.id,
        tokenVersion: newUser.tokenVersion,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        activeOrgId: org.id,
        orgName: org.name,
        role: userRole,
        memberships: newUser.memberships.map((m) => ({ orgId: m.orgId, role: m.role, orgName: org.name })),
      },
    });

    response.cookies.set("froncort_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
