import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("product popup keeps flavor lists compact and bulk-adds exact canonical SKUs in one cart save", async () => {
  const catalog = await read("components/product-catalog.tsx");
  assert.match(catalog, /INITIAL_VISIBLE_VARIANTS = 6/);
  assert.match(catalog, /bulkMode/);
  assert.match(catalog, /bulkSelected/);
  assert.match(catalog, /bulkChoices/);
  assert.match(catalog, /addBulkToCart/);
  assert.match(catalog, /Chọn nhiều vị/);
  assert.match(catalog, /\+\{hiddenVariantCount\} vị khác/);
  assert.match(catalog, /Xem thêm \{hiddenVariantCount\} vị/);
  assert.match(catalog, /bulkSelectedEntries/);
  assert.match(catalog, /nextLines\.findIndex\(\(line\) => line\.sku === product\.sku\)/);
  assert.match(catalog, /service\.saveCart\(\{ lines: nextLines/);
  assert.match(catalog, /formatPrice\(product\)/);
});

test("quick order keeps one top query while the left rail owns purchase/category filtering", async () => {
  const quickOrder = await read("components/quick-order.tsx");
  assert.match(quickOrder, /quick-order-search-top/);
  assert.match(quickOrder, /Lọc nhanh tên, nhãn, vị, quy cách/);
  assert.doesNotMatch(quickOrder, /Lọc nhanh tên, nhãn, SKU/);
  assert.match(quickOrder, /ref=\{searchInputRef\}/);
  assert.match(quickOrder, /quick-filter-rail/);
  assert.match(quickOrder, /quick-filter-mode/);
  assert.match(quickOrder, /quick-filter-categories/);
  assert.match(quickOrder, /productTypeOptions\.map/);
  assert.doesNotMatch(quickOrder, /quick-order-summary|quick-order-sticky-search|addSelectedToCart/);
});

test("final interaction stylesheet keeps bulk UI while the final quick-order layer owns rail and navigation glow", async () => {
  const [layout, interactionCss, railCss] = await Promise.all([
    read("app/layout.tsx"),
    read("app/interaction-polish.css"),
    read("app/quick-order-rail.css"),
  ]);
  assert.match(layout, /home-category-icons\.css";\nimport "\.\/interaction-polish\.css";/);
  assert.match(layout, /motion\.css";\nimport "\.\/quick-order-rail\.css";/);
  assert.match(interactionCss, /\.catalog-family-card\s*\{[^}]*box-shadow:/s);
  assert.match(interactionCss, /\.bulk-variant-grid/);
  assert.match(interactionCss, /\.bulk-add-summary/);
  assert.match(railCss, /\.quick-filter-rail/);
  assert.match(railCss, /\.quick-direct-add/);
  assert.match(railCss, /\.bottom-navigation::after/);
  assert.match(railCss, /@media \(max-width: 430px\)/);
});
