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

test("cart keeps the exact selected retail or case SKU after adding", async () => {
  const source = await read("components/cart-screen.tsx");
  assert.match(source, /cart-mode-static/);
  assert.match(source, /purchaseModeLabel\(product\)/);
  assert.match(source, /item\.sku === line\.sku/);
  assert.doesNotMatch(source, /switchVariant|familyVariants|cart-variant-switch|targetSku/);
});

test("quick order pages and filters the full catalog through the service with visible exact prices", async () => {
  const source = await read("components/quick-order.tsx");
  assert.match(source, /service\.listProductPage\(\{/);
  assert.match(source, /limit: PAGE_SIZE/);
  assert.match(source, /query: searchQuery/);
  assert.match(source, /categoryId: selectedCategoryId/);
  assert.match(source, /purchaseMode: selectedPurchaseMode/);
  assert.match(source, /productType: selectedProductType/);
  assert.match(source, /offset: products\.length/);
  assert.match(source, /Mua lẻ/);
  assert.match(source, /Mua thùng/);
  assert.doesNotMatch(source, /Promise\.all\(\[service\.listCategories\(\), service\.listProducts\(\)\]\)/);
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
  const [account, addressFields] = await Promise.all([
    read("components/account-auth-card.tsx"),
    read("components/vietnam-address-fields.tsx"),
  ]);
  assert.match(account, /VietnamAddressFields/);
  assert.match(account, /addressLine1: form\.addressLine\.trim\(\)/);
  assert.match(account, /ward: form\.wardName\.trim\(\)/);
  assert.match(account, /province: form\.provinceName\.trim\(\)/);
  assert.match(account, /countryCode: "VN"/);
  assert.match(account, /Tên quán hoặc điểm bán/);
  assert.doesNotMatch(account, /SHOP_REGISTRATION_STORAGE_PREFIX/);
  assert.match(addressFields, /Tỉnh \/ thành phố/);
  assert.match(addressFields, /Xã \/ phường \/ đặc khu/);
  assert.match(addressFields, /Số nhà, tên đường/);
  assert.match(addressFields, /provinceCode/);
  assert.match(addressFields, /wardCode/);
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
