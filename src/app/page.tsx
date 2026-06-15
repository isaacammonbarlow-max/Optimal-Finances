import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { TrackedItemsPanel } from "@/components/dashboard/tracked-items-panel";
import { TkogonChat } from "@/components/tkogon/chat";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthError, requireAuth } from "@/lib/auth-helpers";
import { getUnreadNotifications } from "@/lib/alerts";
import { formatCurrency } from "@/lib/utils";
import {
  getCategorySpending,
  getNetWorthSummary,
  getRecentReceipts,
  getSpendingSummary,
  getTrackedLineItemSummaries,
} from "@/lib/spending";
import Link from "next/link";
import { Bell } from "lucide-react";

export default async function DashboardPage() {
  let ctx;
  try {
    ctx = await requireAuth();
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/api/auth/signout?callbackUrl=/login");
    }
    throw error;
  }
  const [spending, netWorth, tracked, categories, receipts, notifications] = await Promise.all([
    getSpendingSummary(ctx.householdId),
    getNetWorthSummary(ctx.householdId),
    getTrackedLineItemSummaries(ctx.userId, ctx.householdId),
    getCategorySpending(ctx.householdId, "month"),
    getRecentReceipts(ctx.householdId),
    getUnreadNotifications(ctx.userId),
  ]);

  return (
    <AppShell>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">Dashboard</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Your financial snapshot</h2>
          <p className="mt-2 max-w-2xl text-slate-400">
            Household-wide spending from receipts, bank sync, and custom categories.
          </p>
        </div>
        {notifications.length > 0 && (
          <Link
            href="/alerts"
            className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300"
          >
            <Bell className="h-4 w-4" />
            {notifications.length} TKOGON alert{notifications.length > 1 ? "s" : ""}
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Net worth</CardDescription>
            <CardTitle>{formatCurrency(netWorth.netWorth)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Assets</CardDescription>
            <CardTitle>{formatCurrency(netWorth.totalAssets)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Debts</CardDescription>
            <CardTitle>{formatCurrency(netWorth.totalDebts)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Income (30 days)</CardDescription>
            <CardTitle>{formatCurrency(netWorth.incomeLast30Days)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Spending overview</CardTitle>
            <CardDescription>Day, week, month, and year totals</CardDescription>
          </CardHeader>
          <CardContent>
            <SpendingChart data={spending} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>This month by category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categories.length === 0 ? (
              <p className="text-sm text-slate-400">Upload a receipt or link a bank to get started.</p>
            ) : (
              categories.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-slate-200">{cat.name}</span>
                  </div>
                  <span className="font-medium text-white">{formatCurrency(cat.total)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tracked line items</CardTitle>
            <CardDescription>Granular spending on items you care about</CardDescription>
          </CardHeader>
          <CardContent>
            <TrackedItemsPanel summaries={tracked} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <TkogonChat />
          <Card>
            <CardHeader>
              <CardTitle>Recent receipts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {receipts.length === 0 ? (
                <p className="text-sm text-slate-400">No receipts yet.</p>
              ) : (
                receipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="flex items-start justify-between rounded-xl bg-black/20 p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {receipt.merchantName ?? "Unknown merchant"}
                      </p>
                      <p className="text-slate-400">
                        {receipt.purchaseDate.toLocaleDateString()} ·{" "}
                        {receipt.category?.name ?? "Uncategorized"}
                      </p>
                    </div>
                    <span className="font-semibold text-emerald-300">
                      {formatCurrency(receipt.totalAmount)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
