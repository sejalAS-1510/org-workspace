import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDigestForUser } from "@/lib/digest/generateDigest";

export async function POST(req: Request) {
  try {
    const memberships = await prisma.orgMembership.findMany({
      take: 50,
    });

    const results = [];
    for (const mem of memberships) {
      try {
        const digest = await generateDigestForUser(prisma, {
          userId: mem.userId,
          activeOrgId: mem.orgId,
        });

        await prisma.notification.create({
          data: {
            userId: mem.userId,
            title: "Scheduled AI Digest Ready",
            body: digest.summaryText,
          },
        });

        results.push({ userId: mem.userId, orgId: mem.orgId, digestId: digest.id });
      } catch (err) {
        console.error(`Error generating digest for user ${mem.userId}:`, err);
      }
    }

    return NextResponse.json({ success: true, processed: results.length, details: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
