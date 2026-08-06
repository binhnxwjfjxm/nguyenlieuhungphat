"use client";

import { KeyRound, ShieldCheck } from "lucide-react";
import { useEffect, useRef } from "react";
import { useCustomerAuth } from "@/components/clerk-auth-provider";
import { customerUserProfileAppearance } from "@/lib/auth/clerk-appearance";

export function ClerkUserProfilePanel() {
  const { clerk, status } = useCustomerAuth();
  const profileHostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = profileHostRef.current;
    if (!node || !clerk || status !== "signed-in") return;

    clerk.mountUserProfile(node, {
      routing: "hash",
      appearance: customerUserProfileAppearance,
    });

    return () => clerk.unmountUserProfile(node);
  }, [clerk, status]);

  return (
    <section className="account-section account-security-section">
      <div className="account-section-heading">
        <span className="account-section-icon">
          <KeyRound aria-hidden="true" size={21} />
        </span>
        <div>
          <p className="eyebrow">Bảo mật & đăng nhập</p>
          <h2>Quản lý tài khoản</h2>
          <p>
            Tạo hoặc đổi mật khẩu, quản lý email và liên kết Google ngay trong ứng dụng.
          </p>
        </div>
      </div>

      {status === "signed-in" ? (
        <div className="clerk-user-profile-host" ref={profileHostRef} />
      ) : (
        <div className="account-inline-state" aria-live="polite">
          <ShieldCheck aria-hidden="true" size={18} />
          Đang tải thông tin bảo mật…
        </div>
      )}
    </section>
  );
}
