import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-helpers";

export async function PATCH(request: NextRequest) {
  return withAuth(async (ctx) => {
    const { ids } = await request.json();
    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: "ids array required" }, { status: 400 });
    }
    await prisma.alertNotification.updateMany({
      where: { id: { in: ids }, userId: ctx.userId },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  });
}
