import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const page = (href) => href === "/" ? "app/page.tsx" : `app${href}/page.tsx`;

const shell = read("components/app-shell.tsx");
const cartBadge = read("components/cart-badge.tsx");
const envExample = read(".env.example");

const primaryRoutes = ["/", "/products", "/quick-order", "/orders", "/account"];

test("Phase 9.7 Customer Ordering primary navigation resolves to real App Router pages", () => {
  for (const href of primaryRoutes) {
    assert.ok(shell.includes(`href: \"${href}\"`), `customer navigation missing ${href}`);
    assert.ok(existsSync(page(href)), `customer route ${href} has no page.tsx`);
  }
  assert.match(shell, /href=\"\/news\"/);
  assert.ok(existsSync("app/news/page.tsx"));
  assert.match(cartBadge, /href=\"\/cart\"/);
  assert.ok(existsSync("app/cart/page.tsx"));
});

test("Phase 9.7 Customer Ordering workflow and system routes remain intentional descendants", () => {
  for (const routePath of [
    "app/products/[sku]/page.tsx",
    "app/orders/[orderId]/page.tsx",
    "app/news/[articleId]/page.tsx",
    "app/checkout/page.tsx",
    "app/order-success/[orderId]/page.tsx",
    "app/login/page.tsx",
    "app/login/sso-callback/page.tsx",
    "app/offline/page.tsx"
  ]) assert.ok(existsSync(routePath), `${routePath} missing`);
});

test("Phase 9.7 Customer Ordering keeps Core routing server-owned and declares required env names", () => {
  for (const name of [
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_CUSTOMER_ORDERING_DATA_MODE",
    "CORE_API_BASE_URL",
    "NEXT_PUBLIC_CUSTOMER_LOGO_URL"
  ]) assert.match(envExample, new RegExp(`^${name}=`, "m"), name);
  assert.match(envExample, /^NEXT_PUBLIC_CUSTOMER_ORDERING_DATA_MODE=core$/m);
  assert.doesNotMatch(envExample, /NEXT_PUBLIC_CORE_API_BASE_URL/);
});
