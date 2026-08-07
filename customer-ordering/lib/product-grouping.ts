import type { Product } from "@/lib/contracts";

export interface ProductChoiceGroup {
  key: string;
  brand: string;
  productType: string;
  products: Product[];
}

export interface ProductBrandGroup {
  brand: string;
  groups: ProductChoiceGroup[];
}

const clean = (value: string | null | undefined, fallback: string) => value?.trim() || fallback;

export function productChoiceGroupKey(product: Product): string {
  return `${clean(product.brand, "Hưng Phát")}\u001f${clean(product.productType, "Sản phẩm")}`;
}

export function productFlavorValue(product: Product): string {
  return product.flavor?.trim() ?? "";
}

export function productSizeValue(product: Product): string {
  return product.size?.trim() ?? "";
}

export function groupProductChoices(products: Product[]): ProductChoiceGroup[] {
  const groups = new Map<string, ProductChoiceGroup>();

  for (const product of products) {
    const key = productChoiceGroupKey(product);
    const existing = groups.get(key);
    if (existing) {
      existing.products.push(product);
      continue;
    }
    groups.set(key, {
      key,
      brand: clean(product.brand, "Hưng Phát"),
      productType: clean(product.productType, "Sản phẩm"),
      products: [product],
    });
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      products: [...group.products].sort((left, right) =>
        productFlavorValue(left).localeCompare(productFlavorValue(right), "vi")
        || productSizeValue(left).localeCompare(productSizeValue(right), "vi")
        || (left.purchaseMode === right.purchaseMode ? 0 : left.purchaseMode === "retail" ? -1 : 1)
        || left.sku.localeCompare(right.sku, "vi")),
    }))
    .sort((left, right) => left.brand.localeCompare(right.brand, "vi") || left.productType.localeCompare(right.productType, "vi"));
}

export function groupProductChoicesByBrand(groups: ProductChoiceGroup[]): ProductBrandGroup[] {
  const brands = new Map<string, ProductChoiceGroup[]>();
  for (const group of groups) brands.set(group.brand, [...(brands.get(group.brand) ?? []), group]);
  return [...brands.entries()]
    .map(([brand, brandGroups]) => ({ brand, groups: brandGroups }))
    .sort((left, right) => left.brand.localeCompare(right.brand, "vi"));
}

export function distinctProductValues(products: Product[], selector: (product: Product) => string): string[] {
  return [...new Set(products.map(selector))].sort((left, right) => left.localeCompare(right, "vi"));
}

export function productVariantSummary(product: Product): string {
  return [product.flavor?.trim(), product.size?.trim()].filter(Boolean).join(" · ") || product.packaging;
}
