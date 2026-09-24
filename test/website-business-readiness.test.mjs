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

test("website uses confirmed contact data without Customer Ordering navigation", () => {
  const contact = read("lib/contact.ts");
  const header = read("components/header.tsx");
  const footer = read("components/footer.tsx");
  const productsPage = read("app/san-pham/page.tsx");
  const categoryDetail = read("app/nganh-hang/[slug]/page.tsx");
  const websiteSource = `${collectText("app")}\n${collectText("components")}`;

  assert.match(contact, /0396980168/);
  assert.match(header, /Liên hệ/);
  assert.doesNotMatch(header, /CUSTOMER_ORDERING_URL|AppInstallGuide|Đặt hàng|Cài app/);
  assert.doesNotMatch(footer, /CUSTOMER_ORDERING_URL|Đặt hàng khách hàng/);
  assert.doesNotMatch(productsPage, /CUSTOMER_ORDERING_URL|sales\.nguyenlieuhungphat\.com|đặt hàng/i);
  assert.doesNotMatch(categoryDetail, /getCustomerOrderingCategoryUrl|sales\.nguyenlieuhungphat\.com|đặt hàng/i);
  assert.match(footer, /ZALO_URL/);
  assert.match(footer, /PRIVACY_POLICY_PATH/);
  assert.doesNotMatch(footer, /href="#"/);
  assert.doesNotMatch(websiteSource, /0900123456|0900 123 456/);
});

test("website taxonomy exposes the company industries without count-led headings", () => {
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
  assert.match(categorySection, /Các ngành hàng trọng tâm/);
  assert.doesNotMatch(categorySection, /Sáu ngành hàng|>6</);
});

test("catalog labels industry data correctly instead of calling it origin", () => {
  const catalog = read("components/product-catalog.tsx");
  assert.match(catalog, /<span>Ngành hàng<\/span>/);
  assert.match(catalog, /Tất cả ngành hàng/);
  assert.doesNotMatch(catalog, /<span>Xuất xứ<\/span>/);
});

test("contact and recruitment forms disclose privacy handling", () => {
  const contact = read("components/contact-form.tsx");
  const recruitment = read("components/recruitment-form.tsx");
  const privacy = read("app/chinh-sach-bao-mat/page.tsx");
  const sitemap = read("app/sitemap.ts");

  assert.match(contact, /PRIVACY_POLICY_PATH/);
  assert.match(contact, /Chính sách bảo mật/);
  assert.match(recruitment, /PRIVACY_POLICY_PATH/);
  assert.match(recruitment, /Chính sách bảo mật/);
  assert.match(privacy, /0396 980 168|ZALO_PHONE_DISPLAY/);
  assert.match(privacy, /Ngày cập nhật/);
  assert.match(sitemap, /chinh-sach-bao-mat/);
});

test("website uses one company address and type-based capability highlights", () => {
  const contact = read("lib/contact.ts");
  const contactPage = read("app/lien-he/page.tsx");
  const footer = read("components/footer.tsx");
  const recruitment = read("components/recruitment-board.tsx");
  const capability = read("components/company-capability-section.tsx");
  const structuredData = read("components/home-structured-data.tsx");

  assert.match(contact, /152 Yersin, phường Đạo Thạnh, tỉnh Đồng Tháp/);
  assert.match(contactPage, /COMPANY_ADDRESS_DISPLAY/);
  assert.match(footer, /COMPANY_ADDRESS_DISPLAY/);
  assert.match(recruitment, /COMPANY_ADDRESS_DISPLAY/);
  assert.match(structuredData, /COMPANY_ADDRESS_STREET/);
  assert.match(structuredData, /COMPANY_ADDRESS_REGION/);
  assert.match(capability, /<strong>Nguyên liệu<\/strong>[\s\S]*?<small>Pha chế &amp; topping<\/small>/);
  assert.match(capability, /<strong>Thực phẩm<\/strong>[\s\S]*?<small>Đông lạnh &amp; gia vị<\/small>/);
  assert.match(capability, /<strong>Bao bì<\/strong>[\s\S]*?<small>Vật tư vận hành<\/small>/);
  assert.doesNotMatch(capability, /<strong>(?:6|2016|B2B)<\/strong>/);
});

test("industry pages stay inside the Website Company content surface", () => {
  const detail = read("app/nganh-hang/[slug]/page.tsx");
  const productsPage = read("app/san-pham/page.tsx");

  assert.match(detail, /TỔNG QUAN NGÀNH HÀNG/);
  assert.match(detail, /Liên hệ Công Ty/);
  assert.doesNotMatch(detail, /\/san-pham|ProductCard|groupProductFamilies/);
  assert.doesNotMatch(detail, /getCustomerOrderingCategoryUrl|CUSTOMER_ORDERING_URL|Xem catalog đầy đủ/);
  assert.doesNotMatch(productsPage, /CUSTOMER_ORDERING_URL|Xem catalog đầy đủ/);
});

test("chatbot uses the canonical endpoint and discloses privacy handling", () => {
  const chatbot = read("components/chatbot.tsx");
  const privacy = read("app/chinh-sach-bao-mat/page.tsx");

  assert.match(chatbot, /fetch\("\/api\/dialogflow\/chat"/);
  assert.doesNotMatch(chatbot, /fetch\("\/api\/supabase\/chat"/);
  assert.match(chatbot, /Hỗ trợ tự động/);
  assert.match(chatbot, /PRIVACY_POLICY_PATH/);
  assert.match(chatbot, /Nội dung chat có thể được lưu/);
  assert.match(privacy, /hội thoại hỗ trợ trực tuyến/i);
});

test("recruitment content describes the role and uses shared contact data", () => {
  const page = read("app/tuyen-dung/page.tsx");
  const board = read("components/recruitment-board.tsx");

  assert.match(page, /Tuyển nhân viên kinh doanh thị trường miền Tây/);
  assert.doesNotMatch(page, /dạng hàng ngang/);
  assert.doesNotMatch(board, /Nam, độ tuổi 22 - 35/);
  assert.match(board, /COMPANY_ADDRESS_DISPLAY/);
  assert.match(board, /ZALO_PHONE_DISPLAY/);
});
