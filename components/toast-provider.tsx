"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastTone = "success" | "error" | "info";

type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
};

type Toast = ToastInput & {
  id: number;
  tone: ToastTone;
};

type ToastContextValue = {
  pushToast: (toast: ToastInput) => void;
  success: (description: string, title?: string) => void;
  error: (description: string, title?: string) => void;
  info: (description: string, title?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function getToneIcon(tone: ToastTone) {
  if (tone === "success") return CheckCircle2;
  if (tone === "error") return AlertCircle;
  return Info;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((toast: ToastInput) => {
    const id = ++counter.current;
    const nextToast: Toast = {
      id,
      tone: toast.tone ?? "info",
      title: toast.title,
      description: toast.description,
    };

    setToasts((current) => [...current, nextToast]);
    window.setTimeout(() => dismiss(id), 4200);
  }, [dismiss]);

  const value = useMemo<ToastContextValue>(
    () => ({
      pushToast,
      success: (description, title = "Thành công") => pushToast({ tone: "success", title, description }),
      error: (description, title = "Có lỗi") => pushToast({ tone: "error", title, description }),
      info: (description, title = "Thông báo") => pushToast({ tone: "info", title, description }),
    }),
    [pushToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => {
          const Icon = getToneIcon(toast.tone);
          return (
            <div className={`toast toast-${toast.tone}`} key={toast.id} role={toast.tone === "error" ? "alert" : "status"}>
              <span className="toast-icon">
                <Icon size={18} />
              </span>
              <div className="toast-copy">
                <strong>{toast.title}</strong>
                {toast.description ? <p>{toast.description}</p> : null}
              </div>
              <button className="toast-close" type="button" aria-label="Đóng thông báo" onClick={() => dismiss(toast.id)}>
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
