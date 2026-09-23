import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("lot 3 exposes dedicated company content pages", () => {
  for (const path of [
    "app/gioi-thieu/page.tsx",
    "app/nganh-hang/page.tsx",
    "app/nhan-hang/page.tsx",
    "app/nang-luc/page.tsx",
    "app/cam-nang/page.tsx",
    "app/tuyen-dung/page.tsx",
    "app/lien-he/page.tsx",
  ]) {
    assert.equal(existsSync(new URL(`../${path}`, import.meta.url)), true, path);
  }

  const site = read("data/site.ts");
  for (const href of ["/nganh-hang", "/nhan-hang", "/nang-luc", "/cam-nang"]) {
    assert.ok(site.includes(`href: "${href}"`), href);
  }
  assert.doesNotMatch(site, /href: "\/#(?:danh-muc|nhan-hang|nang-luc|cam-nang)"/);
});

test("lot 3 catalog is presentation-only on visible product surfaces", () => {
  const productCard = read("components/product-card.tsx");
  const catalog = read("components/product-catalog.tsx");
  const detail = read("app/san-pham/[slug]/page.tsx");
  const categoryDetail = read("app/nganh-hang/[slug]/page.tsx");
  const products = read("data/products.ts");

  for (const source of [productCard, catalog, detail, categoryDetail]) {
    assert.doesNotMatch(source, /QuoteButton|QuoteForm|QuoteCta|Nhận báo giá|Đặt hàng|Cài app/);
  }

  assert.doesNotMatch(productCard, /localStorage|Heart|save-button/);
  assert.doesNotMatch(products, /Mua sỉ|Báo giá theo nhu cầu|Hỗ trợ đặt hàng số lượng lớn/);
  assert.match(detail, /Liên hệ Công Ty/);
  assert.match(catalog, /Liên hệ Công Ty/);
});

test("lot 3 contact page uses a neutral company contact form", () => {
  const page = read("app/lien-he/page.tsx");
  const form = read("components/contact-form.tsx");

  assert.match(page, /ContactForm/);
  assert.doesNotMatch(page, /QuoteForm|QuoteCta|BÁO GIÁ|số lượng|khu vực giao/i);
  assert.match(form, /Nội dung liên hệ/);
  assert.match(form, /Gửi thông tin/);
  assert.doesNotMatch(form, /Nhận báo giá|Gửi báo giá|Số lượng dự kiến|Khu vực giao hàng/);
});

test("lot 3 brand directory is derived from current product data", () => {
  const data = read("data/brands.ts");
  const page = read("app/nhan-hang/page.tsx");

  assert.match(data, /productFamilies/);
  assert.match(data, /familyCount/);
  assert.match(page, /brands\.map/);
  assert.doesNotMatch(page, /Torani|DingFong|Carisa/);
});

test("lot 3 keeps content cards compact and responsive", () => {
  const css = read("app/company-site-v2.css");

  assert.match(css, /\.company-story-grid/);
  assert.match(css, /\.brand-directory-grid/);
  assert.match(css, /\.capability-page-grid/);
  assert.match(css, /\.contact-v2-grid/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.brand-directory-grid/);
});
