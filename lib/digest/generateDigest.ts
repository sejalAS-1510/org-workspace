import { PrismaClient } from "@prisma/client";
import { logAudit } from "../audit/audit";

export interface GenerateDigestResult {
  id: string;
  userId: string;
  orgId: string;
  summaryText: string;
  ticketCount: number;
  prCount: number;
  createdAt: Date;
  sourceRefs: string[];
}

/**
 * generateDigestForUser
 * Generates a personalized AI digest strictly scoped to the activeOrgId + unrevoked shares.
 * Enforces cross-org isolation and audit trail traceability via sourceRefs.
 */
export async function generateDigestForUser(
  prisma: PrismaClient,
  params: { userId: string; activeOrgId: string }
): Promise<GenerateDigestResult> {
  const { userId, activeOrgId } = params;

  // 1. Fetch tickets scoped strictly to activeOrgId or explicitly shared with this org/user
  const tickets = await prisma.ticket.findMany({
    where: {
      OR: [
        { orgId: activeOrgId },
        {
          shares: {
            some: {
              revokedAt: null,
              sharedWithOrgId: activeOrgId,
              OR: [{ sharedWithUserId: userId }, { sharedWithUserId: null }],
            },
          },
        },
      ],
    },
    select: {
      id: true,
      title: true,
      status: true,
      assigneeId: true,
      createdAt: true,
    },
  });

  // 2. Fetch PRs scoped strictly to activeOrgId or explicitly shared with this org/user
  const prs = await prisma.pR.findMany({
    where: {
      OR: [
        { orgId: activeOrgId },
        {
          shares: {
            some: {
              revokedAt: null,
              sharedWithOrgId: activeOrgId,
              OR: [{ sharedWithUserId: userId }, { sharedWithUserId: null }],
            },
          },
        },
      ],
    },
    include: {
      reviewers: true,
    },
  });

  // 3. Filter relevant metrics for personalized summary
  const userTickets = tickets.filter((t) => t.assigneeId === userId || t.status === "OPEN");
  const openTickets = tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS");
  const prsNeedingReview = prs.filter(
    (pr) =>
      pr.status === "IN_REVIEW" &&
      pr.reviewers.some((r) => r.userId === userId && r.decision === "PENDING")
  );

  // 4. Collect sourceRefs (IDs of all records referenced)
  const ticketIds = tickets.map((t) => t.id);
  const prIds = prs.map((p) => p.id);
  const sourceRefs = [...ticketIds, ...prIds];

  // 5. Construct summary text
  const summaryParts: string[] = [
    `Personalized Digest for User (${userId}) in Org (${activeOrgId}):`,
    `- Total Active Tickets: ${openTickets.length}`,
    `- Tickets Assigned to You: ${userTickets.length}`,
    `- PRs Waiting for Your Review: ${prsNeedingReview.length}`,
  ];

  if (prsNeedingReview.length > 0) {
    summaryParts.push(`- Action Item: You have ${prsNeedingReview.length} PR(s) requiring review decision.`);
  } else {
    summaryParts.push(`- Action Item: All PR reviews up to date.`);
  }

  const summaryText = summaryParts.join("\n");
  const digestId = `digest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // 6. Record DIGEST_GENERATED in AuditLog with sourceRefs for provenance traceability
  await logAudit(prisma, {
    orgId: activeOrgId,
    actorId: userId,
    action: "DIGEST_GENERATED",
    entityType: "DIGEST",
    entityId: digestId,
    metadata: {
      ticketCount: tickets.length,
      prCount: prs.length,
      summaryText,
    },
    sourceRefs,
  });

  return {
    id: digestId,
    userId,
    orgId: activeOrgId,
    summaryText,
    ticketCount: tickets.length,
    prCount: prs.length,
    createdAt: new Date(),
    sourceRefs,
  };
}
