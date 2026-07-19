"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MessageSquareMore, Minimize2, RefreshCcw, Search, Sparkles, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { categories } from "@/data/site";
import { DEFAULT_SITE_URL } from "@/lib/site";
import { normalizeSearchText } from "@/lib/search";
import { createLeadCode, validateChatInput } from "@/lib/validation";
import { QuoteButton } from "./quote-trigger";
import { useQuote } from "./quote-provider";
import { useToast } from "./toast-provider";
import chatbotAvatar from "../avatar-chat-bot.jpg";

type Message = {
  id: number;
  role: "assistant" | "user";
  text: string;
};

type Mode = "home" | "search" | "quote" | "callback";

type LeadDraft = {
  product: string;
  quantity: string;
  area: string;
  name: string;
  phone: string;
  company: string;
  note: string;
};

type SessionState = {
  sessionId: string;
  mode: Mode;
  minimized: boolean;
  open: boolean;
  messages: Message[];
  draft: LeadDraft;
  searchQuery: string;
  requestCallback: boolean;
  sentSignature: string;
};

const STORAGE_KEY = "hungphat-chatbot-state";

const DEFAULT_STATE: SessionState = {
  sessionId: "",
  mode: "home",
  minimized: false,
  open: false,
  messages: [
    {
      id: 1,
      role: "assistant",
      text:
        "Xin chào, tôi là trợ lý trực tuyến của Hưng Phát. Tôi có thể hỗ trợ tìm ngành hàng, tiếp nhận nhu cầu báo giá hoặc chuyển yêu cầu đến nhân viên phụ trách.",
    },
  ],
  draft: {
    product: "",
    quantity: "",
    area: "",
    name: "",
    phone: "",
    company: "",
    note: "",
  },
  searchQuery: "",
  requestCallback: false,
  sentSignature: "",
};

function createSessionId() {
  return createLeadCode("CHAT");
}

function vibrate() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(14);
  }
}

function makeTranscript(messages: Message[], draft: LeadDraft, requestCallback: boolean) {
  const conversation = messages
    .map((message) => `${message.role === "assistant" ? "Trợ lý" : "Khách"}: ${message.text}`)
    .join("\n");
  const summary = [
    `Ngành hàng / nhu cầu: ${draft.product || "Chưa xác định"}`,
    `Số lượng dự kiến: ${draft.quantity || "Chưa xác định"}`,
    `Khu vực giao hàng: ${draft.area || "Chưa xác định"}`,
    `Họ và tên: ${draft.name || "Chưa xác định"}`,
    `Số điện thoại: ${draft.phone || "Chưa xác định"}`,
    draft.company ? `Công ty: ${draft.company}` : null,
    draft.note ? `Nội dung trao đổi: ${draft.note}` : null,
    `Yêu cầu gọi lại: ${requestCallback ? "Có" : "Không"}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `--- Hội thoại ---\n${conversation}\n\n--- Tóm tắt ---\n${summary}`.slice(0, 2800);
}

function parseStoredState(value: string | null): SessionState {
  if (!value) return { ...DEFAULT_STATE, sessionId: createSessionId() };
  try {
    const parsed = JSON.parse(value) as Partial<SessionState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      sessionId: parsed.sessionId || createSessionId(),
      messages: parsed.messages?.length ? parsed.messages : DEFAULT_STATE.messages,
      draft: { ...DEFAULT_STATE.draft, ...(parsed.draft ?? {}) },
    };
  } catch {
    return { ...DEFAULT_STATE, sessionId: createSessionId() };
  }
}

export function Chatbot() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const { openQuote } = useQuote();
  const toast = useToast();
  const [state, setState] = useState<SessionState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const nextMessageId = useRef(2);

  useEffect(() => {
    const stored = parseStoredState(sessionStorage.getItem(STORAGE_KEY));
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    queueMicrotask(() => {
      setState(stored);
      setHydrated(true);
      nextMessageId.current = stored.messages.length + 1;
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [state.messages, state.mode]);

  const searchResults = useMemo(() => {
    const query = normalizeSearchText(state.searchQuery);
    if (!query) {
      return categories;
    }

    return categories.filter((category) => {
      const searchable = normalizeSearchText([category.title, category.description].join(" "));
      return searchable.includes(query);
    });
  }, [state.searchQuery]);

  function persist(next: Partial<SessionState>) {
    setState((current) => ({ ...current, ...next }));
  }

  function addMessage(role: Message["role"], text: string) {
    setState((current) => ({
      ...current,
      messages: [...current.messages, { id: nextMessageId.current++, role, text }],
    }));
  }

  function openPanel(mode: Mode) {
    vibrate();
    setState((current) => ({
      ...current,
      open: true,
      minimized: false,
      mode,
    }));
    if (mode === "home") {
      addMessage("assistant", "Anh muốn tìm ngành hàng, lấy báo giá hay cần nhân viên gọi lại?");
    }
  }

  function resetChat() {
    const fresh: SessionState = {
      ...DEFAULT_STATE,
      open: true,
      sessionId: createSessionId(),
      messages: [
        {
          id: 1,
          role: "assistant",
          text:
            "Xin chào, tôi là trợ lý trực tuyến của Hưng Phát. Tôi có thể hỗ trợ tìm ngành hàng, tiếp nhận nhu cầu báo giá hoặc chuyển yêu cầu đến nhân viên phụ trách.",
        },
      ],
    };
    nextMessageId.current = 2;
    setState(fresh);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  }

  function updateDraft<K extends keyof LeadDraft>(key: K, value: LeadDraft[K]) {
    setState((current) => ({
      ...current,
      draft: { ...current.draft, [key]: value },
    }));
  }

  function startSearch(query?: string) {
    setState((current) => ({
      ...current,
      open: true,
      minimized: false,
      mode: "search",
      searchQuery: query ?? current.searchQuery,
    }));
    addMessage("assistant", "Em đang lọc theo ngành hàng phù hợp cho anh.");
  }

  function startQuote() {
    setState((current) => ({
      ...current,
      open: true,
      minimized: false,
      mode: "quote",
      requestCallback: false,
    }));
    addMessage("assistant", "Anh điền nhanh nhu cầu, em sẽ mở form báo giá sẵn để gửi tiếp.");
  }

  function startCallback() {
    setState((current) => ({
      ...current,
      open: true,
      minimized: false,
      mode: "callback",
      requestCallback: true,
    }));
    addMessage("assistant", "Anh để lại thông tin, em sẽ chuyển yêu cầu cho nhân viên phụ trách.");
  }

  function addQuickReply(message: string) {
    addMessage("user", message);
  }

  async function sendCallback() {
    const draft = state.draft;
    const transcript = makeTranscript(state.messages, draft, true);
    const payload = {
      sessionId: state.sessionId || createSessionId(),
      name: draft.name,
      phone: draft.phone,
      company: draft.company,
      product: draft.product,
      quantity: draft.quantity,
      area: draft.area,
      transcript,
      requestCallback: true,
      source: "chatbot",
      pathname,
      website: process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL,
      honeypot: "",
    };

    const validated = validateChatInput(payload);
    if (!validated.ok) {
      toast.error(validated.error);
      addMessage("assistant", "Thông tin còn thiếu hoặc chưa đúng. Anh kiểm tra lại giúp em.");
      return;
    }

    const signature = `${validated.data.phoneNormalized}|${validated.data.transcript}`;
    if (state.sentSignature === signature) {
      toast.info("Transcript này đã được gửi rồi.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/telegram/chat", {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify(validated.data),
      });
      const result = (await response.json()) as { ok: boolean; sessionId?: string; error?: string; retryAfter?: number };
      if (!response.ok || !result.ok) {
        toast.error(
          result.retryAfter ? `${result.error ?? "Không gửi được."} Thử lại sau ${result.retryAfter}s.` : result.error ?? "Không gửi được.",
        );
        return;
      }

      const nextSessionId = result.sessionId ?? validated.data.sessionId;
      persist({
        sessionId: nextSessionId,
        sentSignature: signature,
        mode: "home",
      });
      addMessage("assistant", `Đã gửi cho nhân viên. Mã phiên ${nextSessionId}.`);
      toast.success(`Đã chuyển yêu cầu. Mã phiên ${nextSessionId}.`);
    } catch {
      toast.error("Lỗi mạng hoặc máy chủ bận.");
    } finally {
      setBusy(false);
    }
  }

  function openQuoteFromChat(categoryTitle: string) {
    openQuote({
      product: categoryTitle,
      usage: categoryTitle,
      source: "chatbot",
      pathname,
    });
    addQuickReply(`Mở form báo giá cho ${categoryTitle}`);
    toast.success("Đã mở form báo giá.");
  }

  return (
    <div className="chatbot-root">
      <AnimatePresence>
        {!state.open ? (
          <motion.button
            key="chat-launcher"
            className="chatbot-launcher"
            initial={reduceMotion ? false : { opacity: 1, y: 18, scale: 0.96 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.22 }}
            type="button"
            aria-label="Mở Hưng Phát Assistant"
            onClick={() => openPanel("home")}
          >
            <Sparkles size={18} />
          </motion.button>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {state.open ? (
          <motion.aside
            className={`chatbot-panel${state.minimized ? " is-minimized" : ""}`}
            initial={reduceMotion ? false : { opacity: 1, y: 18, scale: 0.98 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <header className="chatbot-header">
              <div className="chatbot-title">
                <span className="chatbot-avatar">
                  <Image src={chatbotAvatar} alt="Avatar chatbot Hưng Phát" fill sizes="38px" priority />
                </span>
                <div>
                  <strong>Hưng Phát Assistant</strong>
                  <span>Đang trực tuyến</span>
                </div>
              </div>
              <div className="chatbot-header-actions">
                <button
                  className="icon-button"
                  type="button"
                  aria-label={state.minimized ? "Mở rộng" : "Thu nhỏ"}
                  onClick={() => setState((current) => ({ ...current, minimized: !current.minimized }))}
                >
                  <Minimize2 size={18} />
                </button>
                <button className="icon-button" type="button" aria-label="Làm mới hội thoại" onClick={resetChat}>
                  <RefreshCcw size={18} />
                </button>
                <button
                  className="icon-button"
                  type="button"
                  aria-label="Đóng chatbot"
                  onClick={() => setState((current) => ({ ...current, open: false }))}
                >
                  <X size={18} />
                </button>
              </div>
            </header>

            {!state.minimized ? (
              <div className="chatbot-body">
                <div className="chatbot-messages" ref={scrollRef}>
                  {state.messages.map((message) => (
                    <div className={`chatbot-message ${message.role}`} key={message.id}>
                      <p>{message.text}</p>
                    </div>
                  ))}
                </div>

                <div className="chatbot-actions">
                  <button
                    className="chip-button"
                    type="button"
                    onClick={() => {
                      addQuickReply("Tìm nguyên liệu pha chế");
                      startSearch("Nguyên liệu pha chế");
                    }}
                  >
                    Tìm nguyên liệu pha chế
                  </button>
                  <button
                    className="chip-button"
                    type="button"
                    onClick={() => {
                      addQuickReply("Tìm nguyên liệu mì cay");
                      startSearch("Nguyên liệu mì cay");
                    }}
                  >
                    Tìm nguyên liệu mì cay
                  </button>
                  <button
                    className="chip-button"
                    type="button"
                    onClick={() => {
                      addQuickReply("Tìm hàng đông lạnh");
                      startSearch("Hàng đông lạnh");
                    }}
                  >
                    Tìm hàng đông lạnh
                  </button>
                  <button
                    className="chip-button"
                    type="button"
                    onClick={() => {
                      addQuickReply("Nhận báo giá");
                      startQuote();
                    }}
                  >
                    Nhận báo giá
                  </button>
                  <button
                    className="chip-button"
                    type="button"
                    onClick={() => {
                      addQuickReply("Gặp nhân viên");
                      startCallback();
                    }}
                  >
                    Gặp nhân viên
                  </button>
                </div>

                {state.mode === "search" ? (
                  <section className="chatbot-panel-section">
                    <label className="chatbot-search">
                      <Search size={18} />
                      <input
                        value={state.searchQuery}
                        onChange={(event) => {
                          persist({ searchQuery: event.target.value });
                        }}
                        placeholder="Nhập ngành hàng hoặc nhu cầu..."
                      />
                    </label>

                    {searchResults.length ? (
                      <div className="chatbot-results">
                        {searchResults.map((category) => (
                          <article className="chatbot-result" key={category.slug}>
                            <strong>{category.title}</strong>
                            <p>{category.description}</p>
                            <div className="chatbot-result-actions">
                              <Link className="button button-ghost" href={`/san-pham?category=${category.slug}`}>
                                Xem ngành hàng
                              </Link>
                              <QuoteButton
                                className="button button-primary"
                                seed={{ product: category.title, usage: category.title, source: "chatbot", pathname }}
                              >
                                Nhận báo giá
                              </QuoteButton>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="chatbot-empty">Danh mục đang được cập nhật. Vui lòng gửi nhu cầu để nhận tư vấn.</p>
                    )}
                  </section>
                ) : null}

                {state.mode === "quote" || state.mode === "callback" ? (
                  <section className="chatbot-panel-section chatbot-form-panel">
                    <div className="form-grid chatbot-form-grid">
                      <label className="field">
                        <span>Nhu cầu / sản phẩm *</span>
                        <input
                          value={state.draft.product}
                          onChange={(event) => updateDraft("product", event.target.value)}
                          placeholder="Tên ngành hàng hoặc nhu cầu"
                        />
                      </label>
                      <label className="field">
                        <span>Số lượng</span>
                        <input
                          value={state.draft.quantity}
                          onChange={(event) => updateDraft("quantity", event.target.value)}
                          placeholder="Ví dụ: 2 tấn"
                        />
                      </label>
                      <label className="field">
                        <span>Khu vực</span>
                        <input
                          value={state.draft.area}
                          onChange={(event) => updateDraft("area", event.target.value)}
                          placeholder="TP.HCM..."
                        />
                      </label>
                      <label className="field">
                        <span>Họ tên *</span>
                        <input
                          value={state.draft.name}
                          onChange={(event) => updateDraft("name", event.target.value)}
                          placeholder="Họ tên liên hệ"
                        />
                      </label>
                      <label className="field">
                        <span>Số điện thoại *</span>
                        <input
                          value={state.draft.phone}
                          onChange={(event) => updateDraft("phone", event.target.value)}
                          placeholder="0912345678"
                          inputMode="tel"
                        />
                      </label>
                      <label className="field">
                        <span>Công ty</span>
                        <input
                          value={state.draft.company}
                          onChange={(event) => updateDraft("company", event.target.value)}
                          placeholder="Không bắt buộc"
                        />
                      </label>
                      <label className="field field-wide">
                        <span>Nội dung cần hỗ trợ</span>
                        <textarea
                          value={state.draft.note}
                          onChange={(event) => updateDraft("note", event.target.value)}
                          rows={3}
                          placeholder="Mô tả thêm yêu cầu"
                        />
                      </label>
                    </div>

                    <div className="chatbot-summary">
                      <strong>Xác nhận trước khi gửi</strong>
                      <p>
                        {state.draft.name || "Chưa có tên"} · {state.draft.phone || "Chưa có số"}
                      </p>
                      <p>
                        {state.draft.product || "Chưa có nhu cầu"} · {state.draft.quantity || "Chưa có số lượng"} ·{" "}
                        {state.draft.area || "Chưa có khu vực"}
                      </p>
                    </div>

                    <div className="chatbot-result-actions">
                      {state.mode === "quote" ? (
                        <button
                          className="button button-primary"
                          type="button"
                          onClick={() => {
                            if (!state.draft.product) {
                              toast.error("Anh nhập nhu cầu hoặc ngành hàng trước nhé.");
                              return;
                            }
                            addQuickReply("Mở form báo giá đã điền sẵn");
                            openQuoteFromChat(state.draft.product);
                          }}
                        >
                          Mở form báo giá
                        </button>
                      ) : null}
                      <button
                        className="button button-secondary"
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          addQuickReply("Yêu cầu nhân viên gọi lại");
                          sendCallback();
                        }}
                      >
                        {busy ? "Đang gửi..." : "Yêu cầu nhân viên gọi lại"}
                      </button>
                    </div>
                  </section>
                ) : null}

                <div className="chatbot-footer-note">
                  <MessageSquareMore size={16} />
                  <span>Em chỉ gửi khi anh xác nhận thông tin hoặc bấm gọi lại.</span>
                </div>
              </div>
            ) : null}
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
