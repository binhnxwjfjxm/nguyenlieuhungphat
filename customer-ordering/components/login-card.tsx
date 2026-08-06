"use client";

import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCustomerAuth } from "@/components/clerk-auth-provider";
import { clerkErrorCode, clerkErrorMessage } from "@/lib/auth/clerk-browser";

function friendlyError(error: unknown): string {
  const code = clerkErrorCode(error);
  if (code === "oauth_access_denied") return "Bạn đã hủy đăng nhập bằng Google.";
  if (code === "feature_not_enabled") return "Đăng nhập bằng Google chưa được bật.";
  if (code === "strategy_for_user_invalid") return "Tài khoản này chưa thể đăng nhập bằng Google.";
  return clerkErrorMessage(error);
}

function GoogleMark() {
  return (
    <span aria-hidden="true" className="google-auth-mark">
      G
    </span>
  );
}

export function LoginCard() {
  const router = useRouter();
  const { status, clerk, error: providerError } = useCustomerAuth();
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

  async function handleGoogleSignIn() {
    if (!clerk) return;
    setError("");
    setSubmitting(true);

    try {
      await clerk.client.signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/login/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (signInError) {
      setError(friendlyError(signInError));
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
          <h1>Đăng nhập</h1>
          <p>Dùng tài khoản Google để đăng nhập hoặc tạo tài khoản mới.</p>
        </div>

        {unavailableMessage ? (
          <div className="auth-config-warning" role="alert">
            <ShieldCheck aria-hidden="true" size={22} />
            <span>{unavailableMessage}</span>
          </div>
        ) : (
          <div className="login-form">
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <button
              className="primary-button google-auth-button"
              disabled={submitting || status !== "signed-out"}
              onClick={handleGoogleSignIn}
              type="button"
            >
              <GoogleMark />
              {submitting ? "Đang chuyển đến Google..." : "Tiếp tục với Google"}
            </button>
            <p className="auth-helper auth-helper-centered">
              Lần đầu đăng nhập, hệ thống sẽ tự tạo tài khoản khách vãng lai sau khi Google xác minh.
            </p>
          </div>
        )}

        <p className="contact-note">
          Cần hỗ trợ liên kết khách hàng? <a href="tel:0900000000">Liên hệ Hưng Phát</a>
        </p>
      </section>
    </main>
  );
}
