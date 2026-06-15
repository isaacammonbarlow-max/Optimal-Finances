import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/crypto";
import type { AuthContext } from "@/lib/auth-helpers";

export async function getHouseholdMembers(householdId: string) {
  return prisma.householdMember.findMany({
    where: { householdId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { joinedAt: "asc" },
  });
}

export async function createHouseholdInvite(
  ctx: AuthContext,
  email?: string,
  role = "MEMBER"
) {
  const token = generateToken(24);
  const invite = await prisma.householdInvite.create({
    data: {
      householdId: ctx.householdId,
      email: email?.toLowerCase().trim() || null,
      token,
      role,
      invitedById: ctx.userId,
      expiresAt: addDays(new Date(), 7),
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return {
    invite,
    inviteUrl: `${baseUrl}/invite/${token}`,
  };
}

export async function acceptHouseholdInvite(token: string, userId: string) {
  const invite = await prisma.householdInvite.findUnique({
    where: { token },
    include: { household: true },
  });

  if (!invite) throw new Error("Invite not found");
  if (invite.acceptedAt) throw new Error("Invite already used");
  if (invite.expiresAt < new Date()) throw new Error("Invite expired");

  const existing = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: { householdId: invite.householdId, userId },
    },
  });

  if (existing) {
    await prisma.householdInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
    return invite.household;
  }

  await prisma.$transaction([
    prisma.householdMember.create({
      data: {
        householdId: invite.householdId,
        userId,
        role: invite.role,
      },
    }),
    prisma.householdInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  return invite.household;
}
