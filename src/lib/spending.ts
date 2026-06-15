import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
} from "date-fns";
import { prisma } from "@/lib/prisma";

export type SpendingPeriod = "day" | "week" | "month" | "year";

export function normalizePeriod(period: string): SpendingPeriod {
  const map: Record<string, SpendingPeriod> = {
    day: "day",
    daily: "day",
    week: "week",
    weekly: "week",
    month: "month",
    monthly: "month",
    year: "year",
    yearly: "year",
  };
  return map[period.toLowerCase()] ?? "month";
}

export function getPeriodRange(period: SpendingPeriod, reference = new Date()) {
  switch (period) {
    case "day":
      return { start: startOfDay(reference), end: endOfDay(reference) };
    case "week":
      return {
        start: startOfWeek(reference, { weekStartsOn: 0 }),
        end: endOfWeek(reference, { weekStartsOn: 0 }),
      };
    case "month":
      return { start: startOfMonth(reference), end: endOfMonth(reference) };
    case "year":
      return { start: startOfYear(reference), end: endOfYear(reference) };
  }
}

export async function getSpendingSummary(householdId: string) {
  const now = new Date();
  const periods: SpendingPeriod[] = ["day", "week", "month", "year"];

  const totals = await Promise.all(
    periods.map(async (period) => {
      const { start, end } = getPeriodRange(period, now);
      const [receipts, bank] = await Promise.all([
        prisma.receipt.aggregate({
          where: {
            householdId,
            purchaseDate: { gte: start, lte: end },
            scanStatus: "PROCESSED",
          },
          _sum: { totalAmount: true },
          _count: true,
        }),
        prisma.transaction.aggregate({
          where: {
            householdId,
            source: "BANK",
            type: "EXPENSE",
            date: { gte: start, lte: end },
          },
          _sum: { amount: true },
        }),
      ]);
      return {
        period,
        total: (receipts._sum.totalAmount ?? 0) + (bank._sum.amount ?? 0),
        receiptCount: receipts._count,
      };
    })
  );

  return totals;
}

export async function getCategorySpending(householdId: string, period: SpendingPeriod) {
  const { start, end } = getPeriodRange(period);
  const receipts = await prisma.receipt.findMany({
    where: {
      householdId,
      purchaseDate: { gte: start, lte: end },
      scanStatus: "PROCESSED",
    },
    include: { category: true },
  });

  const byCategory = new Map<string, { name: string; color: string; total: number }>();

  for (const receipt of receipts) {
    const key = receipt.categoryId ?? "uncategorized";
    const name = receipt.category?.name ?? "Uncategorized";
    const color = receipt.category?.color ?? "#6b7280";
    const existing = byCategory.get(key) ?? { name, color, total: 0 };
    existing.total += receipt.totalAmount;
    byCategory.set(key, existing);
  }

  return Array.from(byCategory.values()).sort((a, b) => b.total - a.total);
}

export async function getLineItemSpending(
  householdId: string,
  lineItemName: string,
  period: SpendingPeriod
) {
  const { start, end } = getPeriodRange(period);
  const normalized = lineItemName.toLowerCase();

  const items = await prisma.lineItem.findMany({
    where: {
      receipt: {
        householdId,
        purchaseDate: { gte: start, lte: end },
        scanStatus: "PROCESSED",
      },
      OR: [
        { name: { contains: lineItemName, mode: "insensitive" } },
        { subcategory: { contains: normalized, mode: "insensitive" } },
      ],
    },
    include: { receipt: true },
  });

  return {
    name: lineItemName,
    period,
    total: items.reduce((sum, item) => sum + item.amount, 0),
    count: items.length,
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      date: item.receipt.purchaseDate,
      merchant: item.receipt.merchantName,
    })),
  };
}

export async function getTrackedLineItemSummaries(userId: string, householdId: string) {
  const tracked = await prisma.trackedLineItem.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  const periods: SpendingPeriod[] = ["day", "week", "month", "year"];
  return Promise.all(
    tracked.map(async (item) => ({
      name: item.name,
      periods: await Promise.all(
        periods.map(async (period) => {
          const data = await getLineItemSpending(householdId, item.name, period);
          return { period, total: data.total, count: data.count };
        })
      ),
    }))
  );
}

export async function getRecentReceipts(householdId: string, limit = 8) {
  return prisma.receipt.findMany({
    where: { householdId },
    include: { category: true, lineItems: true, user: { select: { name: true, email: true } } },
    orderBy: { purchaseDate: "desc" },
    take: limit,
  });
}

export async function getNetWorthSummary(householdId: string) {
  const [assets, debts, income] = await Promise.all([
    prisma.asset.aggregate({ where: { householdId }, _sum: { value: true } }),
    prisma.debt.aggregate({ where: { householdId }, _sum: { balance: true } }),
    prisma.paystub.aggregate({
      where: {
        householdId,
        payDate: { gte: subDays(new Date(), 30) },
      },
      _sum: { netPay: true },
    }),
  ]);

  const totalAssets = assets._sum.value ?? 0;
  const totalDebts = debts._sum.balance ?? 0;

  return {
    totalAssets,
    totalDebts,
    netWorth: totalAssets - totalDebts,
    incomeLast30Days: income._sum.netPay ?? 0,
  };
}
