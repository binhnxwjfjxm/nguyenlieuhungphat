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

export type DialogflowCxConfig = {
  projectId: string;
  location: string;
  agentId: string;
  agentDisplayName: string;
  languageCode: string;
};

const DIALOGFLOW_SCOPE = "https://www.googleapis.com/auth/dialogflow";
const DEFAULT_PROJECT_ID = "hck-agent-chat-prod";
const DEFAULT_CONSUMER_PROJECT_ID = "hck-agent-chat-prod-498413";
const DEFAULT_LOCATION = "global";
const DEFAULT_AGENT_ID = "e326abbf-77f7-4b16-996c-64408c4dd136";
const DEFAULT_AGENT_DISPLAY_NAME = "Hưng Phát";
const DEFAULT_LANGUAGE_CODE = "vi";
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

function getExactEnvValue(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (value !== undefined) return value;
  }
  return "";
}

function getFirstPresentCredential() {
  for (const key of [
    "DIALOGFLOW_CX_SERVICE_ACCOUNT_JSON",
    "DIALOGFLOW_SERVICE_ACCOUNT_JSON",
    "GOOGLE_SERVICE_ACCOUNT_JSON",
  ]) {
    const value = process.env[key];
    if (value !== undefined) return { key, value };
  }
  return null;
}

export function normalizeDialogflowSessionId(sessionId: string) {
  return sessionId.trim().replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 36) || "hungphat-session";
}

function loadServiceAccount(): ServiceAccount {
  if (cachedServiceAccount) return cachedServiceAccount;
  const selectedCredential = getFirstPresentCredential();
  if (!selectedCredential) throw new Error("dialogflow_service_account_missing");
  const inlineJson = selectedCredential.value.trim();
  if (!inlineJson) throw new Error(`dialogflow_service_account_unreadable:${selectedCredential.key}`);
  let parsed: ServiceAccount;
  try {
    parsed = JSON.parse(inlineJson) as ServiceAccount;
  } catch {
    throw new Error(`dialogflow_service_account_unreadable:${selectedCredential.key}`);
  }
  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    throw new Error("dialogflow_service_account_invalid");
  }
  if (!SAFE_PROJECT_ID.test(parsed.project_id)) throw new Error("dialogflow_consumer_project_invalid");
  if (parsed.project_id !== DEFAULT_CONSUMER_PROJECT_ID) {
    throw new Error("dialogflow_consumer_project_identity_mismatch");
  }
  console.info("dialogflow_cx_runtime_identity", {
    credentialAlias: selectedCredential.key,
    clientEmail: parsed.client_email,
    consumerProjectId: parsed.project_id,
  });
  cachedServiceAccount = parsed;
  return parsed;
}

function getDialogflowBaseUrl(location: string) {
  const host = location === "global" ? "dialogflow.googleapis.com" : `${location}-dialogflow.googleapis.com`;
  return `https://${host}/v3`;
}

function getDialogflowRuntimeConfig() {
  const projectId = getExactEnvValue("DIALOGFLOW_CX_PROJECT_ID", "DIALOGFLOW_PROJECT_ID") || DEFAULT_PROJECT_ID;
  const location = getExactEnvValue("DIALOGFLOW_CX_LOCATION", "DIALOGFLOW_LOCATION") || DEFAULT_LOCATION;
  const configuredAgentId = getExactEnvValue("DIALOGFLOW_CX_AGENT_ID", "DIALOGFLOW_AGENT_ID") || DEFAULT_AGENT_ID;
  const agentDisplayName = getExactEnvValue("DIALOGFLOW_CX_AGENT_DISPLAY_NAME") || DEFAULT_AGENT_DISPLAY_NAME;
  const languageCode = getEnvValue("DIALOGFLOW_CX_LANGUAGE_CODE", "DIALOGFLOW_LANGUAGE_CODE") || DEFAULT_LANGUAGE_CODE;

  if (!SAFE_PROJECT_ID.test(projectId)) throw new Error("dialogflow_project_invalid");
  if (!SAFE_LOCATION.test(location)) throw new Error("dialogflow_location_invalid");
  if (!AGENT_ID_PATTERN.test(configuredAgentId)) throw new Error("dialogflow_agent_id_invalid");
  if (!SAFE_LANGUAGE.test(languageCode)) throw new Error("dialogflow_language_invalid");
  if (projectId !== DEFAULT_PROJECT_ID) throw new Error("dialogflow_project_identity_mismatch");
  if (location !== DEFAULT_LOCATION) throw new Error("dialogflow_location_identity_mismatch");
  if (configuredAgentId !== DEFAULT_AGENT_ID) throw new Error("dialogflow_agent_identity_mismatch");
  if (agentDisplayName !== DEFAULT_AGENT_DISPLAY_NAME) throw new Error("dialogflow_agent_display_name_invalid");

  return Object.freeze({ projectId, location, configuredAgentId, agentDisplayName, languageCode });
}

async function getAccessToken(serviceAccount: ServiceAccount) {
  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: [DIALOGFLOW_SCOPE],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const value = typeof token === "string" ? token : token?.token ?? "";
  if (!value) throw new Error("dialogflow_access_token_missing");
  return value;
}

async function resolveDialogflowAgent(): Promise<DialogflowCxConfig> {
  if (cachedAgent) return cachedAgent;
  const runtime = getDialogflowRuntimeConfig();

  cachedAgent = Object.freeze({
    projectId: runtime.projectId,
    location: runtime.location,
    agentId: runtime.configuredAgentId,
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

function providerErrorText(value: unknown) {
  return typeof value === "string"
    ? value.replace(/[\r\n\t]+/g, " ").trim().slice(0, 500)
    : "";
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
  const serviceAccount = loadServiceAccount();
  const token = await getAccessToken(serviceAccount);
  const baseUrl = getDialogflowBaseUrl(agent.location);
  const sessionId = normalizeDialogflowSessionId(input.sessionId);
  const sessionPath = `projects/${encodeURIComponent(agent.projectId)}/locations/${encodeURIComponent(agent.location)}/agents/${encodeURIComponent(agent.agentId)}/sessions/${encodeURIComponent(sessionId)}`;
  const response = await fetch(`${baseUrl}/${sessionPath}:detectIntent`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "x-goog-user-project": DEFAULT_CONSUMER_PROJECT_ID,
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

  if (!response.ok) {
    const providerPayload = await response.json().catch(() => null) as Record<string, unknown> | null;
    const providerError = providerPayload?.error && typeof providerPayload.error === "object" && !Array.isArray(providerPayload.error)
      ? providerPayload.error as Record<string, unknown>
      : {};
    console.error("dialogflow_cx_detect_intent_provider_error", {
      httpStatus: response.status,
      code: typeof providerError.code === "number" ? providerError.code : null,
      status: providerErrorText(providerError.status),
      message: providerErrorText(providerError.message),
    });
    throw new Error(`dialogflow_cx_detect_intent_unavailable_${response.status}`);
  }
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
