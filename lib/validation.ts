export type FieldErrors<T extends string = string> = Partial<Record<T, string>>;

export type QuoteRequestInput = {
  name: string;
  phone: string;
  company: string;
  email: string;
  product: string;
  quantity: string;
  area: string;
  usage: string;
  note: string;
  source: string;
  pathname: string;
  website: string;
  honeypot: string;
};

export type QuoteRequestData = QuoteRequestInput & {
  phoneNormalized: string;
};

export type ChatRequestInput = {
  sessionId: string;
  name: string;
  phone: string;
  company: string;
  product: string;
  quantity: string;
  area: string;
  transcript: string;
  requestCallback: boolean;
  source: string;
  pathname: string;
  website: string;
  honeypot: string;
};

export type ChatRequestData = ChatRequestInput & {
  phoneNormalized: string;
};

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; error: string; fieldErrors?: FieldErrors };

const VN_PHONE_PATTERN = /^(?:0\d{9,10}|84\d{9,10})$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SESSION_PATTERN = /^(?:CHAT-\d{8}-[A-Z0-9]{4})$/;

function cleanupControlCharacters(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ");
}

export function sanitizeText(value: unknown, maxLength = Number.POSITIVE_INFINITY) {
  const stringValue = typeof value === "string" ? value : value == null ? "" : String(value);
  const collapsed = cleanupControlCharacters(stringValue).replace(/\s+/g, " ").trim();
  return collapsed.slice(0, maxLength);
}

export function normalizePhone(value: unknown) {
  const raw = sanitizeText(value, 40).replace(/[^\d+]/g, "");
  if (!raw) return "";

  if (raw.startsWith("+84")) {
    const rest = raw.slice(3);
    return `0${rest}`;
  }

  if (raw.startsWith("84")) {
    const rest = raw.slice(2);
    return `0${rest}`;
  }

  return raw;
}

export function isValidVietnamPhone(value: string) {
  return VN_PHONE_PATTERN.test(value);
}

export function isValidEmail(value: string) {
  return !value || EMAIL_PATTERN.test(value);
}

function normalizeOptionalText(value: unknown, maxLength: number) {
  return sanitizeText(value, maxLength);
}

export function validateQuoteInput(raw: Partial<QuoteRequestInput>): ValidationResult<QuoteRequestData> {
  const data: QuoteRequestData = {
    name: normalizeOptionalText(raw.name, 80),
    phone: normalizeOptionalText(raw.phone, 40),
    company: normalizeOptionalText(raw.company, 120),
    email: normalizeOptionalText(raw.email, 160),
    product: normalizeOptionalText(raw.product, 120),
    quantity: normalizeOptionalText(raw.quantity, 60),
    area: normalizeOptionalText(raw.area, 80),
    usage: normalizeOptionalText(raw.usage, 120),
    note: normalizeOptionalText(raw.note, 500),
    source: normalizeOptionalText(raw.source, 80),
    pathname: normalizeOptionalText(raw.pathname, 160),
    website: normalizeOptionalText(raw.website, 160),
    honeypot: normalizeOptionalText(raw.honeypot, 40),
    phoneNormalized: "",
  };

  const fieldErrors: FieldErrors<keyof QuoteRequestInput> = {};

  if (data.honeypot) {
    return { ok: false, code: "BOT_DETECTED", error: "Yêu cầu không hợp lệ." };
  }

  if (data.name.length < 2) {
    fieldErrors.name = "Họ tên phải từ 2 đến 80 ký tự.";
  }

  if (data.name.length > 80) {
    fieldErrors.name = "Họ tên phải từ 2 đến 80 ký tự.";
  }

  data.phoneNormalized = normalizePhone(data.phone);
  if (!isValidVietnamPhone(data.phoneNormalized)) {
    fieldErrors.phone = "Số điện thoại phải đúng định dạng Việt Nam.";
  }

  if (data.company.length > 120) {
    fieldErrors.company = "Tên công ty tối đa 120 ký tự.";
  }

  if (data.email && !isValidEmail(data.email)) {
    fieldErrors.email = "Email chưa đúng định dạng.";
  }

  if (!data.product && !data.usage) {
    fieldErrors.product = "Cần nhập sản phẩm hoặc nhu cầu.";
    fieldErrors.usage = "Cần nhập sản phẩm hoặc nhu cầu.";
  }

  if (data.product.length > 120) {
    fieldErrors.product = "Sản phẩm tối đa 120 ký tự.";
  }

  if (data.quantity.length > 60) {
    fieldErrors.quantity = "Số lượng tối đa 60 ký tự.";
  }

  if (data.area.length > 80) {
    fieldErrors.area = "Khu vực tối đa 80 ký tự.";
  }

  if (data.usage.length > 120) {
    fieldErrors.usage = "Nhu cầu tối đa 120 ký tự.";
  }

  if (data.note.length > 500) {
    fieldErrors.note = "Ghi chú tối đa 500 ký tự.";
  }

  if (Object.keys(fieldErrors).length) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Dữ liệu chưa hợp lệ.", fieldErrors };
  }

  return { ok: true, data };
}

export function validateChatInput(raw: Partial<ChatRequestInput>): ValidationResult<ChatRequestData> {
  const sessionId = sanitizeText(raw.sessionId, 24);
  const data: ChatRequestData = {
    sessionId: sessionId && SESSION_PATTERN.test(sessionId) ? sessionId : "",
    name: normalizeOptionalText(raw.name, 80),
    phone: normalizeOptionalText(raw.phone, 40),
    company: normalizeOptionalText(raw.company, 120),
    product: normalizeOptionalText(raw.product, 120),
    quantity: normalizeOptionalText(raw.quantity, 60),
    area: normalizeOptionalText(raw.area, 80),
    transcript: normalizeOptionalText(raw.transcript, 3000),
    requestCallback: Boolean(raw.requestCallback),
    source: normalizeOptionalText(raw.source, 80),
    pathname: normalizeOptionalText(raw.pathname, 160),
    website: normalizeOptionalText(raw.website, 160),
    honeypot: normalizeOptionalText(raw.honeypot, 40),
    phoneNormalized: "",
  };

  const fieldErrors: FieldErrors<keyof ChatRequestInput> = {};

  if (data.honeypot) {
    return { ok: false, code: "BOT_DETECTED", error: "Yêu cầu không hợp lệ." };
  }

  if (data.name.length < 2 || data.name.length > 80) {
    fieldErrors.name = "Họ tên phải từ 2 đến 80 ký tự.";
  }

  data.phoneNormalized = normalizePhone(data.phone);
  if (!isValidVietnamPhone(data.phoneNormalized)) {
    fieldErrors.phone = "Số điện thoại phải đúng định dạng Việt Nam.";
  }

  if (data.company.length > 120) {
    fieldErrors.company = "Tên công ty tối đa 120 ký tự.";
  }

  if (data.product.length > 120) {
    fieldErrors.product = "Nhu cầu/sản phẩm tối đa 120 ký tự.";
  }

  if (data.quantity.length > 60) {
    fieldErrors.quantity = "Số lượng tối đa 60 ký tự.";
  }

  if (data.area.length > 80) {
    fieldErrors.area = "Khu vực tối đa 80 ký tự.";
  }

  if (data.transcript.length < 20) {
    fieldErrors.transcript = "Transcript quá ngắn.";
  }

  if (!data.sessionId) {
    fieldErrors.sessionId = "Mã phiên không hợp lệ.";
  }

  if (Object.keys(fieldErrors).length) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Dữ liệu chưa hợp lệ.", fieldErrors };
  }

  return { ok: true, data };
}

export function createLeadCode(prefix: "HP" | "CHAT", now = new Date()) {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .replace(/-/g, "");
  const random = randomBytes(3).toString("hex").toUpperCase().slice(0, 4);
  return `${prefix}-${date}-${random}`;
}

export function formatVietnamDateTime(now = new Date()) {
  const date = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
    timeStyle: "short",
  }).format(now);

  return date.replace(",", " ·");
}

export function makeFingerprint(parts: string[]) {
  return parts.map((part) => sanitizeText(part, 256).toLowerCase()).join("|");
}
import { randomBytes } from "node:crypto";

