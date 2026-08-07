import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("catalog groups strictly by family SKU and never invents a brand from product type", async () => {
  const [catalog, grouping] = await Promise.all([
    read("components/product-catalog.tsx"),
    read("lib/product-grouping.ts"),
  ]);
  assert.match(grouping, /return clean\(product\.brand, "Hưng Phát"\)/);
  assert.match(grouping, /return clean\(product\.productType/);
  assert.match(grouping, /return clean\(product\.familySku, product\.sku\)/);
  assert.doesNotMatch(grouping, /inferredBrandFromDetail/);
  assert.doesNotMatch(catalog, /groupProductChoicesByBrand/);
  assert.match(catalog, /selectedSkuByFamily/);
  assert.match(catalog, /catalog-price-columns/);
  assert.match(catalog, /catalog-card-price/);
  assert.match(catalog, /catalog-card-price">\{formatPrice\(selected\)\}/);
  assert.doesNotMatch(catalog, /formatPrice\(retail\)/);
  assert.doesNotMatch(catalog, /formatPrice\(caseVariant\)/);
  assert.match(catalog, /quickViewFlavorOptions/);
  assert.match(catalog, /quickViewSizeOptions/);
  assert.match(catalog, /quickViewPurchaseModes/);
});

test("quick order renders every exact SKU with its own visible price", async () => {
  const source = await read("components/quick-order.tsx");
  assert.doesNotMatch(source, /groupProductChoicesByBrand/);
  assert.doesNotMatch(source, /<details className="quick-product-group"/);
  assert.match(source, /visibleProducts\.map\(\(product\)/);
  assert.match(source, /formatPrice\(product\)/);
  assert.match(source, /quick-product-mode-price/);
  assert.match(source, /quantities\[product\.sku\]/);
  assert.match(source, /nextLines\.push\(\{ sku, quantity \}\)/);
  assert.match(source, /Mua lẻ/);
  assert.match(source, /Mua thùng/);
});

test("quick view keeps the page locked while the modal owns bounded vertical scrolling", async () => {
  const [catalog, css] = await Promise.all([
    read("components/product-catalog.tsx"),
    read("app/product-grouping.css"),
  ]);
  assert.match(css, /\.product-quick-view-backdrop\s*\{[^}]*overflow:\s*hidden/);
  assert.match(css, /\.product-quick-view-tall\s*\{[^}]*max-height:\s*min\(88dvh,\s*760px\)/);
  assert.match(css, /\.product-quick-view-tall\s*\{[^}]*overflow-y:\s*auto/);
  assert.doesNotMatch(css, /\.product-quick-view-tall\s*\{[^}]*max-height:\s*none/);
  assert.match(css, /\.product-choice-chips[\s\S]*flex-wrap:\s*wrap/);
  assert.match(css, /\.product-choice-chips[\s\S]*overflow:\s*visible/);
  assert.doesNotMatch(css, /\.product-choice-chips\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(catalog, /document\.body\.style\.overflow = "hidden"/);
  assert.match(catalog, /quickViewDialogRef/);
  assert.match(catalog, /quickViewCloseRef/);
  assert.match(catalog, /quickViewOpenerRef/);
  assert.match(catalog, /event\.key !== "Tab"/);
  assert.match(catalog, /opener\?\.focus\(\)/);
});

test("shared customer logo uses the bundled known-good asset", async () => {
  const [logo, shell, login] = await Promise.all([
    read("components/customer-logo.tsx"),
    read("components/app-shell.tsx"),
    read("components/login-card.tsx"),
  ]);
  assert.match(logo, /CUSTOMER_LOGO_SRC = "\/logo-transparent\.png"/);
  assert.match(logo, /src=\{CUSTOMER_LOGO_SRC\}/);
  assert.doesNotMatch(logo, /NEXT_PUBLIC_CUSTOMER_LOGO_URL/);
  assert.doesNotMatch(logo, /app-customer\/image-system/);
  assert.match(shell, /CustomerLogo/);
  assert.match(login, /CustomerLogo/);
});

test("catalog repair styles load after earlier customer ordering styles", async () => {
  const layout = await read("app/layout.tsx");
  assert.match(layout, /experience-polish\.css";\nimport "\.\/product-grouping\.css";/);
});
