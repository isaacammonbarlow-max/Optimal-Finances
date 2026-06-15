import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-helpers";
import { createHouseholdInvite, getHouseholdMembers } from "@/lib/household";

export async function GET() {
  return withAuth(async (ctx) => {
    const [household, members, invites] = await Promise.all([
      prisma.household.findUnique({ where: { id: ctx.householdId } }),
      getHouseholdMembers(ctx.householdId),
      prisma.householdInvite.findMany({
        where: { householdId: ctx.householdId, acceptedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return NextResponse.json({ household, members, invites, role: ctx.role });
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async (ctx) => {
    if (ctx.role !== "OWNER" && ctx.role !== "ADMIN") {
      return NextResponse.json({ error: "Only owners/admins can invite" }, { status: 403 });
    }
    const body = await request.json();
    const result = await createHouseholdInvite(ctx, body.email, body.role ?? "MEMBER");
    return NextResponse.json(result);
  });
}
