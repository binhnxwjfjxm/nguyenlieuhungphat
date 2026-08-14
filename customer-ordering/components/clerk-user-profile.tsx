"use client";

import { ChevronRight, KeyRound, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AccountModal } from "@/components/account-modal";
import { useCustomerAuth } from "@/components/clerk-auth-provider";
import { customerUserProfileAppearance } from "@/lib/auth/clerk-appearance";

export function ClerkUserProfilePanel() {
  const { clerk, status } = useCustomerAuth();
  const profileHostRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const onToggle = () => setOpen(true);

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
    <section className="account-section account-security-section">
      <div className="account-section-heading">
        <span className="account-section-icon">
          <KeyRound aria-hidden="true" size={21} />
        </span>
        <div>
          <p className="eyebrow">Bảo mật & đăng nhập</p>
          <h2>Quản lý tài khoản</h2>
          <p>Mật khẩu, email và liên kết Google.</p>
        </div>
        <button aria-label="Mở quản lý bảo mật và đăng nhập" className="account-section-open" onClick={onToggle} type="button"><span>Quản lý</span><ChevronRight aria-hidden="true" size={18} /></button>
      </div>

      <AccountModal description="Quản lý mật khẩu, email và các phương thức liên kết với tài khoản Clerk." icon={<KeyRound aria-hidden="true" size={22} />} onClose={() => setOpen(false)} open={open} title="Bảo mật & đăng nhập">
        {open && status === "signed-in" ? (
          <div className="clerk-user-profile-host" ref={profileHostRef} />
        ) : (
          <div className="account-inline-state" aria-live="polite">
            <ShieldCheck aria-hidden="true" size={18} />
            Đang tải thông tin bảo mật…
          </div>
        )}
      </AccountModal>
    </section>
  );
}
