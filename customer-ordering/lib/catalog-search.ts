import type { Product } from "@/lib/contracts";

export function normalizeCatalogText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("đ", "d")
    .replaceAll("Đ", "D")
    .toLocaleLowerCase("vi")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function compactCatalogText(value: string): string {
  return normalizeCatalogText(value).replace(/[^a-z0-9]/g, "");
}

function searchableText(product: Product): string {
  return [
    product.sku,
    product.name,
    product.brand,
    product.productType,
    product.flavor ?? "",
    product.size,
    product.packaging,
    product.unit,
    ...product.aliases,
  ].join(" ");
}

export function productMatchesQuery(product: Product, query: string): boolean {
  const normalizedQuery = normalizeCatalogText(query);
  if (!normalizedQuery) return true;
  const compactQuery = compactCatalogText(query);
  const normalizedSku = normalizeCatalogText(product.sku);
  const compactSku = compactCatalogText(product.sku);
  const normalizedHaystack = normalizeCatalogText(searchableText(product));
  const compactHaystack = compactCatalogText(searchableText(product));
  return (
    normalizedSku.includes(normalizedQuery) ||
    (compactQuery.length >= 2 && compactSku.includes(compactQuery)) ||
    normalizedHaystack.includes(normalizedQuery) ||
    (compactQuery.length >= 3 && compactHaystack.includes(compactQuery))
  );
}

export function productSearchRank(product: Product, query: string): number {
  const compactQuery = compactCatalogText(query);
  if (!compactQuery) return 100;
  const compactSku = compactCatalogText(product.sku);
  const compactName = compactCatalogText(product.name);
  if (compactSku === compactQuery) return 0;
  if (compactSku.startsWith(compactQuery)) return 1;
  if (compactName === compactQuery) return 2;
  if (compactName.startsWith(compactQuery)) return 3;
  if (compactSku.includes(compactQuery)) return 4;
  return 10;
}
