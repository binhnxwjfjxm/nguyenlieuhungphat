import generatedCatalog from "@/lib/adapters/mock/generated-catalog.json";
import { productMatchesQuery, productSearchRank } from "@/lib/catalog-search";
import type { Category, Product, ProductSearchInput } from "@/lib/contracts";

interface GeneratedCatalog {
  categories: Category[];
  products: Product[];
  meta: { sourceFiles: string[]; productCount: number };
}

const catalog = generatedCatalog as GeneratedCatalog;

export const MOCK_CATEGORIES: Category[] = catalog.categories.map((category) => ({ ...category }));
export const MOCK_PRODUCTS: Product[] = catalog.products.map((product) => ({
  ...product,
  aliases: [...product.aliases],
  price: { ...product.price },
}));

export const LEGACY_PRODUCT_ID_TO_SKU: Readonly<Record<string, string>> = {
  "tran-chau-den-1kg": "TS-TC-001",
  "tran-chau-den-1kg-case": "TS-TC-001T",
  "bot-kem-beo-1kg": "TS-BKB-002",
  "bot-kem-beo-1kg-case": "TS-BKB-002T",
  "my-cay-goi": "MC-MY-001",
  "my-cay-case": "MC-MY-001T",
  "pho-mai-que-goi": "DL-PMQ-001",
  "pho-mai-que-case": "DL-PMQ-001T",
  "xuc-xich-an-vat": "AV-XX-001",
  "xuc-xich-an-vat-case": "AV-XX-001T",
  "ly-pet-700ml": "BB-LY-700",
  "ly-pet-700ml-case": "BB-LY-700T",
  "sot-cay-chai": "GS-SC-001",
  "sot-cay-case": "GS-SC-001T",
};

export function cloneProduct(product: Product): Product {
  return { ...product, aliases: [...product.aliases], price: { ...product.price } };
}

export function findProductBySku(sku: string): Product | null {
  const normalized = sku.trim().toUpperCase();
  const product = MOCK_PRODUCTS.find((item) => item.sku.toUpperCase() === normalized);
  return product ? cloneProduct(product) : null;
}

export function filterProducts(input: ProductSearchInput = {}): Product[] {
  const query = input.query?.trim() ?? "";
  return MOCK_PRODUCTS
    .filter((product) => !input.categoryId || product.categoryId === input.categoryId)
    .filter((product) => !input.purchaseMode || product.purchaseMode === input.purchaseMode)
    .filter((product) => !input.brand || product.brand === input.brand)
    .filter((product) => !input.productType || product.productType === input.productType)
    .filter((product) => !input.flavor || product.flavor === input.flavor)
    .filter((product) => !input.size || product.size === input.size)
    .filter((product) => productMatchesQuery(product, query))
    .map(cloneProduct)
    .sort((left, right) => {
      const rank = productSearchRank(left, query) - productSearchRank(right, query);
      return rank || left.name.localeCompare(right.name, "vi") || left.sku.localeCompare(right.sku);
    });
}
