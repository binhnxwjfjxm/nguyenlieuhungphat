import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site";
import { checkChatRateLimit } from "@/lib/rate-limit";
import { createLeadCode, formatVietnamDateTime, makeFingerprint, validateChatInput } from "@/lib/validation";
import {
  escapeHtml,
  getTelegramDestinations,
  normalizeTelegramText,
  sendTelegramMessage,
  TelegramConfigError,
  TelegramRequestError,
} from "@/lib/telegram";
import type { FieldErrors } from "@/lib/validation";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 24 * 1024;

function getRequestIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const firstForwarded = forwarded?.split(",")[0]?.trim();
  return firstForwarded || realIp || "unknown";
}

function jsonError(
  status: 400 | 429 | 500 | 503,
  code: string,
  error: string,
  retryAfter?: number,
  fieldErrors?: FieldErrors,
) {
  const body: Record<string, unknown> = { ok: false, code, error };
  if (retryAfter) body.retryAfter = retryAfter;
  if (fieldErrors) body.fieldErrors = fieldErrors;

  const response = NextResponse.json(body, { status });
  if (retryAfter) {
    response.headers.set("Retry-After", String(retryAfter));
  }
  return response;
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

    const validated = validateChatInput(raw as Record<string, unknown>);
    if (!validated.ok) {
      return jsonError(400, validated.code, validated.error, undefined, validated.fieldErrors);
    }

    const data = validated.data;
    const website = data.website || getSiteUrl();
    const sessionId = data.sessionId || createLeadCode("CHAT");
    const rateLimitPhone = data.phoneNormalized || sessionId;
    const ip = getRequestIp(request);
    const fingerprint = makeFingerprint([
      sessionId,
      data.name,
      rateLimitPhone,
      data.company,
      data.product,
      data.quantity,
      data.area,
      data.transcript,
      String(data.requestCallback),
      data.source,
      data.pathname,
    ]);

    const rateLimit = checkChatRateLimit({
      ip,
      phone: rateLimitPhone,
      fingerprint,
    });

    if (!rateLimit.ok) {
      return jsonError(429, rateLimit.code, rateLimit.error, rateLimit.retryAfter);
    }

    const destinations = getTelegramDestinations();
    const message = normalizeTelegramText(
      [
        "<b>YÊU CẦU TỪ CHATBOT</b>",
        `<b>Mã phiên:</b> <code>${escapeHtml(sessionId)}</code>`,
        `<b>Thời gian:</b> ${escapeHtml(formatVietnamDateTime())}`,
        "",
        data.name ? `<b>Họ và tên:</b> ${escapeHtml(data.name)}` : undefined,
        data.phoneNormalized ? `<b>Số điện thoại:</b> ${escapeHtml(data.phoneNormalized)}` : undefined,
        data.company ? `<b>Công ty:</b> ${escapeHtml(data.company)}` : undefined,
        data.product ? `<b>Ngành hàng:</b> ${escapeHtml(data.product)}` : undefined,
        data.quantity ? `<b>Số lượng dự kiến:</b> ${escapeHtml(data.quantity)}` : undefined,
        data.area ? `<b>Khu vực giao hàng:</b> ${escapeHtml(data.area)}` : undefined,
        data.requestCallback ? `<b>Yêu cầu gọi lại:</b> Có` : undefined,
        "",
        "<b>Nội dung trao đổi:</b>",
        escapeHtml(data.transcript).replace(/\n/g, "<br>"),
        "",
        `<b>Website:</b> ${escapeHtml(website)}`,
        `<b>Pathname:</b> ${escapeHtml(data.pathname || "/")}`,
      ]
        .filter(Boolean)
        .join("\n"),
    );

    try {
      const telegram = await sendTelegramMessage({
        chatId: destinations.adminChatId,
        text: message,
      });

      return NextResponse.json(
        {
          ok: true,
          sessionId,
          telegram: {
            chatId: telegram.result?.chat?.id ?? destinations.adminChatId,
            messageId: telegram.result?.message_id ?? null,
          },
        },
        { status: 200 },
      );
    } catch (error) {
      if (error instanceof TelegramConfigError) {
        return jsonError(503, "MISSING_CONFIG", "Thiếu cấu hình Telegram.");
      }
      if (error instanceof TelegramRequestError) {
        return jsonError(
          error.status === 429 ? 429 : 503,
          error.status === 429 ? "TELEGRAM_RATE_LIMITED" : "TELEGRAM_UNAVAILABLE",
          error.message,
          error.retryAfter,
        );
      }
      return jsonError(503, "TELEGRAM_UNAVAILABLE", "Không thể gửi yêu cầu lúc này.");
    }
  } catch {
    return jsonError(500, "INTERNAL_ERROR", "Đã xảy ra lỗi không mong muốn.");
  }
}
