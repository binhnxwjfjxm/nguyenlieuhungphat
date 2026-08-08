import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

test("Phase 9.2 Customer Ordering uses same-origin portal BFF and keeps Core secrets server-side", async () => {
  const [adapter, proxy, service, checkout, env] = await Promise.all([
    source("lib/adapters/core/core-customer-ordering-adapter.ts"),
    source("app/api/customer-portal/[...path]/route.ts"),
    source("lib/customer-ordering-service.ts"),
    source("components/checkout-screen.tsx"),
    source(".env.example"),
  ]);
  assert.match(adapter, /session\?\.getToken/);
  assert.match(adapter, /\/api\/customer-portal/);
  assert.match(adapter, /Idempotency-Key/);
  assert.match(adapter, /submissionKey/);
  assert.match(proxy, /CORE_API_BASE_URL/);
  assert.doesNotMatch(proxy, /CORE_API_SERVER_TOKEN|BACKEND_API_TOKEN/);
  assert.match(proxy, /Authorization: authorization/);
  assert.match(service, /CoreCustomerOrderingAdapter/);
  assert.match(service, /NEXT_PUBLIC_CUSTOMER_ORDERING_DATA_MODE/);
  assert.match(checkout, /isRetryable/);
  assert.match(checkout, /retryable/);
  assert.match(env, /CORE_API_BASE_URL=https:\/\/REPLACE_WITH_CORE_API_HOST/);
  assert.doesNotMatch(env, /CORE_API_SERVER_TOKEN|BACKEND_API_TOKEN/);
});

test("Phase 9.2 adapter does not create a second customer/order store", async () => {
  const adapter = await source("lib/adapters/core/core-customer-ordering-adapter.ts");
  assert.match(adapter, /requestPortal<\{ order: CustomerOrder \}>/);
  assert.match(adapter, /requestPortal<\{ orders: CustomerOrder\[\] \}>/);
  assert.doesNotMatch(adapter, /localStorage.*orders|saveOrder|portal_orders/i);
});
