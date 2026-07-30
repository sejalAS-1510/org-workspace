import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getSessionContext } from "../../../lib/identity/auth";
import { assertCan } from "../../../lib/authz/permissions";

export async function GET(req: Request) {
  const session = await getSessionContext(prisma, req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    assertCan(session.role as any, "audit:read:unified");

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || undefined;
    const entityType = url.searchParams.get("entityType") || undefined;
    const actorId = url.searchParams.get("actorId") || undefined;
    const startDate = url.searchParams.get("startDate") ? new Date(url.searchParams.get("startDate")!) : undefined;
    const endDate = url.searchParams.get("endDate") ? new Date(url.searchParams.get("endDate")!) : undefined;
    const format = url.searchParams.get("format");

    const where: any = {
      orgId: session.activeOrgId,
      ...(action ? { action } : {}),
      ...(entityType ? { entityType } : {}),
      ...(actorId ? { actorId } : {}),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
    };

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const parsedLogs = logs.map((log) => {
      let sourceRefs: string[] = [];
      try {
        sourceRefs = typeof log.sourceRefs === "string" ? JSON.parse(log.sourceRefs || "[]") : log.sourceRefs;
      } catch {
        sourceRefs = [];
      }
      return { ...log, sourceRefs };
    });

    if (format === "csv") {
      const csvHeader = "ID,OrgID,Timestamp,Action,EntityType,EntityID,Actor,SourceRefs\n";
      const csvRows = parsedLogs.map((log) => {
        const actor = log.actor ? log.actor.email : "SYSTEM";
        const refs = (log.sourceRefs || []).join(";");
        return `"${log.id}","${log.orgId}","${log.createdAt.toISOString()}","${log.action}","${log.entityType}","${log.entityId}","${actor}","${refs}"`;
      });

      const csvContent = csvHeader + csvRows.join("\n");
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="audit_logs_${session.activeOrgId}_${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({ logs: parsedLogs });
  } catch (err: any) {
    if (err.name === "ForbiddenError") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
