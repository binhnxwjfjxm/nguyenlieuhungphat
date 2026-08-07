import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("catalog models retail and case SKUs as separate purchasable variants", async () => {
  const [contracts, mockData, generator] = await Promise.all([
    read("lib/contracts.ts"), read("lib/adapters/mock/mock-catalog.ts"), read("scripts/generate-catalog-sku.mjs"),
  ]);
  assert.match(contracts, /export type PurchaseMode = "retail" \| "case"/);
  assert.match(contracts, /sku: string/);
  assert.match(contracts, /familySku: string/);
  assert.match(contracts, /purchaseMode: PurchaseMode/);
  assert.match(mockData, /generated-catalog\.json/);
  assert.match(generator, /casePrice/);
});

test("catalog keeps industries, product groups and brands as separate axes", async () => {
  const [generator, home, catalog, grouping, css] = await Promise.all([
    read("scripts/generate-catalog-sku.mjs"), read("components/home-screen.tsx"), read("components/product-catalog.tsx"), read("lib/product-grouping.ts"), read("app/catalog-polish.css"),
  ]);
  for (const label of ["Trà sữa", "Mỳ cay", "Đông lạnh", "Ăn vặt", "Bao bì"]) assert.match(generator, new RegExp(label));
  assert.match(home, /MOCK_CATEGORIES/);
  assert.match(home, /MOCK_PRODUCTS/);
  assert.match(catalog, /Nhóm hàng/);
  assert.match(catalog, /Nhãn hàng/);
  assert.match(catalog, /product\.productType === activeProductType/);
  assert.match(catalog, /product\.brand === filters\.brand/);
  assert.doesNotMatch(grouping, /inferredBrandFromDetail/);
  assert.match(css, /\.catalog-filter-panel/);
  assert.match(css, /position: absolute/);
});

test("catalog keeps the selected exact SKU price on-card while group variants stay selectable", async () => {
  const [catalog, detail] = await Promise.all([read("components/product-catalog.tsx"), read("components/product-detail.tsx")]);
  assert.match(catalog, /selectedSkuByGroup/);
  assert.match(catalog, /familyVariants = variants\.filter\(\(product\) => product\.familySku === selected\.familySku\)/);
  assert.match(catalog, /purchaseMode === "retail"/);
  assert.match(catalog, /purchaseMode === "case"/);
  assert.match(catalog, /catalog-card-price/);
  assert.match(catalog, /formatPrice\(selected\)/);
  assert.match(catalog, /catalog-price-columns/);
  assert.doesNotMatch(catalog, /formatPrice\(retail\)/);
  assert.doesNotMatch(catalog, /formatPrice\(caseVariant\)/);
  assert.match(catalog, /<span>Lẻ<\/span>/);
  assert.match(catalog, /<span>Thùng<\/span>/);
  assert.match(catalog, /quickViewRetail/);
  assert.match(catalog, /quickViewCase/);
  assert.match(catalog, /role="dialog"/);
  assert.match(detail, /familyVariants/);
  assert.match(detail, /candidate\.familySku === item\.familySku/);
  assert.match(detail, /variant\.sku === product\.sku/);
});
