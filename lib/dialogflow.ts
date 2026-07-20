import fs from "node:fs/promises";
import path from "node:path";
import { GoogleAuth } from "google-auth-library";
import { getDialogflowRuntimeFromSupabase } from "@/lib/hung-phat-supabase";

type ServiceAccount = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
  [key: string]: unknown;
};

export type DialogflowConfig = {
  projectId: string;
  location: string;
  agentId: string;
  languageCode: string;
};

type SupabaseDialogflowRuntime = DialogflowConfig & {
  serviceAccountJson: string;
  agentDisplayName?: string;
};

const ROOT = process.cwd();
const SERVICE_ACCOUNT_PATH = path.join(ROOT, "Project-ID-dialog-supprot-vlgn.json");

const DIALOGFLOW_SCOPE = "https://www.googleapis.com/auth/dialogflow";
const DIALOGFLOW_BASE_URL = "https://dialogflow.googleapis.com/v3";

const DEFAULT_LOCATION = "global";
const DEFAULT_LANGUAGE_CODE = "vi";
const DEFAULT_AGENT_ID = "291aef79-770c-4c6d-a8c8-a081206ace4e";

let cachedServiceAccount: ServiceAccount | null = null;
let cachedSupabaseRuntime: SupabaseDialogflowRuntime | null = null;

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scoreAgent(displayName: string) {
  const normalized = normalizeText(displayName);
  if (!normalized) return -1;
  if (normalized === "hung phat admin") return 100;
  if (normalized === "hung phat web assistant") return 95;
  if (normalized.includes("hung phat")) return 80;
  return -1;
}

function chooseAgent(preferredAgent: { name?: string; displayName?: string } | null, agents: Array<{ name?: string; displayName?: string }>) {
  if (preferredAgent && scoreAgent(preferredAgent.displayName ?? "") >= 0) {
    return preferredAgent;
  }

  const ranked = agents
    .map((agent) => ({ agent, score: scoreAgent(agent.displayName ?? "") }))
    .filter(({ score }) => score >= 0)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) {
    throw new Error("No Dialogflow CX agent matched Hưng Phát.");
  }

  return ranked[0].agent;
}

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

async function readServiceAccount(): Promise<ServiceAccount> {
  if (cachedServiceAccount) return cachedServiceAccount;

  if (cachedSupabaseRuntime) {
    cachedServiceAccount = JSON.parse(cachedSupabaseRuntime.serviceAccountJson) as ServiceAccount;
    return cachedServiceAccount;
  }

  const runtimeFromSupabase = await getDialogflowRuntimeFromSupabase();
  if (runtimeFromSupabase) {
    cachedSupabaseRuntime = runtimeFromSupabase;
    cachedServiceAccount = JSON.parse(runtimeFromSupabase.serviceAccountJson) as ServiceAccount;
    return cachedServiceAccount;
  }

  const inlineJson = getEnvValue("DIALOGFLOW_SERVICE_ACCOUNT_JSON", "DIALOGFLOW_CX_SERVICE_ACCOUNT_JSON", "GOOGLE_SERVICE_ACCOUNT_JSON");
  if (inlineJson) {
    cachedServiceAccount = JSON.parse(inlineJson) as ServiceAccount;
    return cachedServiceAccount;
  }

  const raw = await fs.readFile(SERVICE_ACCOUNT_PATH, "utf8");
  cachedServiceAccount = JSON.parse(raw) as ServiceAccount;
  return cachedServiceAccount;
}

export async function getDialogflowConfig(): Promise<DialogflowConfig> {
  const serviceAccount = await readServiceAccount();
  const runtimeFromSupabase = cachedSupabaseRuntime ?? (await getDialogflowRuntimeFromSupabase());
  if (runtimeFromSupabase) {
    cachedSupabaseRuntime = runtimeFromSupabase;
  }

  const projectId =
    runtimeFromSupabase?.projectId ||
    getEnvValue("DIALOGFLOW_CX_PROJECT_ID", "DIALOGFLOW_PROJECT_ID") ||
    serviceAccount.project_id ||
    "";
  if (!projectId) {
    throw new Error("Missing Dialogflow project id.");
  }

  return {
    projectId,
    location: runtimeFromSupabase?.location || getEnvValue("DIALOGFLOW_CX_LOCATION", "DIALOGFLOW_LOCATION") || DEFAULT_LOCATION,
    agentId: runtimeFromSupabase?.agentId || getEnvValue("DIALOGFLOW_CX_AGENT_ID", "DIALOGFLOW_AGENT_ID") || DEFAULT_AGENT_ID,
    languageCode:
      runtimeFromSupabase?.languageCode || getEnvValue("DIALOGFLOW_CX_LANGUAGE_CODE", "DIALOGFLOW_LANGUAGE_CODE") || DEFAULT_LANGUAGE_CODE,
  };
}

async function getAuthHeaders() {
  const serviceAccount = await readServiceAccount();
  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: [DIALOGFLOW_SCOPE],
  });
  const client = await auth.getClient();
  return client.getRequestHeaders();
}

async function getAccessToken() {
  const serviceAccount = await readServiceAccount();
  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: [DIALOGFLOW_SCOPE],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (typeof token === "string") return token;
  return token?.token ?? "";
}

async function listAgents(projectId: string, location: string) {
  const headers = await getAuthHeaders();
  const agents: Array<{ name?: string; displayName?: string }> = [];
  let pageToken = "";

  do {
    const url = new URL(`${DIALOGFLOW_BASE_URL}/projects/${projectId}/locations/${location}/agents`);
    url.searchParams.set("pageSize", "200");
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }
    const response = await fetch(url, { headers });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Dialogflow agent lookup failed ${response.status}: ${text.slice(0, 400)}`);
    }
    const payload = JSON.parse(text) as { agents?: Array<{ name?: string; displayName?: string }>; nextPageToken?: string };
    agents.push(...(payload.agents ?? []));
    pageToken = payload.nextPageToken ?? "";
  } while (pageToken);

  return agents;
}

export async function resolveDialogflowAgent() {
  const config = await getDialogflowConfig();
  const headers = await getAuthHeaders();
  const preferredAgentPath = `projects/${config.projectId}/locations/${config.location}/agents/${config.agentId}`;
  const preferredResponse = await fetch(`${DIALOGFLOW_BASE_URL}/${preferredAgentPath}`, { headers });
  const preferredAgent = preferredResponse.ok
    ? ((await preferredResponse.json()) as { name?: string; displayName?: string })
    : null;

  if (preferredAgent && scoreAgent(preferredAgent.displayName ?? "") >= 0) {
    return { ...config, agentName: preferredAgent.name ?? preferredAgentPath, agentDisplayName: preferredAgent.displayName ?? "Hưng Phát" };
  }

  const agents = await listAgents(config.projectId, config.location);
  const selectedAgent = chooseAgent(preferredAgent, agents);
  if (!selectedAgent.name) {
    throw new Error("Selected Dialogflow agent is missing resource name.");
  }

  return {
    ...config,
    agentName: selectedAgent.name,
    agentDisplayName: selectedAgent.displayName ?? "Hưng Phát",
  };
}

export async function detectDialogflowReply(input: {
  sessionId: string;
  message: string;
}) {
  const agent = await resolveDialogflowAgent();
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("Missing Dialogflow access token.");
  }

  const sessionId = normalizeDialogflowSessionId(input.sessionId);
  const sessionPath = `${agent.agentName}/sessions/${sessionId}`;
  const url = `${DIALOGFLOW_BASE_URL}/${sessionPath}:detectIntent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      queryInput: {
        languageCode: agent.languageCode,
        text: {
          text: input.message,
        },
      },
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Dialogflow detectIntent failed ${response.status}: ${text.slice(0, 400)}`);
  }

  const payload = JSON.parse(text) as {
    queryResult?: {
      responseMessages?: Array<{ text?: { text?: string[] } }>;
      intent?: { displayName?: string };
      currentPage?: { displayName?: string };
      parameters?: Record<string, unknown>;
      fulfillmentText?: string;
    };
  };

  const responseMessages = payload.queryResult?.responseMessages ?? [];
  const replyText =
    responseMessages
      .flatMap((message) => message.text?.text ?? [])
      .map((item) => item.trim())
      .filter(Boolean)
      .join("\n")
      .trim() ||
    payload.queryResult?.fulfillmentText?.trim() ||
    "";

  return {
    agent,
    replyText,
    intentDisplayName: payload.queryResult?.intent?.displayName ?? "",
    pageDisplayName: payload.queryResult?.currentPage?.displayName ?? "",
    parameters: payload.queryResult?.parameters ?? {},
  };
}
