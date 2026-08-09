import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("catalog cards stay compact and product detail opens in-place", async () => {
  const source = await read("components/product-catalog.tsx");
  assert.match(source, /catalog-product-card-compact/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /catalog-family-footer/);
  assert.match(source, /catalog-price-columns/);
  assert.match(source, /ShoppingCart/);
  assert.doesNotMatch(source, /Xem chi tiết/);
  assert.doesNotMatch(source, /catalog-product-spec/);
  assert.doesNotMatch(source, /catalog-product-link/);
});

test("cart can switch exact retail and case SKU after adding", async () => {
  const source = await read("components/cart-screen.tsx");
  assert.match(source, /switchVariant/);
  assert.match(source, /familyVariants/);
  assert.match(source, /cart-variant-switch/);
  assert.match(source, /sku: targetSku/);
});

test("quick order loads catalog once and filters retail/case locally with visible exact SKU price", async () => {
  const source = await read("components/quick-order.tsx");
  assert.match(source, /Promise\.all\(\[service\.listCategories\(\), service\.listProducts\(\)\]\)/);
  assert.match(source, /purchaseMode === "all" \|\| product\.purchaseMode === purchaseMode/);
  assert.match(source, /productMatchesQuery\(product, deferredQuery\)/);
  assert.match(source, /Mua lẻ/);
  assert.match(source, /Mua thùng/);
  assert.doesNotMatch(source, /purchaseMode:\s*purchaseMode === "all" \? null : purchaseMode/);
  assert.match(source, /quick-product-mode-price/);
  assert.match(source, /formatPrice\(product\)/);
});

test("orders keep a reusable purchased-products tab", async () => {
  const source = await read("components/orders-screen.tsx");
  assert.match(source, /Sản phẩm đã mua/);
  assert.match(source, /purchasedItems/);
  assert.match(source, /addPurchasedItem/);
  assert.match(source, /announceCartUpdated/);
});

test("shop registration sends canonical Vietnam address fields to Core", async () => {
  const account = await read("components/account-auth-card.tsx");
  assert.match(account, /addressLine1/);
  assert.match(account, /ward/);
  assert.match(account, /province/);
  assert.match(account, /countryCode: "VN"/);
  assert.match(account, /Tên quán hoặc điểm bán/);
  assert.match(account, /Tỉnh \/ thành phố/);
  assert.match(account, /Xã \/ phường/);
  assert.match(account, /Số nhà, tên đường/);
  assert.doesNotMatch(account, /provinceCode|wardCode|SHOP_REGISTRATION_STORAGE_PREFIX/);
});

test("home uses generated catalog identities and direct R2 hero image", async () => {
  const source = await read("components/home-screen.tsx");
  assert.match(source, /MOCK_PRODUCTS/);
  assert.match(source, /MOCK_CATEGORIES/);
  assert.match(source, /hero-app-customer\.jpg/);
  assert.match(source, /unoptimized/);
  assert.doesNotMatch(source, /Mock UI/);
  assert.doesNotMatch(source, /TS-TC-001|DL-PMQ-001/);
});

test("customer-facing screens do not expose implementation or demo copy", async () => {
  const files = [
    "components/product-catalog.tsx",
    "components/quick-order.tsx",
    "components/orders-screen.tsx",
    "components/account-auth-card.tsx",
    "components/home-screen.tsx",
    "components/notification-center.tsx",
    "components/notification-preferences.tsx",
  ];
  const sources = await Promise.all(files.map(read));
  for (const source of sources) assert.doesNotMatch(source, /Mock UI|Giai đoạn UI hiện|UI-[0-9]|\bdemo\b/i);
  assert.doesNotMatch(sources[0], /catalog-intro/);
  assert.doesNotMatch(sources[1], /quick-order-intro/);
  assert.doesNotMatch(sources[2], /orders-intro/);
  assert.doesNotMatch(sources[5], /notification-center-hero/);
});

test("experience polish styles are loaded before the catalog repair overrides", async () => {
  const layout = await read("app/layout.tsx");
  const css = await read("app/experience-polish.css");
  assert.match(layout, /experience-polish\.css/);
  assert.match(layout, /product-grouping\.css/);
  assert.match(css, /product-quick-view-backdrop/);
  assert.match(css, /catalog-add-icon/);
  assert.match(css, /orders-inner-tabs/);
  assert.match(css, /vietnam-address-fields/);
});
