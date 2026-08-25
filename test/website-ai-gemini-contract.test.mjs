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

test("Website Gemini runtime accepts the canonical Google credential and legacy server-side aliases", () => {
  const source = read("lib/dialogflow.ts");
  assert.match(source, /GOOGLE_SERVICE_ACCOUNT_JSON/);
  assert.match(source, /DIALOGFLOW_SERVICE_ACCOUNT_JSON/);
  assert.match(source, /DIALOGFLOW_CX_SERVICE_ACCOUNT_JSON/);
  assert.doesNotMatch(source, /Project-ID-dialog-supprot-vlgn\.json|getDialogflowRuntimeFromSupabase/);
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

test("Website chat preserves newest turn and does not discard a successful Gemini reply when metering is unavailable", () => {
  const route = read("app/api/dialogflow/chat/route.ts");
  assert.match(route, /buildRecentTranscript/);
  assert.match(route, /endsWith\(currentTurn\)/);
  assert.match(route, /slice\(-MAX_TRANSCRIPT_CHARS\)/);
  assert.match(route, /createCompanyIdempotencyKey\(\)/);
  assert.match(route, /try\s*\{\s*await recordCompanyAiUsage/s);
  assert.match(route, /website_ai_usage_record_failed/);
  assert.match(route, /providerRequestId: aiReply\.providerRequestId/);
  assert.match(route, /usageMetadata: aiReply\.usageMetadata/);
  assert.match(route, /let usageRecorded = false/);
  assert.match(route, /usageRecorded = true/);
  assert.match(route, /source === "production-smoke"/);
  assert.match(route, /responseBody\.usageRecorded = usageRecorded/);
  assert.match(route, /AI_ASSISTANT_UNAVAILABLE/);
  assert.doesNotMatch(route, /agentDisplayName|intentDisplayName|pageDisplayName/);
  assert.doesNotMatch(route, /Không thể kết nối Dialogflow/);
});

test("Website production rollout smokes Gemini plus metering and restores the previous Vercel deployment on failure", () => {
  const workflow = read(".github/workflows/vercel-website-production-manual.yml");
  assert.match(workflow, /WEBSITE_PRODUCTION_ORIGIN: https:\/\/www\.nguyenlieuhungphat\.com/);
  assert.match(workflow, /api\/dialogflow\/chat/);
  assert.match(workflow, /\\"source\\":\\"production-smoke\\"/);
  assert.match(workflow, /\.usageRecorded == true/);
  assert.match(workflow, /WEBSITE_AI_PRODUCTION_SMOKE=success/);
  assert.match(workflow, /WEBSITE_AI_METERING_SMOKE=success/);
  assert.match(workflow, /\/v1\/projects\/\$\{VERCEL_WEBSITE_PROJECT_ID\}\/rollback\/\$\{PREVIOUS_PRODUCTION_DEPLOYMENT_ID\}/);
  assert.match(workflow, /restoring previous production deployment/i);
});

test("Website environment contract has no hard-coded Dialogflow agent fallback", () => {
  const env = read(".env.example");
  assert.match(env, /GEMINI_WEBSITE_MODEL=gemini-2\.5-flash/);
  assert.match(env, /GOOGLE_CLOUD_LOCATION=global/);
  assert.match(env, /COMPANY_API_URL=/);
  assert.match(env, /COMPANY_WEBSITE_AI_API_TOKEN=/);
  assert.doesNotMatch(env, /DIALOGFLOW_CX_AGENT_ID|291aef79-770c-4c6d-a8c8-a081206ace4e/);
});
