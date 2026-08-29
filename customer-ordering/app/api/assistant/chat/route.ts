import { NextRequest, NextResponse } from "next/server";
import { detectDialogflowReply, normalizeDialogflowSessionId } from "@/lib/dialogflow";
import {
  createOrderingAiIdempotencyKey,
  getOrderingAiContext,
  recordOrderingAiUsage,
} from "@/lib/ordering-ai-usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 12 * 1024;
const MAX_MESSAGE_CHARS = 1000;

type CustomerProfileEnvelope = {
  data?: { profile?: { customerCode?: string } };
  error?: { code?: string };
};

function jsonError(status: 400 | 401 | 429 | 503, code: string, message: string) {
  return NextResponse.json({ ok: false, code, error: message }, { status });
}

function bearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  return /^Bearer\s+\S+$/i.test(authorization) ? authorization : "";
}

function coreBaseUrl() {
  const value = process.env.CORE_API_BASE_URL?.trim().replace(/\/$/, "") ?? "";
  if (!value || !/^https?:\/\//.test(value)) throw new Error("ordering_core_api_url_missing");
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

    const aiReply = await detectDialogflowReply({ sessionId, message });
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
