import { productFamilies } from "./products";

export type BrandSummary = {
  name: string;
  familyCount: number;
  categoryCount: number;
  sampleFamilies: string[];
};

const brandMap = new Map<string, { families: Set<string>; categories: Set<string> }>();

for (const family of productFamilies) {
  const brand = family.brand?.trim();
  if (!brand || brand.toLocaleLowerCase("vi") === "hưng phát") continue;

  const entry = brandMap.get(brand) ?? { families: new Set<string>(), categories: new Set<string>() };
  entry.families.add(family.name);
  entry.categories.add(family.origin);
  brandMap.set(brand, entry);
}

export const brands: BrandSummary[] = [...brandMap.entries()]
  .map(([name, value]) => ({
    name,
    familyCount: value.families.size,
    categoryCount: value.categories.size,
    sampleFamilies: [...value.families].sort((a, b) => a.localeCompare(b, "vi")).slice(0, 3),
  }))
  .sort((left, right) => right.familyCount - left.familyCount || left.name.localeCompare(right.name, "vi"));

export function brandInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("vi"))
    .join("");
}
