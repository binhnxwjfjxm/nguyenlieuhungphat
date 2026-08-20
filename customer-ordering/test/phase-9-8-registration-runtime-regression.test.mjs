import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const [account, addressFields, accessGate, shell, lifecycle, manifest, layout, worker] = await Promise.all([
  readFile(new URL("../components/account-auth-card.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/vietnam-address-fields.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/customer-portal-access-gate.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/app-shell.tsx", import.meta.url), "utf8"),
  readFile(new URL("../lib/customer-portal-lifecycle.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/manifest.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  readFile(new URL("../public/OneSignalSDKWorker.js", import.meta.url), "utf8"),
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

test("PWA icon cache uses the canonical combined worker and versioned icon URLs", async () => {
  for (const source of [manifest, layout, worker]) assert.match(source, /icon-192-20260809\.png/);
  assert.match(manifest, /icon-512-20260809\.png/);
  assert.match(manifest, /icon-maskable-512-20260820\.png/);
  assert.match(worker, /"\/icon-192-20260809\.png"/);
  assert.match(worker, /"\/icon-512-20260809\.png"/);
  assert.match(worker, /"\/icon-maskable-512-20260820\.png"/);
  assert.match(worker, /hp-customer-ordering-shell-v3-20260820/);
  assert.doesNotMatch(worker, /hp-customer-ordering-shell-v1/);
  const [icon192, icon512, iconMaskable] = await Promise.all([
    stat(new URL("../public/icon-192-20260809.png", import.meta.url)),
    stat(new URL("../public/icon-512-20260809.png", import.meta.url)),
    stat(new URL("../public/icon-maskable-512-20260820.png", import.meta.url)),
  ]);
  for (const icon of [icon192, icon512, iconMaskable]) {
    assert.equal(icon.isFile(), true);
    assert.ok(icon.size > 0);
  }
});
