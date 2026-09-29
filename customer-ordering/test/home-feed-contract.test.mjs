import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("home giữ ngành hàng chuẩn và dùng một banner Công Ty thay dãy sản phẩm/tin mock", async () => {
  const [home, categoryOrder, banner] = await Promise.all([
    read("components/home-screen.tsx"),
    read("lib/category-order.ts"),
    read("components/managed-home-banner.tsx"),
  ]);

  assert.match(home, /sortCustomerCategories\(MOCK_CATEGORIES\)/);
  assert.match(home, /href=\{`\/products\?category=\$\{encodeURIComponent\(category\.id\)\}`\}/);
  assert.match(categoryOrder, /CUSTOMER_CATEGORY_PRIORITY/);
  for (const id of ["milk-tea", "spicy-noodle", "frozen", "snacks", "packaging", "sauce-seasoning"]) {
    assert.match(categoryOrder, new RegExp(`"${id}"`));
  }
  assert.doesNotMatch(home, /home-product-scroller|home-product-section/);
  assert.doesNotMatch(home, /HomeAnnouncementPreview/);
  assert.match(home, /<ManagedHomeBanner \/>/);
  assert.match(banner, /service\.getHomeContent\(\)/);
  assert.match(banner, /content\.sectionTitle/);
  assert.match(banner, /content\.bannerUrl/);
});
