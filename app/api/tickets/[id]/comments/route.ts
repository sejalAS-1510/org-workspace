import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getSessionContext } from "../../../../../lib/identity/auth";
import { commentOnSharedOrOwnedTicket } from "../../../../../lib/authz/withOrgScope";
import { logAudit } from "../../../../../lib/audit/audit";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSessionContext(prisma, req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { body } = await req.json();
    if (!body || typeof body !== "string") {
      return NextResponse.json({ error: "Comment body required" }, { status: 400 });
    }

    const comment = await commentOnSharedOrOwnedTicket(prisma, session, params.id, body);

    await logAudit(prisma, {
      orgId: session.activeOrgId,
      actorId: session.userId,
      action: "CREATE",
      entityType: "TICKET_COMMENT",
      entityId: comment.id,
      metadata: { ticketId: params.id },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
