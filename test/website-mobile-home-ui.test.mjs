import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile("app/page.tsx", "utf8");
const design = await readFile("app/company-site-v2.css", "utf8");
const header = await readFile("components/header.tsx", "utf8");

test("homepage mobile refinements stay scoped to the company presentation surface", () => {
  assert.match(page, /<main className="home-page">/);
  assert.match(design, /@media \(max-width: 760px\)/);
  assert.match(design, /\.hero-stack \{\s*display: none !important;/);
});

test("compact density contract applies to buttons and cards", () => {
  assert.match(design, /\.button \{[\s\S]*min-height: 40px !important;/);
  assert.match(design, /\.button-large \{[\s\S]*min-height: 44px !important;/);
  assert.match(design, /\.product-card-body \{[\s\S]*padding: 15px 15px 17px !important;/);
  assert.match(design, /\.process-step \{[\s\S]*min-height: 0 !important;/);
});

test("mobile navigation uses the clean company tone and contact-only CTA", () => {
  assert.match(design, /\.mobile-menu \{[\s\S]*rgba\(255, 255, 255, 0\.985\)/);
  assert.match(design, /\.mobile-contact-button \{[\s\S]*width: 100%;/);
  assert.match(header, /mobile-contact-button/);
  assert.doesNotMatch(header, /mobile-quote|Cài app|Đặt hàng/);
});
