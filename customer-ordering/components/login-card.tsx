"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCustomerAuth } from "@/components/clerk-auth-provider";
import { CustomerLogo } from "@/components/customer-logo";
import { customerSignInAppearance } from "@/lib/auth/clerk-appearance";

type AuthMode = "sign-in" | "sign-up";

export function LoginCard() {
  const router = useRouter();
  const { status, clerk, error: providerError } = useCustomerAuth();
  const authHostRef = useRef<HTMLDivElement>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("sign-in");

  useEffect(() => {
    if (status === "signed-in") router.replace("/");
  }, [router, status]);

  useEffect(() => {
    const node = authHostRef.current;
    if (!node || !clerk || status !== "signed-out") return;

    if (authMode === "sign-up") {
      clerk.mountSignUp(node, {
        routing: "hash",
        oauthFlow: "redirect",
        forceRedirectUrl: "/",
        fallbackRedirectUrl: "/",
        signInForceRedirectUrl: "/",
        signInFallbackRedirectUrl: "/",
        appearance: customerSignInAppearance,
      });
      return () => clerk.unmountSignUp(node);
    }

    clerk.mountSignIn(node, {
      routing: "hash",
      withSignUp: false,
      oauthFlow: "redirect",
      forceRedirectUrl: "/",
      fallbackRedirectUrl: "/",
      signUpForceRedirectUrl: "/",
      signUpFallbackRedirectUrl: "/",
      appearance: customerSignInAppearance,
    });

    return () => clerk.unmountSignIn(node);
  }, [authMode, clerk, status]);

  const unavailableMessage = useMemo(() => {
    if (status === "unconfigured") return "Dịch vụ đăng nhập chưa được cấu hình.";
    if (status === "error") return providerError ?? "Không tải được dịch vụ đăng nhập.";
    return null;
  }, [providerError, status]);

  return (
    <main className="login-page">
      <section className="login-card login-card-with-clerk">
        <CustomerLogo className="login-logo login-logo-compact" height={96} priority width={204} />

        <div className="login-heading login-heading-compact">
          <h1>{authMode === "sign-in" ? "Đăng nhập" : "Đăng ký tài khoản"}</h1>
          <p>
            {authMode === "sign-in"
              ? "Dùng Google, email hoặc tên đăng nhập để tiếp tục đặt hàng."
              : "Tạo tài khoản khách hàng Hưng Phát bằng phương thức bạn đã chọn."}
          </p>
        </div>

        {!unavailableMessage ? (
          <div className="auth-mode-tabs" role="tablist" aria-label="Đăng nhập hoặc đăng ký">
            <button
              aria-selected={authMode === "sign-in"}
              className={authMode === "sign-in" ? "is-active" : undefined}
              onClick={() => setAuthMode("sign-in")}
              role="tab"
              type="button"
            >
              Đăng nhập
            </button>
            <button
              aria-selected={authMode === "sign-up"}
              className={authMode === "sign-up" ? "is-active" : undefined}
              onClick={() => setAuthMode("sign-up")}
              role="tab"
              type="button"
            >
              Đăng ký
            </button>
          </div>
        ) : null}

        {unavailableMessage ? (
          <div className="auth-config-warning" role="alert">
            <ShieldCheck aria-hidden="true" size={22} />
            <span>{unavailableMessage}</span>
          </div>
        ) : (
          <>
            {status === "loading" ? (
              <div className="auth-embed-loading" aria-live="polite">
                Đang tải phương thức xác thực…
              </div>
            ) : null}
            <div className="clerk-auth-host" ref={authHostRef} />
            <div className="auth-privacy-note">
              <ShieldCheck aria-hidden="true" size={17} />
              <span>Google và mật khẩu do hệ thống xác thực bảo vệ; Hưng Phát không lưu mật khẩu của bạn.</span>
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
