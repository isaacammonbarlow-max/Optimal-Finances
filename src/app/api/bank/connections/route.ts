import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-helpers";
import { getUserBankConnections, syncBankConnection } from "@/lib/bank-sync";
import { runSpendingAlerts } from "@/lib/alerts";

export async function GET() {
  return withAuth(async (ctx) => {
    const connections = await getUserBankConnections(ctx.userId);
    return NextResponse.json(connections);
  });
}

export async function POST() {
  return withAuth(async (ctx) => {
    const connections = await getUserBankConnections(ctx.userId);
    for (const conn of connections) {
      await syncBankConnection(conn.id, ctx);
    }
    void runSpendingAlerts(ctx).catch(console.error);
    return NextResponse.json({ synced: connections.length });
  });
}
