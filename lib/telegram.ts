import "server-only";

type TelegramMessageOptions = {
  chatId: string;
  text: string;
  messageThreadId?: string | number | null;
};

export class TelegramConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TelegramConfigError";
  }
}

export class TelegramRequestError extends Error {
  status: number;
  retryAfter?: number;

  constructor(message: string, status: number, retryAfter?: number) {
    super(message);
    this.name = "TelegramRequestError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

function normalizeNfc(value: string) {
  return value.normalize("NFC");
}

function firstNonEmpty(...values: Array<string | undefined | null>) {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

function normalizeThreadId(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return undefined;
  return trimmed;
}

function escapeTelegramHtml(value: string) {
  return normalizeNfc(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function normalizeTelegramText(value: string) {
  return normalizeNfc(value);
}

export function formatTelegramLines(lines: Array<string | undefined | null>) {
  return lines.filter(Boolean).join("\n");
}

function getTelegramConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const quoteChatId = firstNonEmpty(process.env.TELEGRAM_QUOTE_CHAT_ID);
  const quoteThreadId = normalizeThreadId(process.env.TELEGRAM_QUOTE_TOPIC_ID);
  const adminChatId = firstNonEmpty(process.env.TELEGRAM_ADMIN_CHAT_ID, process.env.TELEGRAM_CHAT_ID);
  const adminThreadId = normalizeThreadId(process.env.TELEGRAM_CHAT_TOPIC_ID);

  if (!token || !quoteChatId || !adminChatId) {
    throw new TelegramConfigError("Thiếu cấu hình Telegram.");
  }

  return {
    token,
    quoteChatId,
    quoteThreadId,
    adminChatId,
    adminThreadId,
  };
}

export async function sendTelegramMessage({ chatId, text, messageThreadId }: TelegramMessageOptions) {
  const { token } = getTelegramConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      signal: controller.signal,
      body: JSON.stringify({
        chat_id: chatId,
        ...(messageThreadId ? { message_thread_id: messageThreadId } : {}),
        text: normalizeNfc(text),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      let description = `Telegram responded with ${response.status}`;
      try {
        const payload = (await response.json()) as { description?: string };
        if (payload.description) {
          description = payload.description;
        }
      } catch {
        // ignore parse errors
      }
      const retryAfter = response.headers.get("retry-after");
      throw new TelegramRequestError(description, response.status, retryAfter ? Number(retryAfter) : undefined);
    }

    return (await response.json()) as {
      ok: boolean;
      result?: { message_id?: number; chat?: { id?: number | string } };
    };
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new TelegramRequestError("Telegram request timed out.", 504);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function escapeHtml(value: string) {
  return escapeTelegramHtml(value);
}

export function getTelegramDestinations() {
  const { quoteChatId, quoteThreadId, adminChatId, adminThreadId } = getTelegramConfig();
  return {
    quoteChatId,
    quoteThreadId,
    adminChatId,
    adminThreadId,
  };
}
