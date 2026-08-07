import type { Category, Product } from "@/lib/contracts";

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

const clean = (value: string | null | undefined, fallback = "") => value?.trim() || fallback;

function categoryLabel(product: Product, categories: Category[]): string {
  const category = categories.find((item) => item.id === product.categoryId);
  return clean(category?.shortName || category?.name, "Sản phẩm");
}

export function productDisplayBrand(product: Product): string {
  return clean(product.brand, "Hưng Phát");
}

export function productDisplayType(product: Product, categories: Category[] = []): string {
  return clean(product.productType, categoryLabel(product, categories));
}

export function productChoiceGroupKey(product: Product): string {
  return clean(product.familySku, product.sku);
}

export function productFlavorValue(product: Product): string {
  return clean(product.flavor);
}

export function productSizeValue(product: Product): string {
  return clean(product.size);
}

export function productSizeLabel(product: Product): string {
  const packaging = clean(product.packaging);
  const packagingMatch = packaging.match(/\b\d+(?:[.,]\d+)?\s*(?:ml|l|g|gr|kg)\b/iu)?.[0];
  if (packagingMatch) return clean(packagingMatch);
  return clean(product.size);
}

export function groupProductChoices(products: Product[], categories: Category[] = []): ProductChoiceGroup[] {
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
      brand: productDisplayBrand(product),
      productType: productDisplayType(product, categories),
      products: [product],
    });
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      products: [...group.products].sort((left, right) =>
        (left.purchaseMode === right.purchaseMode ? 0 : left.purchaseMode === "retail" ? -1 : 1)
        || left.sku.localeCompare(right.sku, "vi")),
    }))
    .sort((left, right) => left.productType.localeCompare(right.productType, "vi") || left.brand.localeCompare(right.brand, "vi"));
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
  return [productFlavorValue(product), productSizeLabel(product)].filter(Boolean).join(" · ") || product.packaging;
}
