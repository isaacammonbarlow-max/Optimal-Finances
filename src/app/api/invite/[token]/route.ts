import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const invite = await prisma.householdInvite.findUnique({
    where: { token },
    include: { household: true, invitedBy: { select: { name: true, email: true } } },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.acceptedAt) {
    return NextResponse.json({ error: "Invite already used" }, { status: 410 });
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invite expired" }, { status: 410 });
  }

  return NextResponse.json({
    householdName: invite.household.name,
    invitedBy: invite.invitedBy.name ?? invite.invitedBy.email,
    email: invite.email,
    expiresAt: invite.expiresAt,
  });
}
