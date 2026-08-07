import type { Category } from "@/lib/contracts";

export const CUSTOMER_CATEGORY_PRIORITY = [
  "milk-tea",
  "spicy-noodle",
  "frozen",
  "snacks",
  "packaging",
  "sauce-seasoning",
] as const;

const CATEGORY_PRIORITY_RANK = new Map<string, number>(
  CUSTOMER_CATEGORY_PRIORITY.map((categoryId, index) => [categoryId, index]),
);

export function sortCustomerCategories(categories: Category[]): Category[] {
  return [...categories].sort((left, right) => {
    const leftRank = CATEGORY_PRIORITY_RANK.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightRank = CATEGORY_PRIORITY_RANK.get(right.id) ?? Number.MAX_SAFE_INTEGER;
    return leftRank - rightRank || left.shortName.localeCompare(right.shortName, "vi");
  });
}
