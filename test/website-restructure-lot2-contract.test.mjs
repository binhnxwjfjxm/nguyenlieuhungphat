import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("lot 2 homepage follows the company presentation sequence", () => {
  const page = read("app/page.tsx");
  const expected = [
    "<Hero />",
    "<CategorySection />",
    "<BrandSection />",
    "<CompanyCapabilitySection />",
    "<HomeGuideSection />",
    "<CompanyContactCta />",
  ];

  let cursor = -1;
  for (const marker of expected) {
    const next = page.indexOf(marker);
    assert.ok(next > cursor, `${marker} must appear in the intended homepage sequence`);
    cursor = next;
  }

  assert.doesNotMatch(page, /ProductSection|AudienceSection|ProcessSection|QuoteCta|TrustSection/);
});

test("lot 2 brand section uses verified official logos only", () => {
  const brand = read("components/brand-section.tsx");
  const brandData = read("data/brands.ts");

  assert.match(brandData, /productFamilies/);
  assert.match(brandData, /logoSrc/);
  assert.match(brandData, /sourceUrl/);
  assert.doesNotMatch(brandData, /brandInitials|familyCount|categoryCount|sampleFamilies/);
  assert.doesNotMatch(brand, /brand-mark|brand-name|\{brands\.length\}/);
  assert.match(brand, /brand-logo-image/);
  assert.match(brand, /id="nhan-hang"/);
});

test("lot 2 homepage keeps transactional language out of key presentation sections", () => {
  const files = [
    "components/category-section.tsx",
    "components/brand-section.tsx",
    "components/company-capability-section.tsx",
    "components/home-guide-section.tsx",
    "components/company-contact-cta.tsx",
    "components/footer.tsx",
  ].map(read).join("\n");

  assert.doesNotMatch(files, /CUSTOMER_ORDERING_URL|sales\.nguyenlieuhungphat\.com|Đặt hàng khách hàng|Cài app/);
  assert.doesNotMatch(files, /Nhận báo giá|Gửi báo giá|Chốt đơn/);
  assert.match(files, /Liên hệ Công Ty|Gửi thông tin/);
});

test("lot 2 homepage follows the locked visual reference structure", () => {
  const css = read("app/company-site-v2.css");
  const hero = read("components/hero.tsx");
  const category = read("components/category-section.tsx");
  const brand = read("components/brand-section.tsx");
  const capability = read("components/company-capability-section.tsx");
  const guide = read("components/home-guide-section.tsx");
  const cta = read("components/company-contact-cta.tsx");

  assert.match(hero, /reference-home-hero/);
  assert.match(hero, /reference-home-hero-shade/);
  assert.match(category, /reference-category-strip/);
  assert.match(category, /reference-category-image/);
  assert.match(brand, /reference-brand-strip/);
  assert.match(capability, /reference-about-layout/);
  assert.match(guide, /return null/);
  assert.doesNotMatch(guide, /guideItems|reference-guide-grid/);
  assert.match(cta, /reference-contact-banner/);

  assert.match(css, /\.reference-home-hero\{[\s\S]*min-height:560px/);
  assert.match(css, /\.reference-category-strip\{[\s\S]*repeat\(7/);
  assert.match(css, /\.reference-guide-grid\{[\s\S]*repeat\(4/);
  assert.match(css, /\.content-page-v2 \.page-hero-inner\.page-hero-with-image\{[\s\S]*min-height:420px/);
});
