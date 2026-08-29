import { createHash } from "node:crypto";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

export const TARGETS = {
  website: {
    expectedRoot: ".",
    projectEnv: "VERCEL_WEBSITE_PROJECT_ID",
    otherProjectEnv: "VERCEL_CUSTOMER_ORDERING_PROJECT_ID",
    originEnv: "WEBSITE_PRODUCTION_ORIGIN",
    deployMode: "source",
    stagedProduction: true,
    smokePaths: ["/", "/san-pham"],
  },
  "customer-ordering": {
    expectedRoot: "customer-ordering",
    projectEnv: "VERCEL_CUSTOMER_ORDERING_PROJECT_ID",
    otherProjectEnv: "VERCEL_WEBSITE_PROJECT_ID",
    originEnv: "CUSTOMER_ORDERING_PRODUCTION_ORIGIN",
    deployMode: "prebuilt",
    stagedProduction: false,
    smokePaths: ["/login", "/", "/products", "/quick-order", "/orders", "/manifest.webmanifest"],
  },
};

export function fingerprint(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 8);
}

export function validateBoundaryConfig({ target, repository, expectedRepository, branch, exactSha, checkedOutSha, rootDirectory, projectId, otherProjectId }) {
  const config = TARGETS[target];
  if (!config) throw new Error(`Unsupported deploy target: ${target}`);
  if (repository !== expectedRepository) throw new Error("Repository boundary mismatch.");
  if (branch !== "main") throw new Error("Production branch must be main.");
  if (!/^[a-f0-9]{40}$/.test(exactSha) || exactSha !== checkedOutSha) throw new Error("Exact main SHA mismatch.");
  if (rootDirectory !== config.expectedRoot) throw new Error(`Root directory must be ${config.expectedRoot}.`);
  if (!projectId || !otherProjectId) throw new Error("Both Vercel project IDs are required.");
  if (projectId === otherProjectId) throw new Error("Website and Customer Ordering project IDs must differ.");
  return config;
}

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: options.cwd, env: options.env ?? process.env, encoding: "utf8", stdio: options.capture ? "pipe" : "inherit" });
  if (result.status !== 0) {
    const detail = options.capture ? result.stderr?.trim() : "";
    throw new Error(`${command} failed${detail ? `: ${detail}` : ""}`);
  }
  return options.capture ? result.stdout.trim() : "";
}

export function gitOutput(args) { return run("git", args, { capture: true }); }
export function assertCleanWorkingTree() {
  if (gitOutput(["status", "--porcelain"])) throw new Error("Working tree must be clean before production deploy.");
}

export async function fetchVercelProject({ token, teamId, projectId }) {
  const url = new URL(`https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}`);
  url.searchParams.set("teamId", teamId);
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Unable to audit Vercel project (${response.status}).`);
  return response.json();
}

export async function fetchVercelProductionEnvEntries({ token, teamId, projectId, fetchImpl = fetch }) {
  const url = new URL(`https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}/env`);
  url.searchParams.set("teamId", teamId);
  url.searchParams.set("decrypt", "true");
  url.searchParams.set("source", "vercel-cli:pull");
  const response = await fetchImpl(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15_000),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Unable to audit Vercel production env (${response.status}).`);
  const entries = Array.isArray(body) ? body : Array.isArray(body?.envs) ? body.envs : [];
  return entries.filter((entry) => {
    const targets = Array.isArray(entry?.target) ? entry.target : [entry?.target].filter(Boolean);
    return targets.includes("production") && !entry?.gitBranch;
  });
}

function productionEnvEntriesFor(entries, key) {
  return entries.filter((entry) => entry?.key === key);
}

function productionOriginValue(entries, key) {
  const matches = productionEnvEntriesFor(entries, key);
  if (matches.length !== 1) throw new Error(`${key} production env must exist exactly once.`);
  const value = typeof matches[0]?.value === "string" ? matches[0].value.trim().replace(/\/+$/, "") : "";
  if (!/^https:\/\/[^/]+$/.test(value)) throw new Error(`${key} production env must be a valid HTTPS origin.`);
  return value;
}

export function validateCustomerOrderingProductionAiEnv(entries) {
  const tokenEntries = productionEnvEntriesFor(entries, "ORDERING_AI_API_TOKEN");
  if (tokenEntries.length !== 1) throw new Error("ORDERING_AI_API_TOKEN production metadata must exist exactly once.");
  const tokenType = String(tokenEntries[0]?.type || "");
  if (!["sensitive", "encrypted"].includes(tokenType)) {
    throw new Error("ORDERING_AI_API_TOKEN must remain a protected Vercel secret.");
  }
  return Object.freeze({
    tokenType,
    coreApiBaseUrl: productionOriginValue(entries, "CORE_API_BASE_URL"),
    websiteAiBaseUrl: productionOriginValue(entries, "WEBSITE_AI_BASE_URL"),
  });
}

export function assertProviderBoundary(project, expectedRoot) {
  const providerRoot = project.rootDirectory || ".";
  if (providerRoot !== expectedRoot) throw new Error(`Vercel root mismatch: expected ${expectedRoot}.`);
  const productionBranch = project.link?.productionBranch ?? project.productionBranch;
  if (productionBranch && productionBranch !== "main") throw new Error("Vercel production branch must be main.");
}

export async function verifyBoundary(target, { auditProvider = true } = {}) {
  const config = TARGETS[target];
  if (!config) throw new Error(`Unsupported deploy target: ${target}`);
  const exactSha = process.env.EXPECTED_MAIN_SHA ?? "";
  const checkedOutSha = gitOutput(["rev-parse", "HEAD"]);
  const repository = process.env.GITHUB_REPOSITORY ?? "";
  const branch = process.env.PRODUCTION_BRANCH ?? "main";
  const projectId = process.env[config.projectEnv] ?? "";
  const otherProjectId = process.env[config.otherProjectEnv] ?? "";
  validateBoundaryConfig({ target, repository, expectedRepository: "binhnxwjfjxm/nguyenlieuhungphat", branch, exactSha, checkedOutSha, rootDirectory: config.expectedRoot, projectId, otherProjectId });
  assertCleanWorkingTree();
  const token = process.env.VERCEL_TOKEN ?? "";
  const teamId = process.env.VERCEL_ORG_ID ?? "";
  if (!token || !teamId) throw new Error("Vercel token and organization ID are required.");
  if (!existsSync(resolve(config.expectedRoot, "package.json"))) throw new Error(`Missing package.json in ${config.expectedRoot}.`);
  if (auditProvider) assertProviderBoundary(await fetchVercelProject({ token, teamId, projectId }), config.expectedRoot);
  console.log(`Boundary verified: ${target} sha=${checkedOutSha.slice(0,12)} project=${fingerprint(projectId)}`);
  return { config, projectId, teamId, token, checkedOutSha };
}

export async function fetchWithRetry(url, options = {}) {
  const attempts = options.attempts ?? 12;
  const delayMs = options.delayMs ?? 5000;
  const timeoutMs = options.timeoutMs ?? 15000;
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleepImpl = options.sleepImpl ?? sleep;
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.status >= 200 && response.status < 400) return response;
      if (response.status < 500 && ![404, 408, 425, 429].includes(response.status)) {
        throw new Error(`Smoke rejected ${new URL(url).pathname || "/"}: HTTP ${response.status}`);
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Smoke rejected")) throw error;
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    if (attempt < attempts) await sleepImpl(delayMs);
  }

  const path = new URL(url).pathname || "/";
  throw new Error(`Smoke failed for ${path} after ${attempts} attempts: ${lastError?.message ?? "unknown error"}`);
}

export async function smokeOrigin(origin, paths, retryOptions = {}) {
  const normalizedOrigin = origin.replace(/\/+$/, "");
  const home = await fetchWithRetry(`${normalizedOrigin}/`, retryOptions);

  for (const path of paths) {
    if (path === "/") continue;
    await fetchWithRetry(`${normalizedOrigin}${path}`, {
      ...retryOptions,
      attempts: retryOptions.attempts ?? 4,
      delayMs: retryOptions.delayMs ?? 2500,
    });
  }

  const html = await home.text();
  const assetMatch = html.match(/\/_next\/static\/[^"' ]+/);
  if (!assetMatch) throw new Error("Smoke could not find a Next.js static asset.");
  await fetchWithRetry(`${normalizedOrigin}${assetMatch[0]}`, {
    ...retryOptions,
    attempts: retryOptions.attempts ?? 4,
    delayMs: retryOptions.delayMs ?? 2500,
  });
}

export async function smokeOrderingAiGatewayProtection({ origin, sessionId = "ordering-gateway-protection-smoke", fetchImpl = fetch }) {
  const normalizedOrigin = String(origin || "").trim().replace(/\/+$/, "");
  if (!/^https:\/\/[^/]+$/.test(normalizedOrigin)) throw new Error("Ordering AI gateway origin is missing or invalid.");

  const response = await fetchImpl(`${normalizedOrigin}/api/dialogflow/chat`, {
    method: "POST",
    headers: {
      "x-ordering-ai-gateway": "customer-ordering",
      "content-type": "application/json; charset=utf-8",
      accept: "application/json",
    },
    body: JSON.stringify({
      sessionId,
      message: "Kiểm tra bảo vệ kết nối tư vấn sản phẩm.",
      source: "production-smoke-ordering-gateway-protection",
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const body = await response.json().catch(() => ({}));
  if (response.status !== 401 || body?.code !== "UNAUTHORIZED") {
    throw new Error(`Ordering AI gateway protection smoke failed: HTTP ${response.status} ${body?.code || "unknown"}`);
  }
  return body;
}

export async function deployTarget(target) {
  const { config, projectId, teamId, token, checkedOutSha } = await verifyBoundary(target);
  const repositoryCwd = resolve(".");
  const appCwd = resolve(config.expectedRoot);
  const vercelDir = resolve(repositoryCwd, ".vercel");
  mkdirSync(vercelDir, { recursive: true });
  writeFileSync(resolve(vercelDir, "project.json"), JSON.stringify({ orgId: teamId, projectId }), { mode: 0o600 });
  const env = { ...process.env, VERCEL_ORG_ID: teamId, VERCEL_PROJECT_ID: projectId };
  try {
    run("npm", ["ci"], { cwd: appCwd, env });
    run("npm", ["run", "build"], { cwd: appCwd, env });

    if (target === "customer-ordering") {
      const productionEntries = await fetchVercelProductionEnvEntries({ token, teamId, projectId });
      const productionAi = validateCustomerOrderingProductionAiEnv(productionEntries);
      console.log(`Ordering AI production env metadata verified: secret=${productionAi.tokenType}`);
    }

    run("vercel", ["pull", "--yes", "--environment=production", "--token", token], { cwd: repositoryCwd, env });

    if (config.deployMode === "prebuilt") {
      run("vercel", ["build", "--prod", "--token", token], { cwd: repositoryCwd, env });
    }

    const deployArgs = ["deploy"];
    if (config.deployMode === "prebuilt") {
      deployArgs.push("--prebuilt");
    } else {
      deployArgs.push("--archive=tgz");
    }
    deployArgs.push("--prod");
    if (config.stagedProduction) deployArgs.push("--skip-domain");
    deployArgs.push("--yes", "--token", token);

    const deploymentUrl = run("vercel", deployArgs, { cwd: repositoryCwd, env, capture: true })
      .split(/\s+/)
      .find((value) => value.startsWith("https://"));
    if (!deploymentUrl) throw new Error("Vercel CLI did not return a deployment URL.");

    await smokeOrigin(deploymentUrl, config.smokePaths);

    if (!config.stagedProduction) {
      const productionOrigin = process.env[config.originEnv] ?? "";
      if (!productionOrigin) throw new Error(`${config.originEnv} is required for production smoke.`);
      await smokeOrigin(productionOrigin, config.smokePaths);
    }

    console.log(`Deployment verified: target=${target} sha=${checkedOutSha.slice(0,12)} deployment=${fingerprint(deploymentUrl)} staged=${config.stagedProduction ? "yes" : "no"}`);
    return Object.freeze({ deploymentUrl, checkedOutSha, stagedProduction: config.stagedProduction });
  } finally {
    rmSync(vercelDir, { recursive: true, force: true });
  }
}
