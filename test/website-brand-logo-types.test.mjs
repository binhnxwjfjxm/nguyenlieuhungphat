import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("website uses product types instead of promotional count highlights", () => {
  const sources = [
    "components/hero.tsx",
    "components/category-section.tsx",
    "components/company-capability-section.tsx",
    "app/gioi-thieu/page.tsx",
    "app/nang-luc/page.tsx",
    "app/nhan-hang/page.tsx",
  ].map(read).join("\n");

  assert.doesNotMatch(sources, />2016</);
  assert.doesNotMatch(sources, />6</);
  assert.doesNotMatch(sources, /Sáu ngành hàng|6 · Ngành hàng|nhãn hàng đang có dữ liệu/);
  assert.match(sources, /Nguyên liệu pha chế|Pha chế/);
  assert.match(sources, /Thực phẩm/);
  assert.match(sources, /Bao bì/);
});

test("brand surfaces render verified logo images only", () => {
  const data = read("data/brands.ts");
  const section = read("components/brand-section.tsx");
  const page = read("app/nhan-hang/page.tsx");

  assert.match(data, /https:\/\/cozy\.vn\/wp-content\/uploads\/2023\/06\/logo\.png/);
  assert.match(data, /https:\/\/coffee\.phuclong\.com\.vn\//);
  assert.match(data, /https:\/\/richs\.com\.vn\//);
  assert.doesNotMatch(data, /brandInitials|familyCount|categoryCount|sampleFamilies/);

  for (const source of [section, page]) {
    assert.match(source, /brand-logo-image/);
    assert.doesNotMatch(source, /brand-mark|brand-name|\{brands\.length\}|familyCount|categoryCount/);
    assert.doesNotMatch(source, /HapticLink|\/san-pham\?q=/);
  }

  assert.match(data, /name: \"Berrino\"/);
  assert.match(data, /name: \"DINGFONG\"/);
  assert.match(data, /name: \"GTP\"/);
  assert.match(data, /gtp\.com\.vn\/assets2\/images\/logo\/logo\.png/);

  const css = read("app/company-site-v2.css");
  assert.match(css, /\.brand-logo-grid \{[\s\S]*repeat\(auto-fit, minmax\(118px, 148px\)\)/);
  assert.match(css, /\.brand-logo-tile \{[\s\S]*min-height: 82px/);
  assert.match(css, /\.brand-logo-image \{[\s\S]*max-width: min\(86%, 124px\)/);
});

test("industry pages stay editorial and do not route into product detail", () => {
  const section = read("components/category-section.tsx");
  const landing = read("app/nganh-hang/page.tsx");
  const detail = read("app/nganh-hang/[slug]/page.tsx");

  assert.doesNotMatch(section, /href=\"\/san-pham\"|\/san-pham\?/);
  assert.doesNotMatch(landing, /Sáu ngành hàng|sáu nhóm ngành hàng/i);
  assert.match(detail, /TỔNG QUAN NGÀNH HÀNG/);
  assert.match(detail, /Nội dung chuyên sâu sẽ tiếp tục được hoàn thiện riêng theo từng ngành hàng/);
  assert.doesNotMatch(detail, /ProductCard|groupProductFamilies|productVariantLabel|\/san-pham/);
});
