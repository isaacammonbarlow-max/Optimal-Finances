import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getPeriodRange, normalizePeriod } from "@/lib/spending";
import { askTkogon } from "@/lib/tkogon/scanner";
import type { AuthContext } from "@/lib/auth-helpers";

export async function checkBudgetAlerts(ctx: AuthContext) {
  const goals = await prisma.budgetGoal.findMany({
    where: { householdId: ctx.householdId, isActive: true },
    include: { category: true },
  });

  const notifications: Array<{ title: string; message: string; alertId?: string }> = [];

  for (const goal of goals) {
    const period = normalizePeriod(goal.period);
    const { start, end } = getPeriodRange(period);

    let spent = 0;

    if (goal.lineItem) {
      const items = await prisma.lineItem.findMany({
        where: {
          name: { contains: goal.lineItem, mode: "insensitive" },
          receipt: {
            householdId: ctx.householdId,
            purchaseDate: { gte: start, lte: end },
            scanStatus: "PROCESSED",
          },
        },
      });
      spent = items.reduce((sum, i) => sum + i.amount, 0);
    } else if (goal.categoryId) {
      const agg = await prisma.receipt.aggregate({
        where: {
          householdId: ctx.householdId,
          categoryId: goal.categoryId,
          purchaseDate: { gte: start, lte: end },
          scanStatus: "PROCESSED",
        },
        _sum: { totalAmount: true },
      });
      spent = agg._sum.totalAmount ?? 0;
    } else {
      const agg = await prisma.transaction.aggregate({
        where: {
          householdId: ctx.householdId,
          type: "EXPENSE",
          date: { gte: start, lte: end },
        },
        _sum: { amount: true },
      });
      spent = agg._sum.amount ?? 0;
    }

    if (spent > goal.amount) {
      const overBy = spent - goal.amount;
      const message = await askTkogon(
        `Generate a brief spending alert: budget "${goal.name}" exceeded by $${overBy.toFixed(2)}. Spent $${spent.toFixed(2)} of $${goal.amount.toFixed(2)} ${goal.period.toLowerCase()}.`,
        { goal, spent, overBy }
      );

      let alert = await prisma.spendingAlert.findFirst({
        where: {
          householdId: ctx.householdId,
          type: "BUDGET_EXCEEDED",
          title: `Budget exceeded: ${goal.name}`,
        },
      });

      if (alert) {
        alert = await prisma.spendingAlert.update({
          where: { id: alert.id },
          data: { lastTriggeredAt: new Date() },
        });
      } else {
        alert = await prisma.spendingAlert.create({
          data: {
            householdId: ctx.householdId,
            userId: ctx.userId,
            categoryId: goal.categoryId,
            type: "BUDGET_EXCEEDED",
            title: `Budget exceeded: ${goal.name}`,
            threshold: goal.amount,
            lineItem: goal.lineItem,
            period: goal.period,
            lastTriggeredAt: new Date(),
          },
        });
      }

      notifications.push({
        title: alert.title,
        message,
        alertId: alert.id,
      });
    }
  }

  return notifications;
}

export async function checkLargeBankTransactions(ctx: AuthContext, threshold = 200) {
  const recent = await prisma.bankTransaction.findMany({
    where: {
      date: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      amount: { gte: threshold },
      bankAccount: { bankConnection: { userId: ctx.userId } },
    },
    include: { bankAccount: true },
    take: 10,
  });

  const notifications: Array<{ title: string; message: string; alertId?: string }> = [];

  for (const txn of recent) {
    const message = await askTkogon(
      `Alert user about a large bank transaction of $${txn.amount.toFixed(2)} at ${txn.merchantName ?? txn.name} on ${format(txn.date, "MMM d")}.`,
      { txn }
    );

    notifications.push({
      title: `Large transaction: $${txn.amount.toFixed(2)}`,
      message,
    });
  }

  return notifications;
}

export async function runSpendingAlerts(ctx: AuthContext) {
  const [budgetAlerts, bankAlerts] = await Promise.all([
    checkBudgetAlerts(ctx),
    checkLargeBankTransactions(ctx),
  ]);

  const all = [...budgetAlerts, ...bankAlerts];

  for (const n of all) {
    await prisma.alertNotification.create({
      data: {
        userId: ctx.userId,
        alertId: n.alertId,
        title: n.title,
        message: n.message,
      },
    });
  }

  return all;
}

export async function getUnreadNotifications(userId: string) {
  return prisma.alertNotification.findMany({
    where: { userId, read: false },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
