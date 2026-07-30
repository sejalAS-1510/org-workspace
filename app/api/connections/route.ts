import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/identity/auth";
import { assertCan } from "@/lib/authz/permissions";
import { logAudit } from "@/lib/audit/audit";

export async function GET(req: Request) {
  const session = await getSessionContext(prisma, req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const connections = await prisma.orgConnection.findMany({
    where: {
      OR: [{ fromOrgId: session.activeOrgId }, { toOrgId: session.activeOrgId }],
    },
    include: {
      fromOrg: { select: { id: true, name: true, slug: true } },
      toOrg: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ connections });
}

export async function POST(req: Request) {
  const session = await getSessionContext(prisma, req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    assertCan(session.role, "org_connection:request");
    const { toOrgSlug } = await req.json();

    if (!toOrgSlug) {
      return NextResponse.json({ error: "Target organization slug required" }, { status: 400 });
    }

    const targetOrg = await prisma.org.findFirst({
      where: {
        OR: [
          { slug: toOrgSlug.toLowerCase().trim() },
          { name: { contains: toOrgSlug.trim() } },
        ],
      },
    });

    if (!targetOrg) {
      return NextResponse.json({ error: `Target organization "${toOrgSlug}" not found.` }, { status: 404 });
    }

    if (targetOrg.id === session.activeOrgId) {
      return NextResponse.json({ error: "Cannot connect to your own organization." }, { status: 400 });
    }

    // Check for existing connection (handles revoked re-requests cleanly)
    const existingConn = await prisma.orgConnection.findFirst({
      where: {
        OR: [
          { fromOrgId: session.activeOrgId, toOrgId: targetOrg.id },
          { fromOrgId: targetOrg.id, toOrgId: session.activeOrgId },
        ],
      },
    });

    let connection;
    if (existingConn) {
      connection = await prisma.orgConnection.update({
        where: { id: existingConn.id },
        data: {
          fromOrgId: session.activeOrgId,
          toOrgId: targetOrg.id,
          status: "PENDING",
          requestedById: session.userId,
          respondedById: null,
        },
      });
    } else {
      connection = await prisma.orgConnection.create({
        data: {
          fromOrgId: session.activeOrgId,
          toOrgId: targetOrg.id,
          status: "PENDING",
          requestedById: session.userId,
        },
      });
    }

    await logAudit(prisma, {
      orgId: session.activeOrgId,
      actorId: session.userId,
      action: "CONNECTION_REQUEST",
      entityType: "ORG_CONNECTION",
      entityId: connection.id,
      metadata: { targetOrgId: targetOrg.id, targetOrgSlug: toOrgSlug },
    });

    return NextResponse.json({ connection }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Forbidden" }, { status: 403 });
  }
}
