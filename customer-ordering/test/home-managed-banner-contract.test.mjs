import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Home dùng đúng một banner do Công Ty quản lý và banner mở popup chi tiết chương trình", async () => {
  const [home, banner, styles] = await Promise.all([
    read("components/home-screen.tsx"),
    read("components/managed-home-banner.tsx"),
    read("components/home-screen.module.css"),
  ]);
  assert.match(home, /ManagedHomeBanner/);
  assert.doesNotMatch(home, /home-product-section/);
  assert.doesNotMatch(home, /HomeAnnouncementPreview/);
  assert.match(banner, /getHomeContent/);
  assert.match(banner, /content\.sectionTitle/);
  assert.match(banner, /content\.bannerUrl/);
  assert.match(banner, /content\.programContent/);
  assert.match(banner, /AccountModal/);
  assert.match(banner, /aria-haspopup="dialog"/);
  assert.match(banner, /setDetailOpen\(true\)/);
  assert.match(styles, /\.programDetail/);
});

test("Customer Ordering proxy và adapter nhận đầy đủ home-content từ Công Ty", async () => {
  const [contracts, adapter, mock, proxy] = await Promise.all([
    read("lib/contracts.ts"),
    read("lib/adapters/core/core-customer-ordering-adapter.ts"),
    read("lib/adapters/mock/mock-customer-ordering-adapter.ts"),
    read("app/api/customer-portal/[...path]/route.ts"),
  ]);
  assert.match(contracts, /interface CustomerHomeContent/);
  assert.match(contracts, /programContent: string/);
  assert.match(contracts, /getHomeContent/);
  assert.match(adapter, /requestPortal<\{ homeContent: CustomerHomeContent \}>\("\/home-content"\)/);
  assert.match(mock, /programContent: ""/);
  assert.match(proxy, /"home-content"/);
});
