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
  Trash2,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ClerkUserProfilePanel } from "@/components/clerk-user-profile";
import { useCustomerAuth } from "@/components/clerk-auth-provider";

type ShopRegistrationDraft = {
  shopName: string;
  contactName: string;
  phone: string;
  address: string;
  businessType: string;
};

type StoredShopRegistrationDraft = {
  version: 1;
  status: "draft";
  savedAt: string;
  expiresAt: string;
  draft: ShopRegistrationDraft;
};

const EMPTY_SHOP_DRAFT: ShopRegistrationDraft = {
  shopName: "",
  contactName: "",
  phone: "",
  address: "",
  businessType: "Cửa hàng bán lẻ",
};

const SHOP_REGISTRATION_STORAGE_PREFIX = "hp-customer-ordering-shop-registration";
const SHOP_REGISTRATION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function shopRegistrationStorageKey(userId: string): string {
  return `${SHOP_REGISTRATION_STORAGE_PREFIX}:${userId}`;
}

function isShopRegistrationDraft(value: unknown): value is ShopRegistrationDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<Record<keyof ShopRegistrationDraft, unknown>>;
  return (
    typeof draft.shopName === "string" &&
    typeof draft.contactName === "string" &&
    typeof draft.phone === "string" &&
    typeof draft.address === "string" &&
    typeof draft.businessType === "string"
  );
}

function isStoredShopRegistrationDraft(value: unknown): value is StoredShopRegistrationDraft {
  if (!value || typeof value !== "object") return false;
  const stored = value as Partial<StoredShopRegistrationDraft>;
  return (
    stored.version === 1 &&
    stored.status === "draft" &&
    typeof stored.savedAt === "string" &&
    Number.isFinite(Date.parse(stored.savedAt)) &&
    typeof stored.expiresAt === "string" &&
    Number.isFinite(Date.parse(stored.expiresAt)) &&
    isShopRegistrationDraft(stored.draft)
  );
}

export function AccountAuthCard() {
  const { user, signOut } = useCustomerAuth();
  const previousUserIdRef = useRef<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [shopDraft, setShopDraft] = useState<ShopRegistrationDraft>(EMPTY_SHOP_DRAFT);
  const [shopSavedAt, setShopSavedAt] = useState<string | null>(null);
  const displayName = user?.fullName || user?.firstName || "Khách hàng Hưng Phát";
  const email = user?.primaryEmailAddress?.emailAddress || "Chưa có email";

  useEffect(() => {
    const userId = user?.id ?? null;
    const previousUserId = previousUserIdRef.current;
    previousUserIdRef.current = userId;

    const timeoutId = window.setTimeout(() => {
      if (previousUserId && previousUserId !== userId) {
        window.localStorage.removeItem(shopRegistrationStorageKey(previousUserId));
      }

      if (!userId) {
        setShopDraft(EMPTY_SHOP_DRAFT);
        setShopSavedAt(null);
        return;
      }

      const storageKey = shopRegistrationStorageKey(userId);
      const rawDraft = window.localStorage.getItem(storageKey);
      if (!rawDraft) {
        setShopDraft(EMPTY_SHOP_DRAFT);
        setShopSavedAt(null);
        return;
      }

      try {
        const storedDraft: unknown = JSON.parse(rawDraft);
        if (
          !isStoredShopRegistrationDraft(storedDraft) ||
          Date.parse(storedDraft.expiresAt) <= Date.now()
        ) {
          window.localStorage.removeItem(storageKey);
          setShopDraft(EMPTY_SHOP_DRAFT);
          setShopSavedAt(null);
          return;
        }

        setShopDraft(storedDraft.draft);
        setShopSavedAt(storedDraft.savedAt);
      } catch {
        window.localStorage.removeItem(storageKey);
        setShopDraft(EMPTY_SHOP_DRAFT);
        setShopSavedAt(null);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [user?.id]);

  function updateShopField<Key extends keyof ShopRegistrationDraft>(
    field: Key,
    value: ShopRegistrationDraft[Key],
  ) {
    setShopDraft((current) => ({ ...current, [field]: value }));
    setShopSavedAt(null);
  }

  function handleShopSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user?.id) return;

    const savedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + SHOP_REGISTRATION_TTL_MS).toISOString();
    const storedDraft: StoredShopRegistrationDraft = {
      version: 1,
      status: "draft",
      savedAt,
      expiresAt,
      draft: shopDraft,
    };

    window.localStorage.setItem(
      shopRegistrationStorageKey(user.id),
      JSON.stringify(storedDraft),
    );
    setShopSavedAt(savedAt);
  }

  function handleDeleteShopDraft() {
    if (user?.id) {
      window.localStorage.removeItem(shopRegistrationStorageKey(user.id));
    }
    setShopDraft(EMPTY_SHOP_DRAFT);
    setShopSavedAt(null);
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      if (user?.id) {
        window.localStorage.removeItem(shopRegistrationStorageKey(user.id));
      }
      setShopDraft(EMPTY_SHOP_DRAFT);
      setShopSavedAt(null);
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
                <span>Đã lưu bản nháp đăng ký quán trên thiết bị này trong tối đa 30 ngày.</span>
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

          <div className="shop-registration-actions">
            <button className="primary-button shop-registration-submit" type="submit">
              <Save aria-hidden="true" size={18} />
              Lưu đề nghị đăng ký quán
            </button>
            {shopSavedAt ? (
              <button
                className="shop-registration-delete"
                onClick={handleDeleteShopDraft}
                type="button"
              >
                <Trash2 aria-hidden="true" size={17} />
                Xóa bản nháp
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <ClerkUserProfilePanel />
    </div>
  );
}
