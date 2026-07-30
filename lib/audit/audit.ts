import { PrismaClient } from "@prisma/client";

export async function logAudit(
  prisma: PrismaClient,
  params: {
    orgId: string;
    actorId?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: any;
    sourceRefs?: string[];
  }
) {
  const metadataStr = params.metadata ? JSON.stringify(params.metadata) : null;
  const sourceRefsStr = params.sourceRefs ? JSON.stringify(params.sourceRefs) : "[]";

  return prisma.auditLog.create({
    data: {
      orgId: params.orgId,
      actorId: params.actorId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: metadataStr,
      sourceRefs: sourceRefsStr,
    },
  });
}
