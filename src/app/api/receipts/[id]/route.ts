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
        await prisma.receipt.findUnique({ where: { id } })
      );
      const body = await request.json();

      const receipt = await prisma.receipt.update({
        where: { id: existing.id },
        data: {
          merchantName: body.merchantName ?? existing.merchantName,
          merchantAddress: body.merchantAddress ?? existing.merchantAddress,
          totalAmount: body.totalAmount != null ? Number(body.totalAmount) : existing.totalAmount,
          purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : existing.purchaseDate,
          categoryId: body.categoryId !== undefined ? body.categoryId : existing.categoryId,
          notes: body.notes ?? existing.notes,
        },
        include: { category: true, lineItems: true },
      });

      await prisma.transaction.updateMany({
        where: { receiptId: existing.id },
        data: {
          amount: receipt.totalAmount,
          description: receipt.merchantName ?? "Receipt purchase",
          date: receipt.purchaseDate,
          categoryId: receipt.categoryId,
        },
      });

      return NextResponse.json(receipt);
    } catch (error) {
      return resourceErrorResponse(error);
    }
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  return withAuth(async (ctx) => {
    try {
      const { id } = await params;
      await assertHouseholdRecord(ctx, await prisma.receipt.findUnique({ where: { id } }));
      await prisma.transaction.deleteMany({ where: { receiptId: id } });
      await prisma.receipt.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    } catch (error) {
      return resourceErrorResponse(error);
    }
  });
}
