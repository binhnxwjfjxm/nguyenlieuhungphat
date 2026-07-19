import "server-only";

type TelegramMessageOptions = {
  text: string;
  topicId?: string | number;
};

export class TelegramConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TelegramConfigError";
  }
}

function escapeTelegramHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatTelegramLines(lines: Array<string | undefined | null>) {
  return lines.filter(Boolean).join("\n");
}

function getTelegramConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId) {
    throw new TelegramConfigError("Thiếu cấu hình Telegram.");
  }

  return {
    token,
    chatId,
    quoteTopicId: process.env.TELEGRAM_QUOTE_TOPIC_ID?.trim() || "",
    chatTopicId: process.env.TELEGRAM_CHAT_TOPIC_ID?.trim() || "",
  };
}

export async function sendTelegramMessage({ text, topicId }: TelegramMessageOptions) {
  const { token, chatId } = getTelegramConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        chat_id: chatId,
        message_thread_id: topicId ? Number(topicId) : undefined,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Telegram responded with ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new Error("Telegram request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function escapeHtml(value: string) {
  return escapeTelegramHtml(value);
}

export function getTelegramTopics() {
  return getTelegramConfig();
}
