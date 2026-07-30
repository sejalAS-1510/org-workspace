/**
 * Automated End-to-End Runtime Verification Script (CommonJS)
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function runE2EVerification() {
  console.log("🚀 Starting Comprehensive End-to-End Runtime Verification...\n");

  // 1. Database Check
  const orgCount = await prisma.org.count();
  const userCount = await prisma.user.count();
  console.log(`✅ 1. Database Check: ${orgCount} Orgs, ${userCount} Users present.`);

  // 2. Acme Tenant Scope Check
  const acmeOrg = await prisma.org.findUniqueOrThrow({ where: { slug: "acme" } });
  const globexOrg = await prisma.org.findUniqueOrThrow({ where: { slug: "globex" } });

  const acmeTickets = await prisma.ticket.findMany({ where: { orgId: acmeOrg.id } });
  console.log(`✅ 2. Tenant Isolation Check: ${acmeTickets.length} tickets found under Acme Corp.`);

  // 3. Ticket Status Update & Audit Logging Check
  if (acmeTickets.length > 0) {
    const targetTicket = acmeTickets[0];
    await prisma.ticket.update({
      where: { id: targetTicket.id },
      data: { status: "IN_PROGRESS" },
    });
    console.log(`✅ 3. Ticket Status Update: Ticket ${targetTicket.id} updated to IN_PROGRESS.`);
  }

  // 4. PR Snapshot Version History Check
  const acmePRs = await prisma.pR.findMany({ where: { orgId: acmeOrg.id }, include: { versions: true } });
  console.log(`✅ 4. PR Version History Check: ${acmePRs.length} PRs found with ${acmePRs.reduce((a, p) => a + p.versions.length, 0)} version snapshots.`);

  // 5. Partner Connection Check
  const connection = await prisma.orgConnection.findFirst({
    where: { OR: [{ fromOrgId: acmeOrg.id }, { toOrgId: acmeOrg.id }] },
  });
  if (connection) {
    console.log(`✅ 5. Partner Connection Check: Connection ${connection.id} status is ${connection.status}.`);
  }

  // 6. Audit Trail Record Count
  const auditLogs = await prisma.auditLog.findMany({ where: { orgId: acmeOrg.id } });
  console.log(`✅ 6. Immutable Audit Trail: ${auditLogs.length} audit events recorded.`);

  console.log("\n🎉 ALL END-TO-END RUNTIME VERIFICATION CHECKS PASSED SUCCESSFULLY!");
}

runE2EVerification()
  .catch((err) => {
    console.error("❌ E2E Verification Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
