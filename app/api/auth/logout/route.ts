import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/identity/auth";
import { logAudit } from "@/lib/audit/audit";

export async function POST(req: Request) {
  const session = await getSessionContext(prisma, req);

  if (session) {
    await logAudit(prisma, {
      orgId: session.activeOrgId,
      actorId: session.userId,
      action: "LOGOUT",
      entityType: "USER_SESSION",
      entityId: session.userId,
    });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete("session_token");
  return response;
}
