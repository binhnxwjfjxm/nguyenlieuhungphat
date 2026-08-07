"use client";

import { Building2, CheckCircle2, LogOut, Mail, Phone, Save, Store, Trash2, UserRound } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ClerkUserProfilePanel } from "@/components/clerk-user-profile";
import { useCustomerAuth } from "@/components/clerk-auth-provider";
import { VietnamAddressFields, type VietnamAddressValue } from "@/components/vietnam-address-fields";

type ShopRegistrationDraft = VietnamAddressValue & {
  shopName: string;
  contactName: string;
  phone: string;
  businessType: string;
};

type StoredShopRegistrationDraft = {
  version: 2;
  status: "draft";
  savedAt: string;
  expiresAt: string;
  draft: ShopRegistrationDraft;
};

type LegacyStoredDraft = {
  version?: 1;
  status?: "draft";
  savedAt?: string;
  expiresAt?: string;
  draft?: { shopName?: string; contactName?: string; phone?: string; address?: string; businessType?: string };
};

const EMPTY_SHOP_DRAFT: ShopRegistrationDraft = {
  shopName: "", contactName: "", phone: "", businessType: "Cửa hàng bán lẻ",
  provinceCode: "", provinceName: "", wardCode: "", wardName: "", addressLine: "", latitude: null, longitude: null,
};

const SHOP_REGISTRATION_STORAGE_PREFIX = "hp-customer-ordering-shop-registration";
const SHOP_REGISTRATION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function shopRegistrationStorageKey(userId: string): string { return `${SHOP_REGISTRATION_STORAGE_PREFIX}:${userId}`; }
function isStoredShopRegistrationDraft(value: unknown): value is StoredShopRegistrationDraft {
  if (!value || typeof value !== "object") return false;
  const stored = value as Partial<StoredShopRegistrationDraft>;
  if (!stored.draft) return false;
  const draft = stored.draft as Partial<ShopRegistrationDraft>;
  return stored.version === 2 && stored.status === "draft" && typeof stored.savedAt === "string" && Number.isFinite(Date.parse(stored.savedAt)) && typeof stored.expiresAt === "string" && Number.isFinite(Date.parse(stored.expiresAt))
    && typeof draft.shopName === "string" && typeof draft.contactName === "string" && typeof draft.phone === "string" && typeof draft.businessType === "string"
    && typeof draft.provinceCode === "string" && typeof draft.provinceName === "string" && typeof draft.wardCode === "string" && typeof draft.wardName === "string" && typeof draft.addressLine === "string"
    && (draft.latitude === null || typeof draft.latitude === "number") && (draft.longitude === null || typeof draft.longitude === "number");
}
function migrateLegacyDraft(value: unknown): ShopRegistrationDraft | null {
  if (!value || typeof value !== "object") return null;
  const stored = value as LegacyStoredDraft;
  if (stored.status !== "draft" || !stored.draft) return null;
  return { ...EMPTY_SHOP_DRAFT, shopName: stored.draft.shopName ?? "", contactName: stored.draft.contactName ?? "", phone: stored.draft.phone ?? "", businessType: stored.draft.businessType ?? "Cửa hàng bán lẻ", addressLine: stored.draft.address ?? "" };
}

export function AccountAuthCard() {
  const { user, signOut } = useCustomerAuth();
  const previousUserIdRef = useRef<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [shopDraft, setShopDraft] = useState<ShopRegistrationDraft>(EMPTY_SHOP_DRAFT);
  const [shopSavedAt, setShopSavedAt] = useState<string | null>(null);
  const [confirmDeleteDraft, setConfirmDeleteDraft] = useState(false);
  const displayName = user?.fullName || user?.firstName || "Khách hàng Hưng Phát";
  const email = user?.primaryEmailAddress?.emailAddress || "Chưa có email";

  useEffect(() => {
    const userId = user?.id ?? null;
    const previousUserId = previousUserIdRef.current;
    previousUserIdRef.current = userId;
    const timeoutId = window.setTimeout(() => {
      if (previousUserId && previousUserId !== userId) window.localStorage.removeItem(shopRegistrationStorageKey(previousUserId));
      if (!userId) { setShopDraft(EMPTY_SHOP_DRAFT); setShopSavedAt(null); setConfirmDeleteDraft(false); return; }
      const storageKey = shopRegistrationStorageKey(userId);
      const rawDraft = window.localStorage.getItem(storageKey);
      if (!rawDraft) { setShopDraft(EMPTY_SHOP_DRAFT); setShopSavedAt(null); setConfirmDeleteDraft(false); return; }
      try {
        const parsed: unknown = JSON.parse(rawDraft);
        if (isStoredShopRegistrationDraft(parsed) && Date.parse(parsed.expiresAt) > Date.now()) { setShopDraft(parsed.draft); setShopSavedAt(parsed.savedAt); return; }
        const migrated = migrateLegacyDraft(parsed);
        if (migrated) { setShopDraft(migrated); setShopSavedAt(null); return; }
        window.localStorage.removeItem(storageKey); setShopDraft(EMPTY_SHOP_DRAFT); setShopSavedAt(null);
      } catch { window.localStorage.removeItem(storageKey); setShopDraft(EMPTY_SHOP_DRAFT); setShopSavedAt(null); }
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [user?.id]);

  function updateShopField<Key extends keyof ShopRegistrationDraft>(field: Key, value: ShopRegistrationDraft[Key]) {
    setShopDraft((current) => ({ ...current, [field]: value })); setShopSavedAt(null); setConfirmDeleteDraft(false);
  }
  function updateAddress(value: VietnamAddressValue) { setShopDraft((current) => ({ ...current, ...value })); setShopSavedAt(null); setConfirmDeleteDraft(false); }

  function handleShopSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user?.id) return;
    const savedAt = new Date().toISOString();
    const storedDraft: StoredShopRegistrationDraft = { version: 2, status: "draft", savedAt, expiresAt: new Date(Date.now() + SHOP_REGISTRATION_TTL_MS).toISOString(), draft: shopDraft };
    window.localStorage.setItem(shopRegistrationStorageKey(user.id), JSON.stringify(storedDraft)); setShopSavedAt(savedAt); setConfirmDeleteDraft(false);
  }
  function handleDeleteShopDraft() { if (user?.id) window.localStorage.removeItem(shopRegistrationStorageKey(user.id)); setShopDraft(EMPTY_SHOP_DRAFT); setShopSavedAt(null); setConfirmDeleteDraft(false); }
  async function handleSignOut() {
    setSigningOut(true);
    try { if (user?.id) window.localStorage.removeItem(shopRegistrationStorageKey(user.id)); setShopDraft(EMPTY_SHOP_DRAFT); setShopSavedAt(null); setConfirmDeleteDraft(false); await signOut(); }
    finally { setSigningOut(false); }
  }

  return <div className="account-hub">
    <section className="account-identity-card"><div className="account-avatar"><UserRound aria-hidden="true" size={30} /></div><div className="account-identity-copy"><h1>{displayName}</h1><p className="account-email"><Mail aria-hidden="true" size={17} />{email}</p></div><button className="account-signout-button" disabled={signingOut} onClick={handleSignOut} type="button"><LogOut aria-hidden="true" size={18} />{signingOut ? "Đang đăng xuất..." : "Đăng xuất"}</button></section>

    <section className="account-section account-link-summary"><div className="account-section-heading"><span className="account-section-icon"><Building2 aria-hidden="true" size={21} /></span><div><p className="eyebrow">Điểm bán</p><h2>{shopSavedAt ? "Đã lưu bản nháp trên thiết bị" : "Chưa có bản nháp điểm bán"}</h2><p>{shopSavedAt ? "Thông tin này chưa được gửi về Hưng Phát. Mở mục bên dưới khi cần tiếp tục chỉnh sửa." : "Bạn có thể lưu tạm thông tin cửa hàng trên thiết bị trước khi có bước gửi đăng ký chính thức."}</p></div></div></section>

    <details className="account-section account-collapsible shop-registration-section">
      <summary className="account-section-heading" style={{ cursor: "pointer", listStyle: "none" }}><span className="account-section-icon"><Store aria-hidden="true" size={21} /></span><div><p className="eyebrow">Thông tin cửa hàng</p><h2>Bản nháp điểm bán</h2><p>Chỉ lưu trên thiết bị hiện tại, chưa gửi đăng ký chính thức.</p></div><span className="status-pill">Chỉnh sửa</span></summary>
      <form className="shop-registration-form" onSubmit={handleShopSubmit}>
        <label><span>Tên quán hoặc điểm bán</span><div className="input-with-icon"><Store aria-hidden="true" size={18} /><input autoComplete="organization" onChange={(event) => updateShopField("shopName", event.target.value)} placeholder="Tên quán / điểm bán" required value={shopDraft.shopName} /></div></label>
        <label><span>Người liên hệ</span><div className="input-with-icon"><UserRound aria-hidden="true" size={18} /><input autoComplete="name" onChange={(event) => updateShopField("contactName", event.target.value)} placeholder="Họ và tên" required value={shopDraft.contactName} /></div></label>
        <label><span>Số điện thoại</span><div className="input-with-icon"><Phone aria-hidden="true" size={18} /><input autoComplete="tel" inputMode="tel" onChange={(event) => updateShopField("phone", event.target.value)} placeholder="Số điện thoại" required value={shopDraft.phone} /></div></label>
        <VietnamAddressFields onChange={updateAddress} value={shopDraft} />
        <label><span>Loại hình kinh doanh</span><select onChange={(event) => updateShopField("businessType", event.target.value)} value={shopDraft.businessType}><option>Cửa hàng bán lẻ</option><option>Trà sữa / đồ uống</option><option>Mỳ cay / quán ăn</option><option>Tiệm bánh</option><option>Nhà hàng</option><option>Nhà phân phối</option><option>Khác</option></select></label>
        {shopSavedAt ? <div className="shop-registration-notice"><CheckCircle2 aria-hidden="true" size={18} /><span>Đã lưu bản nháp trên thiết bị. Thông tin chưa được gửi về Hưng Phát.</span></div> : null}
        <div className="shop-registration-actions"><button className="primary-button shop-registration-submit" type="submit"><Save aria-hidden="true" size={18} />Lưu bản nháp</button>{shopSavedAt ? <button className="shop-registration-delete" onClick={() => setConfirmDeleteDraft(true)} type="button"><Trash2 aria-hidden="true" size={17} />Xóa bản nháp</button> : null}</div>
        {confirmDeleteDraft ? <div className="shop-registration-delete-confirm" role="alert"><p>Xóa bản nháp điểm bán đã lưu trên thiết bị?</p><div><button className="danger-button" onClick={handleDeleteShopDraft} type="button">Xác nhận xóa</button><button className="secondary-action-button" onClick={() => setConfirmDeleteDraft(false)} type="button">Giữ lại</button></div></div> : null}
      </form>
    </details>
    <ClerkUserProfilePanel />
  </div>;
}
