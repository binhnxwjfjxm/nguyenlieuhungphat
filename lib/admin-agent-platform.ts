import "server-only";

import { createHash } from "node:crypto";
import { GoogleAuth } from "google-auth-library";

type ServiceAccount = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
  [key: string]: unknown;
};

type AgentResource = {
  name: string;
  displayName: string;
  location: string;
};

type UsageMetadata = {
  promptTokenCount: number;
  cachedContentTokenCount: number;
  candidatesTokenCount: number;
  thoughtsTokenCount: number;
  toolUsePromptTokenCount: number;
  totalTokenCount: number;
};

const CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
const AGENT_MODEL = "gemini-2.5-pro";
const RESOURCE_PATTERN = /^projects\/([^/]+)\/locations\/([a-z0-9-]+)\/reasoningEngines\/([A-Za-z0-9._-]+)$/;
const SAFE_PROJECT = /^[a-z][a-z0-9-]{4,61}[a-z0-9]$/;
const PRIMARY_LOCATIONS = ["us-central1", "asia-southeast1"] as const;
const OTHER_LOCATIONS = [
  "us-east1", "us-east4", "us-west1",
  "europe-west1", "europe-west2", "europe-west3", "europe-west4", "europe-west6", "europe-west8", "europe-southwest1",
  "asia-east1", "asia-east2", "asia-northeast1", "asia-northeast3", "asia-south1", "asia-southeast2",
  "australia-southeast2", "me-west1", "northamerica-northeast1", "northamerica-northeast2", "southamerica-east1",
] as const;

let cachedResource: AgentResource | null = null;
let cachedCredential: ServiceAccount | null = null;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function firstCredential() {
  for (const key of ["DIALOGFLOW_CX_SERVICE_ACCOUNT_JSON", "DIALOGFLOW_SERVICE_ACCOUNT_JSON", "GOOGLE_SERVICE_ACCOUNT_JSON"]) {
    if (process.env[key] !== undefined) return { key, value: process.env[key] ?? "" };
  }
  return null;
}

function loadCredential() {
  if (cachedCredential) return cachedCredential;
  const selected = firstCredential();
  if (!selected || !selected.value.trim()) throw new Error("admin_agent_google_credential_missing");
  let parsed: ServiceAccount;
  try {
    parsed = JSON.parse(selected.value) as ServiceAccount;
  } catch {
    throw new Error("admin_agent_google_credential_invalid");
  }
  const projectId = text(parsed.project_id);
  const clientEmail = text(parsed.client_email);
  const privateKey = text(parsed.private_key).replace(/\\n/g, "\n");
  if (!SAFE_PROJECT.test(projectId) || !clientEmail.includes("@") || !privateKey.includes("PRIVATE KEY")) {
    throw new Error("admin_agent_google_credential_invalid");
  }
  cachedCredential = { ...parsed, project_id: projectId, client_email: clientEmail, private_key: privateKey };
  return cachedCredential;
}

async function accessToken() {
  const credential = loadCredential();
  const auth = new GoogleAuth({ credentials: credential, scopes: [CLOUD_PLATFORM_SCOPE] });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const value = typeof token === "string" ? token : token?.token ?? "";
  if (!value) throw new Error("admin_agent_google_access_token_missing");
  return { token: value, consumerProjectId: text(credential.project_id) };
}

function resourceProjectId() {
  const configured = text(loadCredential().project_id);
  if (!SAFE_PROJECT.test(configured)) throw new Error("admin_agent_resource_project_missing");
  return configured;
}

async function listLocation(projectId: string, location: string, token: string, consumerProjectId: string) {
  const url = new URL(`https://${location}-aiplatform.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/locations/${encodeURIComponent(location)}/reasoningEngines`);
  url.searchParams.set("pageSize", "100");
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      authorization: `Bearer ${token}`,
      "x-goog-user-project": consumerProjectId,
    },
    signal: AbortSignal.timeout(8_000),
  });
  const body = await response.json().catch(() => null) as { reasoningEngines?: unknown[]; error?: { status?: unknown } } | null;
  if (response.status === 400 || response.status === 404) return [] as AgentResource[];
  if (!response.ok) {
    console.error("admin_agent_reasoning_engine_list_failed", JSON.stringify({ location, httpStatus: response.status, status: text(body?.error?.status) || null }));
    return [] as AgentResource[];
  }
  const rows = Array.isArray(body?.reasoningEngines) ? body.reasoningEngines : [];
  return rows.flatMap((raw) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    const row = raw as { name?: unknown; displayName?: unknown };
    const name = text(row.name);
    const match = RESOURCE_PATTERN.exec(name);
    if (!match) return [];
    return [{ name, displayName: text(row.displayName), location: match[2] }];
  });
}

function chooseResource(resources: AgentResource[]) {
  const unique = [...new Map(resources.map((item) => [item.name, item])).values()];
  if (unique.length === 1) return unique[0];
  const preferred = unique.filter((item) => /admin|c[oô]ng\s*ty|company/i.test(item.displayName));
  if (preferred.length === 1) return preferred[0];
  console.error("admin_agent_reasoning_engine_ambiguous", JSON.stringify({
    count: unique.length,
    candidates: unique.map((item) => ({ name: item.name, displayName: item.displayName })),
  }));
  if (unique.length === 0) throw new Error("admin_agent_reasoning_engine_not_found");
  throw new Error("admin_agent_reasoning_engine_ambiguous");
}

async function discoverResource() {
  if (cachedResource) return cachedResource;
  const { token, consumerProjectId } = await accessToken();
  const projectId = resourceProjectId();
  let resources = (await Promise.all(PRIMARY_LOCATIONS.map((location) => listLocation(projectId, location, token, consumerProjectId)))).flat();
  if (resources.length === 0) {
    resources = (await Promise.all(OTHER_LOCATIONS.map((location) => listLocation(projectId, location, token, consumerProjectId)))).flat();
  }
  cachedResource = chooseResource(resources);
  console.info("admin_agent_reasoning_engine_resolved", {
    name: cachedResource.name,
    displayName: cachedResource.displayName,
    location: cachedResource.location,
  });
  return cachedResource;
}

function count(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isSafeInteger(number) && number >= 0 ? number : 0;
}

function usageMetadata(event: Record<string, unknown>) {
  const raw = event.usage_metadata ?? event.usageMetadata;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const metadata = raw as Record<string, unknown>;
  return {
    promptTokenCount: count(metadata.prompt_token_count ?? metadata.promptTokenCount),
    cachedContentTokenCount: count(metadata.cached_content_token_count ?? metadata.cachedContentTokenCount),
    candidatesTokenCount: count(metadata.candidates_token_count ?? metadata.candidatesTokenCount),
    thoughtsTokenCount: count(metadata.thoughts_token_count ?? metadata.thoughtsTokenCount),
    toolUsePromptTokenCount: count(metadata.tool_use_prompt_token_count ?? metadata.toolUsePromptTokenCount),
    totalTokenCount: count(metadata.total_token_count ?? metadata.totalTokenCount),
  } satisfies UsageMetadata;
}

function unwrapEvent(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.output && typeof record.output === "object" && !Array.isArray(record.output)) return record.output as Record<string, unknown>;
  return record;
}

function eventText(event: Record<string, unknown>) {
  const content = event.content;
  if (!content || typeof content !== "object" || Array.isArray(content)) return "";
  const typed = content as { role?: unknown; parts?: unknown };
  if (typed.role !== "model" || !Array.isArray(typed.parts)) return "";
  return typed.parts.flatMap((part) => {
    if (!part || typeof part !== "object" || Array.isArray(part)) return [];
    const value = text((part as { text?: unknown }).text);
    return value ? [value] : [];
  }).join("\n").trim();
}

function parseResponse(bodyText: string) {
  const events: Record<string, unknown>[] = [];
  for (const rawLine of bodyText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith(":") || line === "event: message") continue;
    const candidate = line.startsWith("data:") ? line.slice(5).trim() : line;
    if (!candidate || candidate === "[DONE]" || !candidate.startsWith("{")) continue;
    try {
      const event = unwrapEvent(JSON.parse(candidate));
      if (event) events.push(event);
    } catch {}
  }

  let replyText = "";
  let partialText = "";
  let providerRequestId = "";
  let sawUsage = false;
  const totals: UsageMetadata = {
    promptTokenCount: 0,
    cachedContentTokenCount: 0,
    candidatesTokenCount: 0,
    thoughtsTokenCount: 0,
    toolUsePromptTokenCount: 0,
    totalTokenCount: 0,
  };
  const seenUsage = new Set<string>();

  events.forEach((event, index) => {
    providerRequestId ||= text(event.invocation_id ?? event.invocationId);
    const responseText = eventText(event);
    if (responseText) {
      if (event.partial === true) partialText += responseText;
      else replyText = responseText;
    }
    const metadata = usageMetadata(event);
    const identity = text(event.id) || String(index);
    if (metadata && !seenUsage.has(identity)) {
      seenUsage.add(identity);
      sawUsage = true;
      (Object.keys(totals) as (keyof UsageMetadata)[]).forEach((key) => { totals[key] += metadata[key]; });
    }
  });

  const finalReply = (replyText || partialText).trim();
  if (!finalReply) throw new Error("admin_agent_reply_empty");
  const expectedTotal = totals.promptTokenCount + totals.candidatesTokenCount + totals.thoughtsTokenCount + totals.toolUsePromptTokenCount;
  const normalizedUsage = sawUsage && totals.totalTokenCount === expectedTotal && totals.cachedContentTokenCount <= totals.promptTokenCount
    ? totals
    : null;
  return { replyText: finalReply, providerRequestId: providerRequestId || null, usageMetadata: normalizedUsage };
}

function providerUserId(actorId: string) {
  return `admin-${createHash("sha256").update(actorId).digest("hex").slice(0, 32)}`;
}

async function ensureSession(resource: AgentResource, token: string, consumerProjectId: string, actorId: string, conversationId: string) {
  const endpoint = `https://${resource.location}-aiplatform.googleapis.com/v1/${resource.name}:query`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json; charset=utf-8",
      "x-goog-user-project": consumerProjectId,
    },
    body: JSON.stringify({
      class_method: "async_create_session",
      input: { user_id: providerUserId(actorId), session_id: conversationId },
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (response.ok || response.status === 409) return;
  const payload = await response.json().catch(() => null) as { error?: { status?: unknown } } | null;
  if (text(payload?.error?.status) === "ALREADY_EXISTS") return;
  throw new Error(`admin_agent_session_unavailable_${response.status}`);
}

export async function adminAgentReadiness() {
  const resource = await discoverResource();
  return { capability: "company-admin-ai", model: AGENT_MODEL, location: resource.location, displayName: resource.displayName || null };
}

export async function queryAdminAgent(input: { actorId: string; conversationId: string; message: string }) {
  const resource = await discoverResource();
  const { token, consumerProjectId } = await accessToken();
  await ensureSession(resource, token, consumerProjectId, input.actorId, input.conversationId);
  const endpoint = `https://${resource.location}-aiplatform.googleapis.com/v1/${resource.name}:streamQuery?alt=sse`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json; charset=utf-8",
      accept: "text/event-stream",
      "x-goog-user-project": consumerProjectId,
    },
    body: JSON.stringify({
      class_method: "async_stream_query",
      input: {
        user_id: providerUserId(input.actorId),
        session_id: input.conversationId,
        message: input.message,
      },
    }),
    signal: AbortSignal.timeout(60_000),
  });
  const bodyText = await response.text();
  if (!response.ok) throw new Error(`admin_agent_query_unavailable_${response.status}`);
  const parsed = parseResponse(bodyText);
  return {
    ...parsed,
    model: AGENT_MODEL,
    occurredAt: new Date().toISOString(),
    conversationId: input.conversationId,
  };
}
