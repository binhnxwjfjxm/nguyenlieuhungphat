type RateLimitBucket = {
  timestamp: number;
  fingerprint?: string;
};

const quoteByIp = new Map<string, RateLimitBucket>();
const quoteByPhone = new Map<string, RateLimitBucket>();
const quoteByFingerprint = new Map<string, RateLimitBucket>();
const chatByIp = new Map<string, RateLimitBucket>();
const chatByPhone = new Map<string, RateLimitBucket>();
const chatByFingerprint = new Map<string, RateLimitBucket>();

const REQUEST_INTERVAL_MS = 60_000;
const DUPLICATE_WINDOW_MS = 5 * 60_000;

function sweep(map: Map<string, RateLimitBucket>, limitMs: number) {
  const now = Date.now();
  for (const [key, entry] of map) {
    if (now - entry.timestamp > limitMs) {
      map.delete(key);
    }
  }
}

function checkWindow(map: Map<string, RateLimitBucket>, key: string, now: number, limitMs: number) {
  sweep(map, limitMs);
  const existing = map.get(key);
  if (existing && now - existing.timestamp < limitMs) {
    return Math.ceil((limitMs - (now - existing.timestamp)) / 1000);
  }
  map.set(key, { timestamp: now });
  return 0;
}

function checkDuplicate(map: Map<string, RateLimitBucket>, key: string, fingerprint: string, now: number) {
  sweep(map, DUPLICATE_WINDOW_MS);
  const existing = map.get(key);
  if (existing && existing.fingerprint === fingerprint && now - existing.timestamp < DUPLICATE_WINDOW_MS) {
    return Math.ceil((DUPLICATE_WINDOW_MS - (now - existing.timestamp)) / 1000);
  }
  map.set(key, { timestamp: now, fingerprint });
  return 0;
}

export function checkQuoteRateLimit({
  ip,
  phone,
  fingerprint,
  now = Date.now(),
}: {
  ip: string;
  phone: string;
  fingerprint: string;
  now?: number;
}) {
  const ipRetryAfter = checkWindow(quoteByIp, ip, now, REQUEST_INTERVAL_MS);
  if (ipRetryAfter) {
    return { ok: false as const, retryAfter: ipRetryAfter, code: "RATE_LIMITED", error: "Bạn đang gửi quá nhanh." };
  }

  const phoneRetryAfter = checkWindow(quoteByPhone, phone, now, REQUEST_INTERVAL_MS);
  if (phoneRetryAfter) {
    return { ok: false as const, retryAfter: phoneRetryAfter, code: "RATE_LIMITED", error: "Bạn đang gửi quá nhanh." };
  }

  const duplicateRetryAfter = checkDuplicate(quoteByFingerprint, `${ip}:${phone}`, fingerprint, now);
  if (duplicateRetryAfter) {
    return {
      ok: false as const,
      retryAfter: duplicateRetryAfter,
      code: "DUPLICATE_REQUEST",
      error: "Nội dung này vừa được gửi gần đây.",
    };
  }

  return { ok: true as const };
}

export function checkChatRateLimit({
  ip,
  phone,
  fingerprint,
  now = Date.now(),
}: {
  ip: string;
  phone: string;
  fingerprint: string;
  now?: number;
}) {
  const ipRetryAfter = checkWindow(chatByIp, ip, now, REQUEST_INTERVAL_MS);
  if (ipRetryAfter) {
    return { ok: false as const, retryAfter: ipRetryAfter, code: "RATE_LIMITED", error: "Bạn đang gửi quá nhanh." };
  }

  const phoneRetryAfter = checkWindow(chatByPhone, phone, now, REQUEST_INTERVAL_MS);
  if (phoneRetryAfter) {
    return { ok: false as const, retryAfter: phoneRetryAfter, code: "RATE_LIMITED", error: "Bạn đang gửi quá nhanh." };
  }

  const duplicateRetryAfter = checkDuplicate(chatByFingerprint, `${ip}:${phone}`, fingerprint, now);
  if (duplicateRetryAfter) {
    return {
      ok: false as const,
      retryAfter: duplicateRetryAfter,
      code: "DUPLICATE_REQUEST",
      error: "Nội dung này vừa được gửi gần đây.",
    };
  }

  return { ok: true as const };
}

