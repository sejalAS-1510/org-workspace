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
    assertCan(session.role, "ticket:share");
    const { sharedWithOrgId, sharedWithUserId } = await req.json();

    if (!sharedWithOrgId) {
      return NextResponse.json({ error: "sharedWithOrgId is required" }, { status: 400 });
    }

    const ticket = await prisma.ticket.findFirst({
      where: { id: params.id, orgId: session.activeOrgId },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const connection = await prisma.orgConnection.findFirst({
      where: {
        status: "APPROVED",
        OR: [
          { fromOrgId: session.activeOrgId, toOrgId: sharedWithOrgId },
          { fromOrgId: sharedWithOrgId, toOrgId: session.activeOrgId },
        ],
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "No active connection with partner organization" },
        { status: 400 }
      );
    }

    const share = await prisma.ticketShare.create({
      data: {
        ticketId: ticket.id,
        sharedWithOrgId,
        sharedWithUserId: sharedWithUserId || null,
        sharedById: session.userId,
      },
    });

    await logAudit(prisma, {
      orgId: session.activeOrgId,
      actorId: session.userId,
      action: "SHARE",
      entityType: "TICKET_SHARE",
      entityId: share.id,
      metadata: { ticketId: ticket.id, sharedWithOrgId, sharedWithUserId },
    });

    return NextResponse.json({ share }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
