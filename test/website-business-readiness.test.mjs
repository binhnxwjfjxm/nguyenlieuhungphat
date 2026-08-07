import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function collectText(path) {
  return readdirSync(new URL(`../${path}`, import.meta.url), { recursive: true })
    .filter((entry) => /\.(?:ts|tsx|js|mjs)$/.test(String(entry)))
    .map((entry) => {
      const fullPath = join(new URL(`../${path}`, import.meta.url).pathname, String(entry));
      return statSync(fullPath).isFile() ? readFileSync(fullPath, "utf8") : "";
    })
    .join("\n");
}

test("website uses the confirmed Zalo contact and customer ordering entry point", () => {
  const contact = read("lib/contact.ts");
  const header = read("components/header.tsx");
  const footer = read("components/footer.tsx");
  const websiteSource = `${collectText("app")}\n${collectText("components")}`;

  assert.match(contact, /0396980168/);
  assert.match(contact, /https:\/\/sales\.nguyenlieuhungphat\.com/);
  assert.match(header, /CUSTOMER_ORDERING_URL/);
  assert.match(header, />Đặt hàng</);
  assert.match(footer, /ZALO_URL/);
  assert.match(footer, /PRIVACY_POLICY_PATH/);
  assert.doesNotMatch(footer, /href="#"/);
  assert.doesNotMatch(websiteSource, /0900123456|0900 123 456/);
});

test("website taxonomy exposes the six customer ordering industries", () => {
  const site = read("data/site.ts");
  const products = read("data/products.ts");
  const categorySection = read("components/category-section.tsx");

  const slugs = [...site.matchAll(/slug:\s*"([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(slugs, [
    "nguyen-lieu-pha-che",
    "nguyen-lieu-mi-cay",
    "hang-dong-lanh",
    "an-vat",
    "bao-bi",
    "gia-vi-sot",
  ]);
  assert.match(products, /code === "BT"/);
  assert.match(products, /code === "AV"/);
  assert.match(products, /return "an-vat"/);
  assert.match(products, /code === "BB"/);
  assert.match(products, /return "bao-bi"/);
  assert.match(products, /code === "GS"/);
  assert.match(products, /return "gia-vi-sot"/);
  assert.match(categorySection, /Sáu ngành hàng ưu tiên/);
});

test("catalog labels industry data correctly instead of calling it origin", () => {
  const catalog = read("components/product-catalog.tsx");
  assert.match(catalog, /<span>Ngành hàng<\/span>/);
  assert.match(catalog, /Tất cả ngành hàng/);
  assert.doesNotMatch(catalog, /<span>Xuất xứ<\/span>/);
});

test("quote and recruitment forms disclose privacy handling", () => {
  const quote = read("components/quote-form.tsx");
  const recruitment = read("components/recruitment-form.tsx");
  const privacy = read("app/chinh-sach-bao-mat/page.tsx");
  const sitemap = read("app/sitemap.ts");

  assert.match(quote, /PRIVACY_POLICY_PATH/);
  assert.match(quote, /Chính sách bảo mật/);
  assert.match(recruitment, /PRIVACY_POLICY_PATH/);
  assert.match(recruitment, /Chính sách bảo mật/);
  assert.match(privacy, /0396 980 168|ZALO_PHONE_DISPLAY/);
  assert.match(privacy, /Ngày áp dụng/);
  assert.match(sitemap, /chinh-sach-bao-mat/);
});
