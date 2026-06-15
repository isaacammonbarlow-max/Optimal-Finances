import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-helpers";

export async function GET() {
  return withAuth(async (ctx) => {
    const tracked = await prisma.trackedLineItem.findMany({
      where: { userId: ctx.userId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(tracked);
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async (ctx) => {
    const { name } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const item = await prisma.trackedLineItem.upsert({
      where: { userId_name: { userId: ctx.userId, name: name.trim().toLowerCase() } },
      create: { userId: ctx.userId, name: name.trim().toLowerCase() },
      update: {},
    });
    return NextResponse.json(item);
  });
}
