import type { Category } from "@prisma/client";
import { parseJsonArray } from "@/lib/utils";

export function matchCategory(
  categories: Category[],
  merchantName?: string | null,
  merchantAddress?: string | null
): Category | null {
  const name = (merchantName ?? "").toLowerCase();
  const address = (merchantAddress ?? "").toLowerCase();

  for (const category of categories) {
    const nameMatchers = parseJsonArray(category.merchantMatchers).map((m) =>
      m.toLowerCase()
    );
    const addressMatchers = parseJsonArray(category.addressMatchers).map((m) =>
      m.toLowerCase()
    );

    const nameMatch = nameMatchers.some(
      (matcher) => matcher && name.includes(matcher)
    );
    const addressMatch = addressMatchers.some(
      (matcher) => matcher && address.includes(matcher)
    );

    if (nameMatch || addressMatch) {
      return category;
    }
  }

  return null;
}
