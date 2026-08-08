import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const page = (href) => href === "/" ? "app/page.tsx" : `app${href}/page.tsx`;
const literalHrefs = (source) => [...source.matchAll(/href:\s*"([^"]+)"/g)].map((match) => match[1]);

const site = read("data/site.ts");
const header = read("components/header.tsx");
const footer = read("components/footer.tsx");
const contact = read("lib/contact.ts");
const envExample = read(".env.example");

const primaryRoutes = ["/", "/gioi-thieu", "/nganh-hang", "/san-pham", "/lien-he", "/tuyen-dung"];
const footerPrimaryRoutes = ["/gioi-thieu", "/nganh-hang", "/san-pham", "/tuyen-dung", "/lien-he"];

test("Phase 9.7 website primary navigation resolves to real App Router pages", () => {
  const navigationBlock = site.match(/export const navigation\s*=\s*\[([\s\S]*?)\];/);
  assert.ok(navigationBlock, "website navigation declaration missing");
  assert.deepEqual(literalHrefs(navigationBlock[1]), primaryRoutes);
  assert.match(header, /import\s+\{\s*navigation\s*\}\s+from\s+"@\/data\/site"/);
  assert.match(header, /\{navigation\.map\(/);

  for (const href of primaryRoutes) {
    assert.ok(existsSync(page(href)), `website route ${href} has no page.tsx`);
  }

  assert.deepEqual(literalHrefs(footer), footerPrimaryRoutes);
  for (const href of footerPrimaryRoutes) {
    assert.ok(existsSync(page(href)), `website footer route ${href} has no page.tsx`);
  }
  assert.match(footer, /href:\s*PRIVACY_POLICY_PATH/);
  assert.match(contact, /PRIVACY_POLICY_PATH\s*=\s*"\/chinh-sach-bao-mat"/);
  assert.ok(existsSync("app/chinh-sach-bao-mat/page.tsx"), "privacy page missing");
});

test("Phase 9.7 website dynamic pages remain intentional drill-down routes", () => {
  assert.ok(existsSync("app/nganh-hang/[slug]/page.tsx"));
  assert.ok(existsSync("app/san-pham/[slug]/page.tsx"));
  assert.match(footer, /`\/nganh-hang\/\$\{category\.slug\}`/);
});

test("Phase 9.7 website source declares production-facing env names and keeps sensitive examples empty", () => {
  const productionFacingNames = [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_R2_ASSET_URL",
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_QUOTE_CHAT_ID",
    "TELEGRAM_ADMIN_CHAT_ID",
    "TELEGRAM_HR_CHAT_ID"
  ];
  for (const name of productionFacingNames) {
    assert.match(envExample, new RegExp(`^${name}=`, "m"), name);
  }

  for (const name of [
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_QUOTE_CHAT_ID",
    "TELEGRAM_ADMIN_CHAT_ID",
    "TELEGRAM_HR_CHAT_ID"
  ]) {
    assert.match(envExample, new RegExp(`^${name}=\\r?$`, "m"), `${name} must stay empty in .env.example`);
  }
});
