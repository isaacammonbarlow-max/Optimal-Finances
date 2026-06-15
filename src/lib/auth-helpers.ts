import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export type AuthContext = {
  userId: string;
  householdId: string;
  email: string;
  role: string;
};

export async function requireAuth(): Promise<AuthContext> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    throw new AuthError("Unauthorized");
  }

  const membership = await prisma.householdMember.findFirst({
    where: { userId: session.user.id },
    orderBy: { joinedAt: "asc" },
  });

  if (!membership) {
    throw new AuthError("No household found for user");
  }

  return {
    userId: session.user.id,
    householdId: membership.householdId,
    email: session.user.email,
    role: membership.role,
  };
}

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbiddenResponse() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function withAuth<T>(
  handler: (ctx: AuthContext) => Promise<T>
): Promise<T | NextResponse> {
  try {
    const ctx = await requireAuth();
    return handler(ctx);
  } catch (error) {
    if (error instanceof AuthError) return unauthorizedResponse();
    throw error;
  }
}
