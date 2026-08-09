import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const [account, addressFields, accessGate, shell, lifecycle, manifest, layout, sw] = await Promise.all([
  readFile(new URL("../components/account-auth-card.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/vietnam-address-fields.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/customer-portal-access-gate.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/app-shell.tsx", import.meta.url), "utf8"),
  readFile(new URL("../lib/customer-portal-lifecycle.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/manifest.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
]);

test("shop registration restores Vietnam address management and business type", () => {
  assert.match(account, /VietnamAddressFields/);
  assert.match(account, /Mô hình quán \/ loại hình kinh doanh/);
  assert.match(account, /Trà sữa \/ đồ uống/);
  assert.match(account, /businessType: form\.businessType/);
  assert.match(lifecycle, /businessType: string/);
  assert.match(addressFields, /provinceKey\(value\.provinceName\)/);
  assert.match(addressFields, /wardKey\(value\.wardName\)/);
  assert.match(addressFields, /Chọn tỉnh \/ thành phố/);
  assert.match(addressFields, /Chọn xã \/ phường/);
  assert.match(addressFields, /Nhập xã \/ phường/);
  assert.match(addressFields, /disabled=\{disabled \|\| !selectedProvince\}/);
});

test("pre-membership commerce is blocked without redirecting every navigation action back to account", () => {
  assert.doesNotMatch(accessGate, /router\.replace/);
  assert.match(accessGate, /href="\/account#shop-registration"/);
  assert.match(shell, /const content = isAccountRoute \? children : <CustomerPortalAccessGate>\{children\}<\/CustomerPortalAccessGate>/);
  assert.match(shell, /<main className="app-content">\{content\}<\/main>/);
});

test("PWA icon cache uses versioned current icon URLs and existing precache assets", async () => {
  for (const source of [manifest, layout, sw]) assert.match(source, /icon-192-20260809\.png/);
  assert.match(manifest, /icon-512-20260809\.png/);
  assert.match(sw, /"\/icon-192-20260809\.png"/);
  assert.match(sw, /"\/icon-512-20260809\.png"/);
  assert.match(sw, /hp-customer-ordering-shell-v2-20260809/);
  assert.doesNotMatch(sw, /hp-customer-ordering-shell-v1/);
  const [icon192, icon512] = await Promise.all([
    stat(new URL("../public/icon-192-20260809.png", import.meta.url)),
    stat(new URL("../public/icon-512-20260809.png", import.meta.url)),
  ]);
  assert.equal(icon192.isFile(), true);
  assert.equal(icon512.isFile(), true);
  assert.ok(icon192.size > 0);
  assert.ok(icon512.size > 0);
});
