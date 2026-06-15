import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-helpers";

export async function GET() {
  return withAuth(async (ctx) => {
    const debts = await prisma.debt.findMany({
      where: { householdId: ctx.householdId },
      orderBy: { balance: "desc" },
    });
    return NextResponse.json(debts);
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async (ctx) => {
    const body = await request.json();
    const debt = await prisma.debt.create({
      data: {
        householdId: ctx.householdId,
        userId: ctx.userId,
        name: body.name,
        type: body.type ?? "CREDIT_CARD",
        balance: Number(body.balance),
        apr: Number(body.apr),
        minimumPayment: body.minimumPayment ? Number(body.minimumPayment) : null,
        dueDay: body.dueDay ? Number(body.dueDay) : null,
        notes: body.notes,
      },
    });
    return NextResponse.json(debt);
  });
}
