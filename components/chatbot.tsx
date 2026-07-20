"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LoaderCircle, MessageSquareMore, Minimize2, RefreshCcw, SendHorizontal, X } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { DEFAULT_SITE_URL } from "@/lib/site";
import { createLeadCode } from "@/lib/validation";
import { useToast } from "./toast-provider";
import chatbotAvatar from "../avatar-chat-bot.jpg";

type Message = {
  id: number;
  role: "assistant" | "user";
  text: string;
};

type ChatState = {
  sessionId: string;
  open: boolean;
  minimized: boolean;
  messages: Message[];
  draft: string;
};

const STORAGE_KEY = "hungphat-chatbot-state";

const DEFAULT_STATE: ChatState = {
  sessionId: "",
  open: false,
  minimized: false,
  messages: [],
  draft: "",
};

function createSessionId() {
  return createLeadCode("CHAT");
}

function vibrate() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(14);
  }
}

function parseStoredState(value: string | null): ChatState {
  if (!value) return { ...DEFAULT_STATE, sessionId: createSessionId() };
  try {
    const parsed = JSON.parse(value) as Partial<ChatState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      sessionId: parsed.sessionId || createSessionId(),
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      draft: parsed.draft ?? "",
    };
  } catch {
    return { ...DEFAULT_STATE, sessionId: createSessionId() };
  }
}

function buildTranscript(messages: Message[], nextText: string) {
  return [...messages, { id: 0, role: "user" as const, text: nextText }]
    .map((message) => `${message.role === "assistant" ? "Trợ lý" : "Khách"}: ${message.text}`)
    .join("\n");
}

export function Chatbot() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const toast = useToast();
  const [state, setState] = useState<ChatState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const nextMessageId = useRef(1);

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
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [state.messages, busy]);

  function updateDraft(value: string) {
    setState((current) => ({ ...current, draft: value }));
  }

  function openChat() {
    vibrate();
    setState((current) => ({
      ...current,
      open: true,
      minimized: false,
    }));
  }

  function resetChat() {
    const fresh: ChatState = {
      ...DEFAULT_STATE,
      open: true,
      sessionId: createSessionId(),
      messages: [],
      draft: "",
    };
    nextMessageId.current = 1;
    setState(fresh);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const text = state.draft.trim();
    if (!text) return;

    const userMessage: Message = {
      id: nextMessageId.current++,
      role: "user",
      text,
    };

    const nextMessages = [...state.messages, userMessage];
    const transcript = buildTranscript(state.messages, text);

    setState((current) => ({
      ...current,
      messages: nextMessages,
      draft: "",
      open: true,
      minimized: false,
    }));
    setBusy(true);

    try {
      const response = await fetch("/api/telegram/chat", {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          sessionId: state.sessionId || createSessionId(),
          name: "",
          phone: "",
          company: "",
          product: "",
          quantity: "",
          area: "",
          transcript,
          requestCallback: false,
          source: "chatbot",
          pathname,
          website: process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL,
          honeypot: "",
        }),
      });

      const result = (await response.json()) as { ok: boolean; sessionId?: string; error?: string; retryAfter?: number };
      if (!response.ok || !result.ok) {
        const errorMessage = result.retryAfter
          ? `${result.error ?? "Không gửi được."} Thử lại sau ${result.retryAfter}s.`
          : result.error ?? "Không gửi được.";
        toast.error(errorMessage);
        setState((current) => ({
          ...current,
          messages: [
            ...current.messages,
            {
              id: nextMessageId.current++,
              role: "assistant",
              text: "Chưa gửi được nội dung. Anh thử lại giúp em nhé.",
            },
          ],
        }));
        return;
      }

      const nextSessionId = result.sessionId ?? state.sessionId ?? createSessionId();
      setState((current) => ({
        ...current,
        sessionId: nextSessionId,
        messages: [
          ...current.messages,
          {
            id: nextMessageId.current++,
            role: "assistant",
            text: "Đã gửi nội dung cho nhân viên phụ trách. Anh chờ em một chút nhé.",
          },
        ],
      }));
      toast.success("Đã chuyển nội dung cho nhân viên phụ trách.");
    } catch {
      toast.error("Lỗi mạng hoặc máy chủ bận.");
      setState((current) => ({
        ...current,
        messages: [
          ...current.messages,
          {
            id: nextMessageId.current++,
            role: "assistant",
            text: "Lỗi mạng hoặc máy chủ bận. Anh gửi lại giúp em nhé.",
          },
        ],
      }));
    } finally {
      setBusy(false);
    }
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
            onClick={openChat}
          >
            <span className="chatbot-launcher-avatar" aria-hidden="true">
              <Image src={chatbotAvatar} alt="" fill sizes="56px" priority />
            </span>
            <span className="chatbot-launcher-badge" aria-hidden="true">
              <MessageSquareMore size={12} />
            </span>
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
                <div className="chatbot-messages" ref={messagesRef}>
                  {state.messages.length ? (
                    state.messages.map((message) => (
                      <div className={`chatbot-message ${message.role}`} key={message.id}>
                        <p>{message.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="chatbot-empty-state">
                      <p>Gõ nội dung cần hỗ trợ bên dưới, em sẽ chuyển cho nhân viên phụ trách.</p>
                    </div>
                  )}
                  {busy ? (
                    <div className="chatbot-message assistant chatbot-message-loading" aria-live="polite">
                      <p>
                        <span className="chatbot-typing" aria-hidden="true">
                          <span />
                          <span />
                          <span />
                        </span>
                      </p>
                    </div>
                  ) : null}
                </div>

                <form className="chatbot-compose" onSubmit={sendMessage}>
                  <label className="field chatbot-compose-field">
                    <span>Nội dung chat</span>
                    <textarea
                      value={state.draft}
                      onChange={(event) => updateDraft(event.target.value)}
                      placeholder="Nhập nội dung cần hỗ trợ..."
                      rows={3}
                    />
                  </label>

                  <div className="chatbot-compose-actions">
                    <small className="chatbot-compose-hint">Nhấn Enter để gửi, Shift+Enter để xuống dòng.</small>
                    <button className="button button-primary" type="submit" disabled={busy || !state.draft.trim()}>
                      {busy ? <LoaderCircle className="spinner" size={18} /> : <SendHorizontal size={18} />}
                      {busy ? "Đang gửi..." : "Gửi"}
                    </button>
                  </div>
                </form>

                <div className="chatbot-footer-note">
                  <MessageSquareMore size={16} />
                  <span>Em chỉ chuyển nội dung anh nhập cho nhân viên phụ trách.</span>
                </div>
              </div>
            ) : null}
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
