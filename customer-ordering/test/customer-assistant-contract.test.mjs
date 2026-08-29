import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const here = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, here), "utf8");

test("Customer Ordering assistant is advisory-only and never owns order mutations", async () => {
  const [route, component] = await Promise.all([
    read("app/api/assistant/chat/route.ts"),
    read("components/customer-assistant.tsx"),
  ]);
  assert.match(route, /capability: "advisory-only"/);
  assert.match(route, /\/api\/customer-portal\/me/);
  assert.doesNotMatch(route, /customer-ordering-service|createCustomerOrderingService|saveCart|submitOrder|addToCart/i);
  assert.doesNotMatch(route, /customer-portal\/(?:orders|cart)/i);
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

test("Customer Ordering reuses Website Dialogflow through a server-only gateway without copying Google credentials", async () => {
  const [orderingRoute, websiteRoute, envExample] = await Promise.all([
    read("app/api/assistant/chat/route.ts"),
    read("../app/api/dialogflow/chat/route.ts"),
    read(".env.example"),
  ]);
  assert.match(orderingRoute, /WEBSITE_AI_BASE_URL/);
  assert.match(orderingRoute, /\/api\/dialogflow\/chat/);
  assert.match(orderingRoute, /x-ordering-ai-gateway/);
  assert.match(orderingRoute, /ORDERING_AI_API_TOKEN/);
  assert.match(orderingRoute, /redirect:\s*"error"/);
  assert.match(orderingRoute, /AbortSignal\.timeout\(35_000\)/);
  assert.doesNotMatch(orderingRoute, /DIALOGFLOW_(?:CX_)?SERVICE_ACCOUNT_JSON|google-auth-library|detectDialogflowReply/);
  assert.match(websiteRoute, /COMPANY_API_URL/);
  assert.match(websiteRoute, /\/api\/ai\/ordering-gateway-auth/);
  assert.match(websiteRoute, /AbortSignal\.timeout\(3_000\)/);
  assert.doesNotMatch(websiteRoute, /process\.env\.ORDERING_AI_API_TOKEN/);
  assert.match(websiteRoute, /gatewayAuth === "authorized"/);
  assert.match(websiteRoute, /usageMetadata: aiReply\.usageMetadata/);
  assert.ok(
    websiteRoute.indexOf('gatewayAuth === "authorized"') < websiteRoute.indexOf("await recordCompanyAiUsage({"),
    "Ordering proxy must return before Website usage metering",
  );
  assert.doesNotMatch(envExample, /DIALOGFLOW_(?:CX_)?SERVICE_ACCOUNT_JSON|GOOGLE_SERVICE_ACCOUNT_JSON/);
  assert.match(envExample, /Google credentials stay only in the Website project/);
});

test("Home exposes a visible Hỏi Hưng Phát action without replacing the ordering flow", async () => {
  const [home, assistantStyle] = await Promise.all([
    read("components/home-screen.tsx"),
    read("components/home-screen.module.css"),
  ]);
  assert.match(home, /href="\/assistant"/);
  assert.match(home, /className=\{styles\.assistantAction\}/);
  assert.match(home, />Hỏi Hưng Phát</);
  assert.match(home, /href="\/quick-order"/);
  assert.match(home, /href="\/orders"/);
  assert.match(assistantStyle, /:global\(\.home-depth-stack\)\s+:global\(\.quick-actions\)\s+\.assistantAction/);
  assert.match(assistantStyle, /background:\s*radial-gradient/);
  assert.match(assistantStyle, /color:\s*#fff/);
});
