import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-helpers";
import {
  getCategorySpending,
  getNetWorthSummary,
  getSpendingSummary,
  getTrackedLineItemSummaries,
} from "@/lib/spending";
import { askTkogon } from "@/lib/tkogon/scanner";

export async function POST(request: NextRequest) {
  return withAuth(async (ctx) => {
    const { question } = await request.json();

    const [spending, netWorth, tracked, monthCategories] = await Promise.all([
      getSpendingSummary(ctx.householdId),
      getNetWorthSummary(ctx.householdId),
      getTrackedLineItemSummaries(ctx.userId, ctx.householdId),
      getCategorySpending(ctx.householdId, "month"),
    ]);

    const answer = await askTkogon(question, {
      spending,
      netWorth,
      trackedLineItems: tracked,
      topCategoriesThisMonth: monthCategories.slice(0, 5),
      recentReceipts: await prisma.receipt.findMany({
        where: { householdId: ctx.householdId },
        take: 5,
        orderBy: { purchaseDate: "desc" },
        include: { lineItems: true, category: true },
      }),
    });

    return NextResponse.json({ answer });
  });
}
