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

test("Website sends a stable UUID Idempotency-Key and never composes a private key format", () => {
  const source = read("lib/company-ai-usage.ts");
  assert.match(source, /randomUUID/);
  assert.match(source, /IDEMPOTENCY_UUID_PATTERN/);
  assert.match(source, /"Idempotency-Key": input\.idempotencyKey/);
  assert.match(source, /source: "website"/);
  assert.match(source, /customerId: null/);
  assert.match(source, /COMPANY_WEBSITE_AI_API_TOKEN/);
  assert.doesNotMatch(source, /normalizeIdempotencyOperation|IDEMPOTENCY_OPERATION_MAX_LENGTH/);
  assert.doesNotMatch(source, /NEXT_PUBLIC_.*TOKEN/);
});

test("Website chat preserves the newest customer turn when history exceeds the transcript limit", () => {
  const route = read("app/api/dialogflow/chat/route.ts");
  assert.match(route, /buildRecentTranscript/);
  assert.match(route, /endsWith\(currentTurn\)/);
  assert.match(route, /slice\(-MAX_TRANSCRIPT_CHARS\)/);
  assert.match(route, /createCompanyIdempotencyKey\(\)/);
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
