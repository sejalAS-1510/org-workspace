import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/identity/auth";
import { reviewPRScoped } from "@/lib/authz/withOrgScope";
import { assertCan } from "@/lib/authz/permissions";
import { logAudit } from "@/lib/audit/audit";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSessionContext(prisma, req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    assertCan(session.role, "pr:approve");
    const { decision, comment } = await req.json();

    if (!decision || !["APPROVED", "CHANGES_REQUESTED"].includes(decision)) {
      return NextResponse.json({ error: "Valid decision required" }, { status: 400 });
    }

    const pr = await reviewPRScoped(prisma, session, params.id, decision, comment);

    await logAudit(prisma, {
      orgId: session.activeOrgId,
      actorId: session.userId,
      action: decision === "APPROVED" ? "APPROVE" : "REQUEST_CHANGES",
      entityType: "PR",
      entityId: params.id,
      metadata: { decision, comment },
    });

    return NextResponse.json({ pr });
  } catch (err: any) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
