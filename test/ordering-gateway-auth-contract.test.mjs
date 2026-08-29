import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (relative) => readFileSync(new URL(`../${relative}`, import.meta.url), "utf8");

test("Website delegates Customer Ordering gateway authorization to Công Ty", () => {
  const route = read("app/api/dialogflow/chat/route.ts");
  assert.match(route, /COMPANY_API_URL/);
  assert.match(route, /\/api\/ai\/ordering-gateway-auth/);
  assert.match(route, /headers:\s*\{\s*authorization,/s);
  assert.match(route, /body\.data\?\.authorized === true/);
  assert.match(route, /body\.data\?\.capability === "ordering-ai"/);
  assert.match(route, /gatewayAuth === "authorized"/);
  assert.match(route, /gatewayAuth === "unavailable"/);
  assert.doesNotMatch(route, /process\.env\.ORDERING_AI_API_TOKEN/);
  assert.doesNotMatch(route, /timingSafeEqual|safeTokenEquals/);
});

test("Ordering production guard still verifies the whole Website gateway before deploy", () => {
  const deploy = read("scripts/vercel/vercel-deploy-common.mjs");
  assert.match(deploy, /smokeOrderingAiGateway/);
  assert.match(deploy, /pulledEnv\.ORDERING_AI_API_TOKEN/);
  assert.match(deploy, /pulledEnv\.WEBSITE_AI_BASE_URL/);
  assert.match(deploy, /Ordering AI gateway smoke failed/);
});
