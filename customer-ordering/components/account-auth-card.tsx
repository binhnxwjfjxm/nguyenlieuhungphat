"use client";

import {
  Building2,
  CheckCircle2,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  Store,
  UserRound,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { ClerkUserProfilePanel } from "@/components/clerk-user-profile";
import { useCustomerAuth } from "@/components/clerk-auth-provider";

type ShopRegistrationDraft = {
  shopName: string;
  contactName: string;
  phone: string;
  address: string;
  businessType: string;
};

const EMPTY_SHOP_DRAFT: ShopRegistrationDraft = {
  shopName: "",
  contactName: "",
  phone: "",
  address: "",
  businessType: "Cửa hàng bán lẻ",
};

const SHOP_REGISTRATION_STORAGE_KEY = "hp-customer-ordering-shop-registration";

export function AccountAuthCard() {
  const { user, signOut } = useCustomerAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [shopDraft, setShopDraft] = useState<ShopRegistrationDraft>(EMPTY_SHOP_DRAFT);
  const [shopSavedAt, setShopSavedAt] = useState<string | null>(null);
  const displayName = user?.fullName || user?.firstName || "Khách hàng Hưng Phát";
  const email = user?.primaryEmailAddress?.emailAddress || "Chưa có email";

  function updateShopField<Key extends keyof ShopRegistrationDraft>(
    field: Key,
    value: ShopRegistrationDraft[Key],
  ) {
    setShopDraft((current) => ({ ...current, [field]: value }));
    setShopSavedAt(null);
  }

  function handleShopSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const savedAt = new Date().toISOString();
    window.localStorage.setItem(
      SHOP_REGISTRATION_STORAGE_KEY,
      JSON.stringify({ ...shopDraft, savedAt, status: "draft" }),
    );
    setShopSavedAt(savedAt);
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="account-hub">
      <section className="account-identity-card">
        <div className="account-avatar">
          <UserRound aria-hidden="true" size={30} />
        </div>
        <div className="account-identity-copy">
          <p className="eyebrow">Tài khoản đặt hàng</p>
          <h1>{displayName}</h1>
          <p className="account-email">
            <Mail aria-hidden="true" size={17} />
            {email}
          </p>
        </div>
        <button
          className="account-signout-button"
          disabled={signingOut}
          onClick={handleSignOut}
          type="button"
        >
          <LogOut aria-hidden="true" size={18} />
          {signingOut ? "Đang đăng xuất..." : "Đăng xuất"}
        </button>
      </section>

      <section className="account-section account-link-summary">
        <div className="account-section-heading">
          <span className="account-section-icon">
            <Building2 aria-hidden="true" size={21} />
          </span>
          <div>
            <p className="eyebrow">Hồ sơ khách hàng</p>
            <h2>Chưa liên kết điểm bán</h2>
            <p>
              Tài khoản đăng nhập đã được xác minh. Sau khi Hưng Phát duyệt quán, tài khoản này vẫn giữ nguyên và được cấp quyền đặt hàng cho đúng điểm bán.
            </p>
          </div>
        </div>
      </section>

      <section className="account-section shop-registration-section">
        <div className="account-section-heading">
          <span className="account-section-icon">
            <Store aria-hidden="true" size={21} />
          </span>
          <div>
            <p className="eyebrow">Quán của tôi</p>
            <h2>Đăng ký điểm bán</h2>
            <p>Điền thông tin quán để chuẩn bị đề nghị mở hồ sơ khách hàng Hưng Phát.</p>
          </div>
        </div>

        <form className="shop-registration-form" onSubmit={handleShopSubmit}>
          <label>
            <span>Tên quán hoặc điểm bán</span>
            <div className="input-with-icon">
              <Store aria-hidden="true" size={18} />
              <input
                autoComplete="organization"
                onChange={(event) => updateShopField("shopName", event.target.value)}
                placeholder="Ví dụ: Tiệm bánh Minh An"
                required
                value={shopDraft.shopName}
              />
            </div>
          </label>

          <label>
            <span>Người liên hệ</span>
            <div className="input-with-icon">
              <UserRound aria-hidden="true" size={18} />
              <input
                autoComplete="name"
                onChange={(event) => updateShopField("contactName", event.target.value)}
                placeholder="Họ và tên"
                required
                value={shopDraft.contactName}
              />
            </div>
          </label>

          <label>
            <span>Số điện thoại</span>
            <div className="input-with-icon">
              <Phone aria-hidden="true" size={18} />
              <input
                autoComplete="tel"
                inputMode="tel"
                onChange={(event) => updateShopField("phone", event.target.value)}
                placeholder="0901 234 567"
                required
                value={shopDraft.phone}
              />
            </div>
          </label>

          <label>
            <span>Địa chỉ nhận hàng</span>
            <div className="input-with-icon">
              <MapPin aria-hidden="true" size={18} />
              <input
                autoComplete="street-address"
                onChange={(event) => updateShopField("address", event.target.value)}
                placeholder="Số nhà, đường, phường/xã, tỉnh/thành"
                required
                value={shopDraft.address}
              />
            </div>
          </label>

          <label>
            <span>Loại hình kinh doanh</span>
            <select
              onChange={(event) => updateShopField("businessType", event.target.value)}
              value={shopDraft.businessType}
            >
              <option>Cửa hàng bán lẻ</option>
              <option>Tiệm bánh</option>
              <option>Nhà hàng / quán ăn</option>
              <option>Nhà phân phối</option>
              <option>Khác</option>
            </select>
          </label>

          <div className="shop-registration-notice">
            {shopSavedAt ? (
              <>
                <CheckCircle2 aria-hidden="true" size={18} />
                <span>Đã lưu bản nháp đăng ký quán trên thiết bị này.</span>
              </>
            ) : (
              <>
                <Save aria-hidden="true" size={18} />
                <span>
                  Giai đoạn UI hiện chỉ lưu bản nháp; khi kết nối hệ thống công ty, đề nghị sẽ được gửi để duyệt chính thức.
                </span>
              </>
            )}
          </div>

          <button className="primary-button shop-registration-submit" type="submit">
            <Save aria-hidden="true" size={18} />
            Lưu đề nghị đăng ký quán
          </button>
        </form>
      </section>

      <ClerkUserProfilePanel />
    </div>
  );
}
