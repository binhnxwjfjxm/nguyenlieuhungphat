import "server-only";

import { randomUUID } from "node:crypto";
import type { GeminiUsageMetadata } from "@/lib/dialogflow";

const IDEMPOTENCY_KEY_MAX_LENGTH = 128;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;
const IDEMPOTENCY_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IDEMPOTENCY_UUID_LENGTH = 36;
const IDEMPOTENCY_OPERATION_MAX_LENGTH = IDEMPOTENCY_KEY_MAX_LENGTH - IDEMPOTENCY_UUID_LENGTH - 1;
const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);

function normalizeIdempotencyOperation(value: string) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, IDEMPOTENCY_OPERATION_MAX_LENGTH)
    .replace(/[._-]+$/g, "");
  if (!normalized) throw new Error("idempotency_operation_required");
  return normalized;
}

// Cross-repo mirror of packages/contracts createIdempotencyKey in NPP-Platform.
// Keep this byte-compatible contract until @npp/contracts is published for external repos.
export function createCompanyIdempotencyKey(operation: string, uuid = randomUUID()) {
  if (typeof uuid !== "string" || !IDEMPOTENCY_UUID_PATTERN.test(uuid)) throw new Error("idempotency_uuid_invalid");
  const key = `${normalizeIdempotencyOperation(operation)}-${uuid.toLowerCase()}`;
  if (!IDEMPOTENCY_KEY_PATTERN.test(key)) throw new Error("idempotency_key_generation_failed");
  return key;
}

function config() {
  const baseUrl = process.env.COMPANY_API_URL?.trim().replace(/\/$/, "") ?? "";
  const token = process.env.COMPANY_WEBSITE_AI_API_TOKEN?.trim() ?? "";
  if (!baseUrl || !/^https?:\/\//.test(baseUrl)) throw new Error("company_ai_api_url_missing");
  if (!token) throw new Error("company_ai_token_missing");
  return { baseUrl, token };
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function errorCode(response: Response) {
  try {
    const body = await response.clone().json() as { error?: { code?: string } };
    return body?.error?.code ?? "";
  } catch {
    return "";
  }
}

export async function recordCompanyAiUsage(input: {
  idempotencyKey: string;
  sessionId: string;
  providerRequestId: string;
  model: string;
  occurredAt: string;
  usageMetadata: GeminiUsageMetadata;
}) {
  if (!IDEMPOTENCY_KEY_PATTERN.test(input.idempotencyKey)) throw new Error("idempotency_key_invalid");
  const runtime = config();
  const payload = {
    source: "website",
    feature: "assistant",
    provider: "google",
    model: input.model,
    serviceTier: "standard",
    inputModality: "text",
    customerId: null,
    providerRequestId: input.providerRequestId,
    conversationId: input.sessionId,
    occurredAt: input.occurredAt,
    usageMetadata: input.usageMetadata,
  };
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`${runtime.baseUrl}/api/ai/usage-events`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${runtime.token}`,
          "content-type": "application/json; charset=utf-8",
          "Idempotency-Key": input.idempotencyKey,
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) return { ok: true as const, duplicate: false as const };
      const code = await errorCode(response);
      if (response.status === 409 && code === "AI_USAGE_PROVIDER_REQUEST_DUPLICATE") {
        return { ok: true as const, duplicate: true as const };
      }
      if (!RETRYABLE_STATUS.has(response.status)) throw new Error(`company_ai_usage_rejected_${response.status}`);
      lastError = new Error(`company_ai_usage_retryable_${response.status}`);
    } catch (error) {
      lastError = error;
      if (error instanceof Error && error.message.startsWith("company_ai_usage_rejected_")) break;
    }
    if (attempt < 2) await wait(120 * (attempt + 1));
  }
  throw lastError instanceof Error ? lastError : new Error("company_ai_usage_unavailable");
}
