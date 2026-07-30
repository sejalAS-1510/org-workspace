/**
 * BOLA isolation test — "non-negotiable" per the assignment spec.
 * Run against a real (test) Postgres DB seeded via scripts/seed.ts,
 * not mocked, since the whole point is proving the query layer, not the
 * function signature.
 */

import { PrismaClient } from "@prisma/client";
import {
  getTicketScoped,
  updateTicketScoped,
  ForbiddenError,
} from "../lib/authz/withOrgScope";
import { describe, it, expect, beforeAll } from "vitest";

const prisma = new PrismaClient();

describe("Ticket isolation (BOLA)", () => {
  let acmeOrgId: string;
  let globexOrgId: string;
  let globexOnlyTicketId: string;
  let acmeGuestUserId: string; // a Globex user with no share into Acme

  beforeAll(async () => {
    // assumes scripts/seed.ts has run against the test DB
    const acme = await prisma.org.findUniqueOrThrow({ where: { slug: "acme" } });
    const globex = await prisma.org.findUniqueOrThrow({ where: { slug: "globex" } });
    acmeOrgId = acme.id;
    globexOrgId = globex.id;

    const privateTicket = await prisma.ticket.findFirstOrThrow({
      where: { orgId: globexOrgId, title: { contains: "Internal" } },
    });
    globexOnlyTicketId = privateTicket.id;

    const guest = await prisma.user.findUniqueOrThrow({
      where: { email: "guest@globex.test" },
    });
    acmeGuestUserId = guest.id;
  });

  it("rejects reading a foreign org's ticket by manipulated ID", async () => {
    const ctx = { userId: acmeGuestUserId, activeOrgId: globexOrgId, role: "CROSS_ORG_GUEST" as const };
    // Guest tries an ID from Acme they were never shared — not the shared one.
    const unsharedAcmeTicket = await prisma.ticket.findFirstOrThrow({
      where: { orgId: acmeOrgId, shares: { none: {} } },
    });

    await expect(getTicketScoped(prisma, ctx, unsharedAcmeTicket.id)).rejects.toThrow(ForbiddenError);
  });

  it("rejects updating a foreign org's ticket even with a valid-looking ID", async () => {
    const ctx = { userId: acmeGuestUserId, activeOrgId: globexOrgId, role: "CROSS_ORG_GUEST" as const };
    const unsharedAcmeTicket = await prisma.ticket.findFirstOrThrow({
      where: { orgId: acmeOrgId, shares: { none: {} } },
    });

    await expect(
      updateTicketScoped(prisma, ctx, unsharedAcmeTicket.id, { title: "hacked" })
    ).rejects.toThrow(ForbiddenError);
  });

  it("allows reading a ticket explicitly shared via TicketShare", async () => {
    const sharedTicket = await prisma.ticket.findFirstOrThrow({
      where: { shares: { some: { sharedWithOrgId: globexOrgId, revokedAt: null } } },
    });
    const ctx = { userId: acmeGuestUserId, activeOrgId: globexOrgId, role: "CROSS_ORG_GUEST" as const };

    const result = await getTicketScoped(prisma, ctx, sharedTicket.id);
    expect(result.id).toBe(sharedTicket.id);
  });

  it("does not leak the shared ticket's neighbors in the same org", async () => {
    // Guest must not be able to list/read any OTHER Acme ticket, only the
    // specifically shared one.
    const ctx = { userId: acmeGuestUserId, activeOrgId: globexOrgId, role: "CROSS_ORG_GUEST" as const };
    const otherAcmeTicket = await prisma.ticket.findFirstOrThrow({
      where: { orgId: acmeOrgId, shares: { none: {} } },
    });

    await expect(getTicketScoped(prisma, ctx, otherAcmeTicket.id)).rejects.toThrow(ForbiddenError);
  });
});
