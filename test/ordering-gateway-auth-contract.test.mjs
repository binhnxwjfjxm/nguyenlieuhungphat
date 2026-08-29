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
  assert.match(route, /AbortSignal\.timeout\(3_000\)/);
  assert.match(route, /gatewayAuth === "authorized"/);
  assert.match(route, /gatewayAuth === "unavailable"/);
  assert.doesNotMatch(route, /process\.env\.ORDERING_AI_API_TOKEN/);
  assert.doesNotMatch(route, /timingSafeEqual|safeTokenEquals/);
});

test("Production deploy guards keep Ordering token protected and use Vercel-aware staged smoke", () => {
  const common = read("scripts/vercel/vercel-deploy-common.mjs");
  const websiteDeploy = read("scripts/vercel/deploy-website-production.mjs");
  const websiteWorkflow = read(".github/workflows/vercel-website-production-manual.yml");
  const orderingRoute = read("customer-ordering/app/api/assistant/chat/route.ts");

  assert.match(common, /fetchVercelProductionEnvEntries/);
  assert.match(common, /validateCustomerOrderingProductionAiEnv/);
  assert.match(common, /ORDERING_AI_API_TOKEN/);
  assert.match(common, /\["sensitive", "encrypted"\]/);
  assert.match(common, /CORE_API_BASE_URL/);
  assert.match(common, /WEBSITE_AI_BASE_URL/);
  assert.doesNotMatch(common, /pulledEnv\.ORDERING_AI_API_TOKEN/);

  assert.match(websiteDeploy, /deployTarget\("website"\)/);
  assert.match(websiteDeploy, /deployment_url=/);
  assert.doesNotMatch(websiteDeploy, /smokeOrderingAiGatewayProtection|ORDERING_AI_API_TOKEN|fetchOrderingProductionToken/);

  assert.match(websiteWorkflow, /vercel curl \/api\/dialogflow\/chat/);
  assert.match(websiteWorkflow, /--deployment "\$STAGED_DEPLOYMENT_URL"/);
  assert.match(websiteWorkflow, /\.usageRecorded == true/);
  assert.match(websiteWorkflow, /WEBSITE_AI_STAGED_SMOKE=success/);
  assert.match(websiteWorkflow, /Promote exact deployment and verify Website production identity/);

  assert.match(orderingRoute, /ORDERING_AI_API_TOKEN/);
  assert.match(orderingRoute, /AbortSignal\.timeout\(35_000\)/);
});
