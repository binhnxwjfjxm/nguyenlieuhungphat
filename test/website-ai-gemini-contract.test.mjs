import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (relative) => readFileSync(new URL(`../${relative}`, import.meta.url), "utf8");

test("Website assistant uses Vertex Gemini 2.5 Flash and provider usage metadata without agent discovery", () => {
  const source = read("lib/dialogflow.ts");
  assert.match(source, /aiplatform\.googleapis\.com\/v1/);
  assert.match(source, /gemini-2\.5-flash/);
  assert.match(source, /usageMetadata/);
  assert.match(source, /promptTokenCount/);
  assert.match(source, /candidatesTokenCount/);
  assert.match(source, /thoughtsTokenCount/);
  assert.match(source, /cachedContentTokenCount/);
  assert.doesNotMatch(source, /listAgents|getDialogflowRuntimeFromSupabase|DEFAULT_AGENT_ID|hung phat admin/i);
});

test("Website records usage through Công Ty with the canonical idempotency contract and reuses one key across retries", () => {
  const source = read("lib/company-ai-usage.ts");
  assert.match(source, /IDEMPOTENCY_KEY_PATTERN = \/\^\[A-Za-z0-9\._-\]\{1,128\}\$\//);
  assert.match(source, /normalizeIdempotencyOperation/);
  assert.match(source, /createCompanyIdempotencyKey/);
  assert.match(source, /"Idempotency-Key": input\.idempotencyKey/);
  assert.match(source, /source: "website"/);
  assert.match(source, /customerId: null/);
  assert.match(source, /COMPANY_WEBSITE_AI_API_TOKEN/);
  assert.doesNotMatch(source, /NEXT_PUBLIC_.*TOKEN/);
});

test("Website chat keeps the existing UI endpoint, meters before returning the reply, and hides provider details from customers", () => {
  const component = read("components/chatbot.tsx");
  const route = read("app/api/dialogflow/chat/route.ts");
  assert.match(component, /fetch\("\/api\/dialogflow\/chat"/);
  assert.match(route, /recordCompanyAiUsage/);
  assert.match(route, /AI_ASSISTANT_UNAVAILABLE/);
  assert.doesNotMatch(route, /agentDisplayName|intentDisplayName|pageDisplayName/);
  assert.doesNotMatch(route, /Không thể kết nối Dialogflow/);
});

test("Website environment contract has no hard-coded Dialogflow agent fallback", () => {
  const env = read(".env.example");
  assert.match(env, /GEMINI_WEBSITE_MODEL=gemini-2\.5-flash/);
  assert.match(env, /GOOGLE_CLOUD_LOCATION=global/);
  assert.match(env, /COMPANY_API_URL=/);
  assert.match(env, /COMPANY_WEBSITE_AI_API_TOKEN=/);
  assert.doesNotMatch(env, /DIALOGFLOW_CX_AGENT_ID|291aef79-770c-4c6d-a8c8-a081206ace4e/);
});
