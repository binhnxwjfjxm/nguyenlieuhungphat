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
  }
});
