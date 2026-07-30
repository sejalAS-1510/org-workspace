import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/identity/auth";
import { generateDigestForUser } from "@/lib/digest/generateDigest";

export async function GET(req: Request) {
  const session = await getSessionContext(prisma, req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const digest = await generateDigestForUser(prisma, {
      userId: session.userId,
      activeOrgId: session.activeOrgId,
    });
    return NextResponse.json({ digest });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to generate digest" }, { status: 500 });
  }
}
