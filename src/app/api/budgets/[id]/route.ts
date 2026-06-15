import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-helpers";
import { assertHouseholdRecord, resourceErrorResponse } from "@/lib/resource-access";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  return withAuth(async (ctx) => {
    try {
      const { id } = await params;
      const existing = await assertHouseholdRecord(
        ctx,
        await prisma.budgetGoal.findUnique({ where: { id } })
      );
      const body = await request.json();

      const goal = await prisma.budgetGoal.update({
        where: { id: existing.id },
        data: {
          name: body.name ?? existing.name,
          amount: body.amount != null ? Number(body.amount) : existing.amount,
          period: body.period ?? existing.period,
          lineItem: body.lineItem !== undefined ? body.lineItem : existing.lineItem,
          categoryId: body.categoryId !== undefined ? body.categoryId : existing.categoryId,
          isActive: body.isActive ?? existing.isActive,
        },
        include: { category: true },
      });

      return NextResponse.json(goal);
    } catch (error) {
      return resourceErrorResponse(error);
    }
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  return withAuth(async (ctx) => {
    try {
      const { id } = await params;
      await assertHouseholdRecord(ctx, await prisma.budgetGoal.findUnique({ where: { id } }));
      await prisma.budgetGoal.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    } catch (error) {
      return resourceErrorResponse(error);
    }
  });
}
