import "server-only";

import { GoogleAuth } from "google-auth-library";

export const runtime = "nodejs";

const CREDENTIAL_KEY = "DIALOGFLOW_SERVICE_ACCOUNT_JSON";
const EXPECTED_AGENT_ID = "e326abbf-77f7-4b16-996c-64408c4dd136";
const EXPECTED_DISPLAY_NAME = "Hưng Phát";
const LOCATION = "global";
const PROJECT_CANDIDATES = ["hck-agent-chat-prod-498413", "hck-agent-chat-prod"] as const;

type ServiceAccount = {
  client_email?: string;
  private_key?: string;
};

type Agent = {
  name?: string;
  displayName?: string;
};

function loadCredential(): ServiceAccount {
  const raw = process.env[CREDENTIAL_KEY]?.trim() ?? "";
  if (!raw) throw new Error("dialogflow_runtime_credential_missing");
  let parsed: ServiceAccount;
  try {
    parsed = JSON.parse(raw) as ServiceAccount;
  } catch {
    throw new Error("dialogflow_runtime_credential_invalid_json");
  }
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("dialogflow_runtime_credential_invalid_shape");
  }
  return parsed;
}

async function accessToken() {
  const auth = new GoogleAuth({
    credentials: loadCredential(),
    scopes: ["https://www.googleapis.com/auth/dialogflow"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const value = typeof token === "string" ? token : token?.token ?? "";
  if (!value) throw new Error("dialogflow_access_token_missing");
  return value;
}

async function providerJson(url: string, token: string) {
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const body = await response.json().catch(() => null) as Record<string, unknown> | null;
  return { response, body };
}

export async function GET() {
  try {
    const token = await accessToken();
    const canonicalNames = new Set<string>();
    const probes: Array<Record<string, unknown>> = [];

    for (const projectId of PROJECT_CANDIDATES) {
      const getUrl = `https://dialogflow.googleapis.com/v3/projects/${encodeURIComponent(projectId)}/locations/${LOCATION}/agents/${EXPECTED_AGENT_ID}`;
      const getResult = await providerJson(getUrl, token);
      const getName = typeof getResult.body?.name === "string" ? getResult.body.name : "";
      const getDisplayName = typeof getResult.body?.displayName === "string" ? getResult.body.displayName : "";
      probes.push({
        operation: "get",
        projectId,
        status: getResult.response.status,
        name: getResult.response.ok ? getName : "",
        displayName: getResult.response.ok ? getDisplayName : "",
      });
      if (getResult.response.ok && getName && getDisplayName === EXPECTED_DISPLAY_NAME) {
        canonicalNames.add(getName);
      }

      const listUrl = new URL(`https://dialogflow.googleapis.com/v3/projects/${encodeURIComponent(projectId)}/locations/${LOCATION}/agents`);
      listUrl.searchParams.set("pageSize", "100");
      const listResult = await providerJson(listUrl.toString(), token);
      const agents = listResult.response.ok && Array.isArray(listResult.body?.agents)
        ? listResult.body.agents as Agent[]
        : [];
      const matches = agents.filter((agent) => agent.displayName === EXPECTED_DISPLAY_NAME && typeof agent.name === "string");
      probes.push({
        operation: "list",
        projectId,
        status: listResult.response.status,
        matchCount: matches.length,
        names: matches.map((agent) => agent.name),
      });
      for (const agent of matches) {
        if (agent.name) canonicalNames.add(agent.name);
      }
    }

    const names = [...canonicalNames];
    return Response.json({
      ok: names.length === 1,
      expectedAgentId: EXPECTED_AGENT_ID,
      expectedDisplayName: EXPECTED_DISPLAY_NAME,
      location: LOCATION,
      canonicalNames: names,
      probes,
    }, { status: names.length === 1 ? 200 : 409 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "dialogflow_metadata_probe_failed";
    return Response.json({ ok: false, code }, { status: 500 });
  }
}
