"use client";

import Image from "next/image";
import { ArrowLeft, Phone, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useCustomerAuth } from "@/components/clerk-auth-provider";
import {
  clerkErrorCode,
  clerkErrorMessage,
  normalizeVietnamPhone,
} from "@/lib/auth/clerk-browser";

type VerificationMode = "sign-in" | "sign-up";

function friendlyError(error: unknown): string {
  const code = clerkErrorCode(error);
  if (code === "form_code_incorrect") return "Mã xác minh không đúng hoặc đã hết hạn.";
  if (code === "form_identifier_exists") return "Số điện thoại này đã có tài khoản. Vui lòng thử lại.";
  if (code === "captcha_invalid") return "Xác minh bảo mật chưa hoàn tất. Vui lòng thử lại.";
  if (code === "feature_not_enabled") return "Đăng nhập bằng số điện thoại chưa được bật.";
  return clerkErrorMessage(error);
}

export function LoginCard() {
  const router = useRouter();
  const { status, clerk, error: providerError } = useCustomerAuth();
  const [phone, setPhone] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<VerificationMode>("sign-in");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "signed-in") router.replace("/");
  }, [router, status]);

  const unavailableMessage = useMemo(() => {
    if (status === "unconfigured") return "Dịch vụ đăng nhập chưa được cấu hình.";
    if (status === "error") return providerError ?? "Không tải được dịch vụ đăng nhập.";
    return null;
  }, [providerError, status]);

  async function startSignIn(phoneNumber: string) {
    if (!clerk) throw new Error("Dịch vụ đăng nhập chưa sẵn sàng.");

    try {
      const attempt = await clerk.client.signIn.create({ identifier: phoneNumber });
      const factor = attempt.supportedFirstFactors?.find(
        (item) => item.strategy === "phone_code" && item.phoneNumberId,
      );
      if (!factor?.phoneNumberId) {
        throw new Error("Tài khoản này chưa bật xác minh bằng số điện thoại.");
      }
      await clerk.client.signIn.prepareFirstFactor({
        strategy: "phone_code",
        phoneNumberId: factor.phoneNumberId,
      });
      setMode("sign-in");
    } catch (signInError) {
      if (clerkErrorCode(signInError) !== "form_identifier_not_found") throw signInError;
      await clerk.client.signUp.create({ phoneNumber });
      await clerk.client.signUp.preparePhoneNumberVerification({ strategy: "phone_code" });
      setMode("sign-up");
    }
  }

  async function handlePhoneSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const phoneNumber = normalizeVietnamPhone(phone);
      await startSignIn(phoneNumber);
      setNormalizedPhone(phoneNumber);
      setStep("code");
    } catch (requestError) {
      setError(friendlyError(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clerk) return;
    setError("");
    setSubmitting(true);

    try {
      const attempt =
        mode === "sign-in"
          ? await clerk.client.signIn.attemptFirstFactor({ strategy: "phone_code", code })
          : await clerk.client.signUp.attemptPhoneNumberVerification({ code });

      if (attempt.status !== "complete" || !attempt.createdSessionId) {
        throw new Error("Tài khoản cần thêm bước xác minh trước khi có thể đăng nhập.");
      }

      await clerk.setActive({ session: attempt.createdSessionId });
      router.replace("/");
      router.refresh();
    } catch (verifyError) {
      setError(friendlyError(verifyError));
    } finally {
      setSubmitting(false);
    }
  }

  async function resendCode() {
    if (!clerk) return;
    setError("");
    setSubmitting(true);
    try {
      if (mode === "sign-in") {
        const factor = clerk.client.signIn.supportedFirstFactors?.find(
          (item) => item.strategy === "phone_code" && item.phoneNumberId,
        );
        if (!factor?.phoneNumberId) throw new Error("Không tìm thấy số điện thoại để gửi lại mã.");
        await clerk.client.signIn.prepareFirstFactor({
          strategy: "phone_code",
          phoneNumberId: factor.phoneNumberId,
        });
      } else {
        await clerk.client.signUp.preparePhoneNumberVerification({ strategy: "phone_code" });
      }
    } catch (resendError) {
      setError(friendlyError(resendError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <Image
          alt="Logo Công ty Hưng Phát"
          className="login-logo"
          height={108}
          priority
          src="/logo-transparent.png"
          width={230}
        />

        <div className="login-heading">
          <h1>{step === "phone" ? "Đăng nhập" : "Xác minh số điện thoại"}</h1>
          <p>
            {step === "phone"
              ? "Khách cũ và khách mới đều dùng một số điện thoại."
              : `Mã xác minh đã được gửi tới ${normalizedPhone}.`}
          </p>
        </div>

        {unavailableMessage ? (
          <div className="auth-config-warning" role="alert">
            <ShieldCheck aria-hidden="true" size={22} />
            <span>{unavailableMessage}</span>
          </div>
        ) : step === "phone" ? (
          <form className="login-form" onSubmit={handlePhoneSubmit}>
            <label>
              <span>Số điện thoại</span>
              <div className="input-with-icon">
                <Phone aria-hidden="true" size={18} />
                <input
                  autoComplete="tel"
                  inputMode="tel"
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Ví dụ: 0901 234 567"
                  required
                  value={phone}
                />
              </div>
            </label>
            <p className="auth-helper">
              Nếu chưa có tài khoản, hệ thống sẽ tạo tài khoản khách vãng lai sau khi xác minh.
            </p>
            <div
              className="clerk-captcha-slot"
              data-cl-language="vi-VN"
              data-cl-size="flexible"
              data-cl-theme="light"
              id="clerk-captcha"
            />
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <button
              className="primary-button"
              disabled={submitting || status !== "signed-out"}
              type="submit"
            >
              {submitting ? "Đang gửi mã..." : "Nhận mã xác minh"}
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleCodeSubmit}>
            <label>
              <span>Mã xác minh</span>
              <div className="input-with-icon otp-input">
                <ShieldCheck aria-hidden="true" size={18} />
                <input
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                  placeholder="Nhập 6 chữ số"
                  required
                  value={code}
                />
              </div>
            </label>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <button className="primary-button" disabled={submitting || code.length < 6} type="submit">
              {submitting ? "Đang xác minh..." : "Xác nhận"}
            </button>
            <div className="auth-secondary-actions">
              <button
                className="text-button"
                onClick={() => {
                  setCode("");
                  setError("");
                  setStep("phone");
                }}
                type="button"
              >
                <ArrowLeft aria-hidden="true" size={16} />
                Đổi số điện thoại
              </button>
              <button className="text-button" disabled={submitting} onClick={resendCode} type="button">
                Gửi lại mã
              </button>
            </div>
          </form>
        )}

        <p className="contact-note">
          Cần hỗ trợ liên kết khách hàng? <a href="tel:0900000000">Liên hệ Hưng Phát</a>
        </p>
      </section>
    </main>
  );
}
