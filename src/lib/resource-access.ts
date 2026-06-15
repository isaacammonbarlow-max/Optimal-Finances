import { NextResponse } from "next/server";
import type { AuthContext } from "@/lib/auth-helpers";

export class ResourceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResourceError";
  }
}

export function notFoundResponse() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export function resourceErrorResponse(error: unknown) {
  if (error instanceof ResourceError) return notFoundResponse();
  throw error;
}

export async function assertHouseholdRecord<T extends { householdId: string }>(
  ctx: AuthContext,
  record: T | null
): Promise<T> {
  if (!record || record.householdId !== ctx.householdId) {
    throw new ResourceError("Not found");
  }
  return record;
}

export async function assertUserRecord<T extends { userId: string }>(
  ctx: AuthContext,
  record: T | null
): Promise<T> {
  if (!record || record.userId !== ctx.userId) {
    throw new ResourceError("Not found");
  }
  return record;
}
