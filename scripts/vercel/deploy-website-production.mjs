#!/usr/bin/env node
import { appendFileSync } from "node:fs";
import { deployTarget, smokeOrderingAiGatewayProtection } from "./vercel-deploy-common.mjs";

try {
  const result = await deployTarget("website");
  await smokeOrderingAiGatewayProtection({
    origin: result.deploymentUrl,
    sessionId: `website-staged-ordering-${result.checkedOutSha.slice(0, 12)}`,
  });
  console.log("WEBSITE_ORDERING_GATEWAY_PROTECTION_STAGED_SMOKE=success");
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `deployment_url=${result.deploymentUrl}\n`);
  }
  console.log(`WEBSITE_STAGED_DEPLOYMENT_URL=${result.deploymentUrl}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Website deployment failed.");
  process.exitCode = 1;
}
