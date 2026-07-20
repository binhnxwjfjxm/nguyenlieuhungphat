import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site";
import { checkQuoteRateLimit } from "@/lib/rate-limit";
import {
  createLeadCode,
  formatVietnamDateTime,
  makeFingerprint,
  quoteDeliveryAreaOptions,
  quoteNeedOptions,
  validateQuoteInput,
} from "@/lib/validation";
import {
  escapeHtml,
  getTelegramDestinations,
  normalizeTelegramText,
  sendTelegramMessage,
  TelegramConfigError,
  TelegramRequestError,
} from "@/lib/telegram";
import { recordQuoteLead } from "@/lib/hung-phat-supabase";
import type { FieldErrors } from "@/lib/validation";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1024;

function getOptionLabel(options: readonly { value: string; label: string }[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

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
    const usageLabel = getOptionLabel(quoteNeedOptions, data.usage);
    const areaLabel = getOptionLabel(quoteDeliveryAreaOptions, data.area);
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

    try {
      const destinations = getTelegramDestinations();
      const message = normalizeTelegramText(
        [
          "<b>BÁO GIÁ WEBSITE</b>",
          `<b>Mã yêu cầu:</b> <code>${escapeHtml(leadId)}</code>`,
          `<b>Thời gian:</b> ${escapeHtml(formatVietnamDateTime())}`,
          "",
          `<b>Họ và tên:</b> ${escapeHtml(data.name)}`,
          `<b>Số điện thoại:</b> ${escapeHtml(data.phoneNormalized)}`,
          data.company ? `<b>Công ty:</b> ${escapeHtml(data.company)}` : undefined,
          data.email ? `<b>Email:</b> ${escapeHtml(data.email)}` : undefined,
          `<b>Nhu cầu chính:</b> ${escapeHtml(usageLabel)}`,
          data.product ? `<b>Sản phẩm cần tìm / nhu cầu cụ thể:</b> ${escapeHtml(data.product)}` : undefined,
          data.quantity ? `<b>Số lượng dự kiến:</b> ${escapeHtml(data.quantity)}` : undefined,
          `<b>Khu vực giao hàng:</b> ${escapeHtml(areaLabel)}`,
          data.note ? `<b>Nội dung cần hỗ trợ:</b> ${escapeHtml(data.note)}` : undefined,
          "",
          `<b>Nguồn gửi:</b> ${escapeHtml(data.source || "quote-form")}`,
          `<b>Pathname:</b> ${escapeHtml(data.pathname || "/")}`,
          `<b>Website:</b> ${escapeHtml(website)}`,
        ]
          .filter(Boolean)
          .join("\n"),
      );

      const telegram = await sendTelegramMessage({
        chatId: destinations.quoteChatId,
        messageThreadId: destinations.quoteThreadId,
        text: message,
      });

      try {
        await recordQuoteLead({
          leadId,
          name: data.name,
          phone: data.phoneNormalized,
          company: data.company,
          email: data.email,
          product: data.product,
          quantity: data.quantity,
          area: areaLabel,
          usage: usageLabel,
          note: data.note,
          source: data.source || "quote-form",
          pathname: data.pathname || "/",
          website,
          status: "new",
          telegramChatId: telegram.result?.chat?.id ?? destinations.quoteChatId,
          telegramMessageId: telegram.result?.message_id ?? null,
        });
      } catch {
        // Keep quote delivery successful even if persistence is unavailable.
      }

      return NextResponse.json(
        {
          ok: true,
          leadId,
          telegram: {
            chatId: telegram.result?.chat?.id ?? destinations.quoteChatId,
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
      return jsonError(503, "TELEGRAM_UNAVAILABLE", "Không thể gửi báo giá lúc này.");
    }
  } catch {
    return jsonError(500, "INTERNAL_ERROR", "Đã xảy ra lỗi không mong muốn.");
  }
}
