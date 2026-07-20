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

export const runtime = "nodejs";

const MAX_BODY_BYTES = 24 * 1024;
const PHONE_PATTERN = /(?:\+?84|0)(?:[\s.-]?\d){9,10}/g;

function jsonError(status: 400 | 429 | 500 | 503, code: string, error: string, retryAfter?: number) {
  const body: Record<string, unknown> = { ok: false, code, error };
  if (retryAfter) body.retryAfter = retryAfter;

  const response = NextResponse.json(body, { status });
  if (retryAfter) {
    response.headers.set("Retry-After", String(retryAfter));
  }
  return response;
}

function extractPhoneCandidate(text: string) {
  const matches = text.match(PHONE_PATTERN) ?? [];
  for (const match of matches) {
    const phone = normalizePhone(match);
    if (isValidVietnamPhone(phone)) {
      return phone;
    }
  }
  return "";
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
    const transcript = sanitizeText(payload.transcript ?? message, 4000);
    const sessionId = normalizeDialogflowSessionId(sanitizeText(payload.sessionId, 80) || createLeadCode("CHAT"));
    const name = sanitizeText(payload.name, 80);
    const phone = sanitizeText(payload.phone, 40);
    const company = sanitizeText(payload.company, 120);
    const source = sanitizeText(payload.source, 80) || "chatbot";
    const pathname = sanitizeText(payload.pathname, 160) || "/";
    const website = sanitizeText(payload.website, 160) || getSiteUrl();
    const honeypot = sanitizeText(payload.honeypot, 40);

    if (honeypot) {
      return jsonError(400, "BOT_DETECTED", "Yêu cầu không hợp lệ.");
    }

    if (!message) {
      return jsonError(400, "VALIDATION_ERROR", "Tin nhắn không được để trống.");
    }

    const confirmedPhone = extractPhoneCandidate(`${message} ${phone}`);
    const requestCallback = Boolean(confirmedPhone);

    const dialogflow = await detectDialogflowReply({
      sessionId,
      message,
    });

    const replyText = dialogflow.replyText || "Đã nhận nội dung. Em sẽ phản hồi sớm.";

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
        playbookKey: "dialogflow-cx",
      });
    } catch {
      // Keep dialog delivery successful even if persistence is unavailable.
    }

    return NextResponse.json(
      {
        ok: true,
        sessionId,
        replyText,
        phoneConfirmed: Boolean(confirmedPhone),
        leadNotified: Boolean(telegramResult),
        dialogflow: {
          agentDisplayName: dialogflow.agent.agentDisplayName,
          intentDisplayName: dialogflow.intentDisplayName,
          pageDisplayName: dialogflow.pageDisplayName,
        },
      },
      { status: 200 },
    );
  } catch {
    return jsonError(503, "DIALOGFLOW_UNAVAILABLE", "Không thể kết nối Dialogflow lúc này.");
  }
}
