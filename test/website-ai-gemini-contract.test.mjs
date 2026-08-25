import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (relative) => readFileSync(new URL(`../${relative}`, import.meta.url), "utf8");

test("Website assistant uses Dialogflow CX detectIntent and never calls Vertex Gemini directly", () => {
  const source = read("lib/dialogflow.ts");
  assert.match(source, /dialogflow\.googleapis\.com/);
  assert.match(source, /:detectIntent/);
  assert.match(source, /responseId/);
  assert.match(source, /DETECT_INTENT_RESPONSE_VIEW_FULL/);
  assert.match(source, /FLOW_BILLING_MODEL = "dialogflow-cx-flow-text"/);
  assert.match(source, /PLAYBOOK_BILLING_MODEL = "dialogflow-cx-playbook-text"/);
  assert.match(source, /generativeInfo/);
  assert.match(source, /requestCount: 1/);
  assert.match(source, /billingUnit: "text-request"/);
  assert.doesNotMatch(source, /aiplatform\.googleapis\.com|generateContent|gemini-2\.5-flash/i);
});

test("Website Dialogflow CX runtime pins exact identity and uses least-privilege detectIntent without agent metadata reads", () => {
  const source = read("lib/dialogflow.ts");
  const cxCredential = source.indexOf('"DIALOGFLOW_CX_SERVICE_ACCOUNT_JSON"');
  const dialogflowCredential = source.indexOf('"DIALOGFLOW_SERVICE_ACCOUNT_JSON"');
  const genericCredential = source.indexOf('"GOOGLE_SERVICE_ACCOUNT_JSON"');
  assert.ok(cxCredential >= 0 && dialogflowCredential > cxCredential && genericCredential > dialogflowCredential);
  assert.match(source, /function getFirstPresentCredential\(\)/);
  assert.match(source, /if \(value !== undefined\) return \{ key, value \}/);
  assert.match(source, /dialogflow_service_account_unreadable:\$\{selectedCredential\.key\}/);
  assert.doesNotMatch(source, /const inlineJson = getEnvValue\(\s*"DIALOGFLOW_CX_SERVICE_ACCOUNT_JSON"/);
  assert.match(source, /DEFAULT_PROJECT_ID = "hck-agent-chat-prod-498413"/);
  assert.match(source, /DEFAULT_LOCATION = "global"/);
  assert.match(source, /DEFAULT_AGENT_ID = "e326abbf-77f7-4b16-996c-64408c4dd136"/);
  assert.match(source, /DEFAULT_AGENT_DISPLAY_NAME = "Hưng Phát"/);
  assert.match(source, /dialogflow_project_identity_mismatch/);
  assert.match(source, /dialogflow_location_identity_mismatch/);
  assert.match(source, /dialogflow_agent_identity_mismatch/);
  assert.match(source, /dialogflow_agent_display_name_invalid/);
  assert.match(source, /agentId: runtime\.configuredAgentId/);
  assert.match(source, /const sessionPath = `projects\/\$\{encodeURIComponent\(agent\.projectId\)\}\/locations\/\$\{encodeURIComponent\(agent\.location\)\}\/agents\/\$\{encodeURIComponent\(agent\.agentId\)\}\/sessions\/\$\{encodeURIComponent\(sessionId\)\}`/);
  assert.match(source, /fetch\(`\$\{baseUrl\}\/\$\{sessionPath\}:detectIntent`/);
  assert.match(source, /getExactEnvValue\("DIALOGFLOW_CX_PROJECT_ID", "DIALOGFLOW_PROJECT_ID"\)/);
  assert.match(source, /getExactEnvValue\("DIALOGFLOW_CX_LOCATION", "DIALOGFLOW_LOCATION"\)/);
  assert.match(source, /getExactEnvValue\("DIALOGFLOW_CX_AGENT_ID", "DIALOGFLOW_AGENT_ID"\)/);
  assert.match(source, /getExactEnvValue\("DIALOGFLOW_CX_AGENT_DISPLAY_NAME"\)/);
  assert.doesNotMatch(source, /fetchAgent|dialogflow_agent_lookup_unavailable|dialogflow_configured_agent_/);
  assert.doesNotMatch(source, /listExactAgent|dialogflow_agent_not_unique|pageSize|nextPageToken/);
  assert.doesNotMatch(source, /serviceAccount\.project_id/);
  assert.doesNotMatch(source, /Project-ID-dialog-supprot-vlgn\.json|getDialogflowRuntimeFromSupabase|hung phat admin/i);
  assert.doesNotMatch(source, /scoreAgent|normalized\.includes\("hung phat"\)/);
});

test("Website sends a stable UUID Idempotency-Key and records provider-priced CX request metadata", () => {
  const source = read("lib/company-ai-usage.ts");
  assert.match(source, /randomUUID/);
  assert.match(source, /IDEMPOTENCY_UUID_PATTERN/);
  assert.match(source, /"Idempotency-Key": input\.idempotencyKey/);
  assert.match(source, /source: "website"/);
  assert.match(source, /customerId: null/);
  assert.match(source, /COMPANY_WEBSITE_AI_API_TOKEN/);
  assert.match(source, /DialogflowCxUsageMetadata/);
  assert.doesNotMatch(source, /normalizeIdempotencyOperation|IDEMPOTENCY_OPERATION_MAX_LENGTH/);
  assert.doesNotMatch(source, /NEXT_PUBLIC_.*TOKEN/);
});

test("Website chat preserves newest turn and does not discard a successful CX reply when metering is unavailable", () => {
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
  assert.match(route, /playbookKey: "dialogflow-cx-website"/);
  assert.match(route, /website_ai_chat_failed/);
  assert.match(route, /AI_ASSISTANT_UNAVAILABLE/);
  assert.doesNotMatch(route, /agentDisplayName|intentDisplayName|pageDisplayName/);
});

test("Website staged production deployment keeps traffic untouched until exact CX and metering smoke pass", () => {
  const deployCommon = read("scripts/vercel/vercel-deploy-common.mjs");
  const deployScript = read("scripts/vercel/deploy-website-production.mjs");
  assert.match(deployCommon, /stagedProduction: true/);
  assert.match(deployCommon, /deployArgs\.push\("--skip-domain"\)/);
  assert.match(deployCommon, /await smokeOrigin\(deploymentUrl, config\.smokePaths\)/);
  assert.match(deployCommon, /if \(!config\.stagedProduction\)/);
  assert.match(deployScript, /GITHUB_OUTPUT/);
  assert.match(deployScript, /deployment_url=/);
});

test("Website production rollout authenticates protected staged smoke, promotes exact deployment and verifies rollback identity", () => {
  const workflow = read(".github/workflows/vercel-website-production-manual.yml");
  assert.match(workflow, /WEBSITE_PRODUCTION_HOST: www\.nguyenlieuhungphat\.com/);
  assert.match(workflow, /\/v4\/aliases\/\$\{encodeURIComponent\(process\.env\.WEBSITE_PRODUCTION_HOST\)\}/);
  assert.match(workflow, /\/v13\/deployments\/\$\{encodeURIComponent\(stagedUrl\.hostname\)\}/);
  assert.match(workflow, /website_staged_deployment_received_production_alias_before_smoke/);
  assert.match(workflow, /Smoke Dialogflow CX and metering on exact staged deployment/);
  assert.match(workflow, /vercel curl \/api\/dialogflow\/chat/);
  assert.match(workflow, /--deployment "\$STAGED_DEPLOYMENT_URL"/);
  assert.match(workflow, /VERCEL_TOKEN: \$\{\{ secrets\.VERCEL_TOKEN \}\}/);
  assert.doesNotMatch(workflow, /--token "\$VERCEL_TOKEN"/);
  assert.match(workflow, /--yes/);
  assert.match(workflow, /--fail-with-body/);
  assert.doesNotMatch(workflow, /"\$STAGED_DEPLOYMENT_URL\/api\/dialogflow\/chat"/);
  assert.match(workflow, /\\"source\\":\\"production-smoke\\"/);
  assert.match(workflow, /\.usageRecorded == true/);
  assert.match(workflow, /\/v10\/projects\/\$\{encodeURIComponent\(projectId\)\}\/promote\/\$\{encodeURIComponent\(newDeploymentId\)\}/);
  assert.match(workflow, /waitForAlias\(newDeploymentId\)/);
  assert.match(workflow, /\/v1\/projects\/\$\{encodeURIComponent\(projectId\)\}\/rollback\/\$\{encodeURIComponent\(previousDeploymentId\)\}/);
  assert.match(workflow, /waitForAlias\(previousDeploymentId\)/);
  assert.match(workflow, /WEBSITE_PRODUCTION_ALIAS_VERIFIED=success/);
  assert.match(workflow, /WEBSITE_AI_METERING_SMOKE=success/);
});

test("Website environment contract pins the exact Dialogflow CX production identity", () => {
  const env = read(".env.example");
  assert.match(env, /DIALOGFLOW_CX_PROJECT_ID=hck-agent-chat-prod-498413/);
  assert.match(env, /DIALOGFLOW_CX_LOCATION=global/);
  assert.match(env, /DIALOGFLOW_CX_AGENT_ID=e326abbf-77f7-4b16-996c-64408c4dd136/);
  assert.match(env, /DIALOGFLOW_CX_AGENT_DISPLAY_NAME=Hưng Phát/);
  assert.match(env, /DIALOGFLOW_CX_LANGUAGE_CODE=vi/);
  assert.match(env, /COMPANY_API_URL=/);
  assert.match(env, /COMPANY_WEBSITE_AI_API_TOKEN=/);
  assert.match(env, /GOOGLE_SERVICE_ACCOUNT_JSON=/);
  assert.doesNotMatch(env, /GEMINI_WEBSITE_MODEL|GOOGLE_CLOUD_LOCATION|291aef79-770c-4c6d-a8c8-a081206ace4e|Hưng Phát - Dialog CX/);
});
