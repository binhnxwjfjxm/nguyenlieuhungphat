"use client";

import { KeyRound, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCustomerAuth } from "@/components/clerk-auth-provider";
import { customerUserProfileAppearance } from "@/lib/auth/clerk-appearance";

export function ClerkUserProfilePanel() {
  const { clerk, status } = useCustomerAuth();
  const profileHostRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const node = profileHostRef.current;
    if (!open || !node || !clerk || status !== "signed-in") return;

    clerk.mountUserProfile(node, {
      routing: "hash",
      appearance: customerUserProfileAppearance,
    });

    return () => clerk.unmountUserProfile(node);
  }, [clerk, open, status]);

  return (
    <details className="account-section account-security-section account-collapsible" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="account-section-heading" style={{ cursor: "pointer", listStyle: "none" }}>
        <span className="account-section-icon">
          <KeyRound aria-hidden="true" size={21} />
        </span>
        <div>
          <p className="eyebrow">Bảo mật & đăng nhập</p>
          <h2>Quản lý tài khoản</h2>
          <p>Mật khẩu, email và liên kết Google.</p>
        </div>
        <span className="status-pill">Quản lý</span>
      </summary>

      {open && status === "signed-in" ? (
        <div className="clerk-user-profile-host" ref={profileHostRef} />
      ) : open ? (
        <div className="account-inline-state" aria-live="polite">
          <ShieldCheck aria-hidden="true" size={18} />
          Đang tải thông tin bảo mật…
        </div>
      ) : null}
    </details>
  );
}
