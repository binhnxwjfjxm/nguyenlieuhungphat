import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { GoogleAuth } from "google-auth-library";
import { Client } from "pg";

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env.local");
const SA_PATH = path.join(ROOT, "Project-ID-dialog-supprot-vlgn.json");
const MIGRATION_PATH = path.join(ROOT, "supabase", "migrations", "20260720_hung_phat_website.sql");

const DIALOGFLOW_SCOPE = "https://www.googleapis.com/auth/dialogflow";
const DIALOGFLOW_BASE_URL = "https://dialogflow.googleapis.com/v3";
const DEFAULT_LOCATION = "global";
const DEFAULT_LANGUAGE = "vi";
const DEFAULT_AGENT_ID = "291aef79-770c-4c6d-a8c8-a081206ace4e";

function stripQuotes(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseDotEnv(content) {
  const env = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = stripQuotes(line.slice(index + 1));
    if (key) env[key] = value;
  }
  return env;
}

function requireValue(env, keys, label) {
  for (const key of keys) {
    const value = env[key]?.trim();
    if (value) {
      return { key, value };
    }
  }
  throw new Error(`Missing ${label}. Expected one of: ${keys.join(", ")}`);
}

function normalizeText(value) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scoreAgent(displayName) {
  const normalized = normalizeText(displayName);
  if (!normalized) return -1;
  if (normalized === "hung phat admin") return 100;
  if (normalized === "hung phat web assistant") return 95;
  if (normalized.includes("hung phat")) return 80;
  return -1;
}

function parseSupabaseConnectionString(connectionString) {
  const value = connectionString.trim();
  const match = value.match(/^postgres(?:ql)?:\/\/(.+)$/i);
  if (!match) {
    throw new Error("SUPABASE_CONNECTION_STRING must start with postgres:// or postgresql://");
  }

  const rest = match[1];
  const slashIndex = rest.indexOf("/");
  if (slashIndex === -1) {
    throw new Error("SUPABASE_CONNECTION_STRING is missing the database name");
  }

  const authority = rest.slice(0, slashIndex);
  const databaseAndQuery = rest.slice(slashIndex + 1);
  const atIndex = authority.lastIndexOf("@");
  if (atIndex === -1) {
    throw new Error("SUPABASE_CONNECTION_STRING is missing host information");
  }

  const userInfo = authority.slice(0, atIndex);
  const hostInfo = authority.slice(atIndex + 1);
  const colonIndex = userInfo.indexOf(":");
  if (colonIndex === -1) {
    throw new Error("SUPABASE_CONNECTION_STRING is missing the password segment");
  }

  const user = decodeURIComponent(userInfo.slice(0, colonIndex));
  const password = decodeURIComponent(userInfo.slice(colonIndex + 1));
  const hostColonIndex = hostInfo.lastIndexOf(":");
  if (hostColonIndex === -1) {
    throw new Error("SUPABASE_CONNECTION_STRING is missing the port");
  }

  const host = hostInfo.slice(0, hostColonIndex);
  const port = Number(hostInfo.slice(hostColonIndex + 1));
  if (!Number.isInteger(port)) {
    throw new Error("SUPABASE_CONNECTION_STRING has an invalid port");
  }

  const [database] = databaseAndQuery.split("?", 1);
  return {
    host,
    port,
    user,
    password,
    database: decodeURIComponent(database),
    ssl: { rejectUnauthorized: false },
  };
}

async function readEnvFile() {
  const content = await fs.readFile(ENV_PATH, "utf8");
  return parseDotEnv(content);
}

async function readServiceAccount() {
  const rawContent = await fs.readFile(SA_PATH, "utf8");
  return {
    rawContent,
    parsed: JSON.parse(rawContent),
  };
}

async function readMigrationSql() {
  return fs.readFile(MIGRATION_PATH, "utf8");
}

async function createGoogleClient(serviceAccount) {
  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: [DIALOGFLOW_SCOPE],
  });
  return auth.getClient();
}

async function fetchJson(url, headers) {
  const response = await fetch(url, { headers });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Dialogflow API error ${response.status}: ${text.slice(0, 400)}`);
  }
  return JSON.parse(text);
}

async function getAgent(authHeaders, projectId, location, agentId) {
  const url = `${DIALOGFLOW_BASE_URL}/projects/${projectId}/locations/${location}/agents/${agentId}`;
  const response = await fetch(url, { headers: authHeaders });
  if (response.status === 404) return null;
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Dialogflow agent lookup failed ${response.status}: ${text.slice(0, 400)}`);
  }
  return JSON.parse(text);
}

async function listAgents(authHeaders, projectId, location) {
  const agents = [];
  let pageToken = "";

  do {
    const url = new URL(`${DIALOGFLOW_BASE_URL}/projects/${projectId}/locations/${location}/agents`);
    url.searchParams.set("pageSize", "200");
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }
    const payload = await fetchJson(url, authHeaders);
    agents.push(...(payload.agents ?? []));
    pageToken = payload.nextPageToken ?? "";
  } while (pageToken);

  return agents;
}

function chooseAgent(preferredAgent, agents) {
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

async function ensureSecret(client, name, value) {
  const existing = await client.query("select id from vault.secrets where name = $1 limit 1", [name]);
  if (existing.rowCount > 0) {
    const id = existing.rows[0].id;
    await client.query("select vault.update_secret($1, $2, $3)", [id, value, name]);
    return "updated";
  }

  await client.query("select vault.create_secret($1, $2)", [value, name]);
  return "created";
}

async function applyMigration(client, migrationSql) {
  await client.query(migrationSql);
}

async function upsertIntegrationSettings(client, rows) {
  for (const row of rows) {
    await client.query(
      `
        insert into public.hung_phat_integration_settings (
          key,
          provider,
          environment,
          enabled,
          config,
          updated_at
        )
        values ($1, $2, $3, $4, $5::jsonb, now())
        on conflict (key) do update set
          provider = excluded.provider,
          environment = excluded.environment,
          enabled = excluded.enabled,
          config = excluded.config,
          updated_at = now()
      `,
      [row.key, row.provider, row.environment, row.enabled, JSON.stringify(row.config)],
    );
  }

  return rows.map((row) => row.key);
}

async function upsertPlaybooks(client, rows) {
  for (const row of rows) {
    await client.query(
      `
        insert into public.hung_phat_playbooks (
          slug,
          title,
          description,
          config,
          enabled,
          version,
          updated_at
        )
        values ($1, $2, $3, $4::jsonb, $5, $6, now())
        on conflict (slug) do update set
          title = excluded.title,
          description = excluded.description,
          config = excluded.config,
          enabled = excluded.enabled,
          version = excluded.version,
          updated_at = now()
      `,
      [row.slug, row.title, row.description, JSON.stringify(row.config), row.enabled, row.version],
    );
  }

  return rows.map((row) => row.slug);
}

async function main() {
  const env = await readEnvFile();
  const migrationSql = await readMigrationSql();
  const serviceAccount = await readServiceAccount();

  const telegramTokenEntry = requireValue(env, ["TELEGRAM_BOT_TOKEN"], "Telegram bot token");
  const supabaseConnection = requireValue(env, ["SUPABASE_CONNECTION_STRING"], "Supabase connection string");
  const quoteChatId = requireValue(env, ["TELEGRAM_QUOTE_CHAT_ID", "TELEGRAM_QUOTE_TOPIC_ID"], "Telegram quote chat ID");
  const adminChatId = requireValue(env, ["TELEGRAM_ADMIN_CHAT_ID", "TELEGRAM_CHAT_TOPIC_ID"], "Telegram admin chat ID");
  const candidateAgentIds = [
    env.DIALOGFLOW_CX_AGENT_ID?.trim(),
    env.DIALOGFLOW_AGENT_ID?.trim(),
    DEFAULT_AGENT_ID,
  ].filter(Boolean);
  const location = env.DIALOGFLOW_CX_LOCATION?.trim() || env.DIALOGFLOW_LOCATION?.trim() || DEFAULT_LOCATION;
  const languageCode = env.DIALOGFLOW_CX_LANGUAGE_CODE?.trim() || env.DIALOGFLOW_LANGUAGE_CODE?.trim() || DEFAULT_LANGUAGE;
  const projectId = serviceAccount.parsed.project_id || "dialog-supprot-vlgn";

  const authClient = await createGoogleClient(serviceAccount.parsed);
  const authHeaders = await authClient.getRequestHeaders();

  let preferredAgent = null;
  for (const candidateId of candidateAgentIds) {
    preferredAgent = await getAgent(authHeaders, projectId, location, candidateId);
    if (preferredAgent) break;
  }

  const allAgents = await listAgents(authHeaders, projectId, location);
  const selectedAgent = chooseAgent(preferredAgent, allAgents);

  const dbConfig = parseSupabaseConnectionString(supabaseConnection.value);
  const client = new Client(dbConfig);
  await client.connect();

  try {
    await applyMigration(client, migrationSql);

    const telegramSecretAction = await ensureSecret(client, "hung_phat_telegram_bot_token", telegramTokenEntry.value);
    const googleSecretAction = await ensureSecret(client, "hung_phat_google_service_account_json", serviceAccount.rawContent);
    const updatedSettings = await upsertIntegrationSettings(client, [
      {
        key: "telegram_runtime",
        provider: "telegram",
        environment: "production",
        enabled: true,
        config: {
          mode: "separate_groups",
          bot_username: "hung_phat_admin_bot",
          quote_chat_id: quoteChatId.value,
          admin_chat_id: adminChatId.value,
        },
      },
      {
        key: "dialogflow_runtime",
        provider: "dialogflow_cx",
        environment: "production",
        enabled: true,
        config: {
          project_id: projectId,
          location,
          agent_id: selectedAgent.name,
          agent_display_name: selectedAgent.displayName,
          language_code: languageCode,
        },
      },
    ]);

    const updatedPlaybooks = await upsertPlaybooks(client, [
      {
        slug: "freeform-chat",
        title: "Chat tu do",
        description: "Luu cau hoi chat tu do va chuyen cho nhan vien phu trach.",
        config: {
          mode: "freeform",
          quick_actions: false,
          persistence: "supabase",
        },
        enabled: true,
        version: 1,
      },
      {
        slug: "quote-intake",
        title: "Bao gia",
        description: "Cau hinh tiep nhan bao gia va luu lead khong nhay cam.",
        config: {
          mode: "lead-intake",
          required_fields: ["name", "phone", "product", "area"],
        },
        enabled: true,
        version: 1,
      },
    ]);

    console.log(`Agent ID selected: ${selectedAgent.name}`);
    console.log(`Agent displayName selected: ${selectedAgent.displayName}`);
    console.log(`Settings rows upserted: ${updatedSettings.join(", ")}`);
    console.log(`Playbooks upserted: ${updatedPlaybooks.join(", ")}`);
    console.log(`Vault secrets synced: hung_phat_telegram_bot_token (${telegramSecretAction}), hung_phat_google_service_account_json (${googleSecretAction})`);
    console.log(`Migration applied: ${path.relative(ROOT, MIGRATION_PATH)}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
