import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildProductSeriesIndex, normalizeSeriesText, productSeriesVariantLabel } from "../lib/product-series.mjs";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("generated catalog groups real Siro Mama flavor families into one card", async () => {
  const generated = JSON.parse(await read("lib/adapters/mock/generated-catalog.json"));
  const products = generated.products;
  const index = buildProductSeriesIndex(products);
  const mamaRetail = products.filter((product) =>
    product.purchaseMode === "retail"
    && normalizeSeriesText(product.name).startsWith("siro mama "));

  assert.ok(mamaRetail.length >= 4, `expected several Siro Mama variants, got ${mamaRetail.length}`);
  const groupKeys = new Set(mamaRetail.map((product) => index.groupKeyBySku.get(product.sku)));
  assert.equal(groupKeys.size, 1);
  const groupKey = [...groupKeys][0];
  const group = index.groupsByKey.get(groupKey);
  assert.ok(group);
  assert.equal(normalizeSeriesText(group.name), "siro mama");
  const variantLabels = new Set(mamaRetail.map((product) => normalizeSeriesText(productSeriesVariantLabel(product, group))).filter(Boolean));
  assert.ok(variantLabels.size >= 4, `expected Siro Mama flavor labels, got ${[...variantLabels].join(", ")}`);

  const overGrouped = index.groups.filter((candidate) => {
    const familyCount = new Set(candidate.products.map((product) => product.familySku)).size;
    if (familyCount < 2) return false;
    return normalizeSeriesText(candidate.name) === normalizeSeriesText(candidate.products[0]?.productType);
  });
  assert.equal(overGrouped.length, 0, `generic product types must not become series: ${overGrouped.map((groupItem) => groupItem.name).join(", ")}`);
});

test("catalog cards and quick view consume the same product series index", async () => {
  const catalog = await read("components/product-catalog.tsx");
  assert.match(catalog, /buildProductSeriesIndex\(products\)/);
  assert.match(catalog, /seriesIndex\.groupKeyBySku/);
  assert.match(catalog, /seriesIndex\.groupsByKey/);
  assert.match(catalog, /productSeriesVariantLabel/);
  assert.match(catalog, /selectedSkuByGroup/);
  assert.match(catalog, /catalog-price-columns/);
  assert.match(catalog, /catalog-card-price/);
  assert.match(catalog, /catalog-card-price">\{formatPrice\(selected\)\}/);
  assert.doesNotMatch(catalog, /function productCardGroupKey/);
  assert.doesNotMatch(catalog, /stripTrailingVariantValue/);
});

test("catalog renders twenty product groups first and expands without rebuilding every group on card toggle", async () => {
  const catalog = await read("components/product-catalog.tsx");
  assert.match(catalog, /INITIAL_VISIBLE_GROUPS = 20/);
  assert.match(catalog, /LOAD_MORE_GROUPS = 20/);
  assert.match(catalog, /productGroups\.slice\(0, visibleGroupCount\)/);
  assert.match(catalog, /visibleProductGroups\.map/);
  assert.match(catalog, /Xem thêm/);
  assert.match(catalog, /const entries = new Map/);
  assert.doesNotMatch(catalog, /const visibleVariants = filteredVariants\.filter/);
  assert.match(catalog, /selected = chooseGroupPreferred\(visibleVariants\.length > 0 \? visibleVariants : variants/);
});

test("quick order renders every exact SKU through the memoized list with its own visible price", async () => {
  const source = await read("components/quick-order.tsx");
  assert.doesNotMatch(source, /groupProductChoicesByBrand/);
  assert.doesNotMatch(source, /<details className="quick-product-group"/);
  assert.match(source, /const QuickOrderProductList = memo/);
  assert.match(source, /products\.map\(\(product\)/);
  assert.match(source, /products=\{filteredProducts\}/);
  assert.match(source, /formatPrice\(product\)/);
  assert.match(source, /quick-product-mode-price/);
  assert.match(source, /key=\{product\.sku\}/);
  assert.match(source, /nextLines\.findIndex\(\(line\) => line\.sku === product\.sku\)/);
  assert.match(source, /nextLines\.push\(\{ sku: product\.sku, quantity: 1 \}\)/);
  assert.match(source, /Mua lẻ/);
  assert.match(source, /Mua thùng/);
});

test("quick view is portaled above the app scroll container and the copy owns mobile scrolling", async () => {
  const [catalog, css] = await Promise.all([
    read("components/product-catalog.tsx"),
    read("app/product-grouping.css"),
  ]);
  assert.match(catalog, /createPortal/);
  assert.match(catalog, /document\.body/);
  assert.match(catalog, /onClick=\{\(\) => setQuickViewSku\(null\)\}/);
  assert.match(catalog, /onClick=\{\(event\) => event\.stopPropagation\(\)\}/);
  assert.doesNotMatch(catalog, /onMouseDown=/);
  assert.match(css, /\.product-quick-view-backdrop\s*\{[^}]*position:\s*fixed/);
  assert.match(css, /\.product-quick-view-copy,[\s\S]*overflow-y:\s*auto/);
  assert.match(css, /\.product-quick-view-copy,[\s\S]*touch-action:\s*pan-y/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*align-items:\s*flex-end/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*max-height:\s*calc\(100dvh - 8px - env\(safe-area-inset-top\)\)/);
  assert.match(catalog, /document\.body\.style\.overflow = "hidden"/);
  assert.match(catalog, /quickViewDialogRef/);
  assert.match(catalog, /quickViewCloseRef/);
  assert.match(catalog, /quickViewOpenerRef/);
});

test("shared customer logo reuses the website company asset and lets Next optimize delivery", async () => {
  const [logo, shell, login] = await Promise.all([
    read("components/customer-logo.tsx"),
    read("components/app-shell.tsx"),
    read("components/login-card.tsx"),
  ]);
  assert.match(logo, /CUSTOMER_LOGO_SRC = "\/logo-transparent\.png"/);
  assert.doesNotMatch(logo, /unoptimized/);
  assert.match(logo, /sizes=\{`\$\{width\}px`\}/);
  assert.doesNotMatch(logo, /logo-mark\.svg/);
  assert.match(shell, /CustomerLogo/);
  assert.match(login, /CustomerLogo/);
});

test("catalog repair styles load after earlier customer ordering styles", async () => {
  const layout = await read("app/layout.tsx");
  assert.match(layout, /experience-polish\.css";\nimport "\.\/product-grouping\.css";/);
});
