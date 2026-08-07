import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("pricing workbooks generate a full unique SKU catalog instead of the 14 demo rows", async () => {
  const generated = JSON.parse(await read("lib/adapters/mock/generated-catalog.json"));
  assert.ok(generated.products.length > 14, `expected >14 mapped SKU, got ${generated.products.length}`);
  assert.equal(new Set(generated.products.map((product) => product.sku)).size, generated.products.length);
  for (const product of generated.products) {
    assert.ok(product.sku);
    assert.ok(product.name);
    assert.equal("id" in product, false);
    assert.equal("code" in product, false);
    if (product.purchaseMode === "case") assert.match(product.sku, /T$/);
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
