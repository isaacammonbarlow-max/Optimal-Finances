import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email?.trim()?.toLowerCase();
    const password = body.password;
    const confirm = body.confirm === "DELETE";

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    if (!confirm) {
      return NextResponse.json(
        { error: 'Type DELETE in the confirmation box to permanently remove your account.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "No account found with that email." }, { status: 404 });
    }

    if (user.passwordHash) {
      if (!password) {
        return NextResponse.json(
          { error: "Enter your current password to delete this account." },
          { status: 400 }
        );
      }
      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
      }
    }

    await prisma.user.delete({ where: { id: user.id } });

    return NextResponse.json({
      ok: true,
      message: "Account deleted. You can register again with the same email.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not delete account." }, { status: 500 });
  }
}
