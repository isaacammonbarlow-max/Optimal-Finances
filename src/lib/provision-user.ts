import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function provisionNewUser(
  email: string,
  passwordHash: string,
  name?: string | null
) {
  const displayName = name?.trim() || email.split("@")[0];

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name: displayName,
      passwordHash,
      emailVerified: new Date(),
      dashboardPreferences: { create: {} },
    },
  });

  const household = await prisma.household.create({
    data: {
      name: `${displayName}'s Household`,
      members: {
        create: { userId: user.id, role: "OWNER" },
      },
    },
  });

  await prisma.category.createMany({
    data: [
      {
        householdId: household.id,
        userId: user.id,
        name: "Bees Marketplace",
        description: "Local marketplace purchases",
        color: "#f59e0b",
        merchantMatchers: JSON.stringify(["bees marketplace", "bee's marketplace"]),
        addressMatchers: JSON.stringify(["bees marketplace", "market st"]),
      },
      {
        householdId: household.id,
        userId: user.id,
        name: "Groceries",
        color: "#22c55e",
        merchantMatchers: JSON.stringify(["kroger", "safeway", "whole foods"]),
      },
    ],
  });

  await prisma.trackedLineItem.createMany({
    data: [
      { userId: user.id, name: "chips" },
      { userId: user.id, name: "energy drink" },
      { userId: user.id, name: "steak" },
    ],
  });

  return user;
}

export async function registerUser(email: string, password: string, name?: string | null) {
  const normalized = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) {
    throw new Error("An account with this email already exists.");
  }
  const passwordHash = await hashPassword(password);
  return provisionNewUser(normalized, passwordHash, name);
}
