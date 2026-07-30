import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getSessionContext } from "../../../lib/identity/auth";
import { listTicketsScoped } from "../../../lib/authz/withOrgScope";
import { assertCan } from "../../../lib/authz/permissions";
import { logAudit } from "../../../lib/audit/audit";

export async function GET(req: Request) {
  const session = await getSessionContext(prisma, req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || undefined;

  try {
    const tickets = await listTicketsScoped(prisma, session, { status });
    return NextResponse.json({ tickets });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Not found" }, { status: 404 });
  }
}

export async function POST(req: Request) {
  const session = await getSessionContext(prisma, req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    assertCan(session.role, "ticket:create");
    const { title, description, assigneeId } = await req.json();

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description required" }, { status: 400 });
    }

    const ticket = await prisma.ticket.create({
      data: {
        orgId: session.activeOrgId,
        title,
        description,
        createdById: session.userId,
        assigneeId: assigneeId || session.userId,
        status: "OPEN",
      },
    });

    await logAudit(prisma, {
      orgId: session.activeOrgId,
      actorId: session.userId,
      action: "CREATE",
      entityType: "TICKET",
      entityId: ticket.id,
      metadata: { title, status: ticket.status },
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (err: any) {
    if (err.name === "ForbiddenError") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
