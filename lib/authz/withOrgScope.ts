/**
 * withOrgScope — the single choke point for tenant isolation.
 *
 * Rule: NO route handler or service function calls prisma.ticket.* or
 * prisma.pR.* directly. Everything goes through here. If a BOLA test ever
 * fails, this file is the first and only place to look.
 *
 * Two legitimate ways a request can reach a record outside ctx.activeOrgId:
 *   1. It doesn't — normal case, we just filter by orgId.
 *   2. An explicit, unrevoked TicketShare/PRShare row grants that specific
 *      user (or their org, for CROSS_ORG_GUEST invites) access to that
 *      specific record. Nothing else ever widens scope.
 */

import { PrismaClient, Ticket, PR, PRVersion } from "@prisma/client";

export type ReviewDecision = "PENDING" | "APPROVED" | "CHANGES_REQUESTED";

export interface RequestContext {
  userId: string;
  activeOrgId: string;
  role:
    | "ORG_ADMIN"
    | "SUPPORT_AGENT"
    | "REVIEWER_APPROVER"
    | "CROSS_ORG_GUEST"
    | "PLATFORM_SUPER_ADMIN";
}

export class ForbiddenError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "ForbiddenError";
  }
}

// ---------------------------------------------------------------------------
// Ticket Isolation & Queries
// ---------------------------------------------------------------------------

export async function getTicketScoped(
  prisma: PrismaClient,
  ctx: RequestContext,
  ticketId: string
): Promise<Ticket> {
  const ownedOrShared = await prisma.ticket.findFirst({
    where: {
      id: ticketId,
      OR: [
        { orgId: ctx.activeOrgId },
        {
          shares: {
            some: {
              revokedAt: null,
              sharedWithOrgId: ctx.activeOrgId,
              OR: [{ sharedWithUserId: ctx.userId }, { sharedWithUserId: null }],
            },
          },
        },
      ],
    },
    include: {
      comments: {
        include: { author: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
      attachments: true,
      shares: true,
    },
  });

  if (!ownedOrShared) {
    throw new ForbiddenError();
  }

  return ownedOrShared;
}

export async function listTicketsScoped(
  prisma: PrismaClient,
  ctx: RequestContext,
  filters: { status?: string } = {}
) {
  // Return tickets owned by active org PLUS tickets shared with this org/user
  return prisma.ticket.findMany({
    where: {
      OR: [
        {
          orgId: ctx.activeOrgId,
          ...(filters.status ? { status: filters.status as any } : {}),
        },
        {
          shares: {
            some: {
              revokedAt: null,
              sharedWithOrgId: ctx.activeOrgId,
              OR: [{ sharedWithUserId: ctx.userId }, { sharedWithUserId: null }],
            },
          },
          ...(filters.status ? { status: filters.status as any } : {}),
        },
      ],
    },
    include: {
      shares: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function updateTicketScoped(
  prisma: PrismaClient,
  ctx: RequestContext,
  ticketId: string,
  data: Partial<Pick<Ticket, "title" | "description" | "status" | "assigneeId">>
): Promise<Ticket> {
  const result = await prisma.ticket.updateMany({
    where: { id: ticketId, orgId: ctx.activeOrgId },
    data,
  });

  if (result.count === 0) {
    throw new ForbiddenError();
  }

  return prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
}

export async function commentOnSharedOrOwnedTicket(
  prisma: PrismaClient,
  ctx: RequestContext,
  ticketId: string,
  body: string
) {
  const ticket = await getTicketScoped(prisma, ctx, ticketId);

  return prisma.ticketComment.create({
    data: { ticketId: ticket.id, authorId: ctx.userId, body },
    include: { author: { select: { id: true, name: true, email: true } } },
  });
}

// ---------------------------------------------------------------------------
// PR Isolation & Queries
// ---------------------------------------------------------------------------

export async function getPRScoped(
  prisma: PrismaClient,
  ctx: RequestContext,
  prId: string
) {
  const ownedOrShared = await prisma.pR.findFirst({
    where: {
      id: prId,
      OR: [
        { orgId: ctx.activeOrgId },
        {
          shares: {
            some: {
              revokedAt: null,
              sharedWithOrgId: ctx.activeOrgId,
              OR: [{ sharedWithUserId: ctx.userId }, { sharedWithUserId: null }],
            },
          },
        },
      ],
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
      reviewers: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      versions: { orderBy: { versionNum: "asc" } },
      shares: true,
    },
  });

  if (!ownedOrShared) {
    throw new ForbiddenError();
  }

  return ownedOrShared;
}

export async function listPRsScoped(
  prisma: PrismaClient,
  ctx: RequestContext,
  filters: { status?: string } = {}
) {
  return prisma.pR.findMany({
    where: {
      OR: [
        {
          orgId: ctx.activeOrgId,
          ...(filters.status ? { status: filters.status as any } : {}),
        },
        {
          shares: {
            some: {
              revokedAt: null,
              sharedWithOrgId: ctx.activeOrgId,
              OR: [{ sharedWithUserId: ctx.userId }, { sharedWithUserId: null }],
            },
          },
          ...(filters.status ? { status: filters.status as any } : {}),
        },
      ],
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
      reviewers: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      versions: { orderBy: { versionNum: "asc" } },
      shares: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function updatePRScoped(
  prisma: PrismaClient,
  ctx: RequestContext,
  prId: string,
  data: Partial<Pick<PR, "title" | "description" | "status" | "requiredApprovals">>
): Promise<PR> {
  const existing = await prisma.pR.findFirst({
    where: { id: prId, orgId: ctx.activeOrgId },
    include: { versions: true },
  });

  if (!existing) {
    throw new ForbiddenError();
  }

  // Versioning requirement: If review has started (reviewStartedAt is set or status is IN_REVIEW/APPROVED/REJECTED),
  // snapshot current title & description into PRVersion BEFORE updating.
  if (existing.reviewStartedAt || existing.status !== "DRAFT") {
    const nextVersionNum = (existing.versions.length || 0) + 1;
    await prisma.pRVersion.create({
      data: {
        prId: existing.id,
        versionNum: nextVersionNum,
        title: existing.title,
        description: existing.description,
        snapshotOf: ctx.userId,
      },
    });
  }

  // Auto-set reviewStartedAt if transitioning to IN_REVIEW for the first time
  const reviewStartedAt =
    data.status === "IN_REVIEW" && !existing.reviewStartedAt
      ? new Date()
      : existing.reviewStartedAt;

  await prisma.pR.update({
    where: { id: prId },
    data: {
      ...data,
      reviewStartedAt,
    },
  });

  return getPRScoped(prisma, ctx, prId);
}

export async function reviewPRScoped(
  prisma: PrismaClient,
  ctx: RequestContext,
  prId: string,
  decision: ReviewDecision,
  comment?: string
) {
  const pr = await getPRScoped(prisma, ctx, prId);

  // Update or insert reviewer decision
  const existingReviewer = await prisma.pRReviewer.findUnique({
    where: { prId_userId: { prId: pr.id, userId: ctx.userId } },
  });

  if (existingReviewer) {
    await prisma.pRReviewer.update({
      where: { id: existingReviewer.id },
      data: { decision, comment, decidedAt: new Date() },
    });
  } else {
    await prisma.pRReviewer.create({
      data: { prId: pr.id, userId: ctx.userId, decision, comment, decidedAt: new Date() },
    });
  }

  // Check N-approvals rule: if total APPROVED reviewers >= requiredApprovals, auto-update PR status to APPROVED
  const updatedPR = await prisma.pR.findUniqueOrThrow({
    where: { id: pr.id },
    include: { reviewers: true },
  });

  const approvalCount = updatedPR.reviewers.filter((r) => r.decision === "APPROVED").length;
  if (approvalCount >= updatedPR.requiredApprovals && updatedPR.status === "IN_REVIEW") {
    await prisma.pR.update({
      where: { id: pr.id },
      data: { status: "APPROVED" },
    });
  } else if (decision === "CHANGES_REQUESTED" && updatedPR.status === "IN_REVIEW") {
    await prisma.pR.update({
      where: { id: pr.id },
      data: { status: "REJECTED" },
    });
  }

  return getPRScoped(prisma, ctx, prId);
}
