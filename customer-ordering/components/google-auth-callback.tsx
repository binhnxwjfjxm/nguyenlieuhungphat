"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCustomerAuth } from "@/components/clerk-auth-provider";
import { clerkErrorMessage } from "@/lib/auth/clerk-browser";

export function GoogleAuthCallback() {
  const { clerk, status, error: providerError } = useCustomerAuth();
  const started = useRef(false);
  const [callbackError, setCallbackError] = useState("");

  useEffect(() => {
    if (!clerk || started.current) return;
    started.current = true;

    void clerk
      .handleRedirectCallback({
        redirectUrl: "/login",
        redirectUrlComplete: "/",
        continueSignUpUrl: "/login",
      })
      .catch((error: unknown) => {
        setCallbackError(clerkErrorMessage(error));
      });
  }, [clerk]);

  const error = callbackError || (status === "error" ? providerError ?? "Không thể hoàn tất đăng nhập." : "");

  return (
    <main className="auth-state-page">
      <span className="auth-state-icon">
        <ShieldCheck aria-hidden="true" size={30} />
      </span>
      {error ? (
        <>
          <strong>Không thể hoàn tất đăng nhập</strong>
          <small role="alert">{error}</small>
          <Link className="primary-button auth-return-button" href="/login">
            Quay lại đăng nhập
          </Link>
        </>
      ) : (
        <>
          <strong>Đang hoàn tất đăng nhập...</strong>
          <small>Vui lòng chờ trong giây lát.</small>
        </>
      )}
      <div
        className="clerk-captcha-slot"
        data-cl-language="vi-VN"
        data-cl-size="flexible"
        data-cl-theme="light"
        id="clerk-captcha"
      />
    </main>
  );
}
