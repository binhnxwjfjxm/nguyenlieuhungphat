import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site";
import {
  createLeadCode,
  formatVietnamDateTime,
  isValidVietnamPhone,
  normalizePhone,
  sanitizeText,
} from "@/lib/validation";
import {
  escapeHtml,
  getTelegramDestinations,
  normalizeTelegramText,
  sendTelegramMessage,
} from "@/lib/telegram";
import { recordChatConversation } from "@/lib/hung-phat-supabase";
import { detectDialogflowReply, normalizeDialogflowSessionId } from "@/lib/dialogflow";
import { createCompanyIdempotencyKey, recordCompanyAiUsage } from "@/lib/company-ai-usage";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 24 * 1024;
const MAX_TRANSCRIPT_CHARS = 4000;
const PHONE_PATTERN = /(?:\+?84|0)(?:[\s.-]?\d){9,10}/g;
const ORDERING_GATEWAY_HEADER = "x-ordering-ai-gateway";
const ORDERING_GATEWAY_VALUE = "customer-ordering";

type OrderingGatewayAuth = "public" | "authorized" | "invalid" | "unavailable";

type OrderingGatewayAuthEnvelope = {
  data?: {
    authorized?: boolean;
    capability?: string;
  };
};

function jsonError(status: 400 | 401 | 429 | 500 | 503, code: string, error: string, retryAfter?: number) {
  const body: Record<string, unknown> = { ok: false, code, error };
  if (retryAfter) body.retryAfter = retryAfter;

  const response = NextResponse.json(body, { status });
  if (retryAfter) response.headers.set("Retry-After", String(retryAfter));
  return response;
}

function extractPhoneCandidate(text: string) {
  const matches = text.match(PHONE_PATTERN) ?? [];
  for (const match of matches) {
    const phone = normalizePhone(match);
    if (isValidVietnamPhone(phone)) return phone;
  }
  return "";
}

function buildRecentTranscript(value: unknown, message: string) {
  const transcript = sanitizeText(value, Number.POSITIVE_INFINITY);
  const currentTurn = `Khách: ${message}`;
  const withCurrentTurn = transcript.endsWith(currentTurn)
    ? transcript
    : `${transcript} ${currentTurn}`.trim();
  return withCurrentTurn.slice(-MAX_TRANSCRIPT_CHARS).trim();
}

function companyApiBaseUrl() {
  const value = process.env.COMPANY_API_URL?.trim().replace(/\/$/, "") ?? "";
  return /^https?:\/\/[^/]+$/.test(value) ? value : "";
}

async function orderingGatewayAuth(request: NextRequest): Promise<OrderingGatewayAuth> {
  if (request.headers.get(ORDERING_GATEWAY_HEADER)?.trim() !== ORDERING_GATEWAY_VALUE) return "public";

  const authorization = request.headers.get("authorization")?.trim() ?? "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) return "invalid";

  const baseUrl = companyApiBaseUrl();
  if (!baseUrl) return "unavailable";

  try {
    const response = await fetch(`${baseUrl}/api/ai/ordering-gateway-auth`, {
      method: "GET",
      cache: "no-store",
      headers: {
        authorization,
        accept: "application/json",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status === 401 || response.status === 403) return "invalid";
    if (!response.ok) return "unavailable";

    const body = await response.json().catch(() => ({})) as OrderingGatewayAuthEnvelope;
    return body.data?.authorized === true && body.data?.capability === "ordering-ai"
      ? "authorized"
      : "unavailable";
  } catch {
    return "unavailable";
  }
}

async function maybeSendLeadNotification(input: {
  sessionId: string;
  phone: string;
  name: string;
  company: string;
  message: string;
  pathname: string;
  website: string;
}) {
  const destinations = getTelegramDestinations();
  const body = normalizeTelegramText(
    [
      "<b>LEAD CHATBOT ĐÃ XÁC NHẬN SĐT</b>",
      `<b>Mã phiên:</b> <code>${escapeHtml(input.sessionId)}</code>`,
      `<b>Thời gian:</b> ${escapeHtml(formatVietnamDateTime())}`,
      "",
      `<b>Số điện thoại:</b> ${escapeHtml(input.phone)}`,
      input.name ? `<b>Họ và tên:</b> ${escapeHtml(input.name)}` : undefined,
      input.company ? `<b>Công ty:</b> ${escapeHtml(input.company)}` : undefined,
      `<b>Nội dung:</b> ${escapeHtml(input.message)}`,
      "",
      `<b>Website:</b> ${escapeHtml(input.website)}`,
      `<b>Pathname:</b> ${escapeHtml(input.pathname || "/")}`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return sendTelegramMessage({
    chatId: destinations.adminChatId,
    messageThreadId: destinations.adminThreadId,
    text: body,
  });
}

export async function POST(request: NextRequest) {
  try {
    const gatewayAuth = await orderingGatewayAuth(request);
    if (gatewayAuth === "invalid") {
      return jsonError(401, "UNAUTHORIZED", "Yêu cầu không hợp lệ.");
    }
    if (gatewayAuth === "unavailable") {
      return jsonError(503, "AI_GATEWAY_AUTH_UNAVAILABLE", "Trợ lý đang tạm gián đoạn. Vui lòng thử lại sau.");
    }

    const bodyText = await request.text();
    if (bodyText.length > MAX_BODY_BYTES) {
      return jsonError(400, "PAYLOAD_TOO_LARGE", "Nội dung yêu cầu quá lớn.");
    }

    let raw: unknown;
    try {
      raw = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      return jsonError(400, "INVALID_JSON", "Dữ liệu gửi lên chưa hợp lệ.");
    }

    const payload = (raw ?? {}) as Record<string, unknown>;
    const message = sanitizeText(payload.message, 1000);
    const transcript = buildRecentTranscript(payload.transcript, message);
    const sessionId = normalizeDialogflowSessionId(sanitizeText(payload.sessionId, 80) || createLeadCode("CHAT"));
    const name = sanitizeText(payload.name, 80);
    const phone = sanitizeText(payload.phone, 40);
    const company = sanitizeText(payload.company, 120);
    const source = sanitizeText(payload.source, 80) || "chatbot";
    const pathname = sanitizeText(payload.pathname, 160) || "/";
    const website = sanitizeText(payload.website, 160) || getSiteUrl();
    const honeypot = sanitizeText(payload.honeypot, 40);

    if (honeypot) return jsonError(400, "BOT_DETECTED", "Yêu cầu không hợp lệ.");
    if (!message) return jsonError(400, "VALIDATION_ERROR", "Tin nhắn không được để trống.");

    const aiReply = await detectDialogflowReply({ sessionId, message, transcript });

    if (gatewayAuth === "authorized") {
      return NextResponse.json({
        ok: true,
        sessionId,
        replyText: aiReply.replyText,
        providerRequestId: aiReply.providerRequestId,
        model: aiReply.model,
        occurredAt: aiReply.occurredAt,
        usageMetadata: aiReply.usageMetadata,
        capability: "advisory-only",
      }, { status: 200 });
    }

    const confirmedPhone = extractPhoneCandidate(`${message} ${phone}`);
    const requestCallback = Boolean(confirmedPhone);
    const usageIdempotencyKey = createCompanyIdempotencyKey();
    let usageRecorded = false;
    try {
      await recordCompanyAiUsage({
        idempotencyKey: usageIdempotencyKey,
        sessionId,
        providerRequestId: aiReply.providerRequestId,
        model: aiReply.model,
        occurredAt: aiReply.occurredAt,
        usageMetadata: aiReply.usageMetadata,
      });
      usageRecorded = true;
    } catch (error) {
      console.error("website_ai_usage_record_failed", JSON.stringify({
        idempotencyKey: usageIdempotencyKey,
        providerRequestId: aiReply.providerRequestId,
        conversationId: sessionId,
        model: aiReply.model,
        occurredAt: aiReply.occurredAt,
        usageMetadata: aiReply.usageMetadata,
        error: error instanceof Error ? error.message : "unknown_error",
      }));
    }

    const replyText = aiReply.replyText || "Đã nhận nội dung. Em sẽ phản hồi sớm.";

    let telegramResult: { chatId: string | number; messageId: number | null } | null = null;
    if (confirmedPhone) {
      try {
        const telegram = await maybeSendLeadNotification({
          sessionId,
          phone: confirmedPhone,
          name,
          company,
          message,
          pathname,
          website,
        });
        telegramResult = {
          chatId: telegram.result?.chat?.id ?? getTelegramDestinations().adminChatId,
          messageId: telegram.result?.message_id ?? null,
        };
      } catch {
        telegramResult = null;
      }
    }

    try {
      await recordChatConversation({
        sessionId,
        source,
        pathname,
        website,
        transcript,
        requestCallback,
        telegramChatId: telegramResult?.chatId ?? null,
        telegramMessageId: telegramResult?.messageId ?? null,
        agentStatus: confirmedPhone ? "lead_confirmed" : "queued",
        playbookKey: "dialogflow-cx-website",
      });
    } catch {
      // Chat delivery must not depend on the legacy conversation store.
    }

    const responseBody: Record<string, unknown> = {
      ok: true,
      sessionId,
      replyText,
      phoneConfirmed: Boolean(confirmedPhone),
      leadNotified: Boolean(telegramResult),
    };
    if (source === "production-smoke") responseBody.usageRecorded = usageRecorded;

    return NextResponse.json(responseBody, { status: 200 });
  } catch (error) {
    console.error("website_ai_chat_failed", error instanceof Error ? error.message : "unknown_error");
    return jsonError(503, "AI_ASSISTANT_UNAVAILABLE", "Trợ lý đang tạm gián đoạn. Vui lòng thử lại sau.");
  }
}
