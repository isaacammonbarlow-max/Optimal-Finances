import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-helpers";
import { getUnreadNotifications, runSpendingAlerts } from "@/lib/alerts";

export async function GET() {
  return withAuth(async (ctx) => {
    const [alerts, notifications] = await Promise.all([
      prisma.spendingAlert.findMany({
        where: { householdId: ctx.householdId },
        include: { category: true },
        orderBy: { createdAt: "desc" },
      }),
      getUnreadNotifications(ctx.userId),
    ]);
    return NextResponse.json({ alerts, notifications });
  });
}

export async function POST() {
  return withAuth(async (ctx) => {
    const triggered = await runSpendingAlerts(ctx);
    return NextResponse.json({ triggered });
  });
}
