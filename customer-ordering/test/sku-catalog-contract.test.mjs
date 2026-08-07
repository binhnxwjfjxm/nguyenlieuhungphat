import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("pricing workbooks generate exactly the canonical 606 retail + 606 case SKU catalog", async () => {
  const generated = JSON.parse(await read("lib/adapters/mock/generated-catalog.json"));
  assert.equal(generated.meta.masterRows, 606);
  assert.equal(generated.products.length, 1212);
  assert.equal(new Set(generated.products.map((product) => product.sku)).size, 1212);
  const retail = generated.products.filter((product) => product.purchaseMode === "retail");
  const cases = generated.products.filter((product) => product.purchaseMode === "case");
  assert.equal(retail.length, 606);
  assert.equal(cases.length, 606);
  const retailSkuSet = new Set(retail.map((product) => product.sku));
  for (const product of generated.products) {
    assert.ok(product.sku);
    assert.ok(product.familySku);
    assert.ok(product.name);
    assert.equal("id" in product, false);
    assert.equal("code" in product, false);
    if (product.purchaseMode === "case") assert.ok(retailSkuSet.has(product.familySku), `${product.sku} must link to its retail MASTER SKU`);
  }
});

test("product identity is SKU end-to-end for future Core integration", async () => {
  const [contracts, service, adapter, catalog, detail, cart, checkout, quick, orderDetail, orders] = await Promise.all([
    read("lib/contracts.ts"), read("lib/customer-ordering-service.ts"), read("lib/adapters/mock/mock-customer-ordering-adapter.ts"),
    read("components/product-catalog.tsx"), read("components/product-detail.tsx"), read("components/cart-screen.tsx"),
    read("components/checkout-screen.tsx"), read("components/quick-order.tsx"), read("components/order-detail.tsx"), read("components/orders-screen.tsx"),
  ]);
  assert.match(contracts, /interface Product[\s\S]*sku: string[\s\S]*familySku: string/);
  assert.match(contracts, /interface CartLine[\s\S]*sku: string/);
  assert.match(contracts, /interface CustomerOrderLine[\s\S]*sku: string/);
  assert.match(contracts, /getProductBySku\(sku: string\)/);
  assert.match(service, /getProductBySku/);
  assert.match(adapter, /item\.sku === line\.sku/);
  for (const source of [catalog, detail, cart, checkout, quick, orderDetail, orders]) assert.match(source, /\.sku/);
  assert.doesNotMatch(`${catalog}\n${detail}\n${cart}\n${checkout}\n${quick}`, /productId/);
});

test("search accepts human-friendly SKU forms and product metadata", async () => {
  const search = await read("lib/catalog-search.ts");
  assert.match(search, /compactCatalogText/);
  assert.match(search, /product\.sku/);
  for (const field of ["product.name", "product.brand", "product.productType", "product.flavor", "product.size"]) assert.match(search, new RegExp(field.replace(".", "\\.")));
});

test("case price never falls back to retail price and identity only comes from MASTER", async () => {
  const generator = await read("scripts/generate-catalog-sku.mjs");
  assert.match(generator, /const amount = purchaseMode === 'case' \? record\.casePrice/);
  assert.match(generator, /const masterRecords = primary\.bySheet\.get\(MASTER_SHEET\)/);
  assert.match(generator, /if \(!catalog\.has\(incoming\.sku\)\) continue/);
  assert.match(generator, /familySku: retailValue/);
  assert.doesNotMatch(generator, /casePrice\s*\?\?\s*record\.retailPrice/);
});
