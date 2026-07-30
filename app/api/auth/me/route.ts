import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/identity/auth";

export async function GET(req: Request) {
  const session = await getSessionContext(prisma, req);

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { memberships: { include: { org: true } } },
  });

  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      activeOrgId: session.activeOrgId,
      role: session.role,
      orgName: session.orgName,
      memberships: user.memberships.map((m) => ({
        orgId: m.orgId,
        orgName: m.org.name,
        role: m.role,
      })),
    },
  });
}
