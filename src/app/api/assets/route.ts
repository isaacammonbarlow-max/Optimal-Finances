import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-helpers";

export async function GET() {
  return withAuth(async (ctx) => {
    const assets = await prisma.asset.findMany({
      where: { householdId: ctx.householdId },
      orderBy: { value: "desc" },
    });
    return NextResponse.json(assets);
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async (ctx) => {
    const body = await request.json();
    const asset = await prisma.asset.create({
      data: {
        householdId: ctx.householdId,
        userId: ctx.userId,
        name: body.name,
        type: body.type ?? "SAVINGS",
        value: Number(body.value),
        apr: Number(body.apr ?? 0),
        notes: body.notes,
      },
    });
    return NextResponse.json(asset);
  });
}
