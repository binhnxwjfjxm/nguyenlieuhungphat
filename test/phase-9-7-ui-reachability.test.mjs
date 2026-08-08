import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const page = (href) => href === "/" ? "app/page.tsx" : `app${href}/page.tsx`;

const site = read("data/site.ts");
const header = read("components/header.tsx");
const footer = read("components/footer.tsx");
const envExample = read(".env.example");

const primaryRoutes = ["/", "/gioi-thieu", "/nganh-hang", "/san-pham", "/lien-he", "/tuyen-dung"];

test("Phase 9.7 website primary navigation resolves to real App Router pages", () => {
  assert.match(header, /navigation\.map/);
  for (const href of primaryRoutes) {
    assert.ok(site.includes(`href: \"${href}\"`), `website navigation missing ${href}`);
    assert.ok(existsSync(page(href)), `website route ${href} has no page.tsx`);
  }
  assert.ok(footer.includes("/chinh-sach-bao-mat"), "privacy route must remain reachable from footer");
  assert.ok(existsSync("app/chinh-sach-bao-mat/page.tsx"), "privacy page missing");
});

test("Phase 9.7 website dynamic pages remain intentional drill-down routes", () => {
  assert.ok(existsSync("app/nganh-hang/[slug]/page.tsx"));
  assert.ok(existsSync("app/san-pham/[slug]/page.tsx"));
  assert.match(footer, /`\/nganh-hang\/\$\{category\.slug\}`/);
});

test("Phase 9.7 website source declares its production-facing env names without values in evidence", () => {
  for (const name of [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_R2_ASSET_URL",
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_QUOTE_CHAT_ID",
    "TELEGRAM_ADMIN_CHAT_ID",
    "TELEGRAM_HR_CHAT_ID"
  ]) {
    assert.match(envExample, new RegExp(`^${name}=`, "m"), name);
  }
});
