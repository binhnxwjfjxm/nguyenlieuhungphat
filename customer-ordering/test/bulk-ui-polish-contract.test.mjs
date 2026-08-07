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

test("quick order reuses one query in the sticky cart bar so deep-scroll search stays available", async () => {
  const quickOrder = await read("components/quick-order.tsx");
  assert.match(quickOrder, /quick-order-summary quick-order-summary-search/);
  assert.match(quickOrder, /quick-order-sticky-search/);
  assert.match(quickOrder, /Lọc nhanh tên, nhãn, SKU/);
  assert.match(quickOrder, /value=\{query\}/);
  assert.match(quickOrder, /onChange=\{\(event\) => setQuery\(event\.target\.value\)\}/);
  assert.match(quickOrder, /selectedLines/);
  assert.match(quickOrder, /addSelectedToCart/);
});

test("final interaction stylesheet owns card depth, responsive bulk UI and compact sticky search", async () => {
  const [layout, css] = await Promise.all([
    read("app/layout.tsx"),
    read("app/interaction-polish.css"),
  ]);
  assert.match(layout, /home-category-icons\.css";\nimport "\.\/interaction-polish\.css";/);
  assert.match(css, /\.catalog-family-card\s*\{[^}]*box-shadow:/s);
  assert.match(css, /\.bulk-variant-grid/);
  assert.match(css, /\.bulk-add-summary/);
  assert.match(css, /\.quick-order-summary-search/);
  assert.match(css, /\.quick-order-sticky-search/);
  assert.match(css, /@media \(max-width: 520px\)/);
  assert.match(css, /@media \(min-width: 700px\)/);
});
