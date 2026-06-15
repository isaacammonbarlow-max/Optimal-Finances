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
        await prisma.debt.findUnique({ where: { id } })
      );
      const body = await request.json();

      const debt = await prisma.debt.update({
        where: { id: existing.id },
        data: {
          name: body.name ?? existing.name,
          type: body.type ?? existing.type,
          balance: body.balance != null ? Number(body.balance) : existing.balance,
          apr: body.apr != null ? Number(body.apr) : existing.apr,
          minimumPayment:
            body.minimumPayment != null ? Number(body.minimumPayment) : existing.minimumPayment,
          dueDay: body.dueDay != null ? Number(body.dueDay) : existing.dueDay,
          notes: body.notes ?? existing.notes,
        },
      });

      return NextResponse.json(debt);
    } catch (error) {
      return resourceErrorResponse(error);
    }
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  return withAuth(async (ctx) => {
    try {
      const { id } = await params;
      await assertHouseholdRecord(ctx, await prisma.debt.findUnique({ where: { id } }));
      await prisma.debt.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    } catch (error) {
      return resourceErrorResponse(error);
    }
  });
}
