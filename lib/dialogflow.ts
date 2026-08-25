import "server-only";

import { GoogleAuth } from "google-auth-library";

export type DialogflowCxUsageMetadata = {
  requestCount: number;
  billingUnit: "text-request";
  requestClass: "flow" | "playbook";
};

type ServiceAccount = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
  [key: string]: unknown;
};

type DialogflowAgent = {
  name?: string;
  displayName?: string;
};

export type DialogflowCxConfig = {
  projectId: string;
  location: string;
  agentId: string;
  agentDisplayName: string;
  languageCode: string;
};

const DIALOGFLOW_SCOPE = "https://www.googleapis.com/auth/dialogflow";
const DEFAULT_LOCATION = "global";
const DEFAULT_LANGUAGE_CODE = "vi";
const DEFAULT_AGENT_DISPLAY_NAME = "Hưng Phát";
const FLOW_BILLING_MODEL = "dialogflow-cx-flow-text";
const PLAYBOOK_BILLING_MODEL = "dialogflow-cx-playbook-text";
const SAFE_PROJECT_ID = /^[a-z][a-z0-9-]{4,61}[a-z0-9]$/;
const SAFE_LOCATION = /^[a-z0-9-]{2,40}$/;
const SAFE_LANGUAGE = /^[A-Za-z]{2,3}(?:-[A-Za-z]{2,8})?$/;
const AGENT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let cachedServiceAccount: ServiceAccount | null = null;
let cachedAgent: DialogflowCxConfig | null = null;

function getEnvValue(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return "";
}

export function normalizeDialogflowSessionId(sessionId: string) {
  return sessionId.trim().replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 36) || "hungphat-session";
}

function loadServiceAccount(): ServiceAccount {
  if (cachedServiceAccount) return cachedServiceAccount;
  const inlineJson = getEnvValue(
    "DIALOGFLOW_CX_SERVICE_ACCOUNT_JSON",
    "DIALOGFLOW_SERVICE_ACCOUNT_JSON",
    "GOOGLE_SERVICE_ACCOUNT_JSON",
  );
  if (!inlineJson) throw new Error("dialogflow_service_account_missing");
  const parsed = JSON.parse(inlineJson) as ServiceAccount;
  if (!parsed.client_email || !parsed.private_key) throw new Error("dialogflow_service_account_invalid");
  cachedServiceAccount = parsed;
  return parsed;
}

function getDialogflowBaseUrl(location: string) {
  const host = location === "global" ? "dialogflow.googleapis.com" : `${location}-dialogflow.googleapis.com`;
  return `https://${host}/v3`;
}

function getDialogflowRuntimeConfig() {
  const serviceAccount = loadServiceAccount();
  const projectId = getEnvValue("DIALOGFLOW_CX_PROJECT_ID", "DIALOGFLOW_PROJECT_ID") || serviceAccount.project_id || "";
  const location = getEnvValue("DIALOGFLOW_CX_LOCATION", "DIALOGFLOW_LOCATION") || DEFAULT_LOCATION;
  const configuredAgentId = getEnvValue("DIALOGFLOW_CX_AGENT_ID", "DIALOGFLOW_AGENT_ID");
  const agentDisplayName = getEnvValue("DIALOGFLOW_CX_AGENT_DISPLAY_NAME") || DEFAULT_AGENT_DISPLAY_NAME;
  const languageCode = getEnvValue("DIALOGFLOW_CX_LANGUAGE_CODE", "DIALOGFLOW_LANGUAGE_CODE") || DEFAULT_LANGUAGE_CODE;

  if (!SAFE_PROJECT_ID.test(projectId)) throw new Error("dialogflow_project_invalid");
  if (!SAFE_LOCATION.test(location)) throw new Error("dialogflow_location_invalid");
  if (configuredAgentId && !AGENT_ID_PATTERN.test(configuredAgentId)) throw new Error("dialogflow_agent_id_invalid");
  if (agentDisplayName !== DEFAULT_AGENT_DISPLAY_NAME) throw new Error("dialogflow_agent_display_name_invalid");
  if (!SAFE_LANGUAGE.test(languageCode)) throw new Error("dialogflow_language_invalid");

  return Object.freeze({ projectId, location, configuredAgentId, agentDisplayName, languageCode });
}

async function getAccessToken() {
  const auth = new GoogleAuth({
    credentials: loadServiceAccount(),
    scopes: [DIALOGFLOW_SCOPE],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const value = typeof token === "string" ? token : token?.token ?? "";
  if (!value) throw new Error("dialogflow_access_token_missing");
  return value;
}

function agentIdFromName(name: string) {
  const match = name.match(/\/agents\/([^/]+)$/);
  const agentId = match?.[1] ?? "";
  if (!AGENT_ID_PATTERN.test(agentId)) throw new Error("dialogflow_agent_resource_invalid");
  return agentId;
}

async function fetchAgent(baseUrl: string, token: string, projectId: string, location: string, agentId: string) {
  const path = `projects/${encodeURIComponent(projectId)}/locations/${encodeURIComponent(location)}/agents/${encodeURIComponent(agentId)}`;
  const response = await fetch(`${baseUrl}/${path}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`dialogflow_agent_lookup_unavailable_${response.status}`);
  return await response.json() as DialogflowAgent;
}

async function listExactAgent(baseUrl: string, token: string, projectId: string, location: string, displayName: string) {
  const matches: DialogflowAgent[] = [];
  let pageToken = "";
  do {
    const url = new URL(`${baseUrl}/projects/${encodeURIComponent(projectId)}/locations/${encodeURIComponent(location)}/agents`);
    url.searchParams.set("pageSize", "100");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const response = await fetch(url, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`dialogflow_agent_list_unavailable_${response.status}`);
    const payload = await response.json() as { agents?: DialogflowAgent[]; nextPageToken?: string };
    matches.push(...(payload.agents ?? []).filter((agent) => agent.displayName?.trim() === displayName));
    pageToken = payload.nextPageToken ?? "";
  } while (pageToken);

  if (matches.length !== 1 || !matches[0]?.name) {
    throw new Error(matches.length === 0 ? "dialogflow_agent_not_found" : "dialogflow_agent_not_unique");
  }
  return matches[0];
}

async function resolveDialogflowAgent(): Promise<DialogflowCxConfig> {
  if (cachedAgent) return cachedAgent;
  const runtime = getDialogflowRuntimeConfig();
  const token = await getAccessToken();
  const baseUrl = getDialogflowBaseUrl(runtime.location);

  let selected: DialogflowAgent;
  if (runtime.configuredAgentId) {
    const configured = await fetchAgent(
      baseUrl,
      token,
      runtime.projectId,
      runtime.location,
      runtime.configuredAgentId,
    );
    if (!configured) throw new Error("dialogflow_configured_agent_not_found");
    if (configured.displayName?.trim() !== runtime.agentDisplayName) {
      throw new Error("dialogflow_configured_agent_name_mismatch");
    }
    selected = configured;
  } else {
    selected = await listExactAgent(baseUrl, token, runtime.projectId, runtime.location, runtime.agentDisplayName);
  }

  const agentId = selected.name ? agentIdFromName(selected.name) : "";
  cachedAgent = Object.freeze({
    projectId: runtime.projectId,
    location: runtime.location,
    agentId,
    agentDisplayName: runtime.agentDisplayName,
    languageCode: runtime.languageCode,
  });
  return cachedAgent;
}

function queryResult(payload: Record<string, unknown>) {
  return payload.queryResult && typeof payload.queryResult === "object" && !Array.isArray(payload.queryResult)
    ? payload.queryResult as Record<string, unknown>
    : {};
}

function responseText(result: Record<string, unknown>) {
  const messages = Array.isArray(result.responseMessages) ? result.responseMessages : [];
  const text = messages
    .flatMap((message) => {
      if (!message || typeof message !== "object") return [];
      const textPayload = (message as { text?: { text?: unknown } }).text?.text;
      return Array.isArray(textPayload) ? textPayload : [];
    })
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
  if (text) return text;
  return typeof result.fulfillmentText === "string" ? result.fulfillmentText.trim() : "";
}

function requestClass(result: Record<string, unknown>): "flow" | "playbook" {
  const generativeInfo = result.generativeInfo;
  return generativeInfo && typeof generativeInfo === "object" && !Array.isArray(generativeInfo)
    ? "playbook"
    : "flow";
}

export async function detectDialogflowReply(input: {
  sessionId: string;
  message: string;
  transcript?: string;
}) {
  const agent = await resolveDialogflowAgent();
  const token = await getAccessToken();
  const baseUrl = getDialogflowBaseUrl(agent.location);
  const sessionId = normalizeDialogflowSessionId(input.sessionId);
  const sessionPath = `projects/${encodeURIComponent(agent.projectId)}/locations/${encodeURIComponent(agent.location)}/agents/${encodeURIComponent(agent.agentId)}/sessions/${encodeURIComponent(sessionId)}`;
  const response = await fetch(`${baseUrl}/${sessionPath}:detectIntent`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      queryInput: {
        languageCode: agent.languageCode,
        text: { text: input.message.trim() },
      },
      responseView: "DETECT_INTENT_RESPONSE_VIEW_FULL",
    }),
  });

  if (!response.ok) throw new Error(`dialogflow_cx_detect_intent_unavailable_${response.status}`);
  const payload = await response.json() as Record<string, unknown>;
  const result = queryResult(payload);
  const replyText = responseText(result);
  if (!replyText) throw new Error("dialogflow_cx_reply_empty");
  const providerRequestId = typeof payload.responseId === "string" ? payload.responseId.trim() : "";
  if (!providerRequestId) throw new Error("dialogflow_cx_response_id_missing");
  const classifiedRequest = requestClass(result);

  return Object.freeze({
    replyText,
    providerRequestId,
    model: classifiedRequest === "playbook" ? PLAYBOOK_BILLING_MODEL : FLOW_BILLING_MODEL,
    usageMetadata: Object.freeze({
      requestCount: 1,
      billingUnit: "text-request" as const,
      requestClass: classifiedRequest,
    }),
    occurredAt: new Date().toISOString(),
  });
}
