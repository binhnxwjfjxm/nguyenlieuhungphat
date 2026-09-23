import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const audit = readFileSync(new URL('../docs/issue-109-website-restructure-lot0-audit.md', import.meta.url), 'utf8');
const rootPackage = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const orderingPackage = JSON.parse(readFileSync(new URL('../customer-ordering/package.json', import.meta.url), 'utf8'));
const websiteCi = readFileSync(new URL('../.github/workflows/frontend-ci.yml', import.meta.url), 'utf8');

test('issue 109 lot 0 locks Website Company and Customer Ordering as separate surfaces', () => {
  assert.match(audit, /Website Công Ty là presentation\/content surface/);
  assert.match(audit, /Customer Ordering vẫn là order surface riêng/);
  assert.match(audit, /Không sửa \`customer-ordering\/\*\*\` trong Issue #109/);
  assert.equal(rootPackage.scripts.dev, 'next dev -p 3100');
  assert.equal(orderingPackage.scripts.dev, 'next dev -p 3200');
});

test('issue 109 lot 0 locks compact UI density as a cross-lot contract', () => {
  assert.match(audit, /button thon gọn/i);
  assert.match(audit, /card nhẹ/i);
  assert.match(audit, /gọn hơn, nhẹ hơn, ít chrome hơn nhưng vẫn dễ bấm và dễ đọc/i);
  assert.match(audit, /design token\/base class/i);
});

test('issue 109 lot 0 preserves the reference image and CI coverage', () => {
  assert.equal(existsSync(new URL('../anh-tham-khao-tai-cau-truc-noi-dung.png', import.meta.url)), true);
  assert.match(audit, /anh-tham-khao-tai-cau-truc-noi-dung\.png/);
  assert.match(websiteCi, /- "test\/\*\*"/);
  assert.match(websiteCi, /npm run verify/);
});

test('issue 109 lot 0 locks SEO and content migration constraints', () => {
  assert.match(audit, /Không xóa route \`\/san-pham\/\[slug\]\` hoặc \`\/nganh-hang\/\[slug\]\` hàng loạt/);
  assert.match(audit, /\`\/nganh-hang\` = giới thiệu ngành hàng/);
  assert.match(audit, /\`\/cam-nang\` = bài viết\/hướng dẫn/);
  assert.match(audit, /Không được tạo số liệu kiểu số khách hàng\/tỉnh\/thành nếu source không có dữ liệu xác nhận/);
});
