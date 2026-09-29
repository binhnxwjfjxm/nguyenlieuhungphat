import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("Home dùng đúng một banner do Công Ty quản lý và không còn dãy card sản phẩm", async () => {
  const [home, banner] = await Promise.all([
    read("customer-ordering/components/home-screen.tsx"),
    read("customer-ordering/components/managed-home-banner.tsx"),
  ]);
  assert.match(home, /ManagedHomeBanner/);
  assert.doesNotMatch(home, /home-product-section/);
  assert.doesNotMatch(home, /HomeAnnouncementPreview/);
  assert.match(banner, /getHomeContent/);
  assert.match(banner, /content\.sectionTitle/);
  assert.match(banner, /content\.bannerUrl/);
});

test("Customer Ordering proxy và adapter đọc home-content từ Công Ty", async () => {
  const [contracts, adapter, proxy] = await Promise.all([
    read("customer-ordering/lib/contracts.ts"),
    read("customer-ordering/lib/adapters/core/core-customer-ordering-adapter.ts"),
    read("customer-ordering/app/api/customer-portal/[...path]/route.ts"),
  ]);
  assert.match(contracts, /interface CustomerHomeContent/);
  assert.match(contracts, /getHomeContent/);
  assert.match(adapter, /requestPortal<\{ homeContent: CustomerHomeContent \}>\("\/home-content"\)/);
  assert.match(proxy, /"home-content"/);
});
