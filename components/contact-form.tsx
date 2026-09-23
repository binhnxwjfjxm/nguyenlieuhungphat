"use client";

import { Check, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PRIVACY_POLICY_PATH } from "@/lib/contact";
import { DEFAULT_SITE_URL } from "@/lib/site";
import {
  type ContactRequestInput,
  sanitizeText,
  validateContactInput,
} from "@/lib/validation";
import { useToast } from "./toast-provider";

type ContactState = {
  name: string;
  phone: string;
  company: string;
  email: string;
  note: string;
  honeypot: string;
};

const EMPTY: ContactState = {
  name: "",
  phone: "",
  company: "",
  email: "",
  note: "",
  honeypot: "",
};

export function ContactForm() {
  const pathname = usePathname();
  const toast = useToast();
  const [form, setForm] = useState<ContactState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactState, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  function update<K extends keyof ContactState>(key: K, value: ContactState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const payload: ContactRequestInput = {
      name: sanitizeText(form.name, 80),
      phone: sanitizeText(form.phone, 40),
      company: sanitizeText(form.company, 120),
      email: sanitizeText(form.email, 160),
      note: sanitizeText(form.note, 1000),
      source: "company-contact-form",
      pathname,
      website: process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL,
      honeypot: sanitizeText(form.honeypot, 40),
    };

    const validated = validateContactInput(payload);
    if (!validated.ok) {
      setErrors(validated.fieldErrors ?? {});
      setStatus("error");
      toast.error("Thông tin liên hệ chưa hợp lệ.");
      return;
    }

    setStatus("submitting");
    setErrors({});

    try {
      const response = await fetch("/api/telegram/contact", {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify(validated.data),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        code?: string;
        retryAfter?: number;
        fieldErrors?: Partial<Record<keyof ContactState, string>>;
      };

      if (!response.ok || !result.ok) {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        const message =
          result.code === "RATE_LIMITED" && result.retryAfter
            ? `Đã gửi quá nhanh. Vui lòng thử lại sau ${result.retryAfter}s.`
            : "Chưa thể gửi thông tin liên hệ lúc này.";
        setStatus("error");
        toast.error(message);
        return;
      }

      setForm(EMPTY);
      setStatus("success");
      toast.success("Hưng Phát đã nhận thông tin liên hệ.");
    } catch {
      setStatus("error");
      toast.error("Kết nối chưa ổn định. Vui lòng thử lại.");
    }
  }

  return (
    <form className="contact-form-v2" onSubmit={handleSubmit}>
      {status === "success" ? (
        <div className="contact-form-status is-success" aria-live="polite">
          <Check size={17} /> Hưng Phát đã nhận thông tin liên hệ.
        </div>
      ) : null}

      <div className="form-grid">
        <label className="field">
          <span>Họ tên *</span>
          <input
            autoComplete="name"
            required
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="Nguyễn Văn A"
          />
          {errors.name ? <em>{errors.name}</em> : null}
        </label>

        <label className="field">
          <span>Số điện thoại *</span>
          <input
            autoComplete="tel"
            inputMode="tel"
            required
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
            placeholder="0912345678"
          />
          {errors.phone ? <em>{errors.phone}</em> : null}
        </label>

        <label className="field field-wide">
          <span>Công Ty / cửa hàng</span>
          <input
            autoComplete="organization"
            value={form.company}
            onChange={(event) => update("company", event.target.value)}
            placeholder="Tên đơn vị"
          />
          {errors.company ? <em>{errors.company}</em> : null}
        </label>

        <label className="field field-wide">
          <span>Email</span>
          <input
            autoComplete="email"
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            placeholder="email@congty.com"
          />
          {errors.email ? <em>{errors.email}</em> : null}
        </label>

        <label className="field field-wide">
          <span>Nội dung liên hệ *</span>
          <textarea
            required
            rows={5}
            value={form.note}
            onChange={(event) => update("note", event.target.value)}
            placeholder="Anh/chị muốn trao đổi nội dung gì với Hưng Phát?"
          />
          {errors.note ? <em>{errors.note}</em> : null}
        </label>

        <label className="contact-honeypot" aria-hidden="true">
          <span>Website</span>
          <input
            tabIndex={-1}
            autoComplete="off"
            value={form.honeypot}
            onChange={(event) => update("honeypot", event.target.value)}
          />
        </label>
      </div>

      <p className="form-privacy-note">
        Hưng Phát sử dụng thông tin đã cung cấp để phản hồi nội dung liên hệ theo{" "}
        <Link href={PRIVACY_POLICY_PATH}>Chính sách bảo mật</Link>.
      </p>

      <div className="form-actions">
        <button className="button button-primary" type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? <LoaderCircle className="spinner" size={17} /> : null}
          {status === "submitting" ? "Đang gửi..." : "Gửi thông tin"}
        </button>
      </div>
    </form>
  );
}
