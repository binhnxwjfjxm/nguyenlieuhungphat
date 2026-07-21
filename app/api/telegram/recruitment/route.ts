import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site";
import {
  createLeadCode,
  formatVietnamDateTime,
  recruitmentPositionOptions,
  validateRecruitmentInput,
} from "@/lib/validation";
import {
  escapeHtml,
  getRecruitmentTelegramDestination,
  normalizeTelegramText,
  sendTelegramDocument,
  sendTelegramMessage,
  TelegramConfigError,
  TelegramRequestError,
} from "@/lib/telegram";
import type { FieldErrors } from "@/lib/validation";

export const runtime = "nodejs";

const MAX_CV_BYTES = 10 * 1024 * 1024;

function getOptionLabel(options: readonly { value: string; label: string }[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function jsonError(status: 400 | 500 | 503, code: string, error: string, fieldErrors?: FieldErrors) {
  const body: Record<string, unknown> = { ok: false, code, error };
  if (fieldErrors) body.fieldErrors = fieldErrors;
  return NextResponse.json(body, { status });
}

function clip(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
}

function isAllowedCvFile(file: File) {
  const name = file.name.toLowerCase();
  const allowedByName = /\.(pdf|docx?|png|jpe?g)$/i.test(name);
  const allowedByType = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
  ].includes(file.type);

  return allowedByName || allowedByType;
}

function buildFullMessage(
  applicationId: string,
  positionLabel: string,
  website: string,
  data: {
    name: string;
    phoneNormalized: string;
    email: string;
    experience: string;
    cvLink: string;
    note: string;
    source: string;
    pathname: string;
  },
) {
  return normalizeTelegramText(
    [
      "<b>UNG TUYEN WEBSITE</b>",
      `<b>Ma ho so:</b> <code>${escapeHtml(applicationId)}</code>`,
      `<b>Thoi gian:</b> ${escapeHtml(formatVietnamDateTime())}`,
      "",
      `<b>Ho va ten:</b> ${escapeHtml(data.name)}`,
      `<b>So dien thoai:</b> ${escapeHtml(data.phoneNormalized)}`,
      data.email ? `<b>Email:</b> ${escapeHtml(data.email)}` : undefined,
      `<b>Vi tri ung tuyen:</b> ${escapeHtml(positionLabel)}`,
      `<b>Kinh nghiem / diem manh:</b> ${escapeHtml(data.experience)}`,
      data.cvLink ? `<b>Link CV / portfolio:</b> ${escapeHtml(data.cvLink)}` : undefined,
      data.note ? `<b>Ghi chu:</b> ${escapeHtml(data.note)}` : undefined,
      "",
      `<b>Nguon gui:</b> ${escapeHtml(data.source || "recruitment-form")}`,
      `<b>Pathname:</b> ${escapeHtml(data.pathname || "/")}`,
      `<b>Website:</b> ${escapeHtml(website)}`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

function buildCaption(
  applicationId: string,
  positionLabel: string,
  data: {
    name: string;
    phoneNormalized: string;
    email: string;
    experience: string;
    cvLink: string;
    note: string;
  },
) {
  return normalizeTelegramText(
    [
      "<b>CV UNG TUYEN</b>",
      `<b>Ma ho so:</b> <code>${escapeHtml(applicationId)}</code>`,
      "",
      `<b>Ho va ten:</b> ${escapeHtml(data.name)}`,
      `<b>So dien thoai:</b> ${escapeHtml(data.phoneNormalized)}`,
      data.email ? `<b>Email:</b> ${escapeHtml(data.email)}` : undefined,
      `<b>Vi tri ung tuyen:</b> ${escapeHtml(positionLabel)}`,
      `<b>Kinh nghiem / diem manh:</b> ${escapeHtml(clip(data.experience, 180))}`,
      data.cvLink ? `<b>Link CV / portfolio:</b> ${escapeHtml(clip(data.cvLink, 180))}` : undefined,
      data.note ? `<b>Ghi chu:</b> ${escapeHtml(clip(data.note, 120))}` : undefined,
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const cvFileValue = formData.get("cvFile");
    const cvFile = cvFileValue instanceof File && cvFileValue.size > 0 ? cvFileValue : null;

    if (cvFile && cvFile.size > MAX_CV_BYTES) {
      return jsonError(400, "FILE_TOO_LARGE", "CV quá lớn. Vui lòng gửi file nhỏ hơn 10MB.");
    }

    if (cvFile && !isAllowedCvFile(cvFile)) {
      return jsonError(400, "UNSUPPORTED_FILE", "Chỉ nhận file PDF, DOC, DOCX, PNG hoặc JPG.");
    }

    const validated = validateRecruitmentInput({
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      position: String(formData.get("position") ?? ""),
      experience: String(formData.get("experience") ?? ""),
      cvLink: String(formData.get("cvLink") ?? ""),
      note: String(formData.get("note") ?? ""),
      source: String(formData.get("source") ?? ""),
      pathname: String(formData.get("pathname") ?? ""),
      website: String(formData.get("website") ?? ""),
      honeypot: String(formData.get("honeypot") ?? ""),
    });

    if (!validated.ok) {
      return jsonError(400, validated.code, validated.error, validated.fieldErrors);
    }

    const data = validated.data;
    const applicationId = createLeadCode("HR");
    const positionLabel = getOptionLabel(recruitmentPositionOptions, data.position);
    const website = data.website || getSiteUrl();
    const { hrChatId } = getRecruitmentTelegramDestination();

    if (cvFile) {
      const caption = buildCaption(applicationId, positionLabel, data);
      await sendTelegramDocument({
        chatId: hrChatId,
        document: cvFile,
        filename: cvFile.name,
        caption,
      });
    } else {
      const message = buildFullMessage(applicationId, positionLabel, website, data);
      await sendTelegramMessage({
        chatId: hrChatId,
        text: message,
      });
    }

    return NextResponse.json(
      {
        ok: true,
        applicationId,
        telegram: {
          chatId: hrChatId,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof TelegramConfigError) {
      return jsonError(503, "MISSING_CONFIG", error.message);
    }
    if (error instanceof TelegramRequestError) {
      return jsonError(503, "TELEGRAM_UNAVAILABLE", error.message);
    }
    return jsonError(500, "INTERNAL_ERROR", "Đã xảy ra lỗi không mong muốn.");
  }
}
