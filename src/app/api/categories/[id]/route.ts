import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-helpers";
import { assertHouseholdRecord, resourceErrorResponse } from "@/lib/resource-access";
import { parseJsonArray, toJsonArray } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  return withAuth(async (ctx) => {
    try {
      const { id } = await params;
      const existing = await assertHouseholdRecord(
        ctx,
        await prisma.category.findUnique({ where: { id } })
      );
      const body = await request.json();

      const category = await prisma.category.update({
        where: { id: existing.id },
        data: {
          name: body.name ?? existing.name,
          description: body.description,
          color: body.color ?? existing.color,
          merchantMatchers: body.merchantMatchers
            ? toJsonArray(body.merchantMatchers)
            : existing.merchantMatchers,
          addressMatchers: body.addressMatchers
            ? toJsonArray(body.addressMatchers)
            : existing.addressMatchers,
          isPinned: body.isPinned ?? existing.isPinned,
        },
      });

      return NextResponse.json({
        ...category,
        merchantMatchers: parseJsonArray(category.merchantMatchers),
        addressMatchers: parseJsonArray(category.addressMatchers),
      });
    } catch (error) {
      return resourceErrorResponse(error);
    }
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  return withAuth(async (ctx) => {
    try {
      const { id } = await params;
      await assertHouseholdRecord(ctx, await prisma.category.findUnique({ where: { id } }));
      await prisma.category.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    } catch (error) {
      return resourceErrorResponse(error);
    }
  });
}
