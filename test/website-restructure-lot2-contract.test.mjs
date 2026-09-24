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
  assert.match(files, /Liên hệ Công Ty|Liên hệ ngay/);
});

test("lot 2 compact homepage system includes responsive grids and light cards", () => {
  const css = read("app/company-site-v2.css");

  assert.match(css, /\.company-category-grid \{[\s\S]*repeat\(3/);
  assert.match(css, /\.brand-logo-grid \{[\s\S]*repeat\(auto-fit, minmax\(118px, 148px\)\)/);
  assert.match(css, /\.home-guide-grid \{[\s\S]*repeat\(3/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.brand-logo-grid \{[\s\S]*repeat\(auto-fit, minmax\(112px, 138px\)\)/);
  assert.match(css, /box-shadow: 0 7px 24px rgba\(26, 58, 48, 0\.045\)/);
});
