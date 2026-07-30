import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getSessionContext } from "../../../lib/identity/auth";
import { listPRsScoped } from "../../../lib/authz/withOrgScope";
import { assertCan } from "../../../lib/authz/permissions";
import { logAudit } from "../../../lib/audit/audit";

export async function GET(req: Request) {
  const session = await getSessionContext(prisma, req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || undefined;

  try {
    const prs = await listPRsScoped(prisma, session, { status });
    return NextResponse.json({ prs });
  } catch (err: any) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function POST(req: Request) {
  const session = await getSessionContext(prisma, req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    assertCan(session.role, "pr:create");
    const { title, description, requiredApprovals, reviewerUserIds } = await req.json();

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description required" }, { status: 400 });
    }

    const pr = await prisma.pR.create({
      data: {
        orgId: session.activeOrgId,
        title,
        description,
        authorId: session.userId,
        status: "DRAFT",
        requiredApprovals: Number(requiredApprovals) || 1,
      },
    });

    if (Array.isArray(reviewerUserIds) && reviewerUserIds.length > 0) {
      await prisma.pRReviewer.createMany({
        data: reviewerUserIds.map((userId: string) => ({
          prId: pr.id,
          userId,
        })),
      });
    }

    await logAudit(prisma, {
      orgId: session.activeOrgId,
      actorId: session.userId,
      action: "CREATE",
      entityType: "PR",
      entityId: pr.id,
      metadata: { title, status: pr.status },
    });

    return NextResponse.json({ pr }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
