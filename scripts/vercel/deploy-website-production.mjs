#!/usr/bin/env node
import { appendFileSync } from "node:fs";
import { deployTarget } from "./vercel-deploy-common.mjs";

try {
  const result = await deployTarget("website");
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `deployment_url=${result.deploymentUrl}\n`);
  }
  console.log(`WEBSITE_STAGED_DEPLOYMENT_URL=${result.deploymentUrl}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Website deployment failed.");
  process.exitCode = 1;
}
