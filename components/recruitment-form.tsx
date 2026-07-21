"use client";

import { Check, LoaderCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { useToast } from "./toast-provider";
import { DEFAULT_SITE_URL } from "@/lib/site";
import {
  type FieldErrors,
  recruitmentPositionOptions,
  type RecruitmentRequestInput,
  sanitizeText,
  validateRecruitmentInput,
} from "@/lib/validation";

type RecruitmentFormProps = {
  inline?: boolean;
  initialValues?: Partial<RecruitmentRequestInput>;
  onClose?: () => void;
  onSuccess?: (applicationId: string) => void;
};

type FormState = RecruitmentRequestInput;

const EMPTY_FORM: RecruitmentRequestInput = {
  name: "",
  phone: "",
  email: "",
  position: "",
  experience: "",
  cvLink: "",
  note: "",
  source: "recruitment-form",
  pathname: "/",
  website: process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL,
  honeypot: "",
};

function fieldValue(value: string | undefined, fallback: string) {
  return sanitizeText(value ?? fallback, 500);
}

export function RecruitmentForm({ inline = false, initialValues, onClose, onSuccess }: RecruitmentFormProps) {
  const pathname = usePathname();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState<FormState>(() => ({
    ...EMPTY_FORM,
    pathname,
    ...initialValues,
    source: initialValues?.source ?? "recruitment-form",
    website: initialValues?.website ?? EMPTY_FORM.website,
  }));
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState("");
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
      email: fieldValue(form.email, ""),
      position: fieldValue(form.position, ""),
      experience: fieldValue(form.experience, ""),
      cvLink: fieldValue(form.cvLink, ""),
      note: fieldValue(form.note, ""),
      source: fieldValue(form.source, "recruitment-form"),
      pathname: fieldValue(form.pathname, pathname),
      website: fieldValue(form.website, EMPTY_FORM.website),
      honeypot: fieldValue(form.honeypot, ""),
    };

    const validated = validateRecruitmentInput(normalized);
    if (!validated.ok) {
      setErrors(validated.fieldErrors ?? {});
      setStatus({ tone: "error", text: validated.error });
      toast.error(validated.error);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setStatus({ tone: "info", text: "Đang gửi hồ sơ..." });

    try {
      const formData = new FormData();
      Object.entries(validated.data).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      if (cvFile) {
        formData.append("cvFile", cvFile, cvFile.name);
      }

      const response = await fetch("/api/telegram/recruitment", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        ok: boolean;
        applicationId?: string;
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
            : payload.error ?? "Không thể gửi hồ sơ.";
        setStatus({ tone: "error", text: message });
        toast.error(message);
        return;
      }

      const nextApplicationId = payload.applicationId ?? "";
      setApplicationId(nextApplicationId);
      setStatus({ tone: "success", text: `Hồ sơ đã gửi. Mã ${nextApplicationId}.` });
      toast.success(`Hồ sơ đã gửi. Mã ${nextApplicationId}.`);
      onSuccess?.(nextApplicationId);
      setForm({
        ...EMPTY_FORM,
        position: validated.data.position,
        source: validated.data.source,
        pathname: validated.data.pathname,
        website: validated.data.website,
      });
      setCvFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
      {applicationId ? (
        <div className="success-banner" aria-live="polite">
          <Check size={18} />
          <div>
            <strong>Đã nhận hồ sơ</strong>
            <p>
              Mã hồ sơ: <code>{applicationId}</code>
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
        <label className="field">
          <span>Email</span>
          <input autoComplete="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="email@congty.com" type="email" />
          {errors.email ? <em>{errors.email}</em> : null}
        </label>
        <label className="field">
          <span>Vị trí ứng tuyển *</span>
          <select required value={form.position} onChange={(event) => updateField("position", event.target.value)}>
            <option value="">Chọn vị trí</option>
            {recruitmentPositionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.position ? <em>{errors.position}</em> : null}
        </label>
        <label className="field field-wide">
          <span>Kinh nghiệm / điểm mạnh *</span>
          <textarea
            required
            value={form.experience}
            onChange={(event) => updateField("experience", event.target.value)}
            placeholder="Ví dụ: từng làm sales B2B, điều phối kho, quản trị nội dung web..."
            rows={inline ? 4 : 5}
          />
          {errors.experience ? <em>{errors.experience}</em> : null}
        </label>
        <label className="field field-wide">
          <span>Link CV / portfolio</span>
          <input value={form.cvLink} onChange={(event) => updateField("cvLink", event.target.value)} placeholder="Dán link Drive, Notion, LinkedIn..." />
          {errors.cvLink ? <em>{errors.cvLink}</em> : null}
        </label>
        <label className="field field-wide">
          <span>Đính kèm CV</span>
          <input
            ref={fileInputRef}
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            type="file"
            onChange={(event) => setCvFile(event.target.files?.[0] ?? null)}
          />
          <small>{cvFile ? `Đã chọn: ${cvFile.name}` : "PDF, DOC, DOCX, PNG hoặc JPG. Tối đa 10MB."}</small>
        </label>
        <label className="field field-wide">
          <span>Ghi chú</span>
          <textarea value={form.note} onChange={(event) => updateField("note", event.target.value)} placeholder="Ghi thêm mong muốn, mức lương hoặc thời gian bắt đầu..." rows={inline ? 4 : 5} />
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
          {isSubmitting ? "Đang gửi..." : "Gửi hồ sơ"}
        </button>
      </div>
    </form>
  );
}
