import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

test("Customer Ordering gates commerce on active Core membership instead of weakening catalog 403", async () => {
  const [shell, gate, catalogAdapter] = await Promise.all([
    source("components/app-shell.tsx"),
    source("components/customer-portal-access-gate.tsx"),
    source("lib/adapters/core/core-customer-ordering-adapter.ts"),
  ]);
  assert.match(shell, /CustomerPortalAccessGate/);
  assert.match(shell, /pathname === "\/account" \|\| pathname\.startsWith\("\/account\/"\)/);
  assert.match(shell, /isAccountRoute \? frame/);
  assert.match(gate, /snapshot\.state !== "active_customer"/);
  assert.match(gate, /router\.replace\("\/account#shop-registration"\)/);
  assert.doesNotMatch(gate, /catalog|listProducts|listCategories/);
  assert.match(catalogAdapter, /PAGE_SIZE = 50/);
  assert.match(catalogAdapter, /PAGE_BATCH_SIZE = 4/);
  assert.match(catalogAdapter, /Promise\.all\(offsets\.map/);
});

test("Customer Ordering BFF exposes only the canonical registration and profile lifecycle", async () => {
  const proxy = await source("app/api/customer-portal/[...path]/route.ts");
  assert.match(proxy, /path\[0\] === "registrations" && path\[1\] === "current"/);
  assert.match(proxy, /\["orders", "registrations"\]\.includes\(path\[0\]\)/);
  assert.match(proxy, /path\[2\] === "resubmit"/);
  assert.match(proxy, /method === "PATCH" && path\.length === 1 && path\[0\] === "me"/);
  assert.match(proxy, /export const PATCH = proxy/);
  assert.match(proxy, /Idempotency-Key/);
  assert.doesNotMatch(proxy, /CORE_API_SERVER_TOKEN|BACKEND_API_TOKEN/);
});

test("shop registration and edit use Core as source of truth with retry-stable idempotency", async () => {
  const [account, lifecycle] = await Promise.all([
    source("components/account-auth-card.tsx"),
    source("lib/customer-portal-lifecycle.ts"),
  ]);
  assert.doesNotMatch(account, /localStorage|SHOP_REGISTRATION_STORAGE/);
  assert.match(account, /submitPortalRegistration/);
  assert.match(account, /resubmitPortalRegistration/);
  assert.match(account, /updatePortalProfile/);
  assert.match(account, /expectedCustomerUpdatedAt: profile\.customerUpdatedAt/);
  assert.match(account, /expectedAddressUpdatedAt: profile\.address\.updatedAt/);
  assert.match(account, /state === "need_more_info"/);
  assert.match(account, /state === "active_customer"/);
  assert.match(account, /Boolean\(snapshot\) && editableState/);
  assert.match(account, /Không mở luồng đăng ký hoặc đặt hàng khi chưa xác minh được trạng thái Core/);
  assert.match(account, /Mã khách Core:/);
  assert.match(account, /profile\.customerCode/);
  assert.match(account, /mutationKeyRef/);
  assert.match(account, /crypto\.randomUUID\(\)/);
  assert.match(account, /portalError\?\.retryable/);
  assert.match(account, /IDEMPOTENCY_IN_PROGRESS/);
  assert.match(account, /customer\.address\?\.addressLine1/);
  assert.match(lifecycle, /\/registrations\/current/);
  assert.match(lifecycle, /method: "PATCH"/);
  assert.match(lifecycle, /Idempotency-Key/);
  assert.match(lifecycle, /idempotencyKey: string/);
  assert.doesNotMatch(lifecycle, /portal-registration:|portal-resubmit:|portal-profile:/);
  assert.doesNotMatch(lifecycle, /sourceSystem|sourceOutletId|sourceDemandReference|salesChannelId|defaultWarehouseId/);
});
