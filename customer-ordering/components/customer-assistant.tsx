"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, Send, ShieldCheck } from "lucide-react";
import { loadClerkBrowser } from "@/lib/auth/clerk-browser";
import styles from "./customer-assistant.module.css";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

type AiCredit = {
  limitUsd: string;
  usedUsd: string;
  remainingUsd: string;
  usagePercent: string;
};

type ChatResponse = {
  ok?: boolean;
  code?: string;
  error?: string;
  replyText?: string;
  credit?: AiCredit;
};

type ClerkWithSession = Awaited<ReturnType<typeof loadClerkBrowser>> & {
  session?: { getToken(): Promise<string | null> } | null;
};

const suggestions = [
  "Có những loại lúa ve nào?",
  "Cách sử dụng lúa ve thế nào?",
  "Hướng dẫn tôi tìm sản phẩm và đặt hàng",
] as const;

function messageId() {
  return globalThis.crypto?.randomUUID?.() ?? `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sessionId() {
  return globalThis.crypto?.randomUUID?.() ?? `ordering-${Date.now()}`;
}

function money(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? `$${parsed.toFixed(2)}` : "$0.00";
}

async function clerkToken() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "";
  if (!publishableKey) throw new Error("clerk_publishable_key_missing");
  const clerk = await loadClerkBrowser(publishableKey) as ClerkWithSession;
  const token = await clerk.session?.getToken();
  if (!token) throw new Error("clerk_session_missing");
  return token;
}

export function CustomerAssistant() {
  const [conversationId] = useState(sessionId);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Chào Quý khách. Tôi có thể tư vấn sản phẩm, cách sử dụng và hướng dẫn thao tác trên ứng dụng. Việc chọn hàng và gửi đơn vẫn do Quý khách tự xác nhận.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [credit, setCredit] = useState<AiCredit | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages, sending]);

  async function send(text: string) {
    const message = text.trim().slice(0, 1000);
    if (!message || sending) return;
    setDraft("");
    setError("");
    setMessages((current) => [...current, { id: messageId(), role: "user", text: message }]);
    setSending(true);
    try {
      const token = await clerkToken();
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({ sessionId: conversationId, message }),
      });
      const body = await response.json().catch(() => ({})) as ChatResponse;
      if (!response.ok || !body.ok || !body.replyText) {
        if (body.code === "AI_CREDIT_LIMIT_REACHED") {
          setError("Hạn mức hỗ trợ AI đã sử dụng hết. Các chức năng đặt hàng khác vẫn hoạt động bình thường.");
        } else if (response.status === 401) {
          setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        } else {
          setError(body.error || "Chưa thể nhận phản hồi. Vui lòng thử lại.");
        }
        return;
      }
      if (body.credit) setCredit(body.credit);
      setMessages((current) => [...current, { id: messageId(), role: "assistant", text: body.replyText! }]);
    } catch {
      setError("Chưa thể kết nối hỗ trợ sản phẩm. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(draft);
  }

  return (
    <section className={styles.screen} aria-label="Hỏi Hưng Phát">
      <div className={styles.intro}>
        <span className={styles.botMark}><Bot aria-hidden="true" size={24} /></span>
        <div>
          <h1>Hỏi Hưng Phát</h1>
          <p>Tư vấn sản phẩm, cách sử dụng và hướng dẫn thao tác.</p>
        </div>
      </div>

      <div className={styles.scopeNotice}>
        <ShieldCheck aria-hidden="true" size={18} />
        <span>Trợ lý chỉ hướng dẫn. Trợ lý không tự thêm giỏ hàng, tạo đơn hoặc gửi đơn.</span>
      </div>

      {credit ? (
        <div className={styles.credit} aria-label="Hạn mức hỗ trợ AI">
          <span>Hạn mức AI còn</span>
          <strong>{money(credit.remainingUsd)}</strong>
          <small>/ {money(credit.limitUsd)}</small>
        </div>
      ) : null}

      <div className={styles.suggestions} aria-label="Câu hỏi gợi ý">
        {suggestions.map((suggestion) => (
          <button disabled={sending} key={suggestion} onClick={() => void send(suggestion)} type="button">
            {suggestion}
          </button>
        ))}
      </div>

      <div className={styles.messages} aria-live="polite">
        {messages.map((message) => (
          <div className={message.role === "user" ? styles.userRow : styles.assistantRow} key={message.id}>
            <div className={message.role === "user" ? styles.userBubble : styles.assistantBubble}>{message.text}</div>
          </div>
        ))}
        {sending ? <div className={styles.assistantRow}><div className={styles.assistantBubble}>Đang tìm thông tin phù hợp…</div></div> : null}
        <div ref={endRef} />
      </div>

      {error ? <p className={styles.error} role="alert">{error}</p> : null}

      <form className={styles.composer} onSubmit={submit}>
        <label className={styles.srOnly} htmlFor="assistant-message">Nhập câu hỏi</label>
        <textarea
          id="assistant-message"
          maxLength={1000}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Hỏi về sản phẩm, cách dùng hoặc cách thao tác…"
          rows={2}
          value={draft}
        />
        <button aria-label="Gửi câu hỏi" disabled={sending || !draft.trim()} type="submit">
          <Send aria-hidden="true" size={19} />
        </button>
      </form>
    </section>
  );
}
