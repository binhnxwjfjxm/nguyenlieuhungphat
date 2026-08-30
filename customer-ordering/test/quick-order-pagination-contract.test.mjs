import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Đặt hàng nhanh dùng catalog phân trang thay vì tải toàn bộ sản phẩm", async () => {
  const [quickOrder, service, contracts] = await Promise.all([
    read("components/quick-order.tsx"),
    read("lib/customer-ordering-service.ts"),
    read("lib/contracts.ts"),
  ]);

  assert.match(contracts, /export interface ProductPageInput/);
  assert.match(contracts, /listProductPage\(input\?: ProductPageInput\): Promise<ProductPage>/);
  assert.match(service, /listProductPage\(input\?: ProductPageInput\)/);
  assert.match(quickOrder, /const PAGE_SIZE = 50/);
  assert.match(quickOrder, /SEARCH_DEBOUNCE_MS = 250/);
  assert.match(quickOrder, /service\.listProductPage\(/);
  assert.match(quickOrder, /offset: products\.length/);
  assert.match(quickOrder, /Xem thêm sản phẩm/);
  assert.doesNotMatch(quickOrder, /service\.listProducts\(\)/);
  assert.doesNotMatch(quickOrder, /productMatchesQuery/);
  assert.doesNotMatch(quickOrder, /filteredProducts/);
});

test("tìm kiếm và bộ lọc Đặt hàng nhanh được gửi lên Công Ty trên toàn catalog", async () => {
  const [quickOrder, coreAdapter] = await Promise.all([
    read("components/quick-order.tsx"),
    read("lib/adapters/core/core-customer-ordering-adapter.ts"),
  ]);

  assert.match(quickOrder, /query: searchQuery/);
  assert.match(quickOrder, /categoryId: selectedCategoryId/);
  assert.match(quickOrder, /purchaseMode: selectedPurchaseMode/);
  assert.match(quickOrder, /requestVersionRef/);
  assert.match(coreAdapter, /query\.set\("search", search\)/);
  assert.match(coreAdapter, /query\.set\("categoryId", input\.categoryId\)/);
  assert.match(coreAdapter, /query\.set\("purchaseMode", input\.purchaseMode\)/);
  assert.match(coreAdapter, /query\.set\("includeCategories", "1"\)/);
  assert.match(coreAdapter, /Math\.min\(PAGE_SIZE/);
});

test("Nhóm sản phẩm và Nhóm hàng dùng cây nhóm canonical thay vì metadata của trang đã tải", async () => {
  const quickOrder = await read("components/quick-order.tsx");
  assert.match(quickOrder, /category\.parentCategoryId/);
  assert.match(quickOrder, /parentCategoryId === activeCategory/);
  assert.match(quickOrder, /activeSubcategory \?\? activeCategory/);
  assert.match(quickOrder, />Nhóm sản phẩm</);
  assert.match(quickOrder, />Nhóm hàng</);
});

test("ảnh sản phẩm dùng Next Image optimizer đã được allowlist cho R2", async () => {
  const [visual, config] = await Promise.all([
    read("components/product-visual.tsx"),
    read("next.config.ts"),
  ]);
  assert.match(config, /\/app-customer\/products\/\*\*/);
  assert.match(visual, /<Image/);
  assert.doesNotMatch(visual, /unoptimized/);
});
