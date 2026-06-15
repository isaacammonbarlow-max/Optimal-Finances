import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-helpers";

export async function GET() {
  return withAuth(async (ctx) => {
    const goals = await prisma.budgetGoal.findMany({
      where: { householdId: ctx.householdId, isActive: true },
      include: { category: true, user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(goals);
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async (ctx) => {
    const body = await request.json();
    const goal = await prisma.budgetGoal.create({
      data: {
        householdId: ctx.householdId,
        userId: ctx.userId,
        name: body.name,
        amount: Number(body.amount),
        period: body.period ?? "MONTHLY",
        categoryId: body.categoryId || null,
        lineItem: body.lineItem || null,
      },
      include: { category: true },
    });
    return NextResponse.json(goal);
  });
}
