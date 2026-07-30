/**
 * "AI summaries must never leak cross-org data" — required dedicated test.
 *
 * Strategy: seed a second org with obviously distinctive private data,
 * generate a digest for a user in the FIRST org, and assert the distinctive
 * string appears nowhere — not in the digest text, and not in the
 * AuditLog's sourceRefs for the DIGEST_GENERATED entry (belt and suspenders:
 * a leak could show up in either place).
 */

import { PrismaClient } from "@prisma/client";
import { describe, it, expect, beforeAll } from "vitest";
import { generateDigestForUser } from "../lib/digest/generateDigest"; // implement alongside this test

const prisma = new PrismaClient();

const CANARY_TITLE = "ZZZ-CANARY-Globex-only-secret-project";

describe("AI digest cross-org isolation", () => {
  let acmeOrgId: string;
  let acmeUserId: string;

  beforeAll(async () => {
    const acme = await prisma.org.findUniqueOrThrow({ where: { slug: "acme" } });
    const globex = await prisma.org.findUniqueOrThrow({ where: { slug: "globex" } });
    acmeOrgId = acme.id;

    const acmeAdmin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@acme.test" } });
    acmeUserId = acmeAdmin.id;

    // Distinctive, unshared record in the OTHER org.
    const globexGuest = await prisma.user.findUniqueOrThrow({ where: { email: "guest@globex.test" } });
    await prisma.ticket.create({
      data: {
        orgId: globex.id,
        title: CANARY_TITLE,
        description: "If this appears in an Acme digest, isolation is broken.",
        status: "OPEN",
        createdById: globexGuest.id,
      },
    });
  });

  it("never includes canary data from another org in the digest text", async () => {
    const digest = await generateDigestForUser(prisma, { userId: acmeUserId, activeOrgId: acmeOrgId });
    expect(digest.summaryText).not.toContain(CANARY_TITLE);
  });

  it("never includes canary record IDs in the digest's audit sourceRefs", async () => {
    const digest = await generateDigestForUser(prisma, { userId: acmeUserId, activeOrgId: acmeOrgId });

    const canaryTicket = await prisma.ticket.findFirstOrThrow({ where: { title: CANARY_TITLE } });
    const auditEntry = await prisma.auditLog.findFirstOrThrow({
      where: { action: "DIGEST_GENERATED", entityId: digest.id },
    });

    expect(auditEntry.sourceRefs).not.toContain(canaryTicket.id);
  });
});
