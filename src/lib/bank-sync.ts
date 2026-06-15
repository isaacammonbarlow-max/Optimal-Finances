import { format, subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";
import {
  exchangePublicToken,
  fetchAccounts,
  fetchTransactions,
  getInstitutionName,
} from "@/lib/plaid";
import { matchCategory } from "@/lib/tkogon/category-matcher";
import type { AuthContext } from "@/lib/auth-helpers";

export async function linkBankAccount(ctx: AuthContext, publicToken: string, institutionId?: string) {
  const { accessToken, itemId } = await exchangePublicToken(publicToken);

  let institutionName: string | null = null;
  if (institutionId) {
    try {
      institutionName = await getInstitutionName(institutionId);
    } catch {
      institutionName = null;
    }
  }

  const connection = await prisma.bankConnection.create({
    data: {
      userId: ctx.userId,
      plaidItemId: itemId,
      encryptedAccessToken: encrypt(accessToken),
      institutionId,
      institutionName,
    },
  });

  await syncBankConnection(connection.id, ctx);
  return connection;
}

export async function syncBankConnection(connectionId: string, ctx: AuthContext) {
  const connection = await prisma.bankConnection.findFirst({
    where: { id: connectionId, userId: ctx.userId },
    include: { accounts: true },
  });

  if (!connection) throw new Error("Bank connection not found");

  const { decrypt } = await import("@/lib/crypto");
  const accessToken = decrypt(connection.encryptedAccessToken);
  const plaidAccounts = await fetchAccounts(accessToken);

  for (const acct of plaidAccounts) {
    await prisma.bankAccount.upsert({
      where: { plaidAccountId: acct.account_id },
      create: {
        bankConnectionId: connection.id,
        plaidAccountId: acct.account_id,
        name: acct.name,
        officialName: acct.official_name,
        type: acct.type,
        subtype: acct.subtype,
        mask: acct.mask,
        currentBalance: acct.balances.current ?? 0,
        availableBalance: acct.balances.available,
        currency: acct.balances.iso_currency_code ?? "USD",
      },
      update: {
        currentBalance: acct.balances.current ?? 0,
        availableBalance: acct.balances.available,
      },
    });
  }

  const startDate = format(subDays(new Date(), 90), "yyyy-MM-dd");
  const endDate = format(new Date(), "yyyy-MM-dd");
  const transactions = await fetchTransactions(accessToken, startDate, endDate);
  const categories = await prisma.category.findMany({
    where: { householdId: ctx.householdId },
  });

  for (const txn of transactions) {
    const account = await prisma.bankAccount.findUnique({
      where: { plaidAccountId: txn.account_id },
    });
    if (!account) continue;

    const matched = matchCategory(categories, txn.merchant_name ?? txn.name, null);
    const amount = Math.abs(txn.amount);

    await prisma.bankTransaction.upsert({
      where: { plaidTxnId: txn.transaction_id },
      create: {
        bankAccountId: account.id,
        plaidTxnId: txn.transaction_id,
        amount,
        date: new Date(txn.date),
        name: txn.name,
        merchantName: txn.merchant_name,
        pending: txn.pending,
        categoryId: matched?.id,
      },
      update: {
        amount,
        pending: txn.pending,
        categoryId: matched?.id,
      },
    });

    if (!txn.pending && amount > 0) {
      await prisma.transaction.upsert({
        where: { externalId: txn.transaction_id },
        create: {
          householdId: ctx.householdId,
          userId: ctx.userId,
          categoryId: matched?.id,
          amount,
          description: txn.merchant_name ?? txn.name,
          date: new Date(txn.date),
          type: "EXPENSE",
          source: "BANK",
          externalId: txn.transaction_id,
        },
        update: {
          amount,
          categoryId: matched?.id,
        },
      });
    }
  }

  await prisma.bankConnection.update({
    where: { id: connection.id },
    data: { lastSyncedAt: new Date() },
  });
}

export async function getUserBankConnections(userId: string) {
  return prisma.bankConnection.findMany({
    where: { userId },
    include: {
      accounts: {
        include: { _count: { select: { transactions: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
