import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const exists = (path) => existsSync(new URL(`../${path}`, import.meta.url));

test("lot 4 removes legacy transactional surfaces from Website Company", () => {
  const layout = read("app/layout.tsx");
  const contact = read("components/contact-form.tsx");
  const contactLib = read("lib/contact.ts");

  assert.doesNotMatch(layout, /QuoteProvider/);
  assert.doesNotMatch(contact, /QuoteRequest|validateQuote|telegram\/quote|product:|quantity:|area:|usage:/);
  assert.doesNotMatch(contactLib, /CUSTOMER_ORDERING_URL|getCustomerOrderingCategoryUrl|sales\.nguyenlieuhungphat\.com/);

  for (const path of [
    "components/quote-provider.tsx",
    "components/quote-trigger.tsx",
    "components/quote-form.tsx",
    "components/quote-cta.tsx",
    "app/api/telegram/quote/route.ts",
    "app/api/telegram/chat/route.ts",
  ]) {
    assert.equal(exists(path), false, `${path} must be removed`);
  }
});

test("lot 4 contact flow only accepts contact information and freeform content", () => {
  const form = read("components/contact-form.tsx");
  const validation = read("lib/validation.ts");
  const route = read("app/api/telegram/contact/route.ts");

  assert.match(form, /\/api\/telegram\/contact/);
  assert.match(validation, /ContactRequestInput/);
  assert.match(validation, /validateContactInput/);
  assert.match(route, /LIÊN HỆ WEBSITE/);
  assert.match(route, /Nội dung liên hệ/);

  for (const source of [form, route]) {
    assert.doesNotMatch(source, /Số lượng dự kiến|Khu vực giao hàng|Nhận báo giá|Gửi báo giá|BÁO GIÁ WEBSITE/);
  }
});

test("lot 4 public chatbot sends only conversation context, not ordering fields", () => {
  const chatbot = read("components/chatbot.tsx");
  const dialogflow = read("app/api/dialogflow/chat/route.ts");

  assert.doesNotMatch(chatbot, /product:\s*""|quantity:\s*""|area:\s*""|requestCallback:\s*false/);
  assert.match(dialogflow, /ORDERING_GATEWAY_HEADER/);
  assert.match(dialogflow, /gatewayAuth === "authorized"/);
  assert.match(dialogflow, /capability: "advisory-only"/);
});

test("lot 4 privacy and SEO reflect the company-information surface", () => {
  const privacy = read("app/chinh-sach-bao-mat/page.tsx");
  const robots = read("app/robots.ts");
  const sitemap = read("app/sitemap.ts");
  const detail = read("app/san-pham/[slug]/page.tsx");

  assert.doesNotMatch(privacy, /báo giá|số lượng|khu vực giao hàng/i);
  assert.match(privacy, /Ngày cập nhật/);
  assert.match(robots, /disallow:\s*\["\/api\/"\]/);
  assert.match(robots, /host:\s*siteUrl/);
  assert.match(sitemap, /nhan-hang/);
  assert.match(sitemap, /nang-luc/);
  assert.match(sitemap, /cam-nang/);
  assert.doesNotMatch(detail, /"@type":\s*"Offer"|priceCurrency|offers:/);
});
