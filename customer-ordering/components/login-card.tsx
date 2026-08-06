"use client";

import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { useCustomerAuth } from "@/components/clerk-auth-provider";
import { customerSignInAppearance } from "@/lib/auth/clerk-appearance";

export function LoginCard() {
  const router = useRouter();
  const { status, clerk, error: providerError } = useCustomerAuth();
  const signInHostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "signed-in") router.replace("/");
  }, [router, status]);

  useEffect(() => {
    const node = signInHostRef.current;
    if (!node || !clerk || status !== "signed-out") return;

    clerk.mountSignIn(node, {
      routing: "hash",
      withSignUp: true,
      oauthFlow: "redirect",
      forceRedirectUrl: "/",
      fallbackRedirectUrl: "/",
      signUpForceRedirectUrl: "/",
      signUpFallbackRedirectUrl: "/",
      appearance: customerSignInAppearance,
    });

    return () => clerk.unmountSignIn(node);
  }, [clerk, status]);

  const unavailableMessage = useMemo(() => {
    if (status === "unconfigured") return "Dịch vụ đăng nhập chưa được cấu hình.";
    if (status === "error") return providerError ?? "Không tải được dịch vụ đăng nhập.";
    return null;
  }, [providerError, status]);

  return (
    <main className="login-page">
      <section className="login-card login-card-with-clerk">
        <Image
          alt="Logo Công ty Hưng Phát"
          className="login-logo login-logo-compact"
          height={96}
          priority
          src="/logo-transparent.png"
          width={204}
        />

        <div className="login-heading login-heading-compact">
          <h1>Đăng nhập hoặc đăng ký</h1>
          <p>Dùng Google, email hoặc tên đăng nhập để tiếp tục đặt hàng.</p>
        </div>

        {unavailableMessage ? (
          <div className="auth-config-warning" role="alert">
            <ShieldCheck aria-hidden="true" size={22} />
            <span>{unavailableMessage}</span>
          </div>
        ) : (
          <>
            {status === "loading" ? (
              <div className="auth-embed-loading" aria-live="polite">
                Đang tải phương thức đăng nhập…
              </div>
            ) : null}
            <div className="clerk-sign-in-host" ref={signInHostRef} />
            <div className="auth-privacy-note">
              <ShieldCheck aria-hidden="true" size={17} />
              <span>
                Google và mật khẩu do hệ thống xác thực bảo vệ; Hưng Phát không lưu mật khẩu của bạn.
              </span>
            </div>
          </>
        )}

        <p className="contact-note contact-note-soft">
          Cần hỗ trợ liên kết khách hàng? <a href="tel:0900000000">Liên hệ Hưng Phát</a>
        </p>
      </section>
    </main>
  );
}
