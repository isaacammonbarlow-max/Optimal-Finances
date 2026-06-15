import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-helpers";
import { buildFinanceCsv, buildFinancePdf, buildGoogleSheetsUrl } from "@/lib/export";
import { getNetWorthSummary } from "@/lib/spending";

export async function GET(request: NextRequest) {
  return withAuth(async (ctx) => {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") ?? "csv";

    const [receipts, paystubs, debts, assets, netWorth] = await Promise.all([
      prisma.receipt.findMany({
        where: { householdId: ctx.householdId },
        include: { category: true, lineItems: true },
        orderBy: { purchaseDate: "desc" },
      }),
      prisma.paystub.findMany({
        where: { householdId: ctx.householdId },
        orderBy: { payDate: "desc" },
      }),
      prisma.debt.findMany({ where: { householdId: ctx.householdId } }),
      prisma.asset.findMany({ where: { householdId: ctx.householdId } }),
      getNetWorthSummary(ctx.householdId),
    ]);

    const payload = { receipts, paystubs, debts, assets, netWorth: netWorth.netWorth };

    if (format === "pdf") {
      const pdf = buildFinancePdf(payload);
      return new NextResponse(Buffer.from(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="optimal-finances-report.pdf"',
        },
      });
    }

    if (format === "sheets") {
      const csv = buildFinanceCsv({ receipts, paystubs, debts, assets });
      return NextResponse.json({ url: buildGoogleSheetsUrl(csv), csv });
    }

    const csv = buildFinanceCsv({ receipts, paystubs, debts, assets });
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="optimal-finances-export.csv"',
      },
    });
  });
}
