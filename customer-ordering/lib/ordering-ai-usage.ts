import "server-only";

import { randomUUID } from "node:crypto";

const IDEMPOTENCY_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);

type DialogflowCxUsageMetadata = {
  requestCount: 1;
  billingUnit: "text-request";
  requestClass: "flow" | "playbook";
};

type AiCredit = {
  limitUsd: string;
  usedUsd: string;
  remainingUsd: string;
  usagePercent: string;
};

type Envelope<T> = { data?: T; error?: { code?: string; message?: string } };

export function createOrderingAiIdempotencyKey(uuid = randomUUID()) {
  if (typeof uuid !== "string" || !IDEMPOTENCY_UUID_PATTERN.test(uuid)) throw new Error("idempotency_uuid_invalid");
  return uuid.toLowerCase();
}

function runtimeConfig() {
  const baseUrl = process.env.CORE_API_BASE_URL?.trim().replace(/\/$/, "") ?? "";
  const token = process.env.ORDERING_AI_API_TOKEN?.trim() ?? "";
  if (!baseUrl || !/^https?:\/\//.test(baseUrl)) throw new Error("ordering_ai_api_url_missing");
  if (!token) throw new Error("ordering_ai_token_missing");
  return { baseUrl, token };
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function responseEnvelope<T>(response: Response): Promise<Envelope<T>> {
  try {
    return await response.clone().json() as Envelope<T>;
  } catch {
    return {};
  }
}

export async function getOrderingAiContext(customerCode: string) {
  const normalizedCode = customerCode.trim();
  if (!normalizedCode || normalizedCode.length > 120) throw new Error("ordering_ai_customer_code_invalid");
  const runtime = runtimeConfig();
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const url = new URL(`${runtime.baseUrl}/api/ai/ordering-context`);
      url.searchParams.set("customerCode", normalizedCode);
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        headers: { authorization: `Bearer ${runtime.token}`, accept: "application/json" },
      });
      const envelope = await responseEnvelope<{ customerId: string; credit: AiCredit }>(response);
      if (response.ok && envelope.data?.customerId && UUID_PATTERN.test(envelope.data.customerId) && envelope.data.credit) {
        return envelope.data;
      }
      if (!RETRYABLE_STATUS.has(response.status)) {
        throw new Error(`ordering_ai_context_rejected_${response.status}_${envelope.error?.code ?? "unknown"}`);
      }
      lastError = new Error(`ordering_ai_context_retryable_${response.status}`);
    } catch (error) {
      lastError = error;
      if (error instanceof Error && error.message.startsWith("ordering_ai_context_rejected_")) break;
    }
    if (attempt < 2) await wait(120 * (attempt + 1));
  }
  throw lastError instanceof Error ? lastError : new Error("ordering_ai_context_unavailable");
}

export async function recordOrderingAiUsage(input: {
  idempotencyKey: string;
  customerId: string;
  sessionId: string;
  providerRequestId: string;
  model: string;
  occurredAt: string;
  usageMetadata: DialogflowCxUsageMetadata;
}) {
  if (!IDEMPOTENCY_UUID_PATTERN.test(input.idempotencyKey)) throw new Error("idempotency_key_invalid");
  if (!UUID_PATTERN.test(input.customerId)) throw new Error("ordering_ai_customer_id_invalid");
  const runtime = runtimeConfig();
  const payload = {
    source: "ordering",
    feature: "assistant",
    provider: "google",
    model: input.model,
    serviceTier: "standard",
    inputModality: "text",
    customerId: input.customerId,
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
      const envelope = await responseEnvelope<{ credit: AiCredit }>(response);
      if (response.ok) return { ok: true as const, duplicate: false as const, credit: envelope.data?.credit ?? null };
      if (response.status === 409 && envelope.error?.code === "AI_USAGE_PROVIDER_REQUEST_DUPLICATE") {
        return { ok: true as const, duplicate: true as const, credit: null };
      }
      if (!RETRYABLE_STATUS.has(response.status)) throw new Error(`ordering_ai_usage_rejected_${response.status}`);
      lastError = new Error(`ordering_ai_usage_retryable_${response.status}`);
    } catch (error) {
      lastError = error;
      if (error instanceof Error && error.message.startsWith("ordering_ai_usage_rejected_")) break;
    }
    if (attempt < 2) await wait(120 * (attempt + 1));
  }
  throw lastError instanceof Error ? lastError : new Error("ordering_ai_usage_unavailable");
}
