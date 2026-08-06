"use client";

import { LogOut, Phone, UserRound } from "lucide-react";
import { useState } from "react";
import { useCustomerAuth } from "@/components/clerk-auth-provider";

export function AccountAuthCard() {
  const { user, signOut } = useCustomerAuth();
  const [signingOut, setSigningOut] = useState(false);
  const displayName = user?.fullName || user?.firstName || "Khách hàng Hưng Phát";
  const phone = user?.primaryPhoneNumber?.phoneNumber || "Chưa có số điện thoại";

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
        <Phone aria-hidden="true" size={17} />
        {phone}
      </p>
      <div className="account-link-state">
        <strong>Trạng thái hiện tại</strong>
        <span>Khách vãng lai — chưa liên kết NPP Core</span>
      </div>
      <p className="account-auth-note">
        Khi Core hoàn thiện customer portal, tài khoản này sẽ được liên kết với đúng mã khách hàng
        mà không đổi cách đăng nhập.
      </p>
      <button className="account-signout-button" disabled={signingOut} onClick={handleSignOut} type="button">
        <LogOut aria-hidden="true" size={18} />
        {signingOut ? "Đang đăng xuất..." : "Đăng xuất"}
      </button>
    </section>
  );
}
