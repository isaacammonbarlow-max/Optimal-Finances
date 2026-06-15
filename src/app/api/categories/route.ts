import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-helpers";
import { parseJsonArray, toJsonArray } from "@/lib/utils";

export async function GET() {
  return withAuth(async (ctx) => {
    const categories = await prisma.category.findMany({
      where: { householdId: ctx.householdId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(
      categories.map((c) => ({
        ...c,
        merchantMatchers: parseJsonArray(c.merchantMatchers),
        addressMatchers: parseJsonArray(c.addressMatchers),
      }))
    );
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async (ctx) => {
    const body = await request.json();
    const category = await prisma.category.create({
      data: {
        householdId: ctx.householdId,
        userId: ctx.userId,
        name: body.name,
        description: body.description,
        color: body.color ?? "#10b981",
        merchantMatchers: toJsonArray(body.merchantMatchers ?? []),
        addressMatchers: toJsonArray(body.addressMatchers ?? []),
        isPinned: body.isPinned ?? true,
      },
    });
    return NextResponse.json({
      ...category,
      merchantMatchers: parseJsonArray(category.merchantMatchers),
      addressMatchers: parseJsonArray(category.addressMatchers),
    });
  });
}
