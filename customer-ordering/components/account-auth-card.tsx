"use client";

import { AlertCircle, Building2, CheckCircle2, Clock3, LogOut, Mail, Phone, RefreshCw, Save, Store, UserRound } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ClerkUserProfilePanel } from "@/components/clerk-user-profile";
import { useCustomerAuth } from "@/components/clerk-auth-provider";
import {
  getPortalLifecycle,
  getPortalProfile,
  PortalLifecycleError,
  resubmitPortalRegistration,
  submitPortalRegistration,
  updatePortalProfile,
  type PortalLifecycleSnapshot,
  type PortalProfile,
  type PortalRegistration,
  type PortalRegistrationInput,
} from "@/lib/customer-portal-lifecycle";

type ShopForm = {
  shopName: string;
  phone: string;
  addressLine1: string;
  ward: string;
  province: string;
};

const EMPTY_FORM: ShopForm = { shopName: "", phone: "", addressLine1: "", ward: "", province: "" };

function formFromRegistration(registration: PortalRegistration | null): ShopForm {
  const customer = registration?.proposedCustomer;
  return customer ? {
    shopName: customer.name ?? "",
    phone: customer.phone ?? "",
    addressLine1: customer.address.addressLine1 ?? "",
    ward: customer.address.ward ?? "",
    province: customer.address.province ?? "",
  } : EMPTY_FORM;
}

function formFromProfile(profile: PortalProfile): ShopForm {
  return {
    shopName: profile.outletName ?? "",
    phone: profile.phone ?? "",
    addressLine1: profile.address?.addressLine1 ?? "",
    ward: profile.address?.ward ?? "",
    province: profile.address?.province ?? "",
  };
}

function registrationInput(form: ShopForm): PortalRegistrationInput {
  return {
    proposedCustomer: {
      name: form.shopName.trim(),
      phone: form.phone.trim(),
      address: {
        label: "Địa chỉ chính",
        addressLine1: form.addressLine1.trim(),
        ward: form.ward.trim(),
        province: form.province.trim(),
        countryCode: "VN",
      },
    },
  };
}

const STATE_COPY: Record<string, { title: string; description: string }> = {
  unregistered: { title: "Chưa đăng ký điểm bán", description: "Gửi thông tin điểm bán để Hưng Phát xác minh trước khi mở danh mục và đặt hàng." },
  submitted: { title: "Đã gửi đăng ký", description: "Hưng Phát đã nhận thông tin và đang chờ xử lý." },
  under_review: { title: "Đang xác minh", description: "Thông tin điểm bán đang được bộ phận phụ trách kiểm tra." },
  need_more_info: { title: "Cần bổ sung thông tin", description: "Cập nhật lại thông tin theo ghi chú bên dưới rồi gửi lại." },
  approved: { title: "Đã duyệt, đang kích hoạt", description: "Hệ thống đang hoàn tất liên kết khách hàng và membership." },
  linked_existing: { title: "Đã liên kết, đang kích hoạt", description: "Hệ thống đang hoàn tất membership cho khách hàng hiện có." },
  activation_pending: { title: "Đã duyệt, đang kích hoạt", description: "Chưa mở đặt hàng cho tới khi membership hoạt động đầy đủ." },
  active_customer: { title: "Điểm bán đã liên thông Core", description: "Danh mục và đặt hàng đã được mở. Thông tin bên dưới là dữ liệu chính thức trên Core." },
  rejected: { title: "Đăng ký chưa được chấp thuận", description: "Xem ghi chú xử lý và liên hệ Hưng Phát nếu cần hỗ trợ." },
  cancelled: { title: "Đăng ký đã hủy", description: "Yêu cầu này đã kết thúc. Liên hệ Hưng Phát nếu cần mở lại quy trình." },
  suspended: { title: "Liên kết điểm bán tạm khóa", description: "Tài khoản hoặc membership hiện không sử dụng được. Vui lòng liên hệ Hưng Phát." },
};

export function AccountAuthCard() {
  const { user, signOut } = useCustomerAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snapshot, setSnapshot] = useState<PortalLifecycleSnapshot | null>(null);
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [form, setForm] = useState<ShopForm>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const displayName = user?.fullName || user?.firstName || "Khách hàng Hưng Phát";
  const email = user?.primaryEmailAddress?.emailAddress || "Chưa có email";

  const refreshPortal = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError("");
    try {
      const next = await getPortalLifecycle();
      setSnapshot(next);
      if (next.state === "active_customer") {
        const activeProfile = await getPortalProfile();
        setProfile(activeProfile);
        setForm(formFromProfile(activeProfile));
      } else {
        setProfile(null);
        setForm(formFromRegistration(next.registration));
      }
    } catch (loadError: unknown) {
      setSnapshot(null);
      setProfile(null);
      setError(loadError instanceof PortalLifecycleError ? loadError.message : "Không tải được trạng thái điểm bán.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { void refreshPortal(); }, [refreshPortal]);

  function updateField(field: keyof ShopForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setNotice("");
    setError("");
  }

  async function handleShopSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!snapshot) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (snapshot.state === "unregistered") {
        await submitPortalRegistration(registrationInput(form));
        setNotice("Đã gửi đăng ký điểm bán về Hưng Phát.");
      } else if (snapshot.state === "need_more_info" && snapshot.registration) {
        await resubmitPortalRegistration(snapshot.registration, registrationInput(form));
        setNotice("Đã gửi lại thông tin bổ sung.");
      } else if (snapshot.state === "active_customer" && profile?.address) {
        const updated = await updatePortalProfile({
          outletName: form.shopName.trim(),
          phone: form.phone.trim(),
          expectedCustomerUpdatedAt: profile.customerUpdatedAt,
          expectedAddressUpdatedAt: profile.address.updatedAt,
          address: {
            id: profile.address.id,
            addressLine1: form.addressLine1.trim(),
            ward: form.ward.trim(),
            province: form.province.trim(),
            countryCode: profile.address.countryCode || "VN",
          },
        });
        setProfile(updated);
        setNotice("Đã cập nhật thông tin điểm bán trên Core.");
      }
      await refreshPortal();
    } catch (saveError: unknown) {
      setError(saveError instanceof PortalLifecycleError ? saveError.message : "Không lưu được thông tin điểm bán.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try { await signOut(); } finally { setSigningOut(false); }
  }

  const state = snapshot?.state ?? "unregistered";
  const copy = STATE_COPY[state] ?? STATE_COPY.unregistered;
  const editableState = state === "unregistered" || state === "need_more_info" || state === "active_customer";
  const editable = Boolean(snapshot) && editableState && (state !== "active_customer" || Boolean(profile?.address));
  const submitLabel = state === "active_customer" ? "Lưu lên Core" : state === "need_more_info" ? "Gửi lại thông tin" : "Gửi đăng ký điểm bán";

  return <div className="account-hub">
    <section className="account-identity-card"><div className="account-avatar"><UserRound aria-hidden="true" size={30} /></div><div className="account-identity-copy"><h1>{displayName}</h1><p className="account-email"><Mail aria-hidden="true" size={17} />{email}</p></div><button className="account-signout-button" disabled={signingOut} onClick={handleSignOut} type="button"><LogOut aria-hidden="true" size={18} />{signingOut ? "Đang đăng xuất..." : "Đăng xuất"}</button></section>

    <section className="account-section account-link-summary" id="shop-registration"><div className="account-section-heading"><span className="account-section-icon"><Building2 aria-hidden="true" size={21} /></span><div><p className="eyebrow">Điểm bán / Core</p><h2>{loading ? "Đang kiểm tra trạng thái..." : error && !snapshot ? "Không đọc được trạng thái điểm bán" : copy.title}</h2><p>{loading ? "Đang đọc dữ liệu chính thức từ Core." : error && !snapshot ? "Không mở luồng đăng ký hoặc đặt hàng khi chưa xác minh được trạng thái Core." : copy.description}</p>{state === "active_customer" && profile?.customerCode ? <p><strong>Mã khách Core:</strong> {profile.customerCode}</p> : null}</div>{snapshot ? (state === "active_customer" ? <span className="status-pill"><CheckCircle2 aria-hidden="true" size={15} />Đã kích hoạt</span> : <span className="status-pill"><Clock3 aria-hidden="true" size={15} />{state}</span>) : null}</div>
      {snapshot?.registration?.reviewReason ? <div className="shop-registration-notice"><AlertCircle aria-hidden="true" size={18} /><span>{snapshot.registration.reviewReason}</span></div> : null}
      {state === "active_customer" && profile && !profile.address ? <div className="shop-registration-notice"><AlertCircle aria-hidden="true" size={18} /><span>Điểm bán chưa có địa chỉ đang hoạt động. Vui lòng liên hệ Hưng Phát để khôi phục địa chỉ trước khi chỉnh sửa.</span></div> : null}
      {snapshot && !editable && !loading ? <button className="secondary-action-button" onClick={() => void refreshPortal()} type="button"><RefreshCw aria-hidden="true" size={17} />Tải lại trạng thái</button> : null}
    </section>

    {editable && !loading ? <section className="account-section shop-registration-section">
      <div className="account-section-heading"><span className="account-section-icon"><Store aria-hidden="true" size={21} /></span><div><p className="eyebrow">{state === "active_customer" ? "Chỉnh sửa thông tin điểm bán" : "Đăng ký điểm bán"}</p><h2>{state === "active_customer" ? "Thông tin chính thức trên Core" : "Thông tin gửi Hưng Phát xác minh"}</h2><p>Chỉ các trường thông tin điểm bán được phép thay đổi; mã khách, kho và kênh bán do Core quản lý.</p></div></div>
      <form className="shop-registration-form" onSubmit={handleShopSubmit}>
        <label><span>Tên quán hoặc điểm bán</span><div className="input-with-icon"><Store aria-hidden="true" size={18} /><input autoComplete="organization" onChange={(event) => updateField("shopName", event.target.value)} placeholder="Tên quán / điểm bán" required value={form.shopName} /></div></label>
        <label><span>Số điện thoại</span><div className="input-with-icon"><Phone aria-hidden="true" size={18} /><input autoComplete="tel" inputMode="tel" onChange={(event) => updateField("phone", event.target.value)} placeholder="Số điện thoại" required value={form.phone} /></div></label>
        <label><span>Tỉnh / thành phố</span><input onChange={(event) => updateField("province", event.target.value)} placeholder="Tỉnh / thành phố" required value={form.province} /></label>
        <label><span>Xã / phường</span><input onChange={(event) => updateField("ward", event.target.value)} placeholder="Xã / phường" required value={form.ward} /></label>
        <label className="address-line-field"><span>Số nhà, tên đường</span><input autoComplete="street-address" onChange={(event) => updateField("addressLine1", event.target.value)} placeholder="Số nhà, tên đường" required value={form.addressLine1} /></label>
        {notice ? <div className="shop-registration-notice"><CheckCircle2 aria-hidden="true" size={18} /><span>{notice}</span></div> : null}
        {error ? <small className="field-error">{error}</small> : null}
        <div className="shop-registration-actions"><button className="primary-button shop-registration-submit" disabled={saving} type="submit"><Save aria-hidden="true" size={18} />{saving ? "Đang lưu..." : submitLabel}</button></div>
      </form>
    </section> : null}

    {error && !editable ? <section className="account-section"><small className="field-error">{error}</small><button className="secondary-action-button" onClick={() => void refreshPortal()} type="button"><RefreshCw aria-hidden="true" size={17} />Thử lại</button></section> : null}
    <ClerkUserProfilePanel />
  </div>;
}
