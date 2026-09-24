import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("lot 1 design layer loads after legacy styles", () => {
  const layout = read("app/layout.tsx");
  const warm = layout.indexOf('import "./hung-phat-warm-gold.css";');
  const v2 = layout.indexOf('import "./company-site-v2.css";');

  assert.ok(warm >= 0);
  assert.ok(v2 > warm);
});

test("lot 1 header is presentation-only and compact", () => {
  const header = read("components/header.tsx");
  const design = read("app/company-site-v2.css");

  assert.match(header, /href="\/lien-he"/);
  assert.doesNotMatch(header, /CUSTOMER_ORDERING_URL|AppInstallGuide|QuoteButton|Đặt hàng|Cài app/);
  assert.match(design, /\.header-inner \{[\s\S]*min-height: 68px !important;/);
  assert.match(design, /\.icon-button \{[\s\S]*38px/);
});

test("lot 1 hero uses company-introduction language and internal links only", () => {
  const hero = read("components/hero.tsx");

  assert.match(hero, /Nguyên liệu chất lượng/);
  assert.match(hero, /Đồng hành cùng tăng trưởng/);
  assert.match(hero, /reference-home-hero/);
  assert.match(hero, /Khám phá ngành hàng/);
  assert.match(hero, /Giới thiệu về Hưng Phát/);
  assert.doesNotMatch(hero, /Nhận báo giá|Đặt hàng|CUSTOMER_ORDERING_URL|sales\.nguyenlieuhungphat\.com/);
});
