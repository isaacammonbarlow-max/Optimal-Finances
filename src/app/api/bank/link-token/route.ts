import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-helpers";
import { createLinkToken, formatPlaidError, isPlaidConfigured } from "@/lib/plaid";

export async function GET() {
  return withAuth(async (ctx) => {
    if (!isPlaidConfigured()) {
      return NextResponse.json(
        {
          error:
            "Plaid is not configured. Add PLAID_CLIENT_ID and PLAID_SECRET to your .env file (sandbox keys from dashboard.plaid.com).",
          configured: false,
        },
        { status: 503 }
      );
    }

    try {
      const linkToken = await createLinkToken(ctx.userId);
      return NextResponse.json({ linkToken, configured: true });
    } catch (error) {
      console.error("Plaid link token error:", error);
      return NextResponse.json(
        { error: formatPlaidError(error), configured: true },
        { status: 500 }
      );
    }
  });
}
