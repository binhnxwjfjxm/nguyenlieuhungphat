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
  assert.match(generator, /endsWith\('T'\)/);
  assert.match(generator, /casePrice/);
});

test("catalog keeps real foodservice industries and compact filters", async () => {
  const [generator, home, catalog, css] = await Promise.all([
    read("scripts/generate-catalog-sku.mjs"), read("components/home-screen.tsx"), read("components/product-catalog.tsx"), read("app/catalog-polish.css"),
  ]);
  for (const label of ["Trà sữa", "Mỳ cay", "Đông lạnh", "Ăn vặt", "Bao bì"]) {
    assert.match(generator, new RegExp(label));
    assert.match(home, new RegExp(label));
  }
  assert.match(catalog, /Mua lẻ/);
  assert.match(catalog, /Mua thùng/);
  assert.match(catalog, /<details className="catalog-filter-menu">/);
  assert.match(catalog, /Thương hiệu/);
  assert.match(catalog, /activeDetailFilterCount/);
  assert.match(css, /\.catalog-filter-panel/);
  assert.match(css, /position: absolute/);
});

test("catalog and detail switch exact SKU variants before carting", async () => {
  const [catalog, detail] = await Promise.all([read("components/product-catalog.tsx"), read("components/product-detail.tsx")]);
  assert.match(catalog, /selectedVariantByFamily/);
  assert.match(catalog, /selected\.sku/);
  assert.match(catalog, /addOne\(selected\)/);
  assert.match(detail, /familyVariants/);
  assert.match(detail, /candidate\.familySku === item\.familySku/);
  assert.match(detail, /variant\.sku === product\.sku/);
  assert.match(detail, /Giá thùng là giá riêng theo SKU thùng/);
});
