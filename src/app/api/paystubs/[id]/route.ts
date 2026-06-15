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
        await prisma.paystub.findUnique({ where: { id } })
      );
      const body = await request.json();

      const paystub = await prisma.paystub.update({
        where: { id: existing.id },
        data: {
          employerName: body.employerName ?? existing.employerName,
          payDate: body.payDate ? new Date(body.payDate) : existing.payDate,
          grossPay: body.grossPay != null ? Number(body.grossPay) : existing.grossPay,
          netPay: body.netPay != null ? Number(body.netPay) : existing.netPay,
          federalTax: body.federalTax != null ? Number(body.federalTax) : existing.federalTax,
          stateTax: body.stateTax != null ? Number(body.stateTax) : existing.stateTax,
        },
      });

      return NextResponse.json(paystub);
    } catch (error) {
      return resourceErrorResponse(error);
    }
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  return withAuth(async (ctx) => {
    try {
      const { id } = await params;
      await assertHouseholdRecord(ctx, await prisma.paystub.findUnique({ where: { id } }));
      await prisma.paystub.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    } catch (error) {
      return resourceErrorResponse(error);
    }
  });
}
