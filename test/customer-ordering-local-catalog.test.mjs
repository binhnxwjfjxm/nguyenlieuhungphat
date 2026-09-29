import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("Customer Ordering dùng IndexedDB local-first thay vì tải toàn catalog theo nhiều page", async () => {
  const adapter = await read("customer-ordering/lib/adapters/core/core-customer-ordering-adapter.ts");
  const indexed = await read("customer-ordering/lib/storage/catalog-indexed-db.ts");
  assert.match(adapter, /readCatalogSnapshot/);
  assert.match(adapter, /fetchCatalogSync/);
  assert.match(adapter, /\/catalog-sync/);
  assert.doesNotMatch(adapter, /PAGE_BATCH_SIZE/);
  assert.doesNotMatch(adapter, /fetchCatalogPages/);
  assert.match(indexed, /indexedDB\.open/);
  assert.match(indexed, /createIndex\(USER_INDEX/);
  assert.match(indexed, /applyCatalogSync/);
});

test("PWA chỉ batch giá cho sản phẩm đang hiện và proxy đúng contract mới", async () => {
  const component = await read("customer-ordering/components/product-catalog.tsx");
  const adapter = await read("customer-ordering/lib/adapters/core/core-customer-ordering-adapter.ts");
  const proxy = await read("customer-ordering/app/api/customer-portal/[...path]/route.ts");
  assert.match(component, /visibleProductGroups/);
  assert.match(component, /refreshProductPrices/);
  assert.match(adapter, /PRICE_BATCH_SIZE = 100/);
  assert.match(adapter, /\/catalog\/prices/);
  assert.match(proxy, /catalog-sync/);
  assert.match(proxy, /path\[0\] === "catalog" && path\[1\] === "prices"/);
});
