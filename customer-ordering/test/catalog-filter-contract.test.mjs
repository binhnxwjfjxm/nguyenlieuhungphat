import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("catalog models retail and case SKUs as separate purchasable variants", async () => {
  const [contracts, mockData] = await Promise.all([
    read("lib/contracts.ts"),
    read("lib/adapters/mock/mock-catalog.ts"),
  ]);

  assert.match(contracts, /export type PurchaseMode = "retail" \| "case"/);
  assert.match(contracts, /familyId: string/);
  assert.match(contracts, /brand: string/);
  assert.match(contracts, /productType: string/);
  assert.match(contracts, /flavor: string \| null/);
  assert.match(contracts, /size: string/);
  assert.match(contracts, /purchaseMode: PurchaseMode/);
  assert.match(mockData, /purchaseMode: "retail"/);
  assert.match(mockData, /purchaseMode: "case"/);
  assert.match(mockData, /code: "TS-TC-001T"/);
  assert.match(mockData, /giá thùng là giá độc lập/);
});

test("catalog replaces old demo groups with foodservice industries", async () => {
  const [mockData, home] = await Promise.all([
    read("lib/adapters/mock/mock-catalog.ts"),
    read("components/home-screen.tsx"),
  ]);

  for (const label of ["Trà sữa", "Mỳ cay", "Đông lạnh", "Ăn vặt", "Bao bì"]) {
    assert.match(mockData, new RegExp(label));
    assert.match(home, new RegExp(label));
  }

  assert.doesNotMatch(mockData, /name: "Bột mì"/);
  assert.doesNotMatch(mockData, /name: "Đường"/);
  assert.doesNotMatch(mockData, /name: "Tinh bột"/);
  assert.doesNotMatch(mockData, /name: "Phụ gia"/);
});

test("catalog keeps the main UI compact while exposing detailed filters on demand", async () => {
  const [catalog, css, layout] = await Promise.all([
    read("components/product-catalog.tsx"),
    read("app/catalog-polish.css"),
    read("app/layout.tsx"),
  ]);

  assert.match(catalog, /Mua lẻ/);
  assert.match(catalog, /Mua thùng/);
  assert.match(catalog, /<details className="catalog-filter-menu">/);
  assert.match(catalog, /Thương hiệu/);
  assert.match(catalog, /Loại/);
  assert.match(catalog, /Vị/);
  assert.match(catalog, /Size/);
  assert.match(catalog, /activeDetailFilterCount/);
  assert.match(css, /\.catalog-filter-panel/);
  assert.match(css, /position: absolute/);
  assert.match(layout, /import "\.\/catalog-polish\.css"/);
});

test("catalog and detail switch the exact retail or case SKU before carting", async () => {
  const [catalog, detail] = await Promise.all([
    read("components/product-catalog.tsx"),
    read("components/product-detail.tsx"),
  ]);

  assert.match(catalog, /selectedVariantByFamily/);
  assert.match(catalog, /selected\.id/);
  assert.match(catalog, /addOne\(selected\)/);
  assert.match(detail, /familyVariants/);
  assert.match(detail, /candidate\.familyId === item\.familyId/);
  assert.match(detail, /variant\.id === product\.id/);
  assert.match(detail, /Giá thùng là giá riêng theo SKU thùng/);
});
