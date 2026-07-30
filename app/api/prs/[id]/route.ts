import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/identity/auth";
import { getPRScoped, updatePRScoped } from "@/lib/authz/withOrgScope";
import { logAudit } from "@/lib/audit/audit";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSessionContext(prisma, req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const pr = await getPRScoped(prisma, session, params.id);
    return NextResponse.json({ pr });
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
    const body = await req.json();
    const updated = await updatePRScoped(prisma, session, params.id, body);

    await logAudit(prisma, {
      orgId: session.activeOrgId,
      actorId: session.userId,
      action: body.status ? "STATUS_CHANGE" : "UPDATE",
      entityType: "PR",
      entityId: updated.id,
      metadata: { changes: body },
    });

    return NextResponse.json({ pr: updated });
  } catch (err: any) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
