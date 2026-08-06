"use client";

import { LogOut, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import { useCustomerAuth } from "@/components/clerk-auth-provider";

export function AccountAuthCard() {
  const { user, signOut } = useCustomerAuth();
  const [signingOut, setSigningOut] = useState(false);
  const displayName = user?.fullName || user?.firstName || "Khách hàng Hưng Phát";
  const email = user?.primaryEmailAddress?.emailAddress || "Chưa có email";

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <section className="account-auth-card">
      <span className="placeholder-icon">
        <UserRound aria-hidden="true" size={30} />
      </span>
      <p className="eyebrow">Tài khoản đặt hàng</p>
      <h1>{displayName}</h1>
      <p className="account-phone">
        <Mail aria-hidden="true" size={17} />
        {email}
      </p>
      <div className="account-link-state">
        <strong>Trạng thái tài khoản</strong>
        <span>Chưa liên kết hồ sơ khách hàng Hưng Phát</span>
      </div>
      <p className="account-auth-note">
        Sau khi hồ sơ được Hưng Phát xác nhận, quý khách vẫn dùng tài khoản Google này để đặt hàng
        và xem thông tin dành riêng cho điểm bán.
      </p>
      <button className="account-signout-button" disabled={signingOut} onClick={handleSignOut} type="button">
        <LogOut aria-hidden="true" size={18} />
        {signingOut ? "Đang đăng xuất..." : "Đăng xuất"}
      </button>
    </section>
  );
}
