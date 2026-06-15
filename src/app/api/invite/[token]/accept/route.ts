import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { acceptHouseholdInvite } from "@/lib/household";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { token } = await params;

  try {
    const household = await acceptHouseholdInvite(token, session.user.id);
    return NextResponse.json({ household });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to accept invite" },
      { status: 400 }
    );
  }
}
