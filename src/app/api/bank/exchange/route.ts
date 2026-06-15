import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-helpers";
import { linkBankAccount } from "@/lib/bank-sync";
import { isPlaidConfigured } from "@/lib/plaid";
import { runSpendingAlerts } from "@/lib/alerts";

export async function POST(request: NextRequest) {
  return withAuth(async (ctx) => {
    if (!isPlaidConfigured()) {
      return NextResponse.json({ error: "Bank sync not configured" }, { status: 503 });
    }

    const { publicToken, institutionId } = await request.json();
    if (!publicToken) {
      return NextResponse.json({ error: "publicToken required" }, { status: 400 });
    }

    try {
      const connection = await linkBankAccount(ctx, publicToken, institutionId);
      void runSpendingAlerts(ctx).catch(console.error);
      return NextResponse.json({ connection });
    } catch (error) {
      console.error(error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to link bank" },
        { status: 500 }
      );
    }
  });
}
