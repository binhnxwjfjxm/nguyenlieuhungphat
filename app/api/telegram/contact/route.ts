import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site";
import { checkContactRateLimit } from "@/lib/rate-limit";
import {
  createLeadCode,
  formatVietnamDateTime,
  makeFingerprint,
  validateContactInput,
} from "@/lib/validation";
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

const MAX_BODY_BYTES = 12 * 1024;

function getRequestIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIp || "unknown";
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
  if (retryAfter) response.headers.set("Retry-After", String(retryAfter));
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    if (bodyText.length > MAX_BODY_BYTES) {
      return jsonError(400, "PAYLOAD_TOO_LARGE", "Nội dung liên hệ quá lớn.");
    }

    let raw: unknown;
    try {
      raw = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      return jsonError(400, "INVALID_JSON", "Dữ liệu gửi lên chưa hợp lệ.");
    }

    const validated = validateContactInput(raw as Record<string, string>);
    if (!validated.ok) {
      return jsonError(400, validated.code, validated.error, undefined, validated.fieldErrors);
    }

    const data = validated.data;
    const website = data.website || getSiteUrl();
    const contactId = createLeadCode("HP");
    const ip = getRequestIp(request);
    const fingerprint = makeFingerprint([
      data.name,
      data.phoneNormalized,
      data.company,
      data.email,
      data.note,
      data.source,
      data.pathname,
    ]);

    const rateLimit = checkContactRateLimit({
      ip,
      phone: data.phoneNormalized,
      fingerprint,
    });
    if (!rateLimit.ok) {
      return jsonError(429, rateLimit.code, rateLimit.error, rateLimit.retryAfter);
    }

    try {
      const destinations = getTelegramDestinations();
      const message = normalizeTelegramText(
        [
          "<b>LIÊN HỆ WEBSITE</b>",
          `<b>Mã liên hệ:</b> <code>${escapeHtml(contactId)}</code>`,
          `<b>Thời gian:</b> ${escapeHtml(formatVietnamDateTime())}`,
          "",
          `<b>Họ và tên:</b> ${escapeHtml(data.name)}`,
          `<b>Số điện thoại:</b> ${escapeHtml(data.phoneNormalized)}`,
          data.company ? `<b>Công Ty / cửa hàng:</b> ${escapeHtml(data.company)}` : undefined,
          data.email ? `<b>Email:</b> ${escapeHtml(data.email)}` : undefined,
          "",
          "<b>Nội dung liên hệ:</b>",
          escapeHtml(data.note),
          "",
          `<b>Nguồn gửi:</b> ${escapeHtml(data.source || "company-contact-form")}`,
          `<b>Pathname:</b> ${escapeHtml(data.pathname || "/")}`,
          `<b>Website:</b> ${escapeHtml(website)}`,
        ]
          .filter(Boolean)
          .join("\n"),
      );

      await sendTelegramMessage({
        chatId: destinations.adminChatId,
        messageThreadId: destinations.adminThreadId,
        text: message,
      });

      return NextResponse.json({ ok: true, contactId }, { status: 200 });
    } catch (error) {
      if (error instanceof TelegramConfigError) {
        return jsonError(503, "MISSING_CONFIG", "Thiếu cấu hình tiếp nhận liên hệ.");
      }
      if (error instanceof TelegramRequestError) {
        return jsonError(
          error.status === 429 ? 429 : 503,
          error.status === 429 ? "TELEGRAM_RATE_LIMITED" : "CONTACT_UNAVAILABLE",
          "Chưa thể gửi thông tin liên hệ lúc này.",
          error.retryAfter,
        );
      }
      return jsonError(503, "CONTACT_UNAVAILABLE", "Chưa thể gửi thông tin liên hệ lúc này.");
    }
  } catch {
    return jsonError(500, "INTERNAL_ERROR", "Đã xảy ra lỗi không mong muốn.");
  }
}
