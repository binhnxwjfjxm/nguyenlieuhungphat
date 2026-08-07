import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("home keeps products on one horizontal row and previews the latest customer-facing announcement through the service boundary", async () => {
  const [home, preview, css] = await Promise.all([
    read("components/home-screen.tsx"),
    read("components/home-announcement-preview.tsx"),
    read("app/home-category-icons.css"),
  ]);

  assert.match(home, /const HOME_CATEGORY_PRIORITY = \[\s*"milk-tea",\s*"spicy-noodle",\s*"frozen",\s*"snacks",\s*"packaging",\s*"sauce-seasoning",\s*\] as const;/);
  assert.match(home, /HOME_CATEGORY_PRIORITY\.flatMap\(\(categoryId\) => MOCK_CATEGORIES\.filter\(\(category\) => category\.id === categoryId\)\)/);
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
