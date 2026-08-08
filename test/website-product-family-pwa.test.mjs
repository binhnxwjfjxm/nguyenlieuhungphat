import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("website gom biến thể theo dòng sản phẩm thay vì mỗi vị một card", () => {
  const products = read("data/products.ts");
  const catalog = read("components/product-catalog.tsx");
  const home = read("components/product-section.tsx");
  const card = read("components/product-card.tsx");
  const detail = read("app/san-pham/[slug]/page.tsx");

  assert.match(products, /export type ProductFamily/);
  assert.match(products, /export function productFamilyKey/);
  assert.match(products, /product\.categorySlug/);
  assert.match(products, /normalizeLookup\(product\.brand/);
  assert.match(products, /export function groupProductFamilies/);
  assert.match(products, /export const featuredProductFamilies/);
  assert.match(products, /productFamilyKey\(item\) !== familyKey/);

  assert.match(catalog, /groupProductFamilies\(products\)/);
  assert.match(catalog, /filteredFamilies/);
  assert.match(catalog, /dòng sản phẩm/);
  assert.match(catalog, /variantCount=\{family\.variants\.length\}/);
  assert.match(catalog, /selectedPreview\.variants\.map/);
  assert.match(catalog, /productVariantLabel/);

  assert.match(home, /featuredProductFamilies\.slice\(0, 8\)/);
  assert.match(home, /displayName=\{family\.name\}/);
  assert.match(card, /variantCount > 1/);
  assert.match(detail, /getProductFamily\(product\)/);
  assert.match(detail, /familyVariants\.map/);
});

test("website có hướng dẫn cài PWA đúng origin và đúng iPhone", () => {
  const header = read("components/header.tsx");
  const guide = read("components/app-install-guide.tsx");

  assert.match(header, /AppInstallGuide/);
  assert.match(header, /label="Cài app"/);
  assert.match(header, /label="Cài app đặt hàng"/);
  assert.match(guide, /CUSTOMER_ORDERING_URL/);
  assert.match(guide, /iPhone \/ iPad/);
  assert.match(guide, /Safari/);
  assert.match(guide, /Chia sẻ/);
  assert.match(guide, /Thêm vào Màn hình chính/);
  assert.doesNotMatch(guide, /beforeinstallprompt/i);
});