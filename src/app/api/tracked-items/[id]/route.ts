import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-helpers";
import { assertUserRecord, resourceErrorResponse } from "@/lib/resource-access";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  return withAuth(async (ctx) => {
    try {
      const { id } = await params;
      const existing = await assertUserRecord(
        ctx,
        await prisma.trackedLineItem.findUnique({ where: { id } })
      );
      const { name } = await request.json();
      if (!name?.trim()) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }

      const item = await prisma.trackedLineItem.update({
        where: { id: existing.id },
        data: { name: name.trim().toLowerCase() },
      });

      return NextResponse.json(item);
    } catch (error) {
      return resourceErrorResponse(error);
    }
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  return withAuth(async (ctx) => {
    try {
      const { id } = await params;
      await assertUserRecord(ctx, await prisma.trackedLineItem.findUnique({ where: { id } }));
      await prisma.trackedLineItem.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    } catch (error) {
      return resourceErrorResponse(error);
    }
  });
}
