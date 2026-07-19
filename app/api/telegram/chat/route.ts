import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site";
import { checkChatRateLimit } from "@/lib/rate-limit";
import {
  createLeadCode,
  formatVietnamDateTime,
  makeFingerprint,
  validateChatInput,
} from "@/lib/validation";
import { escapeHtml, getTelegramTopics, sendTelegramMessage, TelegramConfigError } from "@/lib/telegram";
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
    const ip = getRequestIp(request);
    const fingerprint = makeFingerprint([
      sessionId,
      data.name,
      data.phoneNormalized,
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
      phone: data.phoneNormalized,
      fingerprint,
    });

    if (!rateLimit.ok) {
      return jsonError(429, rateLimit.code, rateLimit.error, rateLimit.retryAfter);
    }

    const topics = getTelegramTopics();
    const message = [
      "<b>Chatbot website</b>",
      `<b>Mã phiên:</b> <code>${escapeHtml(sessionId)}</code>`,
      `<b>Thời gian:</b> ${escapeHtml(formatVietnamDateTime())}`,
      "",
      "<b>Khách hàng</b>",
      `<b>Họ tên:</b> ${escapeHtml(data.name)}`,
      `<b>Điện thoại:</b> ${escapeHtml(data.phoneNormalized)}`,
      data.company ? `<b>Công ty:</b> ${escapeHtml(data.company)}` : undefined,
      "",
      "<b>Nhu cầu</b>",
      data.product ? `<b>Sản phẩm/Nhu cầu:</b> ${escapeHtml(data.product)}` : undefined,
      data.quantity ? `<b>Số lượng:</b> ${escapeHtml(data.quantity)}` : undefined,
      data.area ? `<b>Khu vực:</b> ${escapeHtml(data.area)}` : undefined,
      "",
      "<b>Yêu cầu xử lý</b>",
      `<b>Gọi lại:</b> ${data.requestCallback ? "Có" : "Không"}`,
      `<b>Pathname bắt đầu:</b> ${escapeHtml(data.pathname || "/")}`,
      `<b>Source:</b> ${escapeHtml(data.source || "chatbot")}`,
      `<b>Website:</b> ${escapeHtml(website)}`,
      "",
      "<b>Transcript</b>",
      escapeHtml(data.transcript).replace(/\n/g, "<br>"),
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await sendTelegramMessage({
        text: message,
        topicId: topics.chatTopicId,
      });
    } catch (error) {
      if (error instanceof TelegramConfigError) {
        return jsonError(503, "MISSING_CONFIG", "Thiếu cấu hình Telegram.");
      }
      return jsonError(503, "TELEGRAM_UNAVAILABLE", "Không thể gửi yêu cầu lúc này.");
    }

    return NextResponse.json({ ok: true, sessionId }, { status: 200 });
  } catch {
    return jsonError(500, "INTERNAL_ERROR", "Đã xảy ra lỗi không mong muốn.");
  }
}
