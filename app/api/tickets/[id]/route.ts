import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getSessionContext } from "../../../../lib/identity/auth";
import { getTicketScoped, updateTicketScoped } from "../../../../lib/authz/withOrgScope";
import { assertCan } from "../../../../lib/authz/permissions";
import { logAudit } from "../../../../lib/audit/audit";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSessionContext(prisma, req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const ticket = await getTicketScoped(prisma, session, params.id);
    return NextResponse.json({ ticket });
  } catch (err: any) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSessionContext(prisma, req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    assertCan(session.role, "ticket:update");
    const body = await req.json();

    const updated = await updateTicketScoped(prisma, session, params.id, body);

    await logAudit(prisma, {
      orgId: session.activeOrgId,
      actorId: session.userId,
      action: body.status ? "STATUS_CHANGE" : "UPDATE",
      entityType: "TICKET",
      entityId: updated.id,
      metadata: { changes: body },
    });

    return NextResponse.json({ ticket: updated });
  } catch (err: any) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
