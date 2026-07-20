"use client";

import { useState, type FormEvent } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useToast } from "./toast-provider";
import { DEFAULT_SITE_URL } from "@/lib/site";
import {
  type FieldErrors,
  quoteDeliveryAreaOptions,
  quoteNeedOptions,
  type QuoteRequestInput,
  sanitizeText,
  validateQuoteInput,
} from "@/lib/validation";

type QuoteFormProps = {
  inline?: boolean;
  initialValues?: Partial<QuoteRequestInput>;
  onClose?: () => void;
  onSuccess?: (leadId: string) => void;
};

type FormState = QuoteRequestInput;

const EMPTY_FORM: QuoteRequestInput = {
  name: "",
  phone: "",
  company: "",
  email: "",
  product: "",
  quantity: "",
  area: "",
  usage: "",
  note: "",
  source: "quote-form",
  pathname: "/",
  website: process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL,
  honeypot: "",
};

function fieldValue(value: string | undefined, fallback: string) {
  return sanitizeText(value ?? fallback, 500);
}

export function QuoteForm({ inline = false, initialValues, onClose, onSuccess }: QuoteFormProps) {
  const pathname = usePathname();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(() => ({
        ...EMPTY_FORM,
        pathname,
        ...initialValues,
        source: initialValues?.source ?? "quote-form",
        website: initialValues?.website ?? EMPTY_FORM.website,
  }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadId, setLeadId] = useState("");
  const [status, setStatus] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
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
    if (isSubmitting) return;

    const normalized = {
      ...form,
      name: fieldValue(form.name, ""),
      phone: fieldValue(form.phone, ""),
      company: fieldValue(form.company, ""),
      email: fieldValue(form.email, ""),
      product: fieldValue(form.product, ""),
      quantity: fieldValue(form.quantity, ""),
      area: fieldValue(form.area, ""),
      usage: fieldValue(form.usage, ""),
      note: fieldValue(form.note, ""),
      source: fieldValue(form.source, "quote-form"),
      pathname: fieldValue(form.pathname, pathname),
      website: fieldValue(form.website, EMPTY_FORM.website),
      honeypot: fieldValue(form.honeypot, ""),
    };

    const validated = validateQuoteInput(normalized);
    if (!validated.ok) {
      setErrors(validated.fieldErrors ?? {});
      setStatus({ tone: "error", text: validated.error });
      toast.error(validated.error);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setStatus({ tone: "info", text: "Đang gửi..." });

    try {
      const response = await fetch("/api/telegram/quote", {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify(validated.data),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        leadId?: string;
        error?: string;
        code?: string;
        retryAfter?: number;
        fieldErrors?: Record<string, string>;
      };

      if (!response.ok || !payload.ok) {
        if (payload.fieldErrors) {
          setErrors(payload.fieldErrors);
        }
        const message =
          payload.code === "RATE_LIMITED" && payload.retryAfter
            ? `${payload.error ?? "Bị giới hạn gửi."} Thử lại sau ${payload.retryAfter}s.`
            : payload.error ?? "Không thể gửi báo giá.";
        setStatus({ tone: "error", text: message });
        toast.error(message);
        return;
      }

      const nextLeadId = payload.leadId ?? "";
      setLeadId(nextLeadId);
      setStatus({ tone: "success", text: `Báo giá đã gửi. Mã lead ${nextLeadId}.` });
      toast.success(`Báo giá đã gửi. Mã lead ${nextLeadId}.`);
      onSuccess?.(nextLeadId);
      setForm({
        ...EMPTY_FORM,
        usage: validated.data.usage,
        area: validated.data.area,
        source: validated.data.source,
        pathname: validated.data.pathname,
        website: validated.data.website,
      });
    } catch {
      const message = "Lỗi mạng hoặc máy chủ bận. Anh thử lại giúp em.";
      setStatus({ tone: "error", text: message });
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={`quote-form${inline ? " quote-form-inline" : ""}`} onSubmit={handleSubmit}>
      {status ? (
        <div className={`quote-form-status quote-form-status-${status.tone}`} aria-live="polite">
          {status.text}
        </div>
      ) : null}
      {leadId ? (
        <div className="success-banner" aria-live="polite">
          <Check size={18} />
          <div>
            <strong>Đã nhận yêu cầu</strong>
            <p>
              Mã lead: <code>{leadId}</code>
            </p>
          </div>
        </div>
      ) : null}

      <div className="form-grid">
        <label className="field">
          <span>Họ tên *</span>
          <input autoComplete="name" required value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Nguyễn Văn A" />
          {errors.name ? <em>{errors.name}</em> : null}
        </label>
        <label className="field">
          <span>Số điện thoại *</span>
          <input autoComplete="tel" inputMode="tel" required value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="0912345678" />
          {errors.phone ? <em>{errors.phone}</em> : null}
        </label>
        <label className="field field-wide">
          <span>Công ty / cửa hàng</span>
          <input autoComplete="organization" value={form.company} onChange={(event) => updateField("company", event.target.value)} placeholder="Tên công ty hoặc cửa hàng" />
          {errors.company ? <em>{errors.company}</em> : null}
        </label>
        <label className="field">
          <span>Email</span>
          <input autoComplete="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="email@congty.com" type="email" />
          {errors.email ? <em>{errors.email}</em> : null}
        </label>
        <label className="field">
          <span>Nhu cầu chính *</span>
          <select required value={form.usage} onChange={(event) => updateField("usage", event.target.value)}>
            <option value="">Chọn nhu cầu</option>
            {quoteNeedOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.usage ? <em>{errors.usage}</em> : null}
        </label>
        <label className="field field-wide">
          <span>Sản phẩm cần tìm / nhu cầu cụ thể</span>
          <textarea
            value={form.product}
            onChange={(event) => updateField("product", event.target.value)}
            placeholder="Ví dụ: trân châu, syrup, gói sốt mì cay, bao bì, hàng đông lạnh... hoặc mô tả nhu cầu cụ thể"
            rows={inline ? 4 : 5}
          />
          {errors.product ? <em>{errors.product}</em> : null}
        </label>
        <label className="field">
          <span>Số lượng dự kiến</span>
          <input value={form.quantity} onChange={(event) => updateField("quantity", event.target.value)} placeholder="Ví dụ: 2 thùng, 50kg, 1 pallet..." />
          {errors.quantity ? <em>{errors.quantity}</em> : null}
        </label>
        <label className="field">
          <span>Khu vực giao hàng *</span>
          <select required value={form.area} onChange={(event) => updateField("area", event.target.value)}>
            <option value="">Chọn khu vực</option>
            {quoteDeliveryAreaOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.area ? <em>{errors.area}</em> : null}
        </label>
        <label className="field field-wide">
          <span>Ghi chú</span>
          <textarea value={form.note} onChange={(event) => updateField("note", event.target.value)} placeholder="Ghi rõ thông tin thêm nếu có" rows={inline ? 4 : 5} />
          {errors.note ? <em>{errors.note}</em> : null}
        </label>
      </div>

      <input
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
        className="honeypot"
        value={form.honeypot}
        onChange={(event) => updateField("honeypot", event.target.value)}
      />

      <input type="hidden" value={form.source} readOnly />
      <input type="hidden" value={form.pathname} readOnly />
      <input type="hidden" value={form.website} readOnly />

      <div className="form-actions">
        {onClose ? (
          <button className="button button-ghost" type="button" onClick={onClose}>
            Đóng
          </button>
        ) : null}
        <button className="button button-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <LoaderCircle className="spinner" size={18} /> : null}
          {isSubmitting ? "Đang gửi..." : "Gửi báo giá"}
        </button>
      </div>
    </form>
  );
}
