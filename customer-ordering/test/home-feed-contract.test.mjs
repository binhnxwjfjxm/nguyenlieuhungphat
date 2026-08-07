import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("home keeps products on one horizontal row, shared category priority and latest customer-facing announcement", async () => {
  const [home, categoryOrder, preview, css] = await Promise.all([
    read("components/home-screen.tsx"),
    read("lib/category-order.ts"),
    read("components/home-announcement-preview.tsx"),
    read("app/home-category-icons.css"),
  ]);

  assert.match(home, /sortCustomerCategories\(MOCK_CATEGORIES\)/);
  assert.match(home, /href=\{`\/products\?category=\$\{encodeURIComponent\(category\.id\)\}`\}/);
  assert.match(categoryOrder, /CUSTOMER_CATEGORY_PRIORITY/);
  for (const id of ["milk-tea", "spicy-noodle", "frozen", "snacks", "packaging", "sauce-seasoning"]) assert.match(categoryOrder, new RegExp(`"${id}"`));
  assert.match(home, /className="home-product-scroller"/);
  assert.doesNotMatch(home, /product-grid home-product-grid/);
  assert.match(home, /<HomeAnnouncementPreview \/>/);
  assert.match(css, /\.home-product-scroller\s*\{[\s\S]*display:\s*flex;[\s\S]*overflow-x:\s*auto;/);
  assert.match(css, /\.home-product-scroller \.home-product-card\s*\{[\s\S]*flex:\s*0 0/);

  assert.match(preview, /createCustomerOrderingService/);
  assert.match(preview, /service\.listAnnouncements\(\)/);
  assert.match(preview, /items\.find\(\(item\) => item\.kind === "promotion" \|\| item\.kind === "company"\)/);
  assert.match(preview, /Sự kiện & tin tức/);
  assert.match(preview, /href=\{`\/news\/\$\{announcement\.id\}`\}/);
  assert.doesNotMatch(preview, /MOCK_ANNOUNCEMENTS/);
});
