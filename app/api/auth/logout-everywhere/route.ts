import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getSessionContext } from "../../../../lib/identity/auth";
import { logAudit } from "../../../../lib/audit/audit";

export async function POST(req: Request) {
  const session = await getSessionContext(prisma, req);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updatedUser = await prisma.user.update({
    where: { id: session.userId },
    data: { tokenVersion: { increment: 1 } },
  });

  await prisma.session.deleteMany({
    where: { userId: session.userId },
  });

  await logAudit(prisma, {
    orgId: session.activeOrgId,
    actorId: session.userId,
    action: "LOGOUT_EVERYWHERE",
    entityType: "USER_SESSION",
    entityId: session.userId,
    metadata: { newVersion: updatedUser.tokenVersion },
  });

  const response = NextResponse.json({
    success: true,
    message: "Logged out everywhere successfully.",
  });

  response.cookies.delete("session_token");
  return response;
}
