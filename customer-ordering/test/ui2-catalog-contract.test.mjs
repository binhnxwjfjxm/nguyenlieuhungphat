import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("UI-2 catalog stays behind the service and SKU adapter boundary", async () => {
  const [contracts, service, adapter, catalog] = await Promise.all([
    read("lib/contracts.ts"), read("lib/customer-ordering-service.ts"), read("lib/adapters/mock/mock-customer-ordering-adapter.ts"), read("components/product-catalog.tsx"),
  ]);
  assert.match(contracts, /listCategories\(\)/);
  assert.match(contracts, /listProducts\(input\?: ProductSearchInput\)/);
  assert.match(contracts, /getProductBySku\(sku: string\)/);
  assert.match(service, /this\.adapter\.listProducts/);
  assert.match(service, /this\.adapter\.getProductBySku/);
  assert.match(adapter, /filterProducts/);
  assert.match(catalog, /createCustomerOrderingService/);
  assert.doesNotMatch(catalog, /MOCK_PRODUCTS/);
});

test("catalog and product detail cover SKU search, availability, price pending and cart persistence", async () => {
  const [catalog, detail, adapter, mockData, search] = await Promise.all([
    read("components/product-catalog.tsx"), read("components/product-detail.tsx"), read("lib/adapters/mock/mock-customer-ordering-adapter.ts"), read("lib/adapters/mock/mock-catalog.ts"), read("lib/catalog-search.ts"),
  ]);
  assert.match(catalog, /type="search"/);
  assert.match(catalog, /activeCategory/);
  assert.match(catalog, /line\.sku === product\.sku/);
  assert.match(catalog, /saveCart/);
  assert.match(detail, /quantity-stepper/);
  assert.match(detail, /availability !== "available"/);
  assert.match(adapter, /CART_KEY/);
  assert.match(mockData, /generated-catalog\.json/);
  assert.match(search, /compactCatalogText/);
  assert.match(search, /product\.sku/);
});

test("header cart badge and navigation use the requested glass treatment", async () => {
  const [shell, badge, css, layout] = await Promise.all([read("components/app-shell.tsx"), read("components/cart-badge.tsx"), read("app/ui2.css"), read("app/layout.tsx")]);
  assert.match(shell, /<CartBadge \/>/);
  assert.match(badge, /CART_UPDATED_EVENT/);
  assert.match(css, /\.app-header,[\s\S]*\.bottom-navigation/);
  assert.match(css, /backdrop-filter: blur\(20px\) saturate\(165%\)/);
  assert.match(layout, /import "\.\/ui2\.css"/);
});

test("product routes use SKU and can initialize the selected category from Home", async () => {
  const [listingPage, detailPage] = await Promise.all([read("app/products/page.tsx"), read("app/products/[sku]/page.tsx")]);
  assert.match(listingPage, /<ProductCatalog initialCategoryId=\{initialCategoryId\} \/>/);
  assert.match(listingPage, /CUSTOMER_CATEGORY_PRIORITY/);
  assert.match(detailPage, /<ProductDetail sku=\{sku\}/);
  assert.doesNotMatch(detailPage, /productId/);
});
