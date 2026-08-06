#!/usr/bin/env node
import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const CUSTOMER_ORDERING_DOMAIN = "sales.nguyenlieuhungphat.com";

export const CUSTOMER_ORDERING_PROJECT = Object.freeze({
  name: "customer-ordering",
  framework: "nextjs",
  rootDirectory: "customer-ordering",
  installCommand: "npm ci",
  buildCommand: "npm run build",
});

function projectUrl(apiBase, teamId, projectName) {
  const url = new URL(`/v9/projects/${encodeURIComponent(projectName)}`, apiBase);
  url.searchParams.set("teamId", teamId);
  return url;
}

function createUrl(apiBase, teamId, version = "v10") {
  const url = new URL(`/${version}/projects`, apiBase);
  url.searchParams.set("teamId", teamId);
  return url;
}

function projectDomainsUrl(apiBase, teamId, projectId, version = "v9") {
  const url = new URL(`/${version}/projects/${encodeURIComponent(projectId)}/domains`, apiBase);
  url.searchParams.set("teamId", teamId);
  return url;
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function responseMessage(body) {
  return body?.error?.message ?? body?.message ?? "unknown error";
}

async function getProject({ apiBase, teamId, token, fetchImpl }) {
  const response = await fetchImpl(projectUrl(apiBase, teamId, CUSTOMER_ORDERING_PROJECT.name), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 404) return null;
  const body = await parseResponse(response);
  if (!response.ok) throw new Error(`Unable to read Vercel project (${response.status}): ${responseMessage(body)}`);
  return body;
}

async function createProject({ apiBase, teamId, token, fetchImpl }) {
  const requestBody = JSON.stringify(CUSTOMER_ORDERING_PROJECT);
  for (const version of ["v10", "v9"]) {
    const response = await fetchImpl(createUrl(apiBase, teamId, version), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: requestBody,
    });
    const body = await parseResponse(response);
    if (response.ok) return body;
    if (response.status === 404 && version === "v10") continue;
    if (response.status === 409) return getProject({ apiBase, teamId, token, fetchImpl });
    throw new Error(`Unable to create Vercel project (${response.status}): ${responseMessage(body)}`);
  }
  throw new Error("Unable to resolve a supported Vercel project API version.");
}

async function listProjectDomains({ apiBase, teamId, token, projectId, fetchImpl }) {
  const response = await fetchImpl(projectDomainsUrl(apiBase, teamId, projectId), {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await parseResponse(response);
  if (!response.ok) throw new Error(`Unable to read Vercel project domains (${response.status}): ${responseMessage(body)}`);
  return Array.isArray(body?.domains) ? body.domains : [];
}

async function addProjectDomain({ apiBase, teamId, token, projectId, fetchImpl }) {
  const response = await fetchImpl(projectDomainsUrl(apiBase, teamId, projectId, "v10"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: CUSTOMER_ORDERING_DOMAIN }),
  });
  const body = await parseResponse(response);
  if (!response.ok) throw new Error(`Unable to add Customer Ordering domain (${response.status}): ${responseMessage(body)}`);
  return body;
}

export function validateCustomerOrderingProject(project) {
  if (!project?.id || !project.id.startsWith("prj_")) throw new Error("Vercel project ID is missing.");
  if (project.name !== CUSTOMER_ORDERING_PROJECT.name) throw new Error("Vercel project name mismatch.");
  if ((project.rootDirectory || ".") !== CUSTOMER_ORDERING_PROJECT.rootDirectory) throw new Error("Vercel root directory mismatch.");
  if (project.framework !== CUSTOMER_ORDERING_PROJECT.framework) throw new Error("Vercel framework mismatch.");
  if (project.installCommand !== CUSTOMER_ORDERING_PROJECT.installCommand) throw new Error("Vercel install command mismatch.");
  if (project.buildCommand !== CUSTOMER_ORDERING_PROJECT.buildCommand) throw new Error("Vercel build command mismatch.");
  if (project.link) throw new Error("Customer Ordering Vercel project must stay disconnected from Git auto-deploy.");
  return project;
}

export function validateCustomerOrderingDomain(domain) {
  if (!domain || domain.name !== CUSTOMER_ORDERING_DOMAIN) throw new Error("Customer Ordering Vercel domain mismatch.");
  if (domain.redirect) throw new Error("Customer Ordering production domain must not redirect.");
  if (domain.gitBranch) throw new Error("Customer Ordering production domain must not bind to a Git branch.");
  return domain;
}

export async function ensureCustomerOrderingProject({
  token = process.env.VERCEL_TOKEN,
  teamId = process.env.VERCEL_ORG_ID,
  apiBase = process.env.VERCEL_API_BASE_URL || "https://api.vercel.com",
  fetchImpl = fetch,
} = {}) {
  if (!token) throw new Error("VERCEL_TOKEN is required.");
  if (!teamId) throw new Error("VERCEL_ORG_ID is required.");

  let project = await getProject({ apiBase, teamId, token, fetchImpl });
  let created = false;
  if (!project) {
    project = await createProject({ apiBase, teamId, token, fetchImpl });
    created = true;
  }
  validateCustomerOrderingProject(project);

  const domains = await listProjectDomains({ apiBase, teamId, token, projectId: project.id, fetchImpl });
  let domain = domains.find((candidate) => candidate?.name === CUSTOMER_ORDERING_DOMAIN);
  let domainAdded = false;
  if (!domain) {
    domain = await addProjectDomain({ apiBase, teamId, token, projectId: project.id, fetchImpl });
    domainAdded = true;
  }
  validateCustomerOrderingDomain(domain);

  return { project, created, domain, domainAdded };
}

function writeGithubOutput(projectId, domain) {
  if (!process.env.GITHUB_OUTPUT) return;
  appendFileSync(process.env.GITHUB_OUTPUT, `project_id=${projectId}\n`, "utf8");
  appendFileSync(process.env.GITHUB_OUTPUT, `domain=${domain.name}\n`, "utf8");
  appendFileSync(process.env.GITHUB_OUTPUT, `domain_verified=${domain.verified === true}\n`, "utf8");
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  ensureCustomerOrderingProject()
    .then(({ project, created, domain, domainAdded }) => {
      writeGithubOutput(project.id, domain);
      console.log(`Customer Ordering Vercel project ${created ? "created" : "verified"}: id=${project.id} root=${project.rootDirectory} git=disconnected`);
      console.log(`Customer Ordering domain ${domainAdded ? "added" : "verified"}: name=${domain.name} verified=${domain.verified === true}`);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : "Customer Ordering Vercel bootstrap failed.");
      process.exitCode = 1;
    });
}
