import "server-only";

import { randomUUID } from "node:crypto";
import type { DialogflowCxUsageMetadata } from "@/lib/dialogflow";

const IDEMPOTENCY_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);

// Website supplies only a stable UUID. Công Ty remains the canonical authority
// that validates the Idempotency-Key contract; Website never composes its own key format.
export function createCompanyIdempotencyKey(uuid = randomUUID()) {
  if (typeof uuid !== "string" || !IDEMPOTENCY_UUID_PATTERN.test(uuid)) throw new Error("idempotency_uuid_invalid");
  return uuid.toLowerCase();
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
  usageMetadata: DialogflowCxUsageMetadata;
}) {
  if (!IDEMPOTENCY_UUID_PATTERN.test(input.idempotencyKey)) throw new Error("idempotency_key_invalid");
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
