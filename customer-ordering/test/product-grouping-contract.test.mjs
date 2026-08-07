import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("catalog groups brand-first while preserving exact SKU selection and price", async () => {
  const [catalog, grouping] = await Promise.all([
    read("components/product-catalog.tsx"),
    read("lib/product-grouping.ts"),
  ]);
  assert.match(grouping, /productDisplayBrand/);
  assert.match(grouping, /productDisplayType/);
  assert.match(grouping, /inferredBrandFromDetail/);
  assert.match(grouping, /productFlavorValue/);
  assert.match(grouping, /productSizeLabel/);
  assert.match(catalog, /groupProductChoicesByBrand/);
  assert.match(catalog, /quickViewFlavorOptions/);
  assert.match(catalog, /quickViewSizeOptions/);
  assert.match(catalog, /quickViewPurchaseModes/);
  assert.match(catalog, /quickViewProduct\.sku/);
  assert.match(catalog, /formatPrice\(quickViewProduct\)/);
});

test("quick order supports grouped multi-selection with exact SKU quantities", async () => {
  const source = await read("components/quick-order.tsx");
  assert.match(source, /groupProductChoicesByBrand/);
  assert.match(source, /toggleGroupSelection/);
  assert.match(source, /type="checkbox"/);
  assert.match(source, /quantities\[product\.sku\]/);
  assert.match(source, /nextLines\.push\(\{ sku, quantity \}\)/);
  assert.match(source, /productFlavorValue/);
  assert.match(source, /productSizeLabel/);
  assert.match(source, /Mua lẻ/);
  assert.match(source, /Mua thùng/);
});

test("product quick view is tall, touch-scrollable, and traps focus", async () => {
  const [catalog, css] = await Promise.all([
    read("components/product-catalog.tsx"),
    read("app/product-grouping.css"),
  ]);
  assert.match(css, /height:\s*min\(92dvh,\s*860px\)/);
  assert.match(css, /height:\s*94dvh/);
  assert.match(css, /overflow-y:\s*auto/);
  assert.match(css, /overscroll-behavior:\s*contain/);
  assert.match(css, /-webkit-overflow-scrolling:\s*touch/);
  assert.match(css, /touch-action:\s*pan-y/);
  assert.match(catalog, /quickViewDialogRef/);
  assert.match(catalog, /quickViewCloseRef/);
  assert.match(catalog, /quickViewOpenerRef/);
  assert.match(catalog, /event\.key !== "Tab"/);
  assert.match(catalog, /opener\?\.focus\(\)/);
});

test("shared customer logo prefers the R2 image for header and login", async () => {
  const [logo, shell, login] = await Promise.all([
    read("components/customer-logo.tsx"),
    read("components/app-shell.tsx"),
    read("components/login-card.tsx"),
  ]);
  assert.match(logo, /pub-7d2987fab97d4e3ebb2021a823973862\.r2\.dev/);
  assert.match(logo, /app-customer\/image-system\/logo-app-customer\.png/);
  assert.match(logo, /unoptimized=\{remote\}/);
  assert.match(logo, /logo-transparent\.png/);
  assert.match(shell, /CustomerLogo/);
  assert.match(login, /CustomerLogo/);
});

test("product grouping styles load after earlier customer ordering styles", async () => {
  const layout = await read("app/layout.tsx");
  assert.match(layout, /experience-polish\.css";\nimport "\.\/product-grouping\.css";/);
});
