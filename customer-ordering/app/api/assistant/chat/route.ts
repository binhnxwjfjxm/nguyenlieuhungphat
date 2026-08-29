import { NextRequest, NextResponse } from "next/server";
import {
  createOrderingAiIdempotencyKey,
  getOrderingAiContext,
  recordOrderingAiUsage,
} from "@/lib/ordering-ai-usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 12 * 1024;
const MAX_MESSAGE_CHARS = 1000;
const ORDERING_GATEWAY_HEADER = "x-ordering-ai-gateway";
const ORDERING_GATEWAY_VALUE = "customer-ordering";

type CustomerProfileEnvelope = {
  data?: { profile?: { customerCode?: string } };
  error?: { code?: string };
};

type GatewayUsageMetadata = {
  requestCount: number;
  billingUnit: "text-request";
  requestClass: "flow" | "playbook";
};

type GatewayEnvelope = {
  ok?: boolean;
  sessionId?: string;
  replyText?: string;
  providerRequestId?: string;
  model?: string;
  occurredAt?: string;
  usageMetadata?: Partial<GatewayUsageMetadata>;
};

function jsonError(status: 400 | 401 | 429 | 503, code: string, message: string) {
  return NextResponse.json({ ok: false, code, error: message }, { status });
}

function bearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  return /^Bearer\s+\S+$/i.test(authorization) ? authorization : "";
}

function normalizeDialogflowSessionId(sessionId: string) {
  return sessionId.trim().replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 36) || "hungphat-ordering";
}

function coreBaseUrl() {
  const value = process.env.CORE_API_BASE_URL?.trim().replace(/\/$/, "") ?? "";
  if (!value || !/^https?:\/\//.test(value)) throw new Error("ordering_core_api_url_missing");
  return value;
}

function websiteAiBaseUrl() {
  const value = process.env.WEBSITE_AI_BASE_URL?.trim().replace(/\/$/, "") ?? "";
  if (!value || !/^https:\/\/[^/]+$/.test(value)) throw new Error("ordering_ai_gateway_url_missing");
  return value;
}

function orderingAiToken() {
  const value = process.env.ORDERING_AI_API_TOKEN?.trim() ?? "";
  if (!value) throw new Error("ordering_ai_token_missing");
  return value;
}

async function resolveCustomerCode(authorization: string) {
  const response = await fetch(`${coreBaseUrl()}/api/customer-portal/me`, {
    method: "GET",
    cache: "no-store",
    headers: { authorization, accept: "application/json" },
  });
  const body = await response.json().catch(() => ({})) as CustomerProfileEnvelope;
  if (response.status === 401 || response.status === 403) throw new Error("ordering_customer_session_invalid");
  if (!response.ok) throw new Error(`ordering_customer_profile_unavailable_${response.status}`);
  const customerCode = body.data?.profile?.customerCode?.trim() ?? "";
  if (!customerCode) throw new Error("ordering_customer_code_missing");
  return customerCode;
}

async function requestSharedDialogflow(input: { sessionId: string; message: string }) {
  const response = await fetch(`${websiteAiBaseUrl()}/api/dialogflow/chat`, {
    method: "POST",
    cache: "no-store",
    headers: {
      authorization: `Bearer ${orderingAiToken()}`,
      [ORDERING_GATEWAY_HEADER]: ORDERING_GATEWAY_VALUE,
      "content-type": "application/json; charset=utf-8",
      accept: "application/json",
    },
    body: JSON.stringify({
      sessionId: input.sessionId,
      message: input.message,
      source: "customer-ordering",
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const body = await response.json().catch(() => ({})) as GatewayEnvelope;
  if (!response.ok || body.ok !== true) throw new Error(`ordering_ai_gateway_unavailable_${response.status}`);

  const replyText = typeof body.replyText === "string" ? body.replyText.trim() : "";
  const providerRequestId = typeof body.providerRequestId === "string" ? body.providerRequestId.trim() : "";
  const model = typeof body.model === "string" ? body.model.trim() : "";
  const occurredAt = typeof body.occurredAt === "string" ? body.occurredAt.trim() : "";
  const usage = body.usageMetadata ?? {};
  const requestClass = usage.requestClass;
  if (!replyText || !providerRequestId || !model || !occurredAt || !Number.isFinite(Date.parse(occurredAt))) {
    throw new Error("ordering_ai_gateway_response_invalid");
  }
  if (usage.requestCount !== 1 || usage.billingUnit !== "text-request" || (requestClass !== "flow" && requestClass !== "playbook")) {
    throw new Error("ordering_ai_gateway_usage_invalid");
  }

  return Object.freeze({
    replyText,
    providerRequestId,
    model,
    occurredAt,
    usageMetadata: Object.freeze({
      requestCount: 1,
      billingUnit: "text-request" as const,
      requestClass,
    }),
  });
}

export async function POST(request: NextRequest) {
  const authorization = bearerToken(request);
  if (!authorization) return jsonError(401, "UNAUTHORIZED", "Vui lòng đăng nhập để sử dụng hỗ trợ sản phẩm.");

  try {
    const bodyText = await request.text();
    if (bodyText.length > MAX_BODY_BYTES) return jsonError(400, "PAYLOAD_TOO_LARGE", "Nội dung yêu cầu quá lớn.");

    let raw: unknown;
    try {
      raw = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      return jsonError(400, "INVALID_JSON", "Dữ liệu gửi lên chưa hợp lệ.");
    }

    const payload = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
    const message = typeof payload.message === "string" ? payload.message.trim().slice(0, MAX_MESSAGE_CHARS) : "";
    const sessionId = normalizeDialogflowSessionId(
      typeof payload.sessionId === "string" ? payload.sessionId : "ordering-assistant",
    );
    if (!message) return jsonError(400, "VALIDATION_ERROR", "Tin nhắn không được để trống.");

    const customerCode = await resolveCustomerCode(authorization);
    const context = await getOrderingAiContext(customerCode);
    const remainingUsd = Number(context.credit.remainingUsd);
    const usagePercent = Number(context.credit.usagePercent);
    if (!Number.isFinite(remainingUsd) || !Number.isFinite(usagePercent)) {
      throw new Error("ordering_ai_credit_invalid");
    }
    if (remainingUsd <= 0 || usagePercent >= 100) {
      return jsonError(429, "AI_CREDIT_LIMIT_REACHED", "Hạn mức hỗ trợ AI của tài khoản đã được sử dụng hết.");
    }

    const aiReply = await requestSharedDialogflow({ sessionId, message });
    const idempotencyKey = createOrderingAiIdempotencyKey();
    let usageRecorded = false;
    let credit = context.credit;
    try {
      const recorded = await recordOrderingAiUsage({
        idempotencyKey,
        customerId: context.customerId,
        sessionId,
        providerRequestId: aiReply.providerRequestId,
        model: aiReply.model,
        occurredAt: aiReply.occurredAt,
        usageMetadata: aiReply.usageMetadata,
      });
      usageRecorded = true;
      if (recorded.credit) credit = recorded.credit;
    } catch (error) {
      console.error("ordering_ai_usage_record_failed", JSON.stringify({
        idempotencyKey,
        providerRequestId: aiReply.providerRequestId,
        conversationId: sessionId,
        model: aiReply.model,
        occurredAt: aiReply.occurredAt,
        usageMetadata: aiReply.usageMetadata,
        error: error instanceof Error ? error.message : "unknown_error",
      }));
    }

    return NextResponse.json({
      ok: true,
      sessionId,
      replyText: aiReply.replyText,
      credit,
      usageRecorded,
      capability: "advisory-only",
    }, { status: 200 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "unknown_error";
    if (code === "ordering_customer_session_invalid") {
      return jsonError(401, "UNAUTHORIZED", "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
    console.error("ordering_ai_chat_failed", code);
    return jsonError(503, "AI_ASSISTANT_UNAVAILABLE", "Hỗ trợ sản phẩm đang tạm gián đoạn. Vui lòng thử lại sau.");
  }
}
