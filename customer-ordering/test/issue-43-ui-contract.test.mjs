import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const fileStat = (path) => stat(new URL(`../${path}`, import.meta.url));

test("issue 43 keeps one category priority and opens Home categories/products correctly", async () => {
  const [order, home, productsPage, catalog] = await Promise.all([
    read("lib/category-order.ts"),
    read("components/home-screen.tsx"),
    read("app/products/page.tsx"),
    read("components/product-catalog.tsx"),
  ]);

  const priority = ["milk-tea", "spicy-noodle", "frozen", "snacks", "packaging", "sauce-seasoning"];
  let cursor = -1;
  for (const id of priority) {
    const next = order.indexOf(`"${id}"`);
    assert.ok(next > cursor, `category ${id} must keep the agreed priority`);
    cursor = next;
  }

  assert.match(home, /href=\{`\/products\?category=\$\{encodeURIComponent\(category\.id\)\}`\}/);
  assert.match(home, /href=\{`\/products\/\$\{encodeURIComponent\(product\.sku\)\}`\}/);
  assert.match(productsPage, /initialCategoryId=\{initialCategoryId\}/);
  assert.match(catalog, /initialCategoryId = null/);
  assert.match(catalog, /useState<string \| null>\(initialCategoryId\)/);
});

test("Quick Order pages and filters through the service, reuses the R2 product visual and keeps cards dense", async () => {
  const [quickOrder, railCss] = await Promise.all([
    read("components/quick-order.tsx"),
    read("app/quick-order-rail.css"),
  ]);

  assert.match(quickOrder, /service\.listProductPage\(\{/);
  assert.match(quickOrder, /query: searchQuery/);
  assert.match(quickOrder, /categoryId: selectedCategoryId/);
  assert.match(quickOrder, /purchaseMode: selectedPurchaseMode/);
  assert.match(quickOrder, /limit: PAGE_SIZE/);
  assert.doesNotMatch(quickOrder, /Promise\.all\(\[service\.listCategories\(\), service\.listProducts\(\)\]\)/);
  assert.match(quickOrder, /const QuickOrderProductList = memo/);
  assert.match(quickOrder, /<ProductVisual compact product=\{product\}/);
  assert.match(quickOrder, /quick-filter-search-shortcut/);
  assert.match(quickOrder, /rootCategories\.map\(\(category\)/);
  assert.match(quickOrder, /quick-direct-add/);
  assert.doesNotMatch(quickOrder, /quick-order-summary|quick-order-sticky-search|quick-quantity-control|selectedOnly/);
  assert.match(railCss, /grid-template-columns:\s*108px minmax\(0, 1fr\)/);
  assert.match(railCss, /\.quick-order-direct-row[\s\S]*height:\s*78px/);
  assert.match(railCss, /\.quick-product-visual/);
  assert.match(railCss, /\.quick-filter-slider[\s\S]*transition:\s*transform 220ms/);
});

test("customer-facing copy and destructive actions do not expose implementation details", async () => {
  const [success, detail, product, account, cart, login, news, checkout] = await Promise.all([
    read("components/order-success.tsx"),
    read("components/order-detail.tsx"),
    read("components/product-detail.tsx"),
    read("components/account-auth-card.tsx"),
    read("components/cart-screen.tsx"),
    read("components/login-card.tsx"),
    read("components/notification-center.tsx"),
    read("components/checkout-screen.tsx"),
  ]);

  for (const source of [success, detail, product, login, checkout]) {
    assert.doesNotMatch(source, /Đơn mock|khi nối Core|dữ liệu nguồn|ứng dụng không tự suy đoán giá|0900000000/i);
  }

  assert.match(account, /Gửi đăng ký điểm bán/);
  assert.match(account, /Lưu lên Công Ty/);
  assert.match(account, /Mã khách Công Ty:/);
  assert.doesNotMatch(account, /Lưu bản nháp|confirmDeleteDraft|SHOP_REGISTRATION_STORAGE_PREFIX/);
  assert.match(cart, /confirmClear/);
  assert.match(checkout, /Chưa có địa chỉ nhận hàng/);
  assert.ok(news.indexOf("notification-feed-section") < news.indexOf("notification-settings-collapsible"));
  assert.match(login, /tên đăng nhập và mật khẩu/i);
});

test("PWA icons are right-sized and logo can use Next image optimization", async () => {
  const [logo, icon192, icon512] = await Promise.all([
    read("components/customer-logo.tsx"),
    fileStat("public/icon-192.png"),
    fileStat("public/icon-512.png"),
  ]);

  assert.doesNotMatch(logo, /unoptimized/);
  assert.ok(icon192.size < 100_000, `icon-192 is unexpectedly heavy: ${icon192.size}`);
  assert.ok(icon512.size < 150_000, `icon-512 is unexpectedly heavy: ${icon512.size}`);
});
