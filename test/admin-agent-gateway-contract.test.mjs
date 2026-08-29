import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function source(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Admin Agent gateway reuses Website Google credential and stays server-only", () => {
  const runtime = source("lib/admin-agent-platform.ts");
  const route = source("app/api/admin-agent/gateway/route.ts");

  assert.match(runtime, /DIALOGFLOW_CX_SERVICE_ACCOUNT_JSON/);
  assert.match(runtime, /GOOGLE_SERVICE_ACCOUNT_JSON/);
  assert.match(runtime, /cloud-platform/);
  assert.match(runtime, /reasoningEngines/);
  assert.match(runtime, /async_create_session/);
  assert.match(runtime, /async_stream_query/);
  assert.match(runtime, /gemini-2\.5-pro/);
  assert.match(route, /COMPANY_WEBSITE_AI_API_TOKEN/);
  assert.match(route, /x-company-admin-ai-gateway/);
  assert.match(route, /timingSafeEqual/);
  assert.doesNotMatch(route, /NEXT_PUBLIC_/);
});

test("Admin Agent gateway is read-only and does not meter as Website", () => {
  const route = source("app/api/admin-agent/gateway/route.ts");
  const runtime = source("lib/admin-agent-platform.ts");

  assert.match(route, /readOnly: true/);
  assert.doesNotMatch(route, /recordCompanyAiUsage|recordChatConversation|Telegram/i);
  assert.doesNotMatch(runtime, /recordCompanyAiUsage|INSERT\s+INTO|UPDATE\s+|DELETE\s+FROM/i);
});

test("Admin Agent resource discovery fails closed instead of selecting an arbitrary engine", () => {
  const runtime = source("lib/admin-agent-platform.ts");
  assert.match(runtime, /admin_agent_reasoning_engine_ambiguous/);
  assert.match(runtime, /unique\.length === 1/);
  assert.match(runtime, /preferred\.length === 1/);
  assert.match(runtime, /admin_agent_reasoning_engine_not_found/);
});
