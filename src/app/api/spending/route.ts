import { NextRequest, NextResponse } from "next/server";
import { getLineItemSpending, getSpendingSummary, type SpendingPeriod } from "@/lib/spending";
import { withAuth } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  return withAuth(async (ctx) => {
    const { searchParams } = new URL(request.url);
    const lineItem = searchParams.get("lineItem");
    const period = (searchParams.get("period") ?? "month") as SpendingPeriod;

    if (lineItem) {
      const data = await getLineItemSpending(ctx.householdId, lineItem, period);
      return NextResponse.json(data);
    }

    const summary = await getSpendingSummary(ctx.householdId);
    return NextResponse.json(summary);
  });
}
