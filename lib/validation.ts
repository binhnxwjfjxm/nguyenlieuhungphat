import { randomBytes } from "node:crypto";

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

export const recruitmentPositionOptions = [
  { value: "kinh-doanh-b2b", label: "Kinh doanh B2B" },
  { value: "kho-giao-nhan", label: "Điều phối kho & giao nhận" },
  { value: "khac", label: "Khác" },
] as const;

export type RecruitmentRequestInput = {
  name: string;
  phone: string;
  email: string;
  position: string;
  experience: string;
  cvLink: string;
  note: string;
  source: string;
  pathname: string;
  website: string;
  honeypot: string;
};

export type RecruitmentRequestData = RecruitmentRequestInput & {
  phoneNormalized: string;
};

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; error: string; fieldErrors?: FieldErrors };

export const quoteNeedOptions = [
  { value: "tra-sua", label: "Trà sữa" },
  { value: "mi-cay", label: "Mì cay" },
  { value: "khac", label: "Khác" },
] as const;

export const quoteDeliveryAreaOptions = [
  { value: "tp-hcm", label: "TP. Hồ Chí Minh" },
  { value: "ha-noi", label: "Hà Nội" },
  { value: "binh-duong", label: "Bình Dương" },
  { value: "dong-nai", label: "Đồng Nai" },
  { value: "long-an", label: "Long An" },
  { value: "can-tho", label: "Cần Thơ" },
  { value: "tay-ninh", label: "Tây Ninh" },
  { value: "ba-ria-vung-tau", label: "Bà Rịa - Vũng Tàu" },
  { value: "mien-nam", label: "Khu vực miền Nam" },
  { value: "mien-trung", label: "Khu vực miền Trung" },
  { value: "mien-bac", label: "Khu vực miền Bắc" },
  { value: "toan-quoc", label: "Toàn quốc" },
  { value: "khac", label: "Khác" },
] as const;

const VN_PHONE_PATTERN = /^(?:0\d{9,10}|84\d{9,10})$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SESSION_PATTERN = /^(?:CHAT-\d{8}-[A-Z0-9]{4})$/;

function cleanupControlCharacters(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ");
}

export function sanitizeText(value: unknown, maxLength = Number.POSITIVE_INFINITY) {
  const stringValue = typeof value === "string" ? value : value == null ? "" : String(value);
  const normalized = stringValue.normalize("NFC");
  const collapsed = cleanupControlCharacters(normalized).replace(/\s+/g, " ").trim();
  return collapsed.slice(0, maxLength);
}

export function normalizePhone(value: unknown) {
  const raw = sanitizeText(value, 40).replace(/[^\d+]/g, "");
  if (!raw) return "";

  if (raw.startsWith("+84")) {
    return `0${raw.slice(3)}`;
  }

  if (raw.startsWith("84")) {
    return `0${raw.slice(2)}`;
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

function normalizeSelectValue(value: unknown, allowedValues: readonly string[]) {
  const normalized = normalizeOptionalText(value, 80);
  return allowedValues.includes(normalized) ? normalized : "";
}

export function validateQuoteInput(raw: Partial<QuoteRequestInput>): ValidationResult<QuoteRequestData> {
  const data: QuoteRequestData = {
    name: normalizeOptionalText(raw.name, 80),
    phone: normalizeOptionalText(raw.phone, 40),
    company: normalizeOptionalText(raw.company, 120),
    email: normalizeOptionalText(raw.email, 160),
    product: normalizeOptionalText(raw.product, 500),
    quantity: normalizeOptionalText(raw.quantity, 60),
    area: normalizeSelectValue(raw.area, quoteDeliveryAreaOptions.map((option) => option.value)),
    usage: normalizeSelectValue(raw.usage, quoteNeedOptions.map((option) => option.value)),
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

  if (data.email && !isValidEmail(data.email)) {
    fieldErrors.email = "Email chưa đúng định dạng.";
  }

  if (!data.usage) {
    fieldErrors.usage = "Vui lòng chọn nhu cầu chính.";
  }

  if (!data.area) {
    fieldErrors.area = "Vui lòng chọn khu vực giao hàng.";
  }

  if (data.product.length > 500) {
    fieldErrors.product = "Nội dung cần tư vấn tối đa 500 ký tự.";
  }

  if (data.quantity.length > 60) {
    fieldErrors.quantity = "Số lượng tối đa 60 ký tự.";
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

  if (data.name && (data.name.length < 2 || data.name.length > 80)) {
    fieldErrors.name = "Họ tên phải từ 2 đến 80 ký tự.";
  }

  data.phoneNormalized = normalizePhone(data.phone);
  if (data.phone && !isValidVietnamPhone(data.phoneNormalized)) {
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

  if (data.transcript.length < 1) {
    fieldErrors.transcript = "Nội dung trao đổi không được để trống.";
  }

  if (!data.sessionId) {
    fieldErrors.sessionId = "Mã phiên không hợp lệ.";
  }

  if (Object.keys(fieldErrors).length) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Dữ liệu chưa hợp lệ.", fieldErrors };
  }

  return { ok: true, data };
}

export function validateRecruitmentInput(raw: Partial<RecruitmentRequestInput>): ValidationResult<RecruitmentRequestData> {
  const data: RecruitmentRequestData = {
    name: normalizeOptionalText(raw.name, 80),
    phone: normalizeOptionalText(raw.phone, 40),
    email: normalizeOptionalText(raw.email, 160),
    position: normalizeSelectValue(raw.position, recruitmentPositionOptions.map((option) => option.value)),
    experience: normalizeOptionalText(raw.experience, 1000),
    cvLink: normalizeOptionalText(raw.cvLink, 300),
    note: normalizeOptionalText(raw.note, 500),
    source: normalizeOptionalText(raw.source, 80),
    pathname: normalizeOptionalText(raw.pathname, 160),
    website: normalizeOptionalText(raw.website, 160),
    honeypot: normalizeOptionalText(raw.honeypot, 40),
    phoneNormalized: "",
  };

  const fieldErrors: FieldErrors<keyof RecruitmentRequestInput> = {};

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

  if (data.email && !isValidEmail(data.email)) {
    fieldErrors.email = "Email chưa đúng định dạng.";
  }

  if (!data.position) {
    fieldErrors.position = "Vui lòng chọn vị trí ứng tuyển.";
  }

  if (data.experience.length < 2 || data.experience.length > 1000) {
    fieldErrors.experience = "Kinh nghiệm / điểm mạnh phải từ 2 đến 1000 ký tự.";
  }

  if (data.cvLink.length > 300) {
    fieldErrors.cvLink = "Link CV tối đa 300 ký tự.";
  }

  if (data.note.length > 500) {
    fieldErrors.note = "Ghi chú tối đa 500 ký tự.";
  }

  if (Object.keys(fieldErrors).length) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Dữ liệu chưa hợp lệ.", fieldErrors };
  }

  return { ok: true, data };
}

export function createLeadCode(prefix: "HP" | "CHAT" | "HR", now = new Date()) {
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
