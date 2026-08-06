import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("UI-2 catalog stays behind the service and mock adapter boundary", async () => {
  const [contracts, service, adapter, catalog] = await Promise.all([
    read("lib/contracts.ts"),
    read("lib/customer-ordering-service.ts"),
    read("lib/adapters/mock/mock-customer-ordering-adapter.ts"),
    read("components/product-catalog.tsx"),
  ]);

  assert.match(contracts, /listCategories\(\)/);
  assert.match(contracts, /listProducts\(input\?: ProductSearchInput\)/);
  assert.match(contracts, /getProductById\(productId: string\)/);
  assert.match(service, /this\.adapter\.listProducts/);
  assert.match(adapter, /MOCK_PRODUCTS/);
  assert.match(catalog, /createCustomerOrderingService/);
  assert.doesNotMatch(catalog, /MOCK_PRODUCTS/);
});

test("catalog and product detail cover search, availability, price pending and cart persistence", async () => {
  const [catalog, detail, adapter, mockData] = await Promise.all([
    read("components/product-catalog.tsx"),
    read("components/product-detail.tsx"),
    read("lib/adapters/mock/mock-customer-ordering-adapter.ts"),
    read("lib/adapters/mock/mock-catalog.ts"),
  ]);

  assert.match(catalog, /type="search"/);
  assert.match(catalog, /activeCategory/);
  assert.match(catalog, /saveCart/);
  assert.match(detail, /quantity-stepper/);
  assert.match(detail, /availability !== "available"/);
  assert.match(adapter, /CART_KEY/);
  assert.match(mockData, /customer_price_pending/);
  assert.match(mockData, /out_of_stock/);
  assert.match(mockData, /paused/);
});

test("header cart badge and navigation use the requested glass treatment", async () => {
  const [shell, badge, css, layout] = await Promise.all([
    read("components/app-shell.tsx"),
    read("components/cart-badge.tsx"),
    read("app/ui2.css"),
    read("app/layout.tsx"),
  ]);

  assert.match(shell, /<CartBadge \/>/);
  assert.match(badge, /CART_UPDATED_EVENT/);
  assert.match(css, /\.app-header,[\s\S]*\.bottom-navigation/);
  assert.match(css, /backdrop-filter: blur\(20px\) saturate\(165%\)/);
  assert.match(css, /box-shadow:/);
  assert.match(css, /rgba\(255, 255, 255, \.7\)/);
  assert.match(layout, /import "\.\/ui2\.css"/);
});

test("product routes are real screens rather than placeholders", async () => {
  const [listingPage, detailPage] = await Promise.all([
    read("app/products/page.tsx"),
    read("app/products/[productId]/page.tsx"),
  ]);

  assert.match(listingPage, /<ProductCatalog \/>/);
  assert.match(detailPage, /<ProductDetail productId=\{productId\} \/>/);
  assert.doesNotMatch(listingPage, /placeholder-screen/);
});
