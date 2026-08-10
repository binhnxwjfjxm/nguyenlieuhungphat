import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

const customerFacingSurfaces = [
  "components/home-screen.tsx",
  "components/product-catalog.tsx",
  "components/quick-order.tsx",
  "components/product-detail.tsx",
  "components/cart-screen.tsx",
  "components/checkout-screen.tsx",
  "components/orders-screen.tsx",
  "components/order-detail.tsx",
];

test("Lane F keeps Customer Portal access deny-by-default until active membership", async () => {
  const [gate, adapter] = await Promise.all([
    source("components/customer-portal-access-gate.tsx"),
    source("lib/adapters/core/core-customer-ordering-adapter.ts"),
  ]);

  assert.match(gate, /portalState === "active_customer"/);
  assert.match(gate, /membership hoạt động/);
  assert.match(adapter, /requestPortal/);
  assert.match(adapter, /\/catalog/);
  assert.match(adapter, /session\?\.getToken/);
});

test("Lane F hides raw SKU from customer-facing copy while preserving canonical SKU keys", async () => {
  const surfaces = await Promise.all(customerFacingSurfaces.map(async (path) => [path, await source(path)]));
  for (const [path, contents] of surfaces) {
    assert.doesNotMatch(contents, /SKU/, `${path} must not expose SKU wording to customers`);
    assert.doesNotMatch(contents, />\{(?:product|quickViewProduct|line|item)\.sku\}/, `${path} must not render raw SKU values`);
  }

  const [catalog, quickOrder, cart, checkout, orders] = await Promise.all([
    source("components/product-catalog.tsx"),
    source("components/quick-order.tsx"),
    source("components/cart-screen.tsx"),
    source("components/checkout-screen.tsx"),
    source("components/orders-screen.tsx"),
  ]);
  assert.match(catalog, /selectedSkuByGroup/);
  assert.match(catalog, /product\.sku/);
  assert.match(quickOrder, /quantities\[product\.sku\]/);
  assert.match(cart, /line\.sku/);
  assert.match(checkout, /productMap\.get\(line\.sku\)/);
  assert.match(orders, /bySku\.get\(line\.sku\)/);
});
