import "server-only";

import { Pool } from "pg";

type TelegramRecord = {
  telegramChatId?: string | number | null;
  telegramMessageId?: number | null;
};

type ChatRecordInput = TelegramRecord & {
  sessionId: string;
  source: string;
  pathname: string;
  website: string;
  transcript: string;
  requestCallback: boolean;
  agentStatus?: string;
  playbookKey?: string;
};

type QuoteRecordInput = TelegramRecord & {
  leadId: string;
  name: string;
  phone: string;
  company: string;
  email: string;
  product: string;
  quantity: string;
  area: string;
  usage: string;
  note: string;
  source: string;
  pathname: string;
  website: string;
  status?: string;
};

type IntegrationSettingsInput = {
  key: string;
  provider: string;
  environment: string;
  enabled: boolean;
  config: Record<string, unknown>;
};

declare global {
  var __hungPhatSupabasePool: Pool | undefined;
}

function getConnectionString() {
  return process.env.SUPABASE_CONNECTION_STRING?.trim() || "";
}

function getPool() {
  const connectionString = getConnectionString();
  if (!connectionString) return null;

  if (!globalThis.__hungPhatSupabasePool) {
    globalThis.__hungPhatSupabasePool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
  }

  return globalThis.__hungPhatSupabasePool;
}

function normalizeValue(value: string) {
  return value.normalize("NFC").trim();
}

function normalizeTelegramId(value?: string | number | null) {
  if (value == null) return null;
  return normalizeValue(String(value));
}

async function runQuery(sql: string, params: unknown[]) {
  const pool = getPool();
  if (!pool) return false;
  await pool.query(sql, params);
  return true;
}

export async function recordChatConversation(input: ChatRecordInput) {
  const pool = getPool();
  if (!pool) return { ok: false as const, skipped: true as const };

  const sessionId = normalizeValue(input.sessionId);
  const source = normalizeValue(input.source || "chatbot");
  const pathname = normalizeValue(input.pathname || "/") || "/";
  const website = normalizeValue(input.website || "");
  const transcript = input.transcript.normalize("NFC");
  const agentStatus = normalizeValue(input.agentStatus || "queued") || "queued";
  const playbookKey = normalizeValue(input.playbookKey || "freeform-chat") || "freeform-chat";

  await pool.query(
    `
      insert into public.hung_phat_chat_sessions (
        session_id,
        source,
        pathname,
        website,
        request_callback,
        agent_status,
        playbook_key,
        last_message_at,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, now(), now())
      on conflict (session_id) do update set
        source = excluded.source,
        pathname = excluded.pathname,
        website = excluded.website,
        request_callback = excluded.request_callback,
        agent_status = excluded.agent_status,
        playbook_key = excluded.playbook_key,
        last_message_at = now(),
        updated_at = now()
    `,
      [sessionId, source, pathname, website, input.requestCallback, agentStatus, playbookKey],
  );

  await pool.query(
    `
      insert into public.hung_phat_chat_messages (
        session_id,
        role,
        content,
        telegram_chat_id,
        telegram_message_id
      )
      values ($1, 'user', $2, $3, $4)
    `,
    [sessionId, transcript, normalizeTelegramId(input.telegramChatId), input.telegramMessageId ?? null],
  );

  return { ok: true as const };
}

export async function recordQuoteLead(input: QuoteRecordInput) {
  const pool = getPool();
  if (!pool) return { ok: false as const, skipped: true as const };

  await pool.query(
    `
      insert into public.hung_phat_quote_leads (
        lead_id,
        name,
        phone,
        company,
        email,
        product,
        quantity,
        area,
        usage,
        note,
        source,
        pathname,
        website,
        status,
        telegram_chat_id,
        telegram_message_id,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, now())
      on conflict (lead_id) do update set
        name = excluded.name,
        phone = excluded.phone,
        company = excluded.company,
        email = excluded.email,
        product = excluded.product,
        quantity = excluded.quantity,
        area = excluded.area,
        usage = excluded.usage,
        note = excluded.note,
        source = excluded.source,
        pathname = excluded.pathname,
        website = excluded.website,
        status = excluded.status,
        telegram_chat_id = excluded.telegram_chat_id,
        telegram_message_id = excluded.telegram_message_id,
        updated_at = now()
    `,
    [
      normalizeValue(input.leadId),
      normalizeValue(input.name),
      normalizeValue(input.phone),
      normalizeValue(input.company || ""),
      normalizeValue(input.email || ""),
      normalizeValue(input.product || ""),
      normalizeValue(input.quantity || ""),
      normalizeValue(input.area || ""),
      normalizeValue(input.usage || ""),
      normalizeValue(input.note || ""),
      normalizeValue(input.source || "quote-form"),
      normalizeValue(input.pathname || "/") || "/",
      normalizeValue(input.website || ""),
      normalizeValue(input.status || "new") || "new",
      normalizeTelegramId(input.telegramChatId),
      input.telegramMessageId ?? null,
    ],
  );

  return { ok: true as const };
}

export async function upsertIntegrationSettings(input: IntegrationSettingsInput) {
  return runQuery(
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
    [input.key, input.provider, input.environment, input.enabled, JSON.stringify(input.config)],
  );
}

export async function upsertPlaybook(input: {
  slug: string;
  title: string;
  description: string;
  config: Record<string, unknown>;
  enabled: boolean;
  version: number;
}) {
  return runQuery(
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
    [input.slug, input.title, input.description, JSON.stringify(input.config), input.enabled, input.version],
  );
}
