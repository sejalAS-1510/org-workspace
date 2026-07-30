/**
 * Universal Idempotent Database Seed Script (CommonJS)
 */

const { PrismaClient } = require("@prisma/client");
const argon2 = require("argon2");

const prisma = new PrismaClient();
const DEMO_PASSWORD = "Passw0rd!";

async function main() {
  const passwordHash = await argon2.hash(DEMO_PASSWORD);

  // Clean wipe for idempotent seeding
  await prisma.auditLog.deleteMany();
  await prisma.ticketComment.deleteMany();
  await prisma.ticketShare.deleteMany();
  await prisma.ticketAttachment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.pRVersion.deleteMany();
  await prisma.pRReviewer.deleteMany();
  await prisma.pRShare.deleteMany();
  await prisma.pR.deleteMany();
  await prisma.orgConnection.deleteMany();
  await prisma.orgMembership.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.org.deleteMany();

  const acme = await prisma.org.create({ data: { name: "Acme Corp", slug: "acme" } });
  const globex = await prisma.org.create({ data: { name: "Globex Inc", slug: "globex" } });

  const admin = await prisma.user.create({
    data: { email: "admin@acme.test", name: "Ana Admin", passwordHash },
  });
  const agent = await prisma.user.create({
    data: { email: "agent@acme.test", name: "Sam Agent", passwordHash },
  });
  const reviewer = await prisma.user.create({
    data: { email: "reviewer@acme.test", name: "Rae Reviewer", passwordHash },
  });
  const guest = await prisma.user.create({
    data: { email: "guest@globex.test", name: "Gil Guest", passwordHash },
  });
  const superAdmin = await prisma.user.create({
    data: { email: "super@platform.test", name: "Pat SuperAdmin", passwordHash },
  });

  await prisma.orgMembership.createMany({
    data: [
      { userId: admin.id, orgId: acme.id, role: "ORG_ADMIN" },
      { userId: agent.id, orgId: acme.id, role: "SUPPORT_AGENT" },
      { userId: reviewer.id, orgId: acme.id, role: "REVIEWER_APPROVER" },
      { userId: guest.id, orgId: globex.id, role: "CROSS_ORG_GUEST" },
      { userId: superAdmin.id, orgId: acme.id, role: "PLATFORM_SUPER_ADMIN" },
    ],
  });

  const connection = await prisma.orgConnection.create({
    data: {
      fromOrgId: acme.id,
      toOrgId: globex.id,
      status: "APPROVED",
      requestedById: admin.id,
      respondedById: admin.id,
    },
  });

  const ticket1 = await prisma.ticket.create({
    data: {
      orgId: acme.id,
      title: "Login page 500 error",
      description: "Users report intermittent 500s on /login since deploy.",
      status: "OPEN",
      createdById: agent.id,
      assigneeId: agent.id,
    },
  });

  await prisma.ticket.create({
    data: {
      orgId: acme.id,
      title: "Add dark mode toggle",
      description: "Feature request from three enterprise customers.",
      status: "IN_PROGRESS",
      createdById: agent.id,
    },
  });

  await prisma.ticket.create({
    data: {
      orgId: globex.id,
      title: "Internal: Q3 budget ticket",
      description: "Should never be visible to Acme.",
      status: "OPEN",
      createdById: guest.id,
    },
  });

  await prisma.ticketShare.create({
    data: {
      ticketId: ticket1.id,
      sharedWithOrgId: globex.id,
      sharedWithUserId: guest.id,
      sharedById: admin.id,
    },
  });

  const pr1 = await prisma.pR.create({
    data: {
      orgId: acme.id,
      title: "Fix login 500 error",
      description: "Adds null check on session middleware.",
      status: "IN_REVIEW",
      authorId: agent.id,
      requiredApprovals: 1,
      reviewStartedAt: new Date(),
    },
  });

  await prisma.pRReviewer.create({
    data: { prId: pr1.id, userId: reviewer.id },
  });

  console.log("Seed complete.");
  console.log({ acmeOrgId: acme.id, globexOrgId: globex.id, connectionId: connection.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
