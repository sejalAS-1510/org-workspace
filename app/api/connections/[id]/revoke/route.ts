import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getSessionContext } from "../../../../../lib/identity/auth";
import { assertCan } from "../../../../../lib/authz/permissions";
import { logAudit } from "../../../../../lib/audit/audit";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSessionContext(prisma, req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    assertCan(session.role, "org_connection:revoke");

    const connection = await prisma.orgConnection.findFirst({
      where: {
        id: params.id,
        OR: [{ toOrgId: session.activeOrgId }, { fromOrgId: session.activeOrgId }],
      },
    });

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    const updated = await prisma.orgConnection.update({
      where: { id: connection.id },
      data: {
        status: "REVOKED",
        respondedById: session.userId,
      },
    });

    const partnerOrgId =
      connection.fromOrgId === session.activeOrgId ? connection.toOrgId : connection.fromOrgId;

    await prisma.ticketShare.updateMany({
      where: {
        sharedWithOrgId: partnerOrgId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    await prisma.pRShare.updateMany({
      where: {
        sharedWithOrgId: partnerOrgId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    await logAudit(prisma, {
      orgId: session.activeOrgId,
      actorId: session.userId,
      action: "CONNECTION_REVOKE",
      entityType: "ORG_CONNECTION",
      entityId: updated.id,
    });

    return NextResponse.json({ connection: updated });
  } catch (err: any) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
