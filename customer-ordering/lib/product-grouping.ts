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
const normalize = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/đ/g, "d")
  .replace(/Đ/g, "D")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const genericTypePrefixes: Array<[string, RegExp]> = [
  ["Sinh tố", /^(?:sinh\s*tố|puree)(?:\s|$)/iu],
  ["Mứt", /^mứt(?:\s|$)/iu],
  ["Siro", /^(?:siro|syrup)(?:\s|$)/iu],
  ["Trà", /^trà(?:\s|$)/iu],
  ["Bột", /^bột(?:\s|$)/iu],
  ["Sốt", /^sốt(?:\s|$)/iu],
  ["Thạch", /^thạch(?:\s|$)/iu],
  ["Trân châu", /^trân\s*châu(?:\s|$)/iu],
  ["Topping", /^topping(?:\s|$)/iu],
  ["Pudding", /^pudding(?:\s|$)/iu],
  ["Đường", /^đường(?:\s|$)/iu],
];

const fallbackBrands = new Set(["", "hung phat", "nguyen lieu hung phat"]);
const sizePattern = /\b\d+(?:[.,]\d+)?\s*(?:ml|l|g|gr|kg)\b/giu;

function categoryLabel(product: Product, categories: Category[]): string {
  const category = categories.find((item) => item.id === product.categoryId);
  return clean(category?.shortName || category?.name, "Sản phẩm");
}

function stripGenericTypePrefix(value: string): { label: string; remainder: string } | null {
  const text = clean(value);
  for (const [label, pattern] of genericTypePrefixes) {
    if (!pattern.test(text)) continue;
    return { label, remainder: clean(text.replace(pattern, "").replace(sizePattern, " ")) };
  }
  return null;
}

function inferredBrandFromDetail(product: Product, categories: Category[]): string {
  const explicitBrand = clean(product.brand);
  if (!fallbackBrands.has(normalize(explicitBrand))) return explicitBrand;

  const detail = clean(product.productType);
  if (!detail) return explicitBrand || "Hưng Phát";
  const category = categoryLabel(product, categories);
  const prefixed = stripGenericTypePrefix(detail);
  const candidate = clean((prefixed?.remainder || detail)
    .replace(sizePattern, " ")
    .replace(/^[\s./_-]+|[\s./_-]+$/g, ""));
  const normalizedCandidate = normalize(candidate);
  if (candidate && normalizedCandidate !== normalize(category) && !genericTypePrefixes.some(([, pattern]) => pattern.test(candidate))) return candidate;
  return explicitBrand || "Hưng Phát";
}

function inferTypeFromName(product: Product): string | null {
  const name = clean(product.name).replace(/\s*-\s*THÙNG\s*$/iu, "");
  return stripGenericTypePrefix(name)?.label ?? null;
}

export function productDisplayBrand(product: Product, categories: Category[] = []): string {
  return inferredBrandFromDetail(product, categories);
}

export function productDisplayType(product: Product, categories: Category[] = []): string {
  const explicitBrand = clean(product.brand);
  const detail = clean(product.productType);
  const displayBrand = inferredBrandFromDetail(product, categories);
  const category = categoryLabel(product, categories);

  if (!fallbackBrands.has(normalize(explicitBrand))) {
    if (detail && normalize(detail) !== normalize(displayBrand)) return stripGenericTypePrefix(detail)?.label || detail;
    return inferTypeFromName(product) || category;
  }

  if (displayBrand !== (explicitBrand || "Hưng Phát")) {
    return stripGenericTypePrefix(detail)?.label || inferTypeFromName(product) || category;
  }
  return stripGenericTypePrefix(detail)?.label || detail || inferTypeFromName(product) || category;
}

export function productChoiceGroupKey(product: Product, categories: Category[] = []): string {
  return `${productDisplayBrand(product, categories)}\u001f${productDisplayType(product, categories)}`;
}

function stripLiteral(source: string, value: string): string {
  if (!value) return source;
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return source.replace(new RegExp(escaped, "giu"), " ");
}

export function productFlavorValue(product: Product, categories: Category[] = []): string {
  const structured = clean(product.flavor);
  if (structured) return structured;

  const displayBrand = productDisplayBrand(product, categories);
  const displayType = productDisplayType(product, categories);
  let candidate = clean(product.name).replace(/\s*-\s*THÙNG\s*$/iu, "");
  candidate = stripLiteral(candidate, displayBrand);
  candidate = stripLiteral(candidate, displayType);
  candidate = candidate.replace(sizePattern, " ").replace(/(?:^|\s)(?:chai|bình|bịch|gói|hộp|lon|can|túi|thùng)(?=\s|$)/giu, " ");
  candidate = clean(candidate.replace(/^[\s./_-]+|[\s./_-]+$/g, ""));
  if (!candidate || candidate.length > 56 || /^\d+(?:[.,]\d+)?$/.test(candidate)) return "";
  return candidate;
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
    const key = productChoiceGroupKey(product, categories);
    const existing = groups.get(key);
    if (existing) {
      existing.products.push(product);
      continue;
    }
    groups.set(key, {
      key,
      brand: productDisplayBrand(product, categories),
      productType: productDisplayType(product, categories),
      products: [product],
    });
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      products: [...group.products].sort((left, right) =>
        productFlavorValue(left, categories).localeCompare(productFlavorValue(right, categories), "vi")
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
  return [...new Set(products.map(selector).filter(Boolean))].sort((left, right) => left.localeCompare(right, "vi"));
}

export function productVariantSummary(product: Product, categories: Category[] = []): string {
  return [productFlavorValue(product, categories), productSizeLabel(product)].filter(Boolean).join(" · ") || product.packaging;
}
