#!/usr/bin/env node
import { appendFileSync } from "node:fs";
import { deployTarget, smokeOrderingAiGateway } from "./vercel-deploy-common.mjs";

async function fetchOrderingProductionToken() {
  const token = process.env.VERCEL_TOKEN?.trim() ?? "";
  const teamId = process.env.VERCEL_ORG_ID?.trim() ?? "";
  const projectId = process.env.VERCEL_CUSTOMER_ORDERING_PROJECT_ID?.trim() ?? "";
  if (!token || !teamId || !projectId) throw new Error("Ordering production env lookup is not configured.");

  const url = new URL(`https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}/env`);
  url.searchParams.set("teamId", teamId);
  url.searchParams.set("decrypt", "true");
  url.searchParams.set("source", "vercel-cli:pull");
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15_000),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Ordering production env lookup failed (${response.status}).`);
  const entries = Array.isArray(body) ? body : Array.isArray(body?.envs) ? body.envs : [];
  const matches = entries.filter((entry) => {
    const targets = Array.isArray(entry?.target) ? entry.target : [entry?.target].filter(Boolean);
    return entry?.key === "ORDERING_AI_API_TOKEN" && targets.includes("production") && !entry?.gitBranch;
  });
  if (matches.length !== 1 || typeof matches[0]?.value !== "string" || !matches[0].value.trim()) {
    throw new Error("Ordering production AI token is missing or ambiguous.");
  }
  return matches[0].value.trim();
}

try {
  const result = await deployTarget("website");
  const orderingToken = await fetchOrderingProductionToken();
  await smokeOrderingAiGateway({
    origin: result.deploymentUrl,
    token: orderingToken,
    sessionId: `website-staged-ordering-${result.checkedOutSha.slice(0, 12)}`,
  });
  console.log(`WEBSITE_ORDERING_GATEWAY_STAGED_SMOKE=success`);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `deployment_url=${result.deploymentUrl}\n`);
  }
  console.log(`WEBSITE_STAGED_DEPLOYMENT_URL=${result.deploymentUrl}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Website deployment failed.");
  process.exitCode = 1;
}
