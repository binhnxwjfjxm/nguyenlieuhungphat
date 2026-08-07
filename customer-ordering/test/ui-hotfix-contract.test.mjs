import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("home starts with search instead of the redundant customer greeting", async () => {
  const home = await read("components/home-screen.tsx");
  assert.doesNotMatch(home, /welcome-row/);
  assert.doesNotMatch(home, /Xin chào,/);
  assert.doesNotMatch(home, /Khách hàng Hưng Phát/);
  assert.match(home, /Tìm sản phẩm hoặc SKU/);
});

test("OneSignal toggle remains actionable while SDK initializes and permission is requested before login", async () => {
  const [preferences, provider] = await Promise.all([
    read("components/notification-preferences.tsx"),
    read("components/onesignal-provider.tsx"),
  ]);
  assert.match(preferences, /disabled=\{push\.busy\}/);
  assert.doesNotMatch(preferences, /disabled=\{push\.busy \|\| push\.status === "loading"\}/);
  assert.match(preferences, /aria-live="polite"/);
  assert.match(preferences, /aria-busy=\{push\.busy\}/);

  const enableStart = provider.indexOf("const enablePush");
  const disableStart = provider.indexOf("const disablePush");
  assert.ok(enableStart >= 0 && disableStart > enableStart);
  const enableBlock = provider.slice(enableStart, disableStart);
  assert.ok(enableBlock.indexOf("requestPermission") >= 0);
  assert.ok(enableBlock.indexOf("sdk.login") >= 0);
  assert.ok(enableBlock.indexOf("requestPermission") < enableBlock.indexOf("sdk.login"));
  assert.match(provider, /Thiết bị chưa đăng ký nhận thông báo/);
  assert.match(provider, /Thiết bị chưa tắt đăng ký thông báo/);
});

test("final hotfix stylesheet centers the cart icon and floats the plus badge", async () => {
  const [layout, css] = await Promise.all([
    read("app/layout.tsx"),
    read("app/ui-hotfix.css"),
  ]);
  assert.match(layout, /ui-hotfix\.css/);
  assert.match(css, /\.catalog-add-icon\s*\{[\s\S]*place-items:\s*center/);
  assert.match(css, /svg:first-child:not\(:only-child\)/);
  assert.match(css, /svg:last-child:not\(:only-child\)/);
  assert.match(css, /translate\(-50%, -50%\)/);
});
