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
        await prisma.asset.findUnique({ where: { id } })
      );
      const body = await request.json();

      const asset = await prisma.asset.update({
        where: { id: existing.id },
        data: {
          name: body.name ?? existing.name,
          type: body.type ?? existing.type,
          value: body.value != null ? Number(body.value) : existing.value,
          apr: body.apr != null ? Number(body.apr) : existing.apr,
          notes: body.notes ?? existing.notes,
        },
      });

      return NextResponse.json(asset);
    } catch (error) {
      return resourceErrorResponse(error);
    }
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  return withAuth(async (ctx) => {
    try {
      const { id } = await params;
      await assertHouseholdRecord(ctx, await prisma.asset.findUnique({ where: { id } }));
      await prisma.asset.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    } catch (error) {
      return resourceErrorResponse(error);
    }
  });
}
