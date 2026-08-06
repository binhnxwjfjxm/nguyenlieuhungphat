import { createHash } from "node:crypto";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

export const TARGETS = {
  website: {
    expectedRoot: ".",
    projectEnv: "VERCEL_WEBSITE_PROJECT_ID",
    otherProjectEnv: "VERCEL_CUSTOMER_ORDERING_PROJECT_ID",
    originEnv: "WEBSITE_PRODUCTION_ORIGIN",
    smokePaths: ["/", "/san-pham"],
  },
  "customer-ordering": {
    expectedRoot: "customer-ordering",
    projectEnv: "VERCEL_CUSTOMER_ORDERING_PROJECT_ID",
    otherProjectEnv: "VERCEL_WEBSITE_PROJECT_ID",
    originEnv: "CUSTOMER_ORDERING_PRODUCTION_ORIGIN",
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

async function smokeOrigin(origin, paths) {
  const normalizedOrigin = origin.replace(/\/+$/, "");
  for (const path of paths) {
    const response = await fetch(`${normalizedOrigin}${path}`, { redirect: "manual" });
    if (response.status >= 500 || response.status === 404) throw new Error(`Smoke failed for ${path}: ${response.status}`);
  }
  const home = await fetch(`${normalizedOrigin}/`);
  const html = await home.text();
  const assetMatch = html.match(/\/_next\/static\/[^"' ]+/);
  if (!assetMatch) throw new Error("Smoke could not find a Next.js static asset.");
  const asset = await fetch(`${normalizedOrigin}${assetMatch[0]}`);
  if (!asset.ok) throw new Error(`Static asset smoke failed: ${asset.status}`);
}

export async function deployTarget(target) {
  const { config, projectId, teamId, token, checkedOutSha } = await verifyBoundary(target);
  const cwd = resolve(config.expectedRoot);
  const vercelDir = resolve(cwd, ".vercel");
  mkdirSync(vercelDir, { recursive: true });
  writeFileSync(resolve(vercelDir, "project.json"), JSON.stringify({ orgId: teamId, projectId }), { mode: 0o600 });
  const env = { ...process.env, VERCEL_ORG_ID: teamId, VERCEL_PROJECT_ID: projectId };
  try {
    run("npm", ["ci"], { cwd, env });
    run("npm", ["run", "build"], { cwd, env });
    run("vercel", ["pull", "--yes", "--environment=production", "--token", token], { cwd, env });
    run("vercel", ["build", "--prod", "--token", token], { cwd, env });
    const deploymentUrl = run("vercel", ["deploy", "--prebuilt", "--prod", "--yes", "--token", token], { cwd, env, capture: true }).split(/\s+/).find((value) => value.startsWith("https://"));
    if (!deploymentUrl) throw new Error("Vercel CLI did not return a deployment URL.");
    const productionOrigin = process.env[config.originEnv] ?? "";
    if (!productionOrigin) throw new Error(`${config.originEnv} is required for production smoke.`);
    await smokeOrigin(productionOrigin, config.smokePaths);
    console.log(`Production verified: target=${target} sha=${checkedOutSha.slice(0,12)} deployment=${fingerprint(deploymentUrl)}`);
  } finally {
    rmSync(vercelDir, { recursive: true, force: true });
  }
}
