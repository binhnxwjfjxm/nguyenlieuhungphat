import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site";
import { checkQuoteRateLimit } from "@/lib/rate-limit";
import {
  createLeadCode,
  formatVietnamDateTime,
  makeFingerprint,
  validateQuoteInput,
} from "@/lib/validation";
import { escapeHtml, getTelegramTopics, sendTelegramMessage, TelegramConfigError } from "@/lib/telegram";
import type { FieldErrors } from "@/lib/validation";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1024;

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

    const validated = validateQuoteInput(raw as Record<string, string>);
    if (!validated.ok) {
      return jsonError(400, validated.code, validated.error, undefined, validated.fieldErrors);
    }

    const data = validated.data;
    const website = data.website || getSiteUrl();
    const leadId = createLeadCode("HP");
    const ip = getRequestIp(request);
    const fingerprint = makeFingerprint([
      data.name,
      data.phoneNormalized,
      data.company,
      data.email,
      data.product,
      data.quantity,
      data.area,
      data.usage,
      data.note,
      data.source,
      data.pathname,
    ]);

    const rateLimit = checkQuoteRateLimit({
      ip,
      phone: data.phoneNormalized,
      fingerprint,
    });

    if (!rateLimit.ok) {
      return jsonError(429, rateLimit.code, rateLimit.error, rateLimit.retryAfter);
    }

    const topics = getTelegramTopics();
    const message = [
      "<b>Báo giá website mới</b>",
      `<b>Mã lead:</b> <code>${escapeHtml(leadId)}</code>`,
      `<b>Thời gian:</b> ${escapeHtml(formatVietnamDateTime())}`,
      "",
      "<b>Khách hàng</b>",
      `<b>Họ tên:</b> ${escapeHtml(data.name)}`,
      `<b>Điện thoại:</b> ${escapeHtml(data.phoneNormalized)}`,
      data.email ? `<b>Email:</b> ${escapeHtml(data.email)}` : undefined,
      data.company ? `<b>Công ty:</b> ${escapeHtml(data.company)}` : undefined,
      "",
      "<b>Nhu cầu</b>",
      data.product ? `<b>Sản phẩm:</b> ${escapeHtml(data.product)}` : undefined,
      data.usage ? `<b>Nhu cầu:</b> ${escapeHtml(data.usage)}` : undefined,
      data.quantity ? `<b>Số lượng:</b> ${escapeHtml(data.quantity)}` : undefined,
      data.area ? `<b>Khu vực:</b> ${escapeHtml(data.area)}` : undefined,
      data.note ? `<b>Ghi chú:</b> ${escapeHtml(data.note)}` : undefined,
      "",
      "<b>Thông tin kỹ thuật</b>",
      `<b>Nguồn:</b> ${escapeHtml(data.source || "quote-form")}`,
      `<b>Pathname:</b> ${escapeHtml(data.pathname || "/")}`,
      `<b>Website:</b> ${escapeHtml(website)}`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await sendTelegramMessage({
        text: message,
        topicId: topics.quoteTopicId,
      });
    } catch (error) {
      if (error instanceof TelegramConfigError) {
        return jsonError(503, "MISSING_CONFIG", "Thiếu cấu hình Telegram.");
      }
      return jsonError(503, "TELEGRAM_UNAVAILABLE", "Không thể gửi báo giá lúc này.");
    }

    return NextResponse.json({ ok: true, leadId }, { status: 200 });
  } catch {
    return jsonError(500, "INTERNAL_ERROR", "Đã xảy ra lỗi không mong muốn.");
  }
}
