import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("UI-0 reuses the company logo asset used by the website instead of the temporary mark", async () => {
  const [shell, login, logo] = await Promise.all([
    read("components/app-shell.tsx"),
    read("components/login-card.tsx"),
    read("components/customer-logo.tsx"),
  ]);
  assert.match(shell, /CustomerLogo/);
  assert.match(login, /CustomerLogo/);
  assert.match(logo, /CUSTOMER_LOGO_SRC = "\/logo-transparent\.png"/);
  assert.match(logo, /src=\{CUSTOMER_LOGO_SRC\}/);
  assert.match(logo, /Logo Công ty Hưng Phát/);
  assert.doesNotMatch(logo, /logo-mark\.svg/);
  assert.doesNotMatch(logo, /pub-7d2987fab97d4e3ebb2021a823973862\.r2\.dev/);
  assert.doesNotMatch(logo, /NEXT_PUBLIC_CUSTOMER_LOGO_URL/);
});

test("bottom navigation contains the five locked labels", async () => {
  const shell = await read("components/app-shell.tsx");
  for (const label of ["Trang chủ", "Sản phẩm", "Đặt nhanh", "Đơn hàng", "Tài khoản"]) assert.match(shell, new RegExp(label));
});

test("PWA manifest is standalone and pins the current versioned icons", async () => {
  const manifest = await read("app/manifest.ts");
  assert.match(manifest, /display: "standalone"/);
  assert.match(manifest, /src: "\/icon-192-20260809\.png"/);
  assert.match(manifest, /src: "\/icon-512-20260809\.png"/);
});

test("service worker caches only public shell assets", async () => {
  const worker = await read("public/sw.js");
  assert.match(worker, /SAFE_ASSETS/);
  assert.doesNotMatch(worker, /cache\.put\(request/);
  assert.doesNotMatch(worker, /\/api\//);
});

test("app frame owns the main scroll region and bottom safe area", async () => {
  const css = await read("app/globals.css");
  assert.match(css, /\.app-frame[\s\S]*height: 100dvh/);
  assert.match(css, /\.app-content[\s\S]*overflow-y: auto/);
  assert.match(css, /\.bottom-navigation[\s\S]*var\(--safe-bottom\)/);
});
