import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const here = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, here), "utf8");

function constant(source, name) {
  const match = source.match(new RegExp(`const ${name} = \"([^\"]+)\"`));
  return match?.[1] ?? "";
}

test("Customer Ordering assistant is advisory-only and never owns order mutations", async () => {
  const [route, component] = await Promise.all([
    read("app/api/assistant/chat/route.ts"),
    read("components/customer-assistant.tsx"),
  ]);
  assert.match(route, /capability: "advisory-only"/);
  assert.match(route, /\/api\/customer-portal\/me/);
  assert.doesNotMatch(route, /\/orders|\/cart|createOrder|saveCart|submitOrder|addToCart/i);
  assert.match(component, /không tự thêm giỏ hàng, tạo đơn hoặc gửi đơn/i);
  assert.doesNotMatch(component, /saveCart|submitOrder|createCustomerOrderingService|\/api\/customer-portal\/orders/i);
});

test("Customer Ordering records provider usage to the shared ledger with canonical retry identity", async () => {
  const source = await read("lib/ordering-ai-usage.ts");
  assert.match(source, /source: "ordering"/);
  assert.match(source, /feature: "assistant"/);
  assert.match(source, /ORDERING_AI_API_TOKEN/);
  assert.match(source, /"Idempotency-Key": input\.idempotencyKey/);
  assert.match(source, /for \(let attempt = 0; attempt < 3; attempt \+= 1\)/);
  assert.doesNotMatch(source, /Idempotency-Key.*randomUUID|attempt.*randomUUID/s);
});

test("Customer Ordering uses the same canonical Dialogflow CX agent as Website", async () => {
  const [orderingSource, websiteSource] = await Promise.all([
    read("lib/dialogflow.ts"),
    read("../lib/dialogflow.ts"),
  ]);
  for (const name of ["DEFAULT_PROJECT_ID", "DEFAULT_CONSUMER_PROJECT_ID", "DEFAULT_LOCATION", "DEFAULT_AGENT_ID"]) {
    assert.ok(constant(orderingSource, name), `${name} missing from Ordering adapter`);
    assert.equal(constant(orderingSource, name), constant(websiteSource, name), `${name} must match Website`);
  }
  assert.match(orderingSource, /x-goog-user-project/);
  assert.match(orderingSource, /requestCount: 1/);
  assert.match(orderingSource, /billingUnit: "text-request"/);
});

test("Home exposes Hỏi Hưng Phát without replacing the ordering flow", async () => {
  const home = await read("components/home-screen.tsx");
  assert.match(home, /href="\/assistant"/);
  assert.match(home, />Hỏi Hưng Phát</);
  assert.match(home, /href="\/quick-order"/);
  assert.match(home, /href="\/orders"/);
});
